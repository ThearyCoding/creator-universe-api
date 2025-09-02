import { Request, Response } from "express";
import { Category } from "../models/category.model";

export class CategoryController {
    // Admin: Create
    async create(req: Request, res: Response) {
        try {
            const { name, description, isActive, imageUrl } = req.body;
            if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

            const category = await Category.create({
                name: name.trim(),
                description,
                isActive: isActive ?? true,
                imageUrl,
            });
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

      // sorting
      const SAFE_SORT_FIELDS = new Set(["createdAt", "name", "isActive", "description", "imageUrl"]);
      const sortByRaw = String(req.query.sortBy ?? "createdAt");
      const sortBy = SAFE_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "createdAt";
      const orderRaw = String(req.query.order ?? "desc").toLowerCase();
      const order = orderRaw === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: order as 1 | -1 };

      // filter
      const filter: Record<string, any> = {};
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
        if (val === "true") filter.isActive = true;
        else if (val === "false") filter.isActive = false;
      }

      const [items, total] = await Promise.all([
        Category.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Category.countDocuments(filter),
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
