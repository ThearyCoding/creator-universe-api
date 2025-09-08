"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_model_1 = require("../models/category.model");
const mongoose_1 = __importDefault(require("mongoose"));
// Helper to extract duplicate key error message from MongoDB errors
function dupKeyMessage(err) {
    if (err?.code === 11000 && err?.keyValue) {
        const keys = Object.keys(err.keyValue);
        return `Duplicate value for: ${keys.join(", ")}`;
    }
    return null;
}
class CategoryController {
    // Admin: Create
    async create(req, res) {
        try {
            const { name, description, isActive, imageUrl } = req.body;
            if (!name?.trim())
                return res.status(400).json({ message: "Name is required" });
            const category = await category_model_1.Category.create({
                name: name.trim(),
                description,
                isActive: isActive ?? true,
                imageUrl,
            });
            return res.status(201).json(category);
        }
        catch (err) {
            if (err?.code === 11000)
                return res.status(409).json({ message: "Category already exists" });
            console.error("Create category error:", err);
            return res.status(500).json({ message: "Failed to create category" });
        }
    }
    ;
    /**
   * PATCH /api/categories/:id
   * Body: { isActive: boolean }
   */
    async updateStatus(req, res) {
        try {
            const { id } = req.body;
            if (!mongoose_1.default.isValidObjectId(id)) {
                return res.status(400).json({ message: "Invalid category id" });
            }
            const { isActive } = req.body ?? {};
            if (typeof isActive !== "boolean") {
                return res.status(400).json({ message: "isActive must be boolean" });
            }
            const updated = await category_model_1.Category.findByIdAndUpdate(id, { $set: { isActive } }, { new: true, runValidators: true }).lean();
            if (!updated) {
                return res.status(404).json({ message: "Category not found" });
            }
            return res.json(updated);
        }
        catch (err) {
            const dup = dupKeyMessage(err);
            if (dup)
                return res.status(409).json({ message: dup });
            console.error("updateStatus error:", err);
            return res.status(500).json({ message: "Failed to update status" });
        }
    }
    ;
    // Public: List
    async list(req, res) {
        try {
            const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
            const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
            const search = String(req.query.search ?? "").trim();
            const isActiveQ = req.query.isActive;
            // sorting
            const SAFE_SORT_FIELDS = new Set(["createdAt", "name", "isActive", "description", "imageUrl"]);
            const sortByRaw = String(req.query.sortBy ?? "createdAt");
            const sortBy = SAFE_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "createdAt";
            const orderRaw = String(req.query.order ?? "desc").toLowerCase();
            const order = orderRaw === "asc" ? 1 : -1;
            const sort = { [sortBy]: order };
            // filter
            const filter = {};
            if (search) {
                // use text index when available; fall back to regex
                filter.$or = [
                    { $text: { $search: search } },
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ];
            }
            if (typeof isActiveQ !== "undefined") {
                const val = String(isActiveQ).toLowerCase();
                if (val === "true")
                    filter.isActive = true;
                else if (val === "false")
                    filter.isActive = false;
            }
            const [items, total] = await Promise.all([
                category_model_1.Category.find(filter)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                category_model_1.Category.countDocuments(filter),
            ]);
            const pages = Math.max(Math.ceil(total / limit), 1);
            const hasPrev = page > 1;
            const hasNext = page < pages;
            res.json({
                items,
                meta: {
                    page,
                    limit,
                    total,
                    pages,
                    sortBy,
                    order: order === 1 ? "asc" : "desc",
                    hasPrev,
                    hasNext,
                    prevPage: hasPrev ? page - 1 : null,
                    nextPage: hasNext ? page + 1 : null,
                },
            });
        }
        catch (err) {
            console.error("List categories error:", err);
            res.status(500).json({ message: "Failed to list categories" });
        }
    }
    ;
    // Public: Get one
    async getOne(req, res) {
        try {
            const { idOrSlug } = req.params;
            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const category = await category_model_1.Category.findOne(query);
            if (!category)
                return res.status(404).json({ message: "Category not found" });
            return res.json(category);
        }
        catch (err) {
            console.error("Get category error:", err);
            return res.status(500).json({ message: "Failed to fetch category" });
        }
    }
    ;
    // Admin: Update
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, isActive, slug, imageUrl } = req.body;
            const category = await category_model_1.Category.findOne({ _id: id });
            if (!category)
                return res.status(404).json({ message: "Category not found" });
            if (typeof name !== "undefined")
                category.name = String(name).trim();
            if (typeof description !== "undefined")
                category.description = String(description);
            if (typeof isActive !== "undefined")
                category.isActive = !!isActive;
            if (typeof imageUrl !== "undefined")
                category.imageUrl = String(imageUrl).trim();
            if (typeof slug !== "undefined" && String(slug).trim()) {
                category.slug = String(slug)
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
            }
            await category.save();
            return res.json(category);
        }
        catch (err) {
            if (err?.code === 11000)
                return res.status(409).json({ message: "Duplicate name or slug" });
            console.error("Update category error:", err);
            return res.status(500).json({ message: "Failed to update category" });
        }
    }
    ;
    async removeBulk(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: "No IDs provided" });
            }
            const result = await category_model_1.Category.deleteMany({ _id: { $in: ids } });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "No categories found to delete" });
            }
            return res.json({ message: `${result.deletedCount} categories deleted successfully` });
        }
        catch (err) {
            console.error("Delete category error:", err);
            return res.status(500).json({ message: "Failed to delete category" });
        }
    }
}
exports.CategoryController = CategoryController;
exports.default = CategoryController;
