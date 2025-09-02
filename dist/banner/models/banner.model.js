"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const mongoose_1 = require("mongoose");
const BannerSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (v) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
            message: "imageUrl must be a valid http(s) URL",
        },
    },
    linkUrl: {
        type: String,
        trim: true,
        validate: {
            validator: (v) => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
            message: "linkUrl must be a valid http(s) URL",
        },
    },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
}, { timestamps: true });
exports.Banner = (0, mongoose_1.model)("Banner", BannerSchema);
