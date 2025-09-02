"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = require("../models/product.model");
class ProductController {
    constructor() {
        // Admin: Create (simple or variants)
        this.create = async (req, res) => {
            try {
                const payload = req.body;
                // Normalize images to array
                if (payload.images && !Array.isArray(payload.images)) {
                    payload.images = [payload.images];
                }
                // Normalize slug if provided
                if (payload.slug) {
                    payload.slug = String(payload.slug)
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                }
                // Coerce category to ObjectId if provided
                if (payload.category && typeof payload.category === "string" && mongoose_1.default.isValidObjectId(payload.category)) {
                    payload.category = new mongoose_1.default.Types.ObjectId(payload.category);
                }
                const product = await product_model_1.Product.create(payload);
                return res.status(201).json(product);
            }
            catch (err) {
                if (err?.code === 11000) {
                    return res.status(409).json({ message: "Duplicate slug or unique field" });
                }
                console.error("Create product error:", err);
                return res.status(500).json({ message: "Failed to create product", details: err?.message });
            }
        };
        // Public: List
        this.list = async (req, res) => {
            try {
                const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
                const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "12"), 10), 1), 100);
                const search = String(req.query.search ?? "").trim();
                const brand = String(req.query.brand ?? "").trim();
                const category = String(req.query.category ?? "").trim();
                const inStock = String(req.query.inStock ?? "").toLowerCase() === "true";
                const hasVariantsQ = req.query.hasVariants;
                const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
                const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
                const sort = String(req.query.sort ?? "-createdAt"); // "price", "-price", etc.
                const filter = { isActive: true };
                if (search) {
                    filter.$or = [
                        { title: { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                        { brand: { $regex: search, $options: "i" } },
                    ];
                }
                if (brand)
                    filter.brand = { $regex: `^${brand}$`, $options: "i" };
                if (category && mongoose_1.default.isValidObjectId(category))
                    filter.category = category;
                if (inStock)
                    filter.totalStock = { $gt: 0 };
                if (typeof hasVariantsQ !== "undefined") {
                    const val = String(hasVariantsQ).toLowerCase();
                    if (val === "true")
                        filter["variants.0"] = { $exists: true };
                    else if (val === "false")
                        filter["variants"] = { $size: 0 };
                }
                // Price filters consider sale windows where possible
                const now = new Date();
                if (typeof minPrice === "number") {
                    filter.$and = filter.$and || [];
                    filter.$and.push({
                        $or: [
                            // simple: active sale
                            {
                                $and: [
                                    { salePrice: { $exists: true } },
                                    { $or: [{ offerStart: { $exists: false } }, { offerStart: { $lte: now } }] },
                                    { $or: [{ offerEnd: { $exists: false } }, { offerEnd: { $gte: now } }] },
                                    { salePrice: { $gte: minPrice } },
                                ],
                            },
                            // simple: base price
                            { price: { $gte: minPrice } },
                            // variants: active sale
                            {
                                variants: {
                                    $elemMatch: {
                                        salePrice: { $exists: true, $gte: minPrice },
                                        $and: [
                                            { $or: [{ offerStart: { $exists: false } }, { offerStart: { $lte: now } }] },
                                            { $or: [{ offerEnd: { $exists: false } }, { offerEnd: { $gte: now } }] }
                                        ]
                                    },
                                },
                            },
                            // variants: base price
                            { variants: { $elemMatch: { price: { $gte: minPrice } } } },
                        ],
                    });
                }
                if (typeof maxPrice === "number") {
                    filter.$and = filter.$and || [];
                    filter.$and.push({
                        $or: [
                            // simple: active sale
                            {
                                $and: [
                                    { salePrice: { $exists: true } },
                                    { $or: [{ offerStart: { $exists: false } }, { offerStart: { $lte: now } }] },
                                    { $or: [{ offerEnd: { $exists: false } }, { offerEnd: { $gte: now } }] },
                                    { salePrice: { $lte: maxPrice } },
                                ],
                            },
                            // simple: base price
                            { price: { $lte: maxPrice } },
                            // variants: active sale
                            {
                                variants: {
                                    $elemMatch: {
                                        salePrice: { $exists: true, $lte: maxPrice },
                                        $and: [
                                            { $or: [{ offerStart: { $exists: false } }, { offerStart: { $lte: now } }] },
                                            { $or: [{ offerEnd: { $exists: false } }, { offerEnd: { $gte: now } }] }
                                        ]
                                    },
                                },
                            },
                            // variants: base price
                            { variants: { $elemMatch: { price: { $lte: maxPrice } } } },
                        ],
                    });
                }
                // Parse sort
                const sortSpec = {};
                if (sort) {
                    const dir = sort.startsWith("-") ? -1 : 1;
                    const field = sort.replace(/^-/, "");
                    sortSpec[field] = dir;
                }
                const [items, total] = await Promise.all([
                    product_model_1.Product.find(filter)
                        .populate("category", "name slug")
                        .sort(sortSpec)
                        .skip((page - 1) * limit)
                        .limit(limit),
                    product_model_1.Product.countDocuments(filter),
                ]);
                return res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
            }
            catch (err) {
                console.error("List products error:", err);
                return res.status(500).json({ message: "Failed to list products" });
            }
        };
        // Public: Get by id or slug
        this.getOne = async (req, res) => {
            try {
                const { idOrSlug } = req.params;
                const query = idOrSlug.match(/^[a-f\d]{24}$/i)
                    ? { _id: idOrSlug }
                    : { slug: idOrSlug.toLowerCase() };
                const product = await product_model_1.Product.findOne(query).populate("category", "name slug");
                if (!product)
                    return res.status(404).json({ message: "Product not found" });
                return res.json(product);
            }
            catch (err) {
                console.error("Get product error:", err);
                return res.status(500).json({ message: "Failed to fetch product" });
            }
        };
        // Admin: Update (full/partial; variants array replaces if provided)
        this.update = async (req, res) => {
            try {
                const { idOrSlug } = req.params;
                const body = req.body;
                const query = idOrSlug.match(/^[a-f\d]{24}$/i)
                    ? { _id: idOrSlug }
                    : { slug: idOrSlug.toLowerCase() };
                const product = await product_model_1.Product.findOne(query);
                if (!product)
                    return res.status(404).json({ message: "Product not found" });
                [
                    "title",
                    "description",
                    "brand",
                    "currency",
                    "compareAtPrice",
                    "price",
                    "salePrice",
                    "offerStart",
                    "offerEnd",
                    "stock",
                    "isActive",
                    "attributes",
                ].forEach((k) => {
                    if (typeof body[k] !== "undefined")
                        product[k] = body[k];
                });
                if (typeof body.slug !== "undefined" && String(body.slug).trim()) {
                    product.slug = String(body.slug)
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "");
                }
                if (typeof body.category !== "undefined" && mongoose_1.default.isValidObjectId(body.category)) {
                    product.category = new mongoose_1.default.Types.ObjectId(body.category);
                }
                if (typeof body.images !== "undefined") {
                    product.images = Array.isArray(body.images) ? body.images : [body.images];
                }
                if (typeof body.variants !== "undefined") {
                    product.variants = body.variants; // full replacement; schema validates pricing/offer windows
                }
                await product.save();
                return res.json(product);
            }
            catch (err) {
                if (err?.code === 11000) {
                    return res.status(409).json({ message: "Duplicate slug or unique field" });
                }
                console.error("Update product error:", err);
                return res.status(500).json({ message: "Failed to update product", details: err?.message });
            }
        };
        // Admin: Delete
        this.remove = async (req, res) => {
            try {
                const { idOrSlug } = req.params;
                const query = idOrSlug.match(/^[a-f\d]{24}$/i)
                    ? { _id: idOrSlug }
                    : { slug: idOrSlug.toLowerCase() };
                const result = await product_model_1.Product.deleteOne(query);
                if (result.deletedCount === 0)
                    return res.status(404).json({ message: "Product not found" });
                return res.json({ message: "Product deleted successfully" });
            }
            catch (err) {
                console.error("Delete product error:", err);
                return res.status(500).json({ message: "Failed to delete product" });
            }
        };
    }
}
exports.ProductController = ProductController;
exports.default = ProductController;
