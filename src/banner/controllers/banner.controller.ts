import { Request, Response } from "express";
import { Banner } from "../models/banner.model";

export class BannerController {
  /**
   * POST /api/banners (admin)
   */
  create = async (req: Request, res: Response) => {
    try {
      const {
        title,
        subtitle,
        description,
        imageUrl,
        linkUrl,
        position,
        isActive,
        startDate,
        endDate,
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: "title is required" });
      }
      if (!imageUrl?.trim()) {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      const banner = await Banner.create({
        title: title.trim(),
        subtitle,
        description,
        imageUrl: String(imageUrl).trim(),
        linkUrl,
        position: typeof position === "number" ? position : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return res.status(201).json(banner);
    } catch (err) {
      console.error("Create banner error:", err);
      return res.status(500).json({ message: "Failed to create banner" });
    }
  };

  /**
   * GET /api/banners (public)
   * Query:
   *   page=1&limit=10
   *   search=keyword (matches title/subtitle/description)
   *   isActive=true|false
   *   nowOnly=true (only banners active *now*: isActive && start<=now && end>=now)
   *   sortBy=position|createdAt|title|isActive|startDate|endDate
   *   order=asc|desc
   */
  list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
      const search = String(req.query.search ?? "").trim();
      const isActiveQ = req.query.isActive;
      const nowOnly = String(req.query.nowOnly ?? "").toLowerCase() === "true";

      // safe sorting (defaults)
      const SAFE_SORT_FIELDS = new Set([
        "position",
        "createdAt",
        "title",
        "isActive",
        "startDate",
        "endDate",
      ]);
      const sortByRaw = String(req.query.sortBy ?? "position");
      const sortBy = SAFE_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "position";
      const orderRaw = String(req.query.order ?? (sortBy === "position" ? "asc" : "desc")).toLowerCase();
      const order: 1 | -1 = orderRaw === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: order, ...(sortBy !== "createdAt" ? { createdAt: -1 } : {}) };

      // filters
      const filter: Record<string, any> = {};

      if (search) {
        // If you have a text index on title/subtitle/description, consider using {$text: {$search: search}}
        // Here we keep it index-agnostic with regex:
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { subtitle: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (typeof isActiveQ !== "undefined") {
        const v = String(isActiveQ).toLowerCase();
        if (v === "true") filter.isActive = true;
        else if (v === "false") filter.isActive = false;
      }

      if (nowOnly) {
        const now = new Date();
        // enforce isActive=true and the date window
        filter.isActive = true;
        filter.$and = [
          { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }, { startDate: null }] },
          { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }, { endDate: null }] },
        ];
      }

      const [items, total] = await Promise.all([
        Banner.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Banner.countDocuments(filter),
      ]);

      const pages = Math.max(Math.ceil(total / limit), 1);
      const hasPrev = page > 1;
      const hasNext = page < pages;

      return res.json({
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
      console.error("List banners error:", err);
      return res.status(500).json({ message: "Failed to list banners" });
    }
  };


  /**
   * GET /api/banners/:id (public)
   */
  getOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      return res.json(banner);
    } catch (err) {
      console.error("Get banner error:", err);
      return res.status(500).json({ message: "Failed to fetch banner" });
    }
  };

  /**
   * PATCH /api/banners/:id (admin)
   */
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        title,
        subtitle,
        description,
        imageUrl,
        linkUrl,
        position,
        isActive,
        startDate,
        endDate,
      } = req.body;

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      if (typeof title !== "undefined") banner.title = String(title).trim();
      if (typeof subtitle !== "undefined") banner.subtitle = String(subtitle);
      if (typeof description !== "undefined") banner.description = String(description);
      if (typeof imageUrl !== "undefined") banner.imageUrl = String(imageUrl).trim();
      if (typeof linkUrl !== "undefined") banner.linkUrl = String(linkUrl).trim();
      if (typeof position !== "undefined") banner.position = Number(position);
      if (typeof isActive !== "undefined") banner.isActive = !!isActive;
      if (typeof startDate !== "undefined") {
        banner.startDate = startDate ? new Date(startDate) : undefined;
      }
      if (typeof endDate !== "undefined") {
        banner.endDate = endDate ? new Date(endDate) : undefined;
      }

      await banner.save();
      return res.json(banner);
    } catch (err) {
      console.error("Update banner error:", err);
      return res.status(500).json({ message: "Failed to update banner" });
    }
  };

  /**
   * DELETE /api/banners/:id (admin)
   */
  remove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await Banner.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Banner not found" });
      }
      return res.json({ message: "Banner deleted successfully" });
    } catch (err) {
      console.error("Delete banner error:", err);
      return res.status(500).json({ message: "Failed to delete banner" });
    }
  };
}

export default BannerController;
