import { User } from "./user";
import { Types } from "mongoose";
import { Comment } from "./comment";

export interface DuckPost extends Document {
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  comments: Array<string | Comment>;
  _createdBy: Types.ObjectId | User["id"];
}
