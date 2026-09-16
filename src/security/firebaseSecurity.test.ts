import { describe, expect, it, vi } from "vitest";

const setDoc = vi.fn(() => Promise.resolve());
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => "session-ref"),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  setDoc,
}));
vi.mock("firebase/functions", () => ({ getFunctions: vi.fn(), httpsCallable: vi.fn() }));
vi.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
}));
vi.mock("../firebase/firebaseConfig", () => ({ db: "db", auth: { currentUser: null } }));

import { revokeAllApplicationSessions } from "./firebaseSecurity";

describe("Firebase security helpers", () => {
  it("rejects an empty UID", async () => {
    await expect(revokeAllApplicationSessions(" ")).rejects.toThrow("valid user ID");
  });

  it("writes only the requested user's session marker", async () => {
    const firestore = await import("firebase/firestore");
    await revokeAllApplicationSessions("user-123");
    expect(firestore.doc).toHaveBeenCalledWith("db", "users", "user-123", "security", "session");
    expect(setDoc).toHaveBeenCalledWith(
      "session-ref",
      expect.objectContaining({ sessionVersion: expect.any(String), updatedAt: "SERVER_TIMESTAMP" }),
      { merge: true },
    );
  });
});
