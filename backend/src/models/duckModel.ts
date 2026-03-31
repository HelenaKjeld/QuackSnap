import { Schema, model } from "mongoose";
import { DuckPost } from "../interfaces/duckpost";

const duckSchema = new Schema<DuckPost>({
  name: { type: String, required: true, min: 3, max: 255 },
  description: { type: String, required: true, min: 3, max: 1024 },
  imageUrl: { type: String, required: true, min: 3, max: 1024 },
  rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
  comments: { type: [String], default: [] },
  _createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

type UpdateQuery<T> = {
  [key: string]: any;
} & {
  __v?: number;
  $set?: Partial<T> & { __v?: number };
  $setOnInsert?: Partial<T> & { __v?: number };
  $inc?: { __v?: number };
};

duckSchema.pre("findOneAndUpdate", function <T extends Document>(this: any) {
  const update = this.getUpdate() as UpdateQuery<T>;
  if (update.__v != null) {
    delete update.__v;
  }
  const keys: Array<"$set" | "$setOnInsert"> = ["$set", "$setOnInsert"];
  for (const key of keys) {
    if (update[key] != null && update[key]!.__v != null) {
      delete update[key]!.__v;
      if (Object.keys(update[key]!).length === 0) {
        delete update[key];
      }
    }
  }
  update.$inc = update.$inc || {};
  update.$inc.__v = 1;
});

export const DuckPostModel = model<DuckPost>("DuckPost", duckSchema);
