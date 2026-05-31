export interface TimezoneOption {
  value: string;
  label: string;
}

/** A curated IANA timezone list (extend freely). */
export const TIMEZONES: TimezoneOption[] = [
  { value: "Asia/Kolkata", label: "India — IST (UTC+5:30)" },
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "America/Denver", label: "US Mountain" },
  { value: "America/Chicago", label: "US Central" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Central Europe" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export const TIMEZONE_VALUES = new Set(TIMEZONES.map((t) => t.value));
