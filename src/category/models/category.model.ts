import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
        message: "imageUrl must be a valid http(s) URL",
      },
    },
  },
  { timestamps: true }
);

categorySchema.pre<ICategory>("validate", function (next) {
  if ((this.isModified("name") || !this.slug) && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category = model<ICategory>("Category", categorySchema);
