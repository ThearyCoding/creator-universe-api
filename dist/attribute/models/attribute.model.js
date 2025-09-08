"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attribute = void 0;
const mongoose_1 = require("mongoose");
const AttributeValueSchema = new mongoose_1.Schema({
    label: { type: String, required: true, trim: true },
    value: { type: String, trim: true },
    meta: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: true });
const AttributeSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: ["text", "color", "size", "number", "select"], default: "text" },
    values: { type: [AttributeValueSchema], default: [] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// auto-normalize code if name changes and code not manually set
AttributeSchema.pre("validate", function (next) {
    if (!this.isModified("code") && this.isModified("name")) {
        this.code = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }
    next();
});
exports.Attribute = (0, mongoose_1.model)("Attribute", AttributeSchema);
