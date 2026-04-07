import { readFile } from "fs/promises";
import path from "path";
import type { Pin } from "@/types/pin";

export interface CountryGeoItem {
    code?: string;
    name: string;
    nameTr?: string;
    continent?: string;
    lat?: number;
    lng?: number;
}

export interface CityGeoItem {
    name: string;
    country: string;
    lat?: number;
    lng?: number;
}

export interface GeoLookups {
    countriesByCode: Map<string, CountryGeoItem>;
    countriesByName: Map<string, CountryGeoItem>;
    cities: CityGeoItem[];
    citiesByCode: Map<string, CityGeoItem>;
}

let geoLookupsPromise: Promise<GeoLookups> | null = null;

export function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createTokenRegex(token: string): RegExp {
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(token)}([^a-z0-9]|$)`, "i");
}

export async function getGeoLookups(): Promise<GeoLookups> {
    if (!geoLookupsPromise) {
        geoLookupsPromise = (async () => {
            const countriesPath = path.join(process.cwd(), "public", "data", "countries.json");
            const citiesPath = path.join(process.cwd(), "public", "data", "cities.json");

            const [countriesRaw, citiesRaw] = await Promise.all([
                readFile(countriesPath, "utf8"),
                readFile(citiesPath, "utf8"),
            ]);

            const countries = JSON.parse(countriesRaw) as CountryGeoItem[];
            const cities = JSON.parse(citiesRaw) as CityGeoItem[];

            const countriesByCode = new Map<string, CountryGeoItem>();
            const countriesByName = new Map<string, CountryGeoItem>();
            const citiesByCode = new Map<string, CityGeoItem>();

            countries.forEach((country) => {
                if (country.code) {
                    countriesByCode.set(country.code.toUpperCase(), country);
                }

                [country.name, country.nameTr]
                    .filter((item): item is string => Boolean(item))
                    .forEach((item) => {
                        countriesByName.set(normalizeText(item), country);
                    });
            });

            cities.forEach((city) => {
                citiesByCode.set(normalizeText(`${city.country}-${city.name}`), city);
            });

            return {
                countriesByCode,
                countriesByName,
                cities,
                citiesByCode,
            };
        })();
    }

    return geoLookupsPromise;
}

export function buildPinSearchText(pin: Pin): string {
    return normalizeText(
        [pin.konum, pin.baslik, pin.ozet, pin.kaynak, ...(pin.etiketler || [])]
            .filter(Boolean)
            .join(" ")
    );
}

export function doesTextContainToken(text: string, token: string): boolean {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken) {
        return false;
    }

    return createTokenRegex(normalizedToken).test(text);
}

export function isWithinRadius(
    pinLat: number,
    pinLng: number,
    centerLat: number,
    centerLng: number,
    radius: number
): boolean {
    const latDiff = Math.abs(pinLat - centerLat);
    const lngDiff = Math.abs(pinLng - centerLng);
    return latDiff <= radius && lngDiff <= radius;
}

export function getCountryRadius(countryCode: string): number {
    const wideCountries = new Set(["US", "CA", "BR", "AU", "RU", "CN", "IN"]);
    return wideCountries.has(countryCode.toUpperCase()) ? 12 : 5;
}

export function matchesCountry(pin: Pin, countryCode: string, geoLookups: GeoLookups): boolean {
    const country = geoLookups.countriesByCode.get(countryCode.toUpperCase());
    if (!country) {
        return false;
    }

    const searchableText = buildPinSearchText(pin);
    const textMatched = [country.name, country.nameTr, country.code]
        .filter((item): item is string => Boolean(item))
        .some((item) => doesTextContainToken(searchableText, item));

    const geoMatched =
        typeof country.lat === "number" &&
        typeof country.lng === "number" &&
        isWithinRadius(
            pin.koordinat.lat,
            pin.koordinat.lng,
            country.lat,
            country.lng,
            getCountryRadius(countryCode)
        );

    return textMatched || geoMatched;
}

export function getMatchedCities(queryWords: string[], geoLookups: GeoLookups): CityGeoItem[] {
    return geoLookups.cities.filter((city) => {
        const normalizedCityName = normalizeText(city.name);
        return queryWords.some((word) => normalizedCityName.includes(normalizeText(word)));
    });
}

export function matchesCity(pin: Pin, city: CityGeoItem): boolean {
    const searchableText = buildPinSearchText(pin);
    const textMatched =
        doesTextContainToken(searchableText, city.name) &&
        doesTextContainToken(searchableText, city.country);

    const geoMatched =
        typeof city.lat === "number" &&
        typeof city.lng === "number" &&
        isWithinRadius(pin.koordinat.lat, pin.koordinat.lng, city.lat, city.lng, 1.2);

    return textMatched || geoMatched;
}
