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

      res.status(201).json(banner);
    } catch (err) {
      console.error("Create banner error:", err);
      res.status(500).json({ message: "Failed to create banner" });
    }
  };

  /**
   * GET /api/banners (public)
   * Query:
   *   page=1&limit=10
   *   search=keyword (matches title/description)
   *   isActive=true|false
   *   nowOnly=true (only banners currently within start/end window AND isActive)
   */
  list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
      const search = String(req.query.search ?? "").trim();
      const isActiveQ = req.query.isActive;
      const nowOnly = String(req.query.nowOnly ?? "").toLowerCase() === "true";

      const filter: Record<string, any> = {};

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
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
        // only banners that are active AND (startDate <= now OR undefined) AND (endDate >= now OR undefined)
        filter.isActive = true;
        filter.$and = [
          { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }, { startDate: null }] },
          { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }, { endDate: null }] },
        ];
      }

      const [items, total] = await Promise.all([
        Banner.find(filter)
          .sort({ position: 1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Banner.countDocuments(filter),
      ]);

      res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("List banners error:", err);
      res.status(500).json({ message: "Failed to list banners" });
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
      res.json(banner);
    } catch (err) {
      console.error("Get banner error:", err);
      res.status(500).json({ message: "Failed to fetch banner" });
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
      res.json(banner);
    } catch (err) {
      console.error("Update banner error:", err);
      res.status(500).json({ message: "Failed to update banner" });
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
      res.json({ message: "Banner deleted successfully" });
    } catch (err) {
      console.error("Delete banner error:", err);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  };
}

export default BannerController;
