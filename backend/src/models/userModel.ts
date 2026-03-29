import { Schema, model } from "mongoose";
import { User } from "../interfaces/user.js";

const userSchema = new Schema<User>({
    fullName: { type: String, required: true, min: 3, max: 255 },
    userName: { type: String, required: true, min: 3, max: 255, unique: true },
    email: { type: String, required: true, min: 6, max: 255, unique: true },
    password: { type: String, required: true, min: 6, max: 255 },
    registerDate: { type: Date, required: true, default: Date.now }
});


export const UserModel = model<User>("User", userSchema); 