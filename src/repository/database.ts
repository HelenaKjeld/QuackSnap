import mongoose from "mongoose";
import console from "node:console";


export async function testConnection() {
    try{
        await connect();
        await disconnect();
        console.log("Database connection test was successful (connect + disconnect)");
    }
    catch (error){
        console.log("Error testing database connection. Error:" + error);
    }
}



export async function connect() {
    try {
        if (!process.env.DBHOST){
            throw new Error("DBHOST environment variable is not defined");
        }
        await mongoose.connect(process.env.DBHOST);

        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().command({ ping: 1 });
            console.log("Connected to MongoDB database successfully");
        }
        else {
            throw new Error("Database connection is not established");
        }
    }

    catch (error){
        console.log("Database connection error:" + error);
    }

}


export async function disconnect() {

    try {
        await mongoose.disconnect();
        console.log("Database connection closed successfully");
    }  
    catch (error) {
        console.log("Error closing database connection. Error:" + error);
    } 
}

