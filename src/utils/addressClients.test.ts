import { describe, expect, it } from "vitest";
import {
  createAddressClient,
  formatAddressClientsForComment,
} from "./addressClients";

const client = (overrides: Partial<ReturnType<typeof createAddressClient>> = {}) => ({
  ...createAddressClient("test"),
  ...overrides,
});

describe("formatAddressClientsForComment", () => {
  it("formats one Cuivre client with network", () => {
    expect(formatAddressClientsForComment([
      client({ fullName: "Jean Dupont", na: "123456", operator: "Proximus" }),
    ], "Cuivre")).toBe("Un TF à l'adresse: Jean Dupont, NA: 123456, chez Proximus;");
  });

  it("formats one Cuivre Mobile Vikings client without repeating network", () => {
    expect(formatAddressClientsForComment([
      client({ na: "123456", operator: "Mobile Vikings" }),
    ], "Cuivre")).toBe("Un TF à l'adresse: Mobile Vikings, NA: 123456;");
  });

  it("formats one Cuivre Autre OLO client without repeating network", () => {
    expect(formatAddressClientsForComment([
      client({ na: "123456", operator: "Autre OLO" }),
    ], "Cuivre")).toBe("Un TF à l'adresse: Autre OLO, NA: 123456;");
  });

  it("formats multiple Cuivre clients", () => {
    expect(formatAddressClientsForComment([
      client({ fullName: "Jean Dupont", na: "111", operator: "Proximus" }),
      client({ na: "222", operator: "Mobile Vikings" }),
      client({ na: "333", operator: "Autre OLO" }),
    ], "Cuivre")).toBe([
      "Clients TF à l'adresse:",
      "1. Jean Dupont, NA: 111, chez Proximus;",
      "2. Mobile Vikings, NA: 222;",
      "3. Autre OLO, NA: 333;",
    ].join("\n"));
  });

  it("formats one Fibre client with network", () => {
    expect(formatAddressClientsForComment([
      client({ fullName: "Jean Dupont", utac: "UT123", operator: "Proximus" }),
    ], "Fibre")).toBe("L'UTAC à l'adresse UT123 est occupé par Jean Dupont, chez Proximus;");
  });

  it("formats one Fibre Mobile Vikings client", () => {
    expect(formatAddressClientsForComment([
      client({ utac: "UT123", operator: "Mobile Vikings" }),
    ], "Fibre")).toBe("L'UTAC à l'adresse UT123 est occupé par un Mobile Vikings;");
  });

  it("formats one Fibre Autre OLO client", () => {
    expect(formatAddressClientsForComment([
      client({ utac: "UT123", operator: "Autre OLO" }),
    ], "Fibre")).toBe("L'UTAC à l'adresse UT123 est occupé par autre OLO;");
  });

  it("formats multiple Fibre clients", () => {
    expect(formatAddressClientsForComment([
      client({ fullName: "Jean Dupont", utac: "UT111", operator: "Proximus" }),
      client({ utac: "UT222", operator: "Mobile Vikings" }),
      client({ utac: "UT333", operator: "Autre OLO" }),
    ], "Fibre")).toBe([
      "Les UTAC à l'adresse occupés par:",
      "1. Jean Dupont, UTAC: UT111, chez Proximus;",
      "2. Mobile Vikings, UTAC: UT222;",
      "3. Autre OLO, UTAC: UT333;",
    ].join("\n"));
  });

  it("ignores empty placeholder clients", () => {
    expect(formatAddressClientsForComment([
      client(),
      client({ fullName: "Jean Dupont", na: "123", operator: "Proximus" }),
    ], "Cuivre")).toBe("Un TF à l'adresse: Jean Dupont, NA: 123, chez Proximus;");
  });
});
