import { Types } from "mongoose";
import { User } from "./user";

export interface Comment {
  _id?: Types.ObjectId | string;
  postId: Types.ObjectId | string;
  text: string;
  createdBy: Types.ObjectId | User["id"];
}
