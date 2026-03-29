import express, { Application, Request, Response }  from 'express';
import dotenvFlow from 'dotenv-flow';
import{ testConnection } from './repository/database';

import routes from './routes';
import { disconnect } from 'node:cluster';
import { setupDocs } from '../util/documentation';
import cors from 'cors';


dotenvFlow.config();

// Create Express application
const app: Application = express();


/**
 * Sets up CORS handling.
 */
function setupCors() {
    app.use(cors({

        origin: "*",

        methods: 'GET, PUT, POST, DELETE',

        allowedHeaders: ['auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],

        credentials:true

    }))
};




export function startServer() {

    setupCors();
    

    app.use(express.json());

    app.use("/api", routes);

    setupDocs (app);

    testConnection();

    const PORT: number = parseInt (process.env.PORT as string) || 4000;
    app.listen(PORT, function() {
        console.log("Server is running on port:" + PORT);
    })
}
