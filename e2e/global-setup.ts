import { request } from "@playwright/test";
import { mkdirSync } from "fs";
import { seedTestData } from "./seed";
import { TEST_BAKER } from "./fixtures";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5000";

export default async function globalSetup() {
  await seedTestData();

  const ctx = await request.newContext({ baseURL: BASE_URL });
  const res = await ctx.post("/api/auth/login", {
    data: { email: TEST_BAKER.email, password: TEST_BAKER.password },
  });
  if (!res.ok()) {
    throw new Error(
      `E2E login failed (${res.status()}): ${await res.text()}. Is the app running on ${BASE_URL}?`,
    );
  }

  mkdirSync("e2e/.auth", { recursive: true });
  await ctx.storageState({ path: "e2e/.auth/state.json" });
  await ctx.dispose();
}
