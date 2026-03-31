import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Application } from "express";

/**
 * Sets up Swagger documentation for the API.
 * @param app
 */
export function setupDocs(app: Application) {
  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: "QrackSnap API",
      version: "1.0.0",
      description: "API documentation for QuackSnap project",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "auth-token",
        },
      },
      schemas: {
        DuckPost: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string" },
            rating: { type: "number" },
            comments: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        UserInput: {
          type: "object",
          required: ["fullName", "userName", "email", "password"],
          properties: {
            fullName: { type: "string", description: "User's full name" },
            userName: { type: "string", description: "User's unique username" },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: { type: "string", description: "User's password" },
          },
        },
        User: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            id: { type: "string" },
            fullName: { type: "string" },
            userName: { type: "string" },
            email: { type: "string" },
            password: { type: "string" },
            registerDate: { type: "string" },
          },
        },
      },
    },
  };

  const options = {
    swaggerDefinition,
    apis: ["**/*.ts"],
  };

  const swaggerSpec = swaggerJSDoc(options);

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
