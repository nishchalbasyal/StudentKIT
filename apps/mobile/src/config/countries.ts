import isoCountries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import type { TimeFormatPreference } from "../api/settings.api";

export type CountryConfig = {
  code: string;
  name: string;
  defaultCurrency: "EUR" | "USD" | "GBP" | "NPR";
  defaultTimeFormat: TimeFormatPreference;
  defaultWorkLimitMode?: "YEARLY_DAYS" | "WEEKLY_HOURS";
  studentWorkLimitDays?: number;
  studentWorkLimitHours?: number;
};

isoCountries.registerLocale(enLocale);

const countryNames = isoCountries.getNames("en", { select: "official" });

const specialRules: Partial<Record<string, Partial<CountryConfig>>> = {
  DE: {
    defaultCurrency: "EUR",
    defaultTimeFormat: "24H",
    defaultWorkLimitMode: "YEARLY_DAYS",
    studentWorkLimitDays: 140,
  },
  GB: {
    defaultCurrency: "GBP",
    defaultTimeFormat: "24H",
    defaultWorkLimitMode: "WEEKLY_HOURS",
    studentWorkLimitHours: 20,
  },
  US: {
    defaultCurrency: "USD",
    defaultTimeFormat: "12H",
    defaultWorkLimitMode: "WEEKLY_HOURS",
    studentWorkLimitHours: 20,
  },
  IN: {
    defaultCurrency: "NPR",
    defaultTimeFormat: "24H",
  },
  NP: {
    defaultCurrency: "NPR",
    defaultTimeFormat: "24H",
  },
};

function defaultCurrencyForCountry(
  code: string,
): CountryConfig["defaultCurrency"] {
  if (code === "US") return "USD";
  if (code === "GB") return "GBP";
  if (code === "IN" || code === "NP") return "NPR";
  return "EUR";
}

function defaultTimeFormatForCountry(code: string): TimeFormatPreference {
  return code === "US" ? "12H" : "24H";
}

export const countries: CountryConfig[] = Object.entries(countryNames)
  .map(([code, name]) => ({
    code,
    name,
    defaultCurrency: defaultCurrencyForCountry(code),
    defaultTimeFormat: defaultTimeFormatForCountry(code),
    ...specialRules[code],
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

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

export function describeCountryWorkLimit(country: CountryConfig) {
  if (country.studentWorkLimitDays) {
    return `${country.studentWorkLimitDays} days/year`;
  }

  if (country.studentWorkLimitHours) {
    return `${country.studentWorkLimitHours} hours/week`;
  }

  return "No fixed student limit";
}
