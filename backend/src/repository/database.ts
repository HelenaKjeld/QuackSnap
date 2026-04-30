import mongoose from "mongoose";
import console from "node:console";

let connectionPromise: Promise<typeof mongoose> | null = null;
let activeConnections = 0;
let disconnectTimer: NodeJS.Timeout | null = null;


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
    activeConnections += 1;

    if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
    }

    try {
        if (!process.env.DBHOST){
            throw new Error("DBHOST environment variable is not defined");
        }

        if (mongoose.connection.readyState !== 1) {
            connectionPromise ??= mongoose.connect(process.env.DBHOST).finally(() => {
                connectionPromise = null;
            });

            await connectionPromise;
        }

        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().command({ ping: 1 });
            console.log("Connected to MongoDB database successfully");
        }
        else {
            throw new Error("Database connection is not established");
        }
    }

    catch (error){
        activeConnections = Math.max(0, activeConnections - 1);
        console.log("Database connection error:" + error);
        throw error;
    }

}


export async function disconnect() {
    activeConnections = Math.max(0, activeConnections - 1);

    if (activeConnections > 0) {
        return;
    }

    if (disconnectTimer) {
        clearTimeout(disconnectTimer);
    }

    disconnectTimer = setTimeout(async () => {
        if (activeConnections > 0 || mongoose.connection.readyState === 0) {
            return;
        }

        disconnectTimer = null;

        try {
            await mongoose.disconnect();
            console.log("Database connection closed successfully");
        }  
        catch (error) {
            console.log("Error closing database connection. Error:" + error);
        } 
    }, 1000);
}

