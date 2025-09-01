"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const urlValidator = (v) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v);
const VariantSchema = new mongoose_1.Schema({
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
        validate: { validator: (v) => !v || urlValidator(v), message: "imageUrl must be a valid http(s) URL" },
    },
    barcode: { type: String, trim: true },
}, { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
// Variant virtuals: effectivePrice & discountPercent
VariantSchema.virtual("effectivePrice").get(function () {
    const now = new Date();
    const inWindow = (!this.offerStart || this.offerStart <= now) &&
        (!this.offerEnd || this.offerEnd >= now);
    if (typeof this.salePrice === "number" && inWindow)
        return this.salePrice;
    return this.price;
});
VariantSchema.virtual("discountPercent").get(function () {
    const base = this.price;
    const eff = this.effectivePrice;
    if (typeof base === "number" && typeof eff === "number" && base > 0 && eff < base) {
        return Math.round(((base - eff) / base) * 100);
    }
    return 0;
});
const ProductSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category" },
    images: {
        type: [String],
        default: [],
        validate: { validator: (arr) => arr.every(urlValidator), message: "All image URLs must be valid http(s) URLs" },
    },
    price: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    offerStart: { type: Date },
    offerEnd: { type: Date },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    stock: { type: Number, min: 0 },
    variants: { type: [VariantSchema], default: [] },
    attributes: { type: Map, of: mongoose_1.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
// Auto-slug from title if not manually changed
ProductSchema.pre("save", function (next) {
    if (this.isModified("title") && !this.isModified("slug")) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    next();
});
// Integrity & aggregation
ProductSchema.pre("validate", function (next) {
    const hasVariants = this.variants && this.variants.length > 0;
    if (hasVariants) {
        // Variant product
        this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        this.stock = undefined;
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
    }
    else {
        // Simple product
        if (typeof this.price !== "number")
            return next(new Error("Simple product requires top-level 'price'"));
        if (typeof this.stock !== "number")
            return next(new Error("Simple product requires top-level 'stock'"));
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
ProductSchema.virtual("effectivePrice").get(function () {
    const now = new Date();
    const inWindow = (!this.offerStart || this.offerStart <= now) &&
        (!this.offerEnd || this.offerEnd >= now);
    if (typeof this.salePrice === "number" && inWindow)
        return this.salePrice;
    return this.price;
});
ProductSchema.virtual("discountPercent").get(function () {
    const base = this.price;
    const eff = this.effectivePrice;
    if (typeof base === "number" && typeof eff === "number" && base > 0 && eff < base) {
        return Math.round(((base - eff) / base) * 100);
    }
    return 0;
});
exports.Product = (0, mongoose_1.model)("Product", ProductSchema);
