// src/modules/products/controllers/mobile.product.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { Attribute } from "../../attribute/models/attribute.model";

const toArray = <T>(v: T | T[]) => (Array.isArray(v) ? v : [v]);

/**
 * MOBILE SHAPE (lightweight)
 * - List: minimal fields + quick price range (best effort) + hasVariants
 * - Detail: flat object (no "product" wrapper) + resolved variants with minimal fields
 *   Removed fields: compareAtPrice, offerStart/End, barcode, effectivePrice, discountPercent
 */
export class MobileProductController {
  // ===== LIST (public/mobile) ===============================================
  list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(parseInt(String(req.query.page ?? "1"), 10), 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "12"), 10), 1), 100);
      const search = String(req.query.search ?? "").trim();
      const brand = String(req.query.brand ?? "").trim();
      const category = String(req.query.category ?? "").trim();
      const inStock = String(req.query.inStock ?? "").toLowerCase() === "true";
      const sort = String(req.query.sort ?? "-createdAt");

      // NOTE: mobile list is public; we show only active items
      const filter: Record<string, any> = { isActive: true };

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

      const dir = sort.startsWith("-") ? -1 : 1;
      const field = sort.replace(/^-/, "");
      const sortSpec: Record<string, 1 | -1> = { [field]: dir };

      const total = await Product.countDocuments(filter);

      // Light list via aggregation:
      // - hasVariants
      // - lowestPrice / highestPrice heuristics (salePrice if present else price)
      const items = await Product.aggregate([
        { $match: filter },
        { $sort: sortSpec },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $addFields: {
            hasVariants: { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
            // compute variant-level chosen prices (salePrice || price)
            _variantPrices: {
              $map: {
                input: { $ifNull: ["$variants", []] },
                as: "v",
                in: {
                  $cond: [
                    { $gt: ["$$v.salePrice", null] }, // salePrice exists
                    "$$v.salePrice",
                    "$$v.price",
                  ],
                },
              },
            },
            // choose top-level chosen price (salePrice || price)
            _topChosenPrice: {
              $cond: [
                { $gt: ["$salePrice", null] },
                "$salePrice",
                "$price",
              ],
            },
          },
        },
        {
          $addFields: {
            lowestPrice: {
              $cond: [
                { $gt: [{ $size: "$_variantPrices" }, 0] },
                { $min: "$_variantPrices" },
                "$_topChosenPrice",
              ],
            },
            highestPrice: {
              $cond: [
                { $gt: [{ $size: "$_variantPrices" }, 0] },
                { $max: "$_variantPrices" },
                "$_topChosenPrice",
              ],
            },
          },
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
            hasVariants: 1,
            lowestPrice: 1,
            highestPrice: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Mobile list products error:", err);
      return res.status(500).json({ message: "Failed to list products (mobile)" });
    }
  };

  // ===== GET ONE (public/mobile; flat + resolved variants) ===================
  // Public: Get by id or slug — FLAT like admin, only `variants` at bottom (attributesResolved)
  getOne = async (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      const query = /^[a-f\d]{24}$/i.test(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug.toLowerCase() };

      // Only active products for public
      const product = await Product.findOne({ ...query, isActive: true }).lean();
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Collect attribute ids from variants
      const attrIdSet = new Set<string>();
      for (const v of product.variants ?? []) {
        // support both "values" (new) and "attributesId" (older)
        const pairs = (v as any).values ?? (v as any).attributesId ?? [];
        for (const p of pairs) attrIdSet.add(p.attributeId);
      }
      const attrIds = Array.from(attrIdSet);
      const attributes = attrIds.length ? await Attribute.find({ _id: { $in: attrIds } }).lean() : [];

      // Build lookups
      const attrById = new Map<string, any>();
      const valByAttrId = new Map<string, Map<string, any>>();
      for (const a of attributes) {
        const id = String(a._id);
        attrById.set(id, { _id: id, name: a.name, code: a.code, type: a.type, isActive: a.isActive });
        const sub = new Map<string, any>();
        for (const v of a.values ?? []) {
          sub.set(String(v._id), { _id: String(v._id), label: v.label, value: v.value, meta: v.meta ?? null });
        }
        valByAttrId.set(id, sub);
      }

      // Resolve variants exactly like admin
      const resolvedVariants = (product.variants ?? []).map((v: any) => {
        const pairs = v.values ?? v.attributesId ?? [];
        const attributesResolved = pairs.map((pair: any) => {
          const attrInfo =
            attrById.get(pair.attributeId) ??
            { _id: pair.attributeId, name: null, code: null, type: null, isActive: null };
          const valueIds = toArray(pair.attributesValueId);
          const values = valueIds.map(
            (vid: string) => valByAttrId.get(pair.attributeId)?.get(vid) ?? { _id: vid, label: null, value: null, meta: null }
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
          price: v.price ?? null,
          salePrice: v.salePrice ?? null,
          stock: v.stock,
          imageUrl: v.imageUrl ?? null,
          barcode: v.barcode ?? null,
          effectivePrice: v.effectivePrice ?? null,
          discountPercent: v.discountPercent ?? 0,
          attributesResolved,
        };
      });

      // Drop raw variants, return flat product + only resolved variants
      const { variants: _dropRaw, ...flat } = product;
      return res.json({
        ...flat,
        variants: resolvedVariants,
      });
    } catch (err) {
      console.error("Get product error:", err);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  };
}

export default MobileProductController;
