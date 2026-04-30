import { Schema, model } from "mongoose";
import { Comment } from "../interfaces/comment";

const commentSchema = new Schema<Comment>({
  postId: { type: Schema.Types.ObjectId, ref: "DuckPost", required: true, index: true },
  text: { type: String, required: true, min: 1, max: 280 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const CommentModel = model<Comment>("Comment", commentSchema);
