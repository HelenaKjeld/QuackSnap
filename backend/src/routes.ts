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
  deleteMyProfile,
  getMyProfile,
  loginUser,
  registerUser,
  updateMyProfile,
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

/**
 * @swagger
 * /user/me:
 *   get:
 *     tags:
 *       - User Routes
 *     summary: Get current user profile
 *     description: Retrieves the profile of the currently authenticated user.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/me", verifyToken, getMyProfile);

/**
 * @swagger
 * /user/me:
 *   put:
 *     tags:
 *       - User Routes
 *     summary: Update current user profile
 *     description: Updates full name, username, email, and optionally password for the authenticated user.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Optional new password
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation failed or email/username already exists
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/user/me", verifyToken, updateMyProfile);

/**
 * @swagger
 * /user/me:
 *   delete:
 *     tags:
 *       - User Routes
 *     summary: Delete current user account
 *     description: Permanently deletes the authenticated user's account.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/user/me", verifyToken, deleteMyProfile);

// create
/**
 * @swagger
 * /post:
 *   post:
 *     tags:
 *       - Post Routes
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

router.post("/posts", verifyToken, createDucks);

// gets all
/**
 * @swagger
 * /post:
 *   get:
 *     tags:
 *       - Post Routes
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
router.get("/posts", getAllDucks);

// get by id
router.get("/posts/:id", getDuckPostById);

router.post("/posts/query", getDuckPostsByQueryGeneric);

router.post("/posts/:key/:value", getDuckPostsByQuery);

// update
router.put("/posts/:id", verifyToken, updateDuckPostById);

// delete
router.delete("/posts/:id", verifyToken, deleteDuckPostById);

export default router;
