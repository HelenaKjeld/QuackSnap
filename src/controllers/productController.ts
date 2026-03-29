import { Request, Response } from "express";
import { RubberDuckModel } from "../models/rubberDuckModel";
import { connect, disconnect } from "../repository/database";
import { buildDynamicQuery } from "./dynamicueryBuilder";

// CRUD YEAH

/**
 * Add new DUCKS to the database
 * @param req
 * @param res
 */
export async function createDucks(req: Request, res: Response): Promise<void> {
  const data = req.body;

  try {
    await connect();

    const product = new RubberDuckModel(data);
    const result = await product.save();

    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating product:", err); // Add this line

    res.status(500).json("An error occurred while creating the product." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves all DUCKS from the database
 * @param req
 * @param res
 */
export async function getAllDucks(req: Request, res: Response): Promise<void> {
  try {
    await connect();

    const result = await RubberDuckModel.find({});

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json("error retrieving the products." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DUCK by ID from the database
 * @param req
 * @param res
 */
export async function getDuckById(req: Request, res: Response): Promise<void> {
  try {
    await connect();

    const id = req.params.id;
    const result = await RubberDuckModel.findById({ _id: id });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json("error retrieving product by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Update a DUCK by ID from the database
 * @param req
 * @param res
 */
export async function updateDuckById(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  try {
    await connect();

    const result = await RubberDuckModel.findByIdAndUpdate(id, req.body);
    if (!result) {
      res.status(404).send("can nott update Duke with the id=" + id);
    } else {
      res.status(200).send("product was updated successfully.");
    }
  } catch (err) {
    res.status(500).json("error update the DUCK product by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Delete a DUCK by ID from the database
 * @param req
 * @param res
 */
export async function deleteDuckById(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  try {
    await connect();

    const result = await RubberDuckModel.findByIdAndDelete(id);
    if (!result) {
      res.status(404).send("can not delete Duke with the id=" + id);
    } else {
      res.status(200).send("product was deleted successfully.");
    }
  } catch (err) {
    res.status(500).json("error deleting the DUCK product by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DUCK by query from the database
 * @param req
 * @param res
 */
export async function getDucksByQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connect();

    // api/products/key/value

    const key: any = req.params.key;
    const value: any = req.params.value;

    const result = await RubberDuckModel.find({
      [key]: { $regex: value, $options: "i" },
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json("error retrieving product by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DUCK by query from the database
 * @param req
 * @param res
 */
export async function getDucksByQueryGeneric(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connect();

    // api/products/query

    const body = req.body;

    const result = await RubberDuckModel.find(
      buildDynamicQuery(RubberDuckModel, body),
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json("error retrieving product by id." + err);
  } finally {
    await disconnect();
  }
}
