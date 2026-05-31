import { describe, expect, it } from "vitest";
import {
  addDays,
  dayInRange,
  dayOfWeek,
  daysBetween,
  isDayKey,
  prevDay,
  startOfWeek,
  toDayKeyInTz,
} from "@/lib/date";

describe("date helpers", () => {
  it("knows weekdays (2026-01-01 is a Thursday)", () => {
    expect(dayOfWeek("2026-01-01")).toBe(4); // 0=Sun .. 4=Thu
  });

  it("addDays / prevDay cross month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(prevDay("2026-03-01")).toBe("2026-02-28");
    // DST is irrelevant — arithmetic is in UTC.
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });

  it("daysBetween is signed", () => {
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(daysBetween("2026-01-08", "2026-01-01")).toBe(-7);
  });

  it("startOfWeek(Monday) lands on the Monday", () => {
    // 2026-01-01 is Thursday -> the Monday of that week is 2025-12-29.
    expect(startOfWeek("2026-01-01", 1)).toBe("2025-12-29");
    expect(dayOfWeek(startOfWeek("2026-05-31", 1))).toBe(1); // Monday
  });

  it("dayInRange is inclusive", () => {
    expect(dayInRange("2026-01-05", "2026-01-01", "2026-01-10")).toBe(true);
    expect(dayInRange("2026-01-01", "2026-01-01", "2026-01-10")).toBe(true);
    expect(dayInRange("2026-01-11", "2026-01-01", "2026-01-10")).toBe(false);
  });

  it("validates day keys", () => {
    expect(isDayKey("2026-05-31")).toBe(true);
    expect(isDayKey("2026-13-01")).toBe(false);
    expect(isDayKey("not-a-date")).toBe(false);
  });

  it("resolves a calendar day in a timezone", () => {
    // 18:30 UTC on Jan 1 is already Jan 2 in Asia/Kolkata (UTC+5:30).
    const instant = new Date("2026-01-01T18:30:00Z");
    expect(toDayKeyInTz(instant, "Asia/Kolkata")).toBe("2026-01-02");
    expect(toDayKeyInTz(instant, "UTC")).toBe("2026-01-01");
  });
});
