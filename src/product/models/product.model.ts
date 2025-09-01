import { Schema, model, Document, Types } from "mongoose";

const urlValidator = (v: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);

export interface IVariant extends Document {
  sku?: string;
  options: Record<string, string>;   // e.g., { color: "Black", storage: "128GB" }

  // Pricing (per-variant)
  price?: number;                    // base price for this variant (falls back to product.price if omitted)
  salePrice?: number;                // active selling price; must be <= price
  compareAtPrice?: number;           // "was"/MSRP for strike-through; usually >= price

  // Offer window (per-variant)
  offerStart?: Date;
  offerEnd?: Date;

  // Inventory & misc
  stock: number;
  imageUrl?: string;
  barcode?: string;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description?: string;
  brand?: string;
  category?: Types.ObjectId;         // ref Category
  images: string[];

  // Simple-product pricing (top-level)
  price?: number;                    // required if no variants
  salePrice?: number;                // <= price
  compareAtPrice?: number;           // >= price
  offerStart?: Date;
  offerEnd?: Date;

  currency: string;
  stock?: number;                    // required if no variants
  variants: Types.DocumentArray<IVariant>;
  attributes: Record<string, string | number | boolean>;
  isActive: boolean;
  totalStock: number;                // sum of variant stocks or = stock

  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    sku: { type: String, trim: true },
    options: { type: Map, of: String, required: true },

    price: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },

    offerStart: { type: Date },
    offerEnd: { type: Date },

    stock: { type: Number, min: 0, required: true, default: 0 },
    imageUrl: {
      type: String,
      trim: true,
      validate: { validator: (v: string) => !v || urlValidator(v), message: "imageUrl must be a valid http(s) URL" },
    },
    barcode: { type: String, trim: true },
  },
  { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Variant virtuals: effectivePrice & discountPercent
VariantSchema.virtual("effectivePrice").get(function (this: IVariant) {
  const now = new Date();
  const inWindow =
    (!this.offerStart || this.offerStart <= now) &&
    (!this.offerEnd || this.offerEnd >= now);
  if (typeof this.salePrice === "number" && inWindow) return this.salePrice;
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

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    images: {
      type: [String],
      default: [],
      validate: { validator: (arr: string[]) => arr.every(urlValidator), message: "All image URLs must be valid http(s) URLs" },
    },

    price: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    offerStart: { type: Date },
    offerEnd: { type: Date },

    currency: { type: String, default: "USD", trim: true, uppercase: true },
    stock: { type: Number, min: 0 },
    variants: { type: [VariantSchema], default: [] },
    attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-slug from title if not manually changed
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
    // Variant product
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    this.stock = undefined as any;

    // Validate variant price relationships & offer windows
    for (const v of this.variants) {
      if (typeof v.salePrice === "number" && typeof v.price === "number" && v.salePrice > v.price) {
        return next(new Error("Variant.salePrice must be <= Variant.price"));
      }
      if (typeof v.compareAtPrice === "number" && typeof v.price === "number" && v.compareAtPrice < v.price) {
        return next(new Error("Variant.compareAtPrice should be >= Variant.price"));
      }
      if (v.offerStart && v.offerEnd && v.offerEnd < v.offerStart) {
        return next(new Error("Variant.offerEnd cannot be before offerStart"));
      }
    }
  } else {
    // Simple product
    if (typeof this.price !== "number") return next(new Error("Simple product requires top-level 'price'"));
    if (typeof this.stock !== "number") return next(new Error("Simple product requires top-level 'stock'"));

    if (typeof this.salePrice === "number" && this.salePrice > this.price) {
      return next(new Error("salePrice must be <= price"));
    }
    if (typeof this.compareAtPrice === "number" && this.compareAtPrice < this.price) {
      return next(new Error("compareAtPrice should be >= price"));
    }
    if (this.offerStart && this.offerEnd && this.offerEnd < this.offerStart) {
      return next(new Error("offerEnd cannot be before offerStart"));
    }

    this.totalStock = this.stock || 0;
  }

  next();
});

// Product-level virtuals for simple products
ProductSchema.virtual("effectivePrice").get(function (this: IProduct) {
  const now = new Date();
  const inWindow =
    (!this.offerStart || this.offerStart <= now) &&
    (!this.offerEnd || this.offerEnd >= now);
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
