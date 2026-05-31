import { cleanupTestData, closeDb } from "./seed";

export default async function globalTeardown() {
  try {
    await cleanupTestData();
  } finally {
    await closeDb();
  }
}
