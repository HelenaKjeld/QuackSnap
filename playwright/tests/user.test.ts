import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

type LoginResponse = {
  error: string | null;
  data?: {
    userId: string;
    userName?: string;
    token: string;
  };
};

function createUserPayload(unique: string) {
  return {
    fullName: "Test User",
    userName: `testuser${unique}`,
    email: `test${unique}@example.com`,
    password: "password123",
  };
}

function createUniqueTestUser(projectName: string) {
  const unique = `${projectName.replace(/\W/g, "")}${randomUUID().replace(/-/g, "")}`;
  return createUserPayload(unique);
}

test("registers a new user", async ({ request }, testInfo) => {
  const user = createUniqueTestUser(testInfo.project.name);
  const response = await request.post("/api/user/register", {
    data: user,
  });

  expect(response.status()).toBe(200);

  const body = (await response.json()) as {
    error: string | null;
    data?: string;
  };
  expect(body.error).toBeNull();
  expect(body.data).toBeTruthy();
});

test("logs in an existing user", async ({ request }, testInfo) => {
  const user = createUniqueTestUser(testInfo.project.name);

  const createResponse = await request.post("/api/user/register", {
    data: user,
  });
  expect(createResponse.status()).toBe(200);

  const loginResponse = await request.post("/api/user/login", {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(loginResponse.status()).toBe(200);

  const loginData = (await loginResponse.json()) as LoginResponse;
  expect(loginData.error).toBeNull();
  expect(loginData.data?.userId).toBeTruthy();
  expect(loginData.data?.token).toBeTruthy();
});

test("deletes the authenticated user profile", async ({ request }, testInfo) => {
  const user = createUniqueTestUser(testInfo.project.name);

  const createResponse = await request.post("/api/user/register", {
    data: user,
  });
  expect(createResponse.status()).toBe(200);

  const loginResponse = await request.post("/api/user/login", {
    data: {
      email: user.email,
      password: user.password,
    },
  });
  expect(loginResponse.status()).toBe(200);

  const loginData = (await loginResponse.json()) as LoginResponse;
  const token = loginData.data?.token;
  expect(token).toBeTruthy();

  const deleteResponse = await request.delete("/api/user/me", {
    headers: {
      "auth-token": String(token),
    },
  });

  expect(deleteResponse.status()).toBe(200);
});
