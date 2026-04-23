// ---------------------------------------------------------------------------
// OpenStreetMap Nominatim-Geocoding.
// Freie Nutzung — max. 1 Request/Sekunde, User-Agent erforderlich.
// https://operations.osmfoundation.org/policies/nominatim/
// ---------------------------------------------------------------------------

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  plz?: string;
  ort?: string;
  bundesland?: string;
  typ: string;
}

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "de");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "de");

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: {
      postcode?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      suburb?: string;
      city_district?: string;
    };
  }>;

  return json.map((r) => ({
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    plz: r.address?.postcode,
    ort: r.address?.city ?? r.address?.town ?? r.address?.village,
    bundesland: r.address?.state,
    typ: r.type,
  }));
}
