import { type Request, type Response, type NextFunction } from "express";

import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import Joi, { ValidationResult } from "joi";

//Product imports
import { UserModel } from "../models/userModel";
import { User } from "../interfaces/user";
import { connect, disconnect } from "../repository/database";

/**
 * Registers a new user in the database
 * @param req
 * @param res
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserRegistration(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const emailExists = await UserModel.findOne({ email: req.body.email });
    if (emailExists) {
      res.status(400).json({ error: "Email already exists." });
      return;
    }

    const userNameExists = await UserModel.findOne({
      userName: req.body.userName,
    });
    if (userNameExists) {
      res.status(400).json({ error: "Username already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const userObject = new UserModel({
      fullName: req.body.fullName,
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPassword,
    });

    const savedUser = await userObject.save();
    res.status(200).json({ error: null, data: savedUser._id });
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while registering the user. Error:" + error);
  } finally {
    await disconnect();
  }
}

/**
 * Login an existing user
 * @param req
 * @param res
 * @returns
 */

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserLoginInfo(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    await connect();
    const user: User | null = await UserModel.findOne({
      email: req.body.email,
    });

    if (!user) {
      res.status(400).json({ error: "Email or password is wrong." });
      return;
    } else {
      const validPassword: boolean = await bcrypt.compare(
        req.body.password,
        user.password,
      );

      if (!validPassword) {
        res.status(400).json({ error: "Email or password is wrong." });
        return;
      }

      const userId: string = user.id;
      const token: string = jwt.sign(
        {
          name: user.fullName,
          email: user.email,
          id: userId,
        },

        process.env.TOKEN_SECRET as string,
        { expiresIn: "2h" },
      );

      res
        .status(200)
        .header("auth-token", token)
        .json({
          error: null,
          data: { userId, userName: user.userName, token },
        });
    }
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while logging in the user. Error:" + error);
  } finally {
    await disconnect();
  }
}

/**
 * Middlewarw to verify the JWT token and protect routes
 * @param req
 * @param res
 * @param next
 */

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.header("auth-token");
  if (!token) {
    res.status(400).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as {
      id?: string;
    };

    if (!decoded?.id) {
      res.status(401).json({ error: "Invalid token payload." });
      return;
    }

    res.locals.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).send({ error: "Invalid token." });
  }
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Could not resolve authenticated user." });
      return;
    }

    await connect();

    const user = await UserModel.findById(userId).select(
      "fullName userName email registerDate",
    );
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({ error: null, data: user });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while loading profile." });
  } finally {
    await disconnect();
  }
}

/**
 * Update the currently authenticated user's profile.
 */
export async function updateMyProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Could not resolve authenticated user." });
      return;
    }

    const { error } = validateUserProfileUpdate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (req.body.email && req.body.email !== currentUser.email) {
      const emailExists = await UserModel.findOne({
        email: req.body.email,
        _id: { $ne: userId },
      });
      if (emailExists) {
        res.status(400).json({ error: "Email already exists." });
        return;
      }
      currentUser.email = req.body.email;
    }

    if (req.body.userName && req.body.userName !== currentUser.userName) {
      const userNameExists = await UserModel.findOne({
        userName: req.body.userName,
        _id: { $ne: userId },
      });
      if (userNameExists) {
        res.status(400).json({ error: "Username already exists." });
        return;
      }
      currentUser.userName = req.body.userName;
    }

    if (req.body.fullName) {
      currentUser.fullName = req.body.fullName;
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      currentUser.password = await bcrypt.hash(req.body.password, salt);
    }

    await currentUser.save();

    res.status(200).json({
      error: null,
      data: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        userName: currentUser.userName,
        email: currentUser.email,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating profile." });
  } finally {
    await disconnect();
  }
}

/**
 * Delete the currently authenticated user's account.
 */
export async function deleteMyProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Could not resolve authenticated user." });
      return;
    }

    await connect();

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({ error: null, data: "User deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting profile." });
  } finally {
    await disconnect();
  }
}

/**
 * Validates the user registration data (fullName, userName, email, password)
 * @param data
 */
export function validateUserRegistration(data: User): ValidationResult {
  const schema = Joi.object({
    fullName: Joi.string().min(3).max(255).required(),
    userName: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().min(5).max(255).required(),
    password: Joi.string().min(6).max(30).required(),
  });

  return schema.validate(data);
}

/**
 * Validates the user Login ( email, password)
 * @param data
 */
export function validateUserLoginInfo(data: User): ValidationResult {
  const schema = Joi.object({
    email: Joi.string().email().min(5).max(255).required(),
    password: Joi.string().min(6).max(30).required(),
  });

  return schema.validate(data);
}

/**
 * Validates profile update payload.
 */
export function validateUserProfileUpdate(
  data: Partial<User>,
): ValidationResult {
  const schema = Joi.object({
    fullName: Joi.string().min(3).max(255),
    userName: Joi.string().min(3).max(255),
    email: Joi.string().email().min(5).max(255),
    password: Joi.string().min(6).max(30),
  }).min(1);

  return schema.validate(data);
}
