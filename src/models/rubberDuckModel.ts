import { Schema, model } from "mongoose";
import { RubberDuck } from "../interfaces/rubberducks";

const duckSchema = new Schema<RubberDuck>({
  name: { type: String, required: true, min: 3, max: 255 },
  description: { type: String, required: true, min: 3, max: 1024 },
  imageUrl: { type: String, required: true, min: 3, max: 1024 },
  color: { type: String, required: true, min: 3, max: 255 },
  theme: { type: String, required: true, min: 3, max: 255 },
  size: { type: Number, required: true, min: 1, max: 100 },
  price: { type: Number, required: true, min: 0 },
  inStock: { type: Boolean, required: true, default: true },
  isOnDiscount: { type: Boolean, required: true, default: false },
  discountPercentage: { type: Number, required: true, default: 0 },
  isHidden: { type: Boolean, required: false },
  _createdBy: { type: String, ref: "User", required: true },
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

export const RubberDuckModel = model<RubberDuck>("RubberDuck", duckSchema);
