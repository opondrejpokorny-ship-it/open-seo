import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalEnvValue: vi.fn(),
  isHostedServerAuthMode: vi.fn(),
  customerHasPaidPlan: vi.fn(),
}));

vi.mock("@/server/lib/runtime-env", () => ({
  getOptionalEnvValue: mocks.getOptionalEnvValue,
  isHostedServerAuthMode: mocks.isHostedServerAuthMode,
}));

vi.mock("@/server/billing/subscription", () => ({
  customerHasPaidPlan: mocks.customerHasPaidPlan,
}));

import { assertAiVisibilityAccess } from "./access";

describe("assertAiVisibilityAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOptionalEnvValue.mockResolvedValue("encoded-key");
    mocks.isHostedServerAuthMode.mockResolvedValue(false);
    mocks.customerHasPaidPlan.mockResolvedValue(true);
  });

  it("fails clearly when DataForSEO is not configured", async () => {
    mocks.getOptionalEnvValue.mockResolvedValue(undefined);

    const result = assertAiVisibilityAccess("org_1");
    await expect(result).rejects.toMatchObject({
      code: "AUTH_CONFIG_MISSING",
    });
    await expect(result).rejects.toThrow("DATAFORSEO_API_KEY");
    expect(mocks.isHostedServerAuthMode).not.toHaveBeenCalled();
    expect(mocks.customerHasPaidPlan).not.toHaveBeenCalled();
  });

  it("allows configured self-hosted deployments", async () => {
    await expect(assertAiVisibilityAccess("org_1")).resolves.toBeUndefined();
    expect(mocks.customerHasPaidPlan).not.toHaveBeenCalled();
  });

  it("requires a paid plan in hosted mode", async () => {
    mocks.isHostedServerAuthMode.mockResolvedValue(true);
    mocks.customerHasPaidPlan.mockResolvedValue(false);

    await expect(assertAiVisibilityAccess("org_1")).rejects.toMatchObject({
      code: "PAYMENT_REQUIRED",
    });
    expect(mocks.customerHasPaidPlan).toHaveBeenCalledWith("org_1");
  });

  it("allows paid hosted organizations", async () => {
    mocks.isHostedServerAuthMode.mockResolvedValue(true);

    await expect(assertAiVisibilityAccess("org_1")).resolves.toBeUndefined();
    expect(mocks.customerHasPaidPlan).toHaveBeenCalledWith("org_1");
  });
});
