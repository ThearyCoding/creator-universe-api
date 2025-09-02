"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    imageUrl: {
        type: String,
        trim: true,
        validate: {
            validator: (v) => !v ||
                /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
            message: "imageUrl must be a valid http(s) URL",
        },
    },
}, { timestamps: true });
categorySchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    next();
});
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
