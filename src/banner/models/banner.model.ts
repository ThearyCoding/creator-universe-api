import { Schema, model, Document } from "mongoose";

export interface IBanner extends Document {
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl: string;
    linkUrl?: string;
    position?: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true },
        description: { type: String, trim: true },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v: string) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
                message: "imageUrl must be a valid http(s) URL",
            },
        },
        linkUrl: {
            type: String,
            trim: true,
            validate: {
                validator: (v: string) => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
                message: "linkUrl must be a valid http(s) URL",
            },
        },
        position: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true }
);

export const Banner = model<IBanner>("Banner", BannerSchema);
