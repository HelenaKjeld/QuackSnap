import { User } from "./user";

export interface RubberDuck extends Document {
    name: string;
    description: string;
    imageUrl: string;
    color: string;
    theme: string;
    size: number;
    price: number;
    inStock: boolean;
    isOnDiscount: boolean;
    discountPercentage: number;
    isHidden: boolean;
    _createdBy: User['id'];
}