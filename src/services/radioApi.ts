import { COUNTRIES_DIRECTORY, CURATED_STATIONS } from '../data/curatedStations';
import { RadioStation } from '../types/radio';

const RADIO_BROWSER_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

const FALLBACK_AUDIO_STREAMS = [
  'https://ice1.somafm.com/groovesalad-128-mp3',
  'https://ice1.somafm.com/indiepop-128-mp3',
  'https://ice1.somafm.com/lush-128-mp3',
  'https://ice1.somafm.com/secretagent-128-mp3',
  'https://stream.radioparadise.com/mp3-192',
];

interface RawRadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  tags: string;
  bitrate: number;
  codec: string;
  votes: number;
  geo_lat: number | null;
  geo_long: number | null;
}

function formatTags(tagsRaw: string): string {
  if (!tagsRaw) return 'Live Broadcast · Musik & Informasi';
  const parts = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 22)
    .slice(0, 3)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  return parts.length > 0 ? parts.join(' · ') : 'Live Broadcast · Global';
}

export async function fetchStationsByCountry(countryCode: string): Promise<RadioStation[]> {
  const upperCode = countryCode.toUpperCase();
  const curatedForCountry = CURATED_STATIONS.filter(
    (s) => s.countrycode.toUpperCase() === upperCode
  );
  const countryMeta = COUNTRIES_DIRECTORY.find((c) => c.code === upperCode);

  for (const mirror of RADIO_BROWSER_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3800);

      const endpoint = `${mirror}/json/stations/bycountrycodeexact/${upperCode}?limit=28&order=votes&reverse=true&hidebroken=true`;
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const rawList = (await res.json()) as RawRadioBrowserStation[];

      const validRemote: RadioStation[] = rawList
        .filter(
          (item) =>
            item.url_resolved &&
            item.url_resolved.startsWith('https://') &&
            item.name &&
            item.name.trim().length > 1
        )
        .slice(0, 18)
        .map((item, idx) => ({
          stationuuid: item.stationuuid,
          name: item.name.trim().replace(/^[-_.\s]+/, ''),
          url: item.url,
          url_resolved: item.url_resolved,
          FallbackUrl: FALLBACK_AUDIO_STREAMS[idx % FALLBACK_AUDIO_STREAMS.length],
          favicon: item.favicon || '',
          country: countryMeta?.name || item.country || upperCode,
          countrycode: upperCode,
          state: item.state || countryMeta?.nativeName || '',
          language: item.language || '',
          tags: formatTags(item.tags),
          bitrate: item.bitrate && item.bitrate > 0 ? item.bitrate : 128,
          codec: item.codec || 'MP3',
          votes: item.votes || 100,
          lat: item.geo_lat || countryMeta?.lat || 0,
          lng: item.geo_long || countryMeta?.lng || 0,
          frequency: `${(88.1 + ((idx * 2.3) % 19.4)).toFixed(1)} FM`,
        }));

      // Deduplicate by name
      const seenNames = new Set(curatedForCountry.map((s) => s.name.toLowerCase()));
      const merged = [...curatedForCountry];
      for (const remote of validRemote) {
        const key = remote.name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          merged.push(remote);
        }
      }
      return merged;
    } catch {
      // Try next mirror
    }
  }

  return curatedForCountry.length > 0 ? curatedForCountry : CURATED_STATIONS;
}

export async function searchGlobalStations(query: string): Promise<RadioStation[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return CURATED_STATIONS;

  const localMatches = CURATED_STATIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(cleanQuery) ||
      s.country.toLowerCase().includes(cleanQuery) ||
      s.tags.toLowerCase().includes(cleanQuery) ||
      s.state.toLowerCase().includes(cleanQuery)
  );

  for (const mirror of RADIO_BROWSER_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const endpoint = `${mirror}/json/stations/search?name=${encodeURIComponent(
        query.trim()
      )}&limit=20&order=votes&reverse=true&hidebroken=true&is_https=true`;

      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const rawList = (await res.json()) as RawRadioBrowserStation[];
      const remoteMatches: RadioStation[] = rawList
        .filter((item) => item.url_resolved && item.url_resolved.startsWith('https://'))
        .slice(0, 15)
        .map((item, idx) => ({
          stationuuid: item.stationuuid,
          name: item.name.trim(),
          url: item.url,
          url_resolved: item.url_resolved,
          FallbackUrl: FALLBACK_AUDIO_STREAMS[idx % FALLBACK_AUDIO_STREAMS.length],
          favicon: item.favicon || '',
          country: item.country || item.countrycode || 'Global',
          countrycode: (item.countrycode || 'US').toUpperCase(),
          state: item.state || '',
          language: item.language || '',
          tags: formatTags(item.tags),
          bitrate: item.bitrate && item.bitrate > 0 ? item.bitrate : 128,
          codec: item.codec || 'MP3',
          votes: item.votes || 50,
          lat: item.geo_lat || 0,
          lng: item.geo_long || 0,
          frequency: `${(89.5 + ((idx * 1.9) % 18)).toFixed(1)} FM`,
        }));

      const seen = new Set(localMatches.map((s) => s.stationuuid));
      return [
        ...localMatches,
        ...remoteMatches.filter((r) => !seen.has(r.stationuuid)),
      ];
    } catch {
      // Try next mirror
    }
  }

  return localMatches;
}
