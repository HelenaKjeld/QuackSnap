import { Router, Request, Response } from "express";
import {
  createDucks,
  getAllDucks,
  getDuckById,
  updateDuckById,
  deleteDuckById,
  getDucksByQuery,
  getDucksByQueryGeneric,
} from "./controllers/productController";
import {
  loginUser,
  registerUser,
  verifyToken,
} from "./controllers/authController";

const router: Router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - App Routes
 *     summary: Health check
 *     description: Basic route to check if the API is running
 *     responses:
 *      200:
 *        description: API is running.
 */

router.get("/", (req: Request, res: Response) => {
  // connect
  res.status(200).send("Welcome to the MENTS API");
  // disconnect
});

// auth routes
/**
 * @swagger
 * /user/register:
 *   post:
 *     tags:
 *       - User Routes
 *     summary: Register a new user
 *     description: Takes a user in the body and tries to register it in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                _id:
 *                  type: string
 */
router.post("/user/register", registerUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - User Routes
 *     summary: Login a user
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           auth-token:
 *             description: JWT authentication token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post("/user/login", loginUser);

// create
/**
 * @swagger
 * /products:
 *   post:
 *     tags:
 *       - Product Routes
 *     summary: Create a new DUCK
 *     description: Creates a new DUCK in the database. Requires authentication.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RubberDuck'
 *     responses:
 *       201:
 *         description: DUCK created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RubberDuck'
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post("/products", verifyToken, createDucks);

// gets
/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Product Routes
 *     summary: Get all DUCKs
 *     description: Retrieves all DUCKs from the database.
 *     responses:
 *       200:
 *         description: A list of all DUCKs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RubberDuck'
 *       500:
 *         description: Server error
 */
router.get("/products", getAllDucks);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags:
 *       - Product Routes
 *     summary: Get a DUCK by ID
 *     description: Retrieves a specific DUCK from the database by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the DUCK to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested DUCK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RubberDuck'
 *       404:
 *         description: DUCK not found
 *       500:
 *         description: Server error
 */
router.get("/products/:id", getDuckById);

/**
 * @swagger
 * /products/query:
 *   post:
 *     tags:
 *       - Product Routes
 *     summary: Query DUCKs with dynamic filters
 *     description: Retrieves DUCKs from the database based on dynamic query parameters in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Dynamic query object with field names and values to filter by
 *             example:
 *               name: "Yellow Duck"
 *               price: 10
 *     responses:
 *       200:
 *         description: A list of DUCKs matching the query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RubberDuck'
 *       500:
 *         description: Server error
 */
router.post("/products/query", getDucksByQueryGeneric);

/**
 * @swagger
 * /products/{key}/{value}:
 *   post:
 *     tags:
 *       - Product Routes
 *     summary: Query DUCKs by key/value pair
 *     description: Retrieves DUCKs from the database that match the specified key/value pair. Requires authentication.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         description: The field name to search by (e.g., name, color)
 *         schema:
 *           type: string
 *       - in: path
 *         name: value
 *         required: true
 *         description: The value to search for (case-insensitive)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of DUCKs matching the query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RubberDuck'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post("/products/:key/:value", getDucksByQuery);

// update
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags:
 *      - Product Routes
 *     summary: Update a DUCK by ID
 *     description: Updates a specific DUCK in the database by its ID. Requires authentication.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID from repository
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RubberDuck'
 *     responses:
 *       200:
 *         description: DUCK updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RubberDuck'
 */
router.put("/products/:id", verifyToken, updateDuckById);

// delete
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags:
 *       - Product Routes
 *     summary: Delete a DUCK by ID
 *     description: Deletes a specific DUCK from the database by its ID. Requires authentication.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the DUCK to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DUCK deleted successfully
 *       404:
 *         description: DUCK not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.delete("/products/:id", verifyToken, deleteDuckById);

export default router;
