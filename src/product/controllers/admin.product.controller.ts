import { Request, Response } from "express";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { Attribute } from "../../attribute/models/attribute.model";

const isHex24 = (s: unknown) => typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s);
const toArray = <T>(v: T | T[]) => (Array.isArray(v) ? v : [v]);

export class AdminProductController {
  // ===== LIST (admin; minimal shape) ========================================
  list = async (req: Request, res: Response) => {
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
      const sort = String(req.query.sort ?? "-createdAt");

      const filter: Record<string, any> = {};
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
        ];
      }
      if (brand) filter.brand = { $regex: `^${brand}$`, $options: "i" };
      if (category && mongoose.isValidObjectId(category)) filter.category = category;
      if (inStock) filter.totalStock = { $gt: 0 };

      if (typeof hasVariantsQ !== "undefined") {
        const val = String(hasVariantsQ).toLowerCase();
        if (val === "true") filter["variants.0"] = { $exists: true };
        else if (val === "false") filter["variants"] = { $size: 0 };
      }

      if (typeof minPrice === "number") {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { salePrice: { $exists: true, $gte: minPrice } },
            { price: { $gte: minPrice } },
            { variants: { $elemMatch: { salePrice: { $exists: true, $gte: minPrice } } } },
            { variants: { $elemMatch: { price: { $gte: minPrice } } } },
          ],
        });
      }
      if (typeof maxPrice === "number") {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { salePrice: { $exists: true, $lte: maxPrice } },
            { price: { $lte: maxPrice } },
            { variants: { $elemMatch: { salePrice: { $exists: true, $lte: maxPrice } } } },
            { variants: { $elemMatch: { price: { $lte: maxPrice } } } },
          ],
        });
      }

      const dir = sort.startsWith("-") ? -1 : 1;
      const field = sort.replace(/^-/, "");
      const sortSpec: Record<string, 1 | -1> = { [field]: dir };

      const total = await Product.countDocuments(filter);

      const items = await Product.aggregate([
        { $match: filter },
        { $sort: sortSpec },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $addFields: {
            hasVariants: { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            brand: 1,
            imageUrl: 1,
            currency: 1,
            category: 1,
            isActive: 1,
            totalStock: 1,
            mainAttributeId: 1,
            hasVariants: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]);

      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error("Admin list products error:", err);
      return res.status(500).json({ message: "Failed to list products" });
    }
  };

  // ===== CREATE (admin; no mainBuild) =======================================
  create = async (req: Request, res: Response) => {
    try {
      const payload = req.body;

      // normalize slug
      if (payload.slug) {
        payload.slug = String(payload.slug)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      // normalize category
      if (payload.category && typeof payload.category === "string" && mongoose.isValidObjectId(payload.category)) {
        payload.category = new mongoose.Types.ObjectId(payload.category);
      }

      const product = await Product.create(payload);
      return res.status(201).json(product);
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Duplicate slug or unique field" });
      }
      console.error("Admin create product error:", err);
      return res.status(500).json({ message: "Failed to create product", details: err?.message });
    }
  };

  // ===== GET ONE (admin; flat with resolved variants) =======================
  getOne = async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const query = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

      const product = await Product.findOne(query).lean();
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Resolve attributes/values so variants are UI-ready
      const attrIdSet = new Set<string>();
      for (const v of product.variants ?? []) {
        for (const p of v.values ?? []) attrIdSet.add(p.attributeId);
      }
      const attrIds = Array.from(attrIdSet);
      const attributes = attrIds.length ? await Attribute.find({ _id: { $in: attrIds } }).lean() : [];

      const attrById = new Map<string, any>();
      const valByAttrId = new Map<string, Map<string, any>>();
      for (const a of attributes) {
        const id = String(a._id);
        attrById.set(id, { _id: id, name: a.name, code: a.code, type: a.type, isActive: a.isActive });
        const vmap = new Map<string, any>();
        for (const v of a.values ?? []) {
          vmap.set(String(v._id), { _id: String(v._id), label: v.label, value: v.value, meta: v.meta ?? null });
        }
        valByAttrId.set(id, vmap);
      }

      const resolvedVariants = (product.variants ?? []).map((v: any) => {
        const attributesResolved = (v.values ?? []).map((pair: any) => {
          const attrInfo =
            attrById.get(pair.attributeId) ?? { _id: pair.attributeId, name: null, code: null, type: null, isActive: null };
          const valueIds = toArray(pair.attributesValueId);
          const values = valueIds.map((vid: string) =>
            valByAttrId.get(pair.attributeId)?.get(vid) ?? { _id: vid, label: null, value: null, meta: null }
          );
        return {
            attribute: attrInfo,
            values,
            stock: pair.stock ?? null,
            imageUrl: pair.imageUrl ?? null,
          };
        });

        return {
          _id: String(v._id),
          sku: v.sku ?? null,
          price: v.price,
          salePrice: v.salePrice ?? null,
          stock: v.stock,
          imageUrl: v.imageUrl ?? null,
          barcode: v.barcode ?? null,
          effectivePrice: v.effectivePrice ?? null,
          discountPercent: v.discountPercent ?? 0,
          attributesResolved,
        };
      });

      const { variants: _dropRaw, ...flat } = product;

      return res.json({
        ...flat,
        variants: resolvedVariants
      });
    } catch (err) {
      console.error("Admin get product error:", err);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  };

  // ===== UPDATE (admin; POST, not PATCH) ====================================
  update = async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const body = req.body;

      const query = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
      const product = await Product.findOne(query);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (typeof body.mainBuild !== "undefined") {
        return res.status(400).json({ message: "mainBuild is no longer supported in update." });
      }

      [
        "title",
        "description",
        "brand",
        "currency",
        "price",
        "salePrice",
        "offerStart",
        "offerEnd",
        "stock",
        "isActive",
        "imageUrl",
        "mainAttributeId",
      ].forEach((k) => {
        if (typeof body[k] !== "undefined") (product as any)[k] = body[k];
      });

      if (typeof body.slug !== "undefined" && String(body.slug).trim()) {
        product.slug = String(body.slug)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      if (typeof body.category !== "undefined") {
        if (body.category && mongoose.isValidObjectId(body.category)) {
          product.category = new mongoose.Types.ObjectId(body.category);
        } else if (body.category === null) {
          // allow clearing category
          (product as any).category = undefined;
        }
      }

      if (typeof body.variants !== "undefined") {
        product.variants = body.variants; // full replacement
      }

      await product.save();
      return res.json(product);
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Duplicate slug or unique field" });
      }
      console.error("Admin update product error:", err);
      return res.status(500).json({ message: "Failed to update product", details: err?.message });
    }
  };

  // ===== BULK DELETE (admin; POST /delete) ==================================
  bulkDelete = async (req: Request, res: Response) => {
    try {
      const { ids } = req.body as { ids?: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Body must include non-empty 'ids' array of ObjectId strings" });
      }
      const validIds = ids.filter(isHex24);
      if (validIds.length === 0) {
        return res.status(400).json({ message: "No valid 24-hex ids provided" });
      }
      const result = await Product.deleteMany({ _id: { $in: validIds } });
      return res.json({ deletedCount: result.deletedCount ?? 0, ids: validIds });
    } catch (err) {
      console.error("Admin bulk delete products error:", err);
      return res.status(500).json({ message: "Failed to delete products" });
    }
  };
}

export default AdminProductController;
