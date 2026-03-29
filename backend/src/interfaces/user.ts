export interface User extends Document {
    id: string;
    fullName: string;
    userName: string;
    email: string;
    password: string;
    registerDate: Date;
}