import { describe, it, expect } from "vitest";
import { run, demo, inspect, stalePrs, busFactor, hotPaths } from "../src/engine";

describe("repo-radar", () => {
  it("demo + inspect", () => {
    expect(demo().score).toBeGreaterThanOrEqual(0);
    expect(inspect().name).toBe("repo-radar");
  });
  it("run health", () => {
    const r = run({});
    expect(r.findings.length).toBeGreaterThan(0);
    expect(r.metrics.stale).toBeGreaterThan(0);
  });
  it("domain helpers", () => {
    expect(stalePrs([{ id: "1", title: "x", ageDays: 10, author: "a" }])).toHaveLength(1);
    expect(busFactor([{ file: "a", author: "a", at: "1" }, { file: "a", author: "b", at: "2" }]).authors).toBe(2);
    expect(hotPaths([{ file: "a", author: "a", at: "1" }, { file: "a", author: "b", at: "2" }])[0].touches).toBe(2);
  });
});
