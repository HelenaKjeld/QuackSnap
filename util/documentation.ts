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
      title: "Rubber Ducks API",
      version: "1.0.0",
      description: "API documentation for the Rubber Ducks project",
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
        RubberDuck: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string" },
            color: { type: "string" },
            theme: { type: "string" },
            size: { type: "number" },
            price: { type: "number" },
            inStock: { type: "boolean" },
            isOnDiscount: { type: "boolean" },
            discountPercentage: { type: "number" },
            isHidden: { type: "boolean" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
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
