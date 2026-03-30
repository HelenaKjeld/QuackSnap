import bcrypt from "bcrypt";
import dotenvFlow from "dotenv-flow";
import { faker } from "@faker-js/faker";

// Project import
import { DuckPostModel } from "../src/models/duckModel";
import { UserModel } from "../src/models/userModel";
import { connect, disconnect } from "../src/repository/database";

dotenvFlow.config();

/**
 * Seed the database with data
 */
export async function seed() {
  try {
    await connect();

    await deleteAllData();
    await seedData();
    console.log("Seeding process completed successfully...");
    process.exit();
  } catch (err) {
    console.log("Error Seeding data." + err);
  } finally {
    await disconnect();
  }
}

/**
 * Delete all data from the database
 */
export async function deleteAllData() {
  await DuckPostModel.deleteMany();
  await UserModel.deleteMany();

  console.log("Cleared data successfully...");
}

/**
 * Seed data into the database
 */
export async function seedData() {
  // hash the password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("12345678", salt);

  const user1 = new UserModel();
  user1.fullName = faker.person.fullName();
  user1.email = faker.internet.email();
  user1.password = passwordHash;
  await user1.save();

  const user2 = new UserModel();
  user2.fullName = faker.person.fullName();
  user2.email = faker.internet.email();
  user2.password = passwordHash;
  await user2.save();

  // Generate fake product
  const colors = ["yellow", "red", "blue", "green", "pink", "orange", "purple"];
  const themes = [
    "classic",
    "pirate",
    "superhero",
    "princess",
    "astronaut",
    "holiday",
  ];

  for (let index = 0; index < 10; index++) {
    await new DuckPostModel({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      imageUrl: "https://picsum.photos/500/500",
      rating: faker.number.int({ min: 1, max: 5 }),
      comments: [],
      _createdBy: user1.id,
    }).save();
  }

  console.log("Seeded data successfully...");
}

// start the actual seeding
seed();
