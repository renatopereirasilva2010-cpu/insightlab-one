import { describe, expect, it } from "vitest";
import { hasPermission } from "./auth";
import type { SessionUser } from "@/lib/session";

const user: SessionUser = {
  id: "user-1",
  email: "admin@mix-demo.local",
  tenantId: "tenant-1",
  unitId: "unit-1",
  permissions: ["clients.read", "sales.create"],
};

describe("hasPermission", () => {
  it("is true for a granted permission", () => {
    expect(hasPermission(user, "clients.read")).toBe(true);
  });

  it("is false for a permission the user does not hold", () => {
    expect(hasPermission(user, "payments.receive")).toBe(false);
  });

  it("does not match on prefixes", () => {
    expect(hasPermission(user, "clients")).toBe(false);
    expect(hasPermission(user, "clients.read.all")).toBe(false);
  });
});
