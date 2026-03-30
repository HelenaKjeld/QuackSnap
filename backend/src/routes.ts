import { Router, Request, Response } from "express";
import {
  createDucks,
  getAllDucks,
  getDuckPostById,
  updateDuckPostById,
  deleteDuckPostById,
  getDuckPostsByQuery,
  getDuckPostsByQueryGeneric,
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
  res.status(200).send("Welcome to the QuackSnap");
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
 *             $ref: '#/components/schemas/UserInput'
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
 *                     userName:
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
 *     summary: Create a new DUCK post
 *     description: Creates a new DUCK post in the database. Requires an auth token.
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
 *         description: DUCK post created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Missing or invalid auth token
 *       500:
 *         description: Server error
 */

router.post("/products", verifyToken, createDucks);

// gets all
/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Product Routes
 *     summary: Get all DUCK posts
 *     description: Retrieves all DUCK posts from the database.
 *     responses:
 *       200:
 *         description: A list of DUCK posts
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

// get by id
router.get("/products/:id", getDuckPostById);

router.post("/products/query", getDuckPostsByQueryGeneric);

router.post("/products/:key/:value", getDuckPostsByQuery);

// update
router.put("/products/:id", verifyToken, updateDuckPostById);

// delete
router.delete("/products/:id", verifyToken, deleteDuckPostById);

export default router;
