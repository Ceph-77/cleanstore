interface NominatimResult {
  lat: string;
  lon: string;
}

export async function geocodeAddress(address: string | null | undefined, city: string | null | undefined) {
  const query = [address, city, "Québec", "Canada"].filter(Boolean).join(", ");
  if (!address && !city) {
    return null;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KLEANSTOR-dev (contact: admin@cleanstore.local)" },
    });
    if (!res.ok) {
      return null;
    }
    const results = (await res.json()) as NominatimResult[];
    if (results.length === 0) {
      return null;
    }
    return { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
