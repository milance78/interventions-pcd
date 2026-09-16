import { afterEach, describe, expect, it } from "vitest";
import { getTrustedDevice, isTrustedDevice, revokeCurrentDevice, trustCurrentDevice } from "./trustedDevice";

afterEach(() => localStorage.clear());

describe("trusted device", () => {
  it("does not trust a new browser", () => expect(isTrustedDevice("u1")).toBe(false));
  it("trusts only the confirmed user on this browser", () => {
    const record = trustCurrentDevice("u1");
    expect(record.uid).toBe("u1");
    expect(isTrustedDevice("u1")).toBe(true);
    expect(isTrustedDevice("u2")).toBe(false);
  });
  it("survives reload through localStorage", () => {
    trustCurrentDevice("u1");
    expect(getTrustedDevice()?.uid).toBe("u1");
  });
  it("revokes the current browser", () => {
    trustCurrentDevice("u1");
    revokeCurrentDevice();
    expect(getTrustedDevice()).toBeNull();
  });
  it("rejects malformed storage", () => {
    localStorage.setItem("interventions-pcd:trusted-device", "invalid");
    expect(getTrustedDevice()).toBeNull();
  });
});
