import { User } from "./user";

export interface DuckPost extends Document {
    name: string;
    description: string;
    imageUrl: string;
    rating: number; 
    comments: string[];
    _createdBy: User['id'];
}