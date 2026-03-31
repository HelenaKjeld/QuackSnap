import { User } from "./user";
import { Types } from "mongoose";

export interface DuckPost extends Document {
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  comments: string[];
  _createdBy: Types.ObjectId | User["id"];
}
