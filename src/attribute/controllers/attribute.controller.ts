// src/api/controllers/attribute.controller.ts
import { Request, Response } from "express";
import mongoose, { Schema } from "mongoose";
import { Attribute } from "../models/attribute.model";

// Helper: dup key -> readable message
function dupKeyMessage(err: any): string | null {
  if (err?.code === 11000 && err?.keyValue) {
    const keys = Object.keys(err.keyValue);
    return `Duplicate value for: ${keys.join(", ")}`;
  }
  return null;
}

// Normalize id or code query
function toIdOrCodeQuery(idOrCode: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrCode);
  return isObjectId ? { _id: idOrCode } : { code: idOrCode.toLowerCase() };
}

export class AttributeController {
  /**
   * POST /api/admin/attributes
   * Body: { name, code?, type?, values?, isActive? }
   */
  async create(req: Request, res: Response) {
    try {
      const { name, code, type, values, isActive } = req.body ?? {};
      if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

      const doc = await Attribute.create({
        name: String(name).trim(),
        code: code ? String(code).trim().toLowerCase() : undefined, // will auto-gen in pre-validate if missing
        type,
        values,
        isActive: typeof isActive === "boolean" ? isActive : true,
      });

      return res.status(201).json(doc);
    } catch (err: any) {
      const dup = dupKeyMessage(err);
      if (dup) return res.status(409).json({ message: dup });
      console.error("Attribute.create error:", err);
      return res.status(500).json({ message: "Failed to create attribute" });
    }
  }

  /**
   * GET /api/admin/attributes
   * Query:
   *  page=1&limit=10&search=...&isActive=true|false
   *  sortBy=createdAt|name|code|type|isActive
   *  order=asc|desc
   */
  async list(req: Request, res: Response) {
    try {
      const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10), 1), 100);
      const search = String(req.query.search ?? "").trim();
      const isActiveQ = req.query.isActive;

      const SAFE_SORT_FIELDS = new Set(["createdAt", "name", "code", "type", "isActive"]);
      const sortByRaw = String(req.query.sortBy ?? "createdAt");
      const sortBy = SAFE_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "createdAt";
      const orderRaw = String(req.query.order ?? "desc").toLowerCase();
      const order: 1 | -1 = orderRaw === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: order };

      const filter: Record<string, any> = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }
      if (typeof isActiveQ !== "undefined") {
        const v = String(isActiveQ).toLowerCase();
        if (v === "true") filter.isActive = true;
        else if (v === "false") filter.isActive = false;
      }

      const [items, total] = await Promise.all([
        Attribute.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
        Attribute.countDocuments(filter),
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
      console.error("Attribute.list error:", err);
      return res.status(500).json({ message: "Failed to list attributes" });
    }
  }

  /**
   * GET /api/admin/attributes/:idOrCode
   */
  async getOne(req: Request, res: Response) {
    try {
      const { idOrCode } = req.params;
      const doc = await Attribute.findOne(toIdOrCodeQuery(idOrCode));
      if (!doc) return res.status(404).json({ message: "Attribute not found" });
      return res.json(doc);
    } catch (err) {
      console.error("Attribute.getOne error:", err);
      return res.status(500).json({ message: "Failed to fetch attribute" });
    }
  }

  /**
   * PATCH /api/admin/attributes/:idOrCode
   * Body: { name?, code?, type?, isActive?, values? (replace array) }
   * NOTE: This updates top-level fields. For granular value ops use dedicated endpoints below.
   */
  async update(req: Request, res: Response) {
    try {
      const { idOrCode } = req.params;
      const { name, code, type, isActive, values } = req.body ?? {};

      const doc = await Attribute.findOne(toIdOrCodeQuery(idOrCode));
      if (!doc) return res.status(404).json({ message: "Attribute not found" });

      if (typeof name !== "undefined") doc.name = String(name).trim();
      if (typeof code !== "undefined")
        doc.code = String(code).trim().toLowerCase();
      if (typeof type !== "undefined") doc.type = type;
      if (typeof isActive !== "undefined") doc.isActive = !!isActive;
      if (typeof values !== "undefined") {
        if (!Array.isArray(values)) {
          return res.status(400).json({ message: "values must be an array" });
        }
        doc.values = values;
      }

      await doc.save();
      return res.json(doc);
    } catch (err: any) {
      const dup = dupKeyMessage(err);
      if (dup) return res.status(409).json({ message: dup });
      console.error("Attribute.update error:", err);
      return res.status(500).json({ message: "Failed to update attribute" });
    }
  }

  /**
   * DELETE /api/admin/attributes/:idOrCode
   */
  async removeMany(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const result = await Attribute.deleteMany({ _id: { $in: ids } });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "No attributes found to delete" });
      }

      return res.json({
        message: `${result.deletedCount} attribute(s) deleted successfully`,
      });
    } catch (err) {
      console.error("Attribute.removeMany error:", err);
      return res.status(500).json({ message: "Failed to delete attributes" });
    }
  }

  // -------- Values management (admin) --------

  /**
   * POST /api/admin/attributes/:idOrCode/values
   * Body: { label, value?, meta? }
   */
  async addValue(req: Request, res: Response) {
    try {
      const { idOrCode } = req.params;
      const { label, value, meta } = req.body ?? {};
      if (!label?.trim()) return res.status(400).json({ message: "label is required" });

      const doc = await Attribute.findOne(toIdOrCodeQuery(idOrCode));
      if (!doc) return res.status(404).json({ message: "Attribute not found" });

      doc.values.push({
        label: String(label).trim(),
        value: typeof value === "string" ? value.trim() : value,
        meta: meta ?? undefined,
      });

      await doc.save();
      return res.status(201).json(doc);
    } catch (err) {
      console.error("Attribute.addValue error:", err);
      return res.status(500).json({ message: "Failed to add value" });
    }
  }

  /**
   * PATCH /api/admin/attributes/:idOrCode/values/:valueId
   * Body: { label?, value?, meta? }
   */
  async updateValue(req: Request, res: Response) {
    try {
      const { idOrCode, valueId } = req.params;
      if (!mongoose.isValidObjectId(valueId)) {
        return res.status(400).json({ message: "Invalid valueId" });
      }

      const doc = await Attribute.findOne(toIdOrCodeQuery(idOrCode));
      if (!doc) return res.status(404).json({ message: "Attribute not found" });

      const sub = doc.values.find((v: any) => String(v._id) === String(valueId));
      if (!sub) return res.status(404).json({ message: "Attribute value not found" });

      const { label, value, meta } = req.body ?? {};
      if (typeof label !== "undefined") sub.label = String(label).trim();
      if (typeof value !== "undefined") sub.value = typeof value === "string" ? value.trim() : value;
      if (typeof meta !== "undefined") sub.meta = meta;

      await doc.save();
      return res.json(doc);
    } catch (err) {
      console.error("Attribute.updateValue error:", err);
      return res.status(500).json({ message: "Failed to update value" });
    }
  }
  /**
   * POST /api/attributes/:idOrCode/values/remove-many
   */
  async removeManyValues(req: Request, res: Response) {
    try {
      const { idOrCode } = req.params;
      const { valueIds } = req.body;

      if (!valueIds || !Array.isArray(valueIds) || valueIds.length === 0) {
        return res.status(400).json({ message: "No valueIds provided" });
      }

      const doc = await Attribute.findOne(toIdOrCodeQuery(idOrCode));
      if (!doc) {
        return res.status(404).json({ message: "Attribute not found" });
      }

      const beforeCount = doc.values.length;
      doc.values = doc.values.filter((v: any) => !valueIds.includes(String(v._id)));
      const deletedCount = beforeCount - doc.values.length;

      if (deletedCount === 0) {
        return res.status(404).json({ message: "No attribute values found to delete" });
      }

      await doc.save();

      return res.json({
        message: `${deletedCount} attribute value(s) deleted successfully`,
        attribute: doc,
      });
    } catch (err) {
      console.error("Attribute.removeManyValues error:", err);
      return res.status(500).json({ message: "Failed to remove attribute values" });
    }
  }


}

export default AttributeController;
