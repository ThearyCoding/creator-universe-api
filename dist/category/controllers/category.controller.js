"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_model_1 = require("../models/category.model");
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
            await category.save();
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
    // Public: Lis
    async list(req, res) {
        try {
            const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
            const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
            const search = String(req.query.search ?? "").trim();
            const isActiveQ = req.query.isActive;
            const filter = {};
            if (search) {
                filter.$or = [
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
                category_model_1.Category.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
                category_model_1.Category.countDocuments(filter),
            ]);
            res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
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
            const { idOrSlug } = req.params;
            const { name, description, isActive, slug, imageUrl } = req.body;
            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const category = await category_model_1.Category.findOne(query).select("+slug");
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
    // Admin: Delete
    async remove(req, res) {
        try {
            const { idOrSlug } = req.params;
            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const result = await category_model_1.Category.deleteOne(query);
            if (result.deletedCount === 0)
                return res.status(404).json({ message: "Category not found" });
            return res.json({ message: "Category deleted successfully" });
        }
        catch (err) {
            console.error("Delete category error:", err);
            return res.status(500).json({ message: "Failed to delete category" });
        }
    }
    ;
}
exports.CategoryController = CategoryController;
exports.default = CategoryController;
