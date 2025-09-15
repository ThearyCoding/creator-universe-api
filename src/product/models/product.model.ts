import { Schema, model, Document, Types } from "mongoose";

const urlValidator = (v: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);
const isHex24 = (s: unknown) => typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s);

// ---------- Variant Value (ids + per-value overrides) ----------
export interface IVariantValue {
  attributeId: string;                               // 24-hex string (Attribute._id)
  attributesValueId: string | string[];              // 24-hex (or array) of Attribute.values[i]._id
  stock: number;                                     // required
  imageUrl?: string;                                 // optional (per-value image)
}

function validateVariantValue(v: any): v is IVariantValue {
  if (!v || typeof v !== "object") return false;
  if (!isHex24(v.attributeId)) return false;
  const val = v.attributesValueId;
  const isValidVal = Array.isArray(val)
    ? val.length > 0 && val.every(isHex24)
    : isHex24(val);
  if (!isValidVal) return false;
  if (typeof v.stock !== "number" || v.stock < 0) return false;
  if (v.imageUrl && !urlValidator(v.imageUrl)) return false;
  return true;
}

// ---------- Variant ----------
export interface IVariant extends Document {
  sku?: string;
  price: number;                         // required
  salePrice?: number;
  values: IVariantValue[];               // required
  stock: number;                         // required
  imageUrl?: string;
  barcode?: string;
}

const VariantValueSchema = new Schema<IVariantValue>(
  {
    attributeId: {
      type: String,
      required: true,
      validate: { validator: isHex24, message: "attributeId must be 24-hex" },
    },
    attributesValueId: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (v: any) => (Array.isArray(v) ? v.length > 0 && v.every(isHex24) : isHex24(v)),
        message: "attributesValueId must be 24-hex string or non-empty array of 24-hex strings",
      },
    },
    stock: { type: Number, min: 0, required: true, default: 0 },
    imageUrl: {
      type: String,
      trim: true,
      validate: { validator: (v: string) => !v || urlValidator(v), message: "imageUrl must be valid http(s) URL" },
    },
  },
  { _id: true }
);

const VariantSchema = new Schema<IVariant>(
  {
    sku: { type: String, trim: true },
    price: { type: Number, min: 0, required: true },
    salePrice: { type: Number, min: 0 },
    values: {
      type: [VariantValueSchema],
      required: true,
      validate: { validator: (arr: any[]) => Array.isArray(arr) && arr.length > 0 && arr.every(validateVariantValue), message: "Invalid values[]" },
    },
    stock: { type: Number, min: 0, required: true },
    imageUrl: {
      type: String,
      trim: true,
      validate: { validator: (v: string) => !v || urlValidator(v), message: "imageUrl must be valid http(s) URL" },
    },
    barcode: { type: String, trim: true },
  },
  { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Variant virtuals
VariantSchema.virtual("effectivePrice").get(function (this: IVariant) {
  if (typeof this.salePrice === "number") return this.salePrice;
  return this.price;
});
VariantSchema.virtual("discountPercent").get(function (this: IVariant) {
  const base = this.price;
  const eff = (this as any).effectivePrice as number | undefined;
  if (typeof base === "number" && typeof eff === "number" && base > 0 && eff < base) {
    return Math.round(((base - eff) / base) * 100);
  }
  return 0;
});

// ---------- Product ----------
export interface IProduct extends Document {
  title: string;
  slug: string;
  description?: string;
  brand?: string;
  category?: Types.ObjectId;

  mainAttributeId?: string;             // required if variants exist

  imageUrl: string;                     // single main image
  price?: number;                       // required if no variants
  salePrice?: number;
  offerStart?: Date;
  offerEnd?: Date;

  currency: string;
  stock?: number;                       // required if no variants
  variants: Types.DocumentArray<IVariant>;

  isActive: boolean;
  totalStock: number;

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },

    mainAttributeId: {
      type: String,
      validate: { validator: (v: any) => !v || isHex24(v), message: "mainAttributeId must be 24-hex" },
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
      validate: { validator: urlValidator, message: "imageUrl must be valid http(s) URL" },
    },

    price: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    offerStart: { type: Date },
    offerEnd: { type: Date },

    currency: { type: String, default: "USD", trim: true, uppercase: true },
    stock: { type: Number, min: 0 },
    variants: { type: [VariantSchema], default: [] },

    isActive: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indices
ProductSchema.index({ totalStock: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

// Auto-slug if title changed and slug not manually set
ProductSchema.pre<IProduct>("save", function (next) {
  if (this.isModified("title") && !this.isModified("slug")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

// Integrity & aggregation
ProductSchema.pre<IProduct>("validate", function (next) {
  const hasVariants = this.variants && this.variants.length > 0;

  if (hasVariants) {
    if (!this.mainAttributeId) {
      return next(new Error("Variant product requires 'mainAttributeId'"));
    }
    const everyHasMain = this.variants.every((v) =>
      (v.values || []).some((p) => p.attributeId === this.mainAttributeId)
    );
    if (!everyHasMain) {
      return next(new Error("Every variant must include a value for 'mainAttributeId'"));
    }
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    this.stock = undefined as any;
  } else {
    if (typeof this.price !== "number") return next(new Error("Simple product requires price"));
    if (typeof this.stock !== "number") return next(new Error("Simple product requires stock"));
    this.totalStock = this.stock || 0;
  }
  next();
});

// Product virtuals
ProductSchema.virtual("effectivePrice").get(function (this: IProduct) {
  const now = new Date();
  const inWindow = (!this.offerStart || this.offerStart <= now) && (!this.offerEnd || this.offerEnd >= now);
  if (typeof this.salePrice === "number" && inWindow) return this.salePrice;
  return this.price;
});
ProductSchema.virtual("discountPercent").get(function (this: IProduct) {
  const base = this.price;
  const eff = (this as any).effectivePrice as number | undefined;
  if (typeof base === "number" && typeof eff === "number" && base > 0 && eff < base) {
    return Math.round(((base - eff) / base) * 100);
  }
  return 0;
});

export const Product = model<IProduct>("Product", ProductSchema);
