import { Request, Response } from "express";
import { DuckPostModel } from "../models/duckModel";
import { CommentModel } from "../models/commentModel";
import { connect, disconnect } from "../repository/database";
import { buildDynamicQuery } from "./dynamicueryBuilder";

// CRUD YEAH

async function attachCommentsToPosts<T extends { _id: unknown; comments?: unknown[] }>(
  posts: T[],
): Promise<T[]> {
  const postIds = posts.map((post) => String(post._id));
  const comments = await CommentModel.find({ postId: { $in: postIds } })
    .populate("createdBy", "userName fullName")
    .lean();

  return posts.map((post) => {
    const postId = String(post._id);
    const storedComments = comments.filter((comment) => String(comment.postId) === postId);

    return {
      ...post,
      comments: [...(post.comments ?? []), ...storedComments],
    };
  });
}

/**
 * Add new DUCKS to the database
 * @param req
 * @param res
 */
export async function createDucks(req: Request, res: Response): Promise<void> {
  const data = req.body;

  try {
    if (!data._createdBy) {
      res.status(400).json({ error: "_createdBy is required." });
      return;
    }

    await connect();

    const product = new DuckPostModel(data);
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

    const result = await DuckPostModel.find({})
      .sort({ _id: -1 })
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    res.status(200).json(await attachCommentsToPosts(result));
  } catch (err) {
    res.status(500).json("error retrieving the products." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DuckPost by ID from the database
 * @param req
 * @param res
 */
export async function getDuckPostById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connect();

    const id = req.params.id;
    const result = await DuckPostModel.findById({ _id: id })
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    if (!result) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    const [postWithComments] = await attachCommentsToPosts([result]);
    res.status(200).json(postWithComments);
  } catch (err) {
    res.status(500).json("error retrieving DuckPost by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Update a DUCK by ID from the database
 * @param req
 * @param res
 */
export async function updateDuckPostById(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  try {
    await connect();

    const result = await DuckPostModel.findByIdAndUpdate(id, req.body);
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
 * Delete a DuckPost by ID from the database
 * @param req
 * @param res
 */
export async function deleteDuckPostById(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  try {
    await connect();

    const result = await DuckPostModel.findByIdAndDelete(id);
    if (!result) {
      res.status(404).send("can not delete DuckPost with the id=" + id);
    } else {
      res.status(200).send("DuckPost was deleted successfully.");
    }
  } catch (err) {
    res.status(500).json("error deleting the DuckPost by id." + err);
  } finally {
    await disconnect();
  }
}

export async function addCommentToDuckPost(
  req: Request,
  res: Response,
): Promise<void> {
  const id = String(req.params.postId ?? req.params.id);
  const comment = String(req.body.comment ?? "").trim();
  const userId = res.locals.userId as string | undefined;

  try {
    if (!userId) {
      res.status(401).json({ error: "Could not resolve authenticated user." });
      return;
    }

    if (comment.length < 1 || comment.length > 280) {
      res.status(400).json({ error: "Comment must be between 1 and 280 characters." });
      return;
    }

    await connect();

    const postExists = await DuckPostModel.exists({ _id: id });
    if (!postExists) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    await CommentModel.create({
      postId: id,
      text: comment,
      createdBy: userId,
    });

    const result = await DuckPostModel.findById(id)
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    const [postWithComments] = await attachCommentsToPosts(result ? [result] : []);
    res.status(200).json(postWithComments);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Could not add comment.", details: message });
  } finally {
    await disconnect();
  }
}

export async function deleteCommentFromDuckPost(
  req: Request,
  res: Response,
): Promise<void> {
  const postId = String(req.params.postId);
  const commentId = String(req.params.commentId);
  const userId = res.locals.userId as string | undefined;

  try {
    if (!userId) {
      res.status(401).json({ error: "Could not resolve authenticated user." });
      return;
    }

    await connect();

    const deletedComment = await CommentModel.findOneAndDelete({
      _id: commentId,
      postId,
      createdBy: userId,
    });

    let result = await DuckPostModel.findById(postId)
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    if (!deletedComment) {
      result = await DuckPostModel.findOneAndUpdate(
        {
          _id: postId,
          "comments._id": commentId,
          "comments.createdBy": userId,
        },
        { $pull: { comments: { _id: commentId } } },
        { new: true },
      )
        .populate("_createdBy", "userName fullName")
        .populate("comments.createdBy", "userName fullName")
        .lean();

      if (!result) {
        res.status(404).json({ error: "Comment not found or you do not have permission to delete it." });
        return;
      }
    }

    if (!result) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    const [postWithComments] = await attachCommentsToPosts([result]);
    res.status(200).json(postWithComments);
  } catch (err) {
    res.status(500).json("error deleting comment from DuckPost." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DUCK by query from the database
 * @param req
 * @param res
 */
export async function getDuckPostsByQuery(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connect();

    // api/products/key/value

    const key: any = req.params.key;
    const value: any = req.params.value;

    const result = await DuckPostModel.find({
      [key]: { $regex: value, $options: "i" },
    })
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    res.status(200).json(await attachCommentsToPosts(result));
  } catch (err) {
    res.status(500).json("error retrieving DuckPost by id." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Retrieves a DuckPost by query from the database
 * @param req
 * @param res
 */
export async function getDuckPostsByQueryGeneric(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connect();

    // api/products/query

    const body = req.body;

    const result = await DuckPostModel.find(
      buildDynamicQuery(DuckPostModel, body),
    )
      .populate("_createdBy", "userName fullName")
      .populate("comments.createdBy", "userName fullName")
      .lean();

    res.status(200).json(await attachCommentsToPosts(result));
  } catch (err) {
    res.status(500).json("error retrieving DuckPost by id." + err);
  } finally {
    await disconnect();
  }
}
