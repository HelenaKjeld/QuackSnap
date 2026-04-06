import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { MongoClient } from "mongodb";

/**
 * Install and run (one consistent command set):
 * 1) npm install
 * 2) npx ts-node ./mongodbPing.ts
 */

/**
 * Read DBHOST from process.env first. If it is missing, try .env in this
 * folder so beginners can run this script without exporting shell variables.
 */
function getMongoUri(): string | null {
  if (process.env.DBHOST && process.env.DBHOST.trim().length > 0) {
    return process.env.DBHOST.trim();
  }

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return null;
  }

  const envContent = readFileSync(envPath, "utf8");
  const line = envContent
    .split(/\r?\n/)
    .find((raw) => raw.trim().startsWith("DBHOST="));

  if (!line) {
    return null;
  }

  const rawValue = line.split("=").slice(1).join("=").trim();
  return rawValue.replace(/^['\"]|['\"]$/g, "");
}

async function runMongoPing(): Promise<void> {
  console.log("[mongodbPing] Step 1/4: Reading DBHOST...");
  const uri = getMongoUri();

  if (!uri) {
    console.error(
      "[mongodbPing] ERROR: DBHOST was not found in environment variables or .env file."
    );
    process.exitCode = 1;
    return;
  }

  // serverSelectionTimeoutMS keeps failures fast and beginner-friendly.
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });

  try {
    console.log("[mongodbPing] Step 2/4: Connecting to MongoDB Atlas...");
    await client.connect();

    console.log("[mongodbPing] Step 3/4: Running lightweight ping command...");
    await client.db("admin").command({ ping: 1 });

    console.log(
      "[mongodbPing] SUCCESS: MongoDB connection is healthy and ping responded."
    );
  } catch (error) {
    console.error("[mongodbPing] ERROR: Could not connect or ping MongoDB Atlas.");
    if (error instanceof Error) {
      console.error(`[mongodbPing] Details: ${error.message}`);
    } else {
      console.error("[mongodbPing] Details:", error);
    }
    process.exitCode = 1;
  } finally {
    console.log("[mongodbPing] Step 4/4: Closing MongoDB connection...");
    await client.close();
  }
}

runMongoPing().catch((error) => {
  console.error("[mongodbPing] ERROR: Unexpected failure while running ping script.");
  if (error instanceof Error) {
    console.error(`[mongodbPing] Details: ${error.message}`);
  } else {
    console.error("[mongodbPing] Details:", error);
  }
  process.exit(1);
});
