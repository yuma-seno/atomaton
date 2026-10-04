import { describe, expect, test } from "bun:test";
import { SWEEP_INTERVAL_MS, sweepDue } from "./issue-index.ts";

/**
 * The sweep is the backstop for the `?since=` cursor, which can skip an issue
 * GitHub's listing had not caught up with. What matters here is only WHEN it runs:
 * too often and every search pays for a full listing, never and a skipped issue is
 * never found.
 */
describe("sweepDue", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  test("a sweep that has never run is due", () => {
    expect(sweepDue(undefined, now)).toBe(true);
  });

  test("a sweep whose record is unreadable is due", () => {
    expect(sweepDue("not a date", now)).toBe(true);
  });

  test("a sweep inside the interval is not due", () => {
    const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(sweepDue(anHourAgo, now)).toBe(false);
  });

  test("a sweep past the interval is due", () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * SWEEP_INTERVAL_MS).toISOString();
    expect(sweepDue(twoDaysAgo, now)).toBe(true);
  });

  test("exactly at the interval it is due", () => {
    const exactly = new Date(now.getTime() - SWEEP_INTERVAL_MS).toISOString();
    expect(sweepDue(exactly, now)).toBe(true);
  });
});
