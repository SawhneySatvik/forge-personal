import { describe, expect, it } from "vitest";
import { submissionCalendarToCountByDay } from "@/lib/integrations/leetcode-shared";

const unix = (y: number, m: number, d: number, h = 0) =>
  String(Math.floor(Date.UTC(y, m - 1, d, h) / 1000));

describe("submissionCalendarToCountByDay", () => {
  it("keys days in the user's tz (IST keeps a UTC-midnight key on the same day)", () => {
    const raw = { [unix(2026, 5, 30)]: 3 };
    expect(submissionCalendarToCountByDay(raw, "Asia/Kolkata")).toEqual({
      "2026-05-30": 3,
    });
  });

  it("shifts a UTC-midnight instant back a day for a negative-offset tz", () => {
    const raw = { [unix(2026, 5, 30)]: 2 };
    expect(
      submissionCalendarToCountByDay(raw, "America/Los_Angeles"),
    ).toEqual({ "2026-05-29": 2 });
  });

  it("accumulates instants that collapse into one local day", () => {
    const raw = { [unix(2026, 5, 30, 0)]: 1, [unix(2026, 5, 30, 3)]: 2 };
    expect(submissionCalendarToCountByDay(raw, "Asia/Kolkata")).toEqual({
      "2026-05-30": 3,
    });
  });

  it("skips zero counts and unparseable keys", () => {
    const raw = { [unix(2026, 5, 30)]: 0, notanumber: 5 };
    expect(submissionCalendarToCountByDay(raw, "Asia/Kolkata")).toEqual({});
  });
});
