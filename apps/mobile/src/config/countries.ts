import type { TimeFormatPreference } from "../api/settings.api";

export type CountryConfig = {
  code: string;
  name: string;
  defaultCurrency: "EUR" | "USD" | "GBP" | "NPR";
  defaultTimeFormat: TimeFormatPreference;
  studentWorkLimitDays?: number;
  studentWorkLimitHours?: number;
};

export const countries: CountryConfig[] = [
  {
    code: "DE",
    name: "Germany",
    defaultCurrency: "EUR",
    defaultTimeFormat: "24H",
    studentWorkLimitDays: 140,
  },
  {
    code: "NP",
    name: "Nepal",
    defaultCurrency: "NPR",
    defaultTimeFormat: "24H",
  },
  {
    code: "IN",
    name: "India",
    defaultCurrency: "NPR",
    defaultTimeFormat: "24H",
  },
  {
    code: "GB",
    name: "United Kingdom",
    defaultCurrency: "GBP",
    defaultTimeFormat: "24H",
    studentWorkLimitHours: 20,
  },
  {
    code: "US",
    name: "United States",
    defaultCurrency: "USD",
    defaultTimeFormat: "12H",
    studentWorkLimitHours: 20,
  },
];

export function findCountryConfig(value: string) {
  const query = value.trim().toLowerCase();
  return countries.find(
    (country) =>
      country.code.toLowerCase() === query ||
      country.name.toLowerCase() === query,
  );
}

export function searchCountries(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return countries;

  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(normalized) ||
      country.code.toLowerCase().includes(normalized),
  );
}
