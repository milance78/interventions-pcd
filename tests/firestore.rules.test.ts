import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "taches-pcd",
    firestore: { rules: require("fs").readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore ownership rules", () => {
  it("allows a user to access their own data", async () => {
    const db = testEnv.authenticatedContext("user-a").firestore();
    await assertSucceeds(setDoc(doc(db, "users/user-a"), { email: "a@example.com" }));
    await assertSucceeds(getDoc(doc(db, "users/user-a")));
  });

  it("rejects access to another user's data", async () => {
    const db = testEnv.authenticatedContext("user-a").firestore();
    await assertFails(getDoc(doc(db, "users/user-b")));
    await assertFails(setDoc(doc(db, "users/user-b"), { forbidden: true }));
  });

  it("rejects unauthenticated access", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/user-a")));
  });

  it("restricts the session marker fields", async () => {
    const db = testEnv.authenticatedContext("user-a").firestore();
    await assertSucceeds(
      setDoc(doc(db, "users/user-a/security/session"), {
        sessionVersion: "version-1",
        updatedAt: "server-time-placeholder",
      }),
    );
    await assertFails(
      setDoc(doc(db, "users/user-a/security/session"), {
        sessionVersion: "version-2",
        isAdmin: true,
      }),
    );
  });
});
