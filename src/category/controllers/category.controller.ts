import { Request, Response } from "express";
import { Category } from "../models/category.model";

export class CategoryController {
    // Admin: Create
    async create(req: Request, res: Response) {
        try {
            const { name, description, isActive, imageUrl } = req.body;
            if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

            const category = new Category({
                name: name.trim(),
                description,
                isActive: isActive ?? true,
                imageUrl,
            });
            await category.save();

            return res.status(201).json(category);
        } catch (err: any) {
            if (err?.code === 11000) return res.status(409).json({ message: "Category already exists" });
            console.error("Create category error:", err);
            return res.status(500).json({ message: "Failed to create category" });
        }
    };

    // Public: List
    async list(req: Request, res: Response) {
        try {
            const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
            const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
            const search = String(req.query.search ?? "").trim();
            const isActiveQ = req.query.isActive;

            const filter: Record<string, any> = {};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ];
            }
            if (typeof isActiveQ !== "undefined") {
                const val = String(isActiveQ).toLowerCase();
                if (val === "true") filter.isActive = true;
                else if (val === "false") filter.isActive = false;
            }

            const [items, total] = await Promise.all([
                Category.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
                Category.countDocuments(filter),
            ]);

            res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
        } catch (err) {
            console.error("List categories error:", err);
            res.status(500).json({ message: "Failed to list categories" });
        }
    };

    // Public: Get one
    async getOne(req: Request, res: Response) {
        try {
            const { idOrSlug } = req.params;
            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const category = await Category.findOne(query);
            if (!category) return res.status(404).json({ message: "Category not found" });
            return res.json(category);
        } catch (err) {
            console.error("Get category error:", err);
            return res.status(500).json({ message: "Failed to fetch category" });
        }
    };

    // Admin: Update
    async update(req: Request, res: Response) {
        try {
            const { idOrSlug } = req.params;
            const { name, description, isActive, slug, imageUrl } = req.body;

            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const category = await Category.findOne(query).select("+slug");
            if (!category) return res.status(404).json({ message: "Category not found" });

            if (typeof name !== "undefined") category.name = String(name).trim();
            if (typeof description !== "undefined") category.description = String(description);
            if (typeof isActive !== "undefined") category.isActive = !!isActive;
            if (typeof imageUrl !== "undefined") category.imageUrl = String(imageUrl).trim();

            if (typeof slug !== "undefined" && String(slug).trim()) {
                category.slug = String(slug)
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
            }

            await category.save();
            return res.json(category);
        } catch (err: any) {
            if (err?.code === 11000) return res.status(409).json({ message: "Duplicate name or slug" });
            console.error("Update category error:", err);
            return res.status(500).json({ message: "Failed to update category" });
        }
    };

    // Admin: Delete
    async remove(req: Request, res: Response) {
        try {
            const { idOrSlug } = req.params;
            const query = idOrSlug.match(/^[a-f\d]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
            const result = await Category.deleteOne(query);
            if (result.deletedCount === 0) return res.status(404).json({ message: "Category not found" });
            return res.json({ message: "Category deleted successfully" });
        } catch (err) {
            console.error("Delete category error:", err);
            return res.status(500).json({ message: "Failed to delete category" });
        }
    };
}

export default CategoryController;
