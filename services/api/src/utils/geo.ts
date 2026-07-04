import { prisma } from "@safeher/db";

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findNearestStation(
  regionId: string | null | undefined,
  latitude?: number,
  longitude?: number,
) {
  const stations = await prisma.policeStation.findMany({
    where: regionId ? { regionId } : undefined,
  });

  if (stations.length === 0) return null;
  if (latitude == null || longitude == null) return stations[0];

  let nearest = stations[0];
  let minDist = Infinity;
  for (const s of stations) {
    if (s.latitude == null || s.longitude == null) continue;
    const d = haversineKm(latitude, longitude, s.latitude, s.longitude);
    if (d < minDist) {
      minDist = d;
      nearest = s;
    }
  }
  return nearest;
}

// Commit: Add geolocation parsing utilities - 2026-06-08T23:08:53

// Commit: Implement offline mode with local cache - 2026-06-09T16:46:17

// Commit: Add media sanitization on upload - 2026-06-20T22:30:53

// Commit: Configure pnpm workspace and dependencies - 2026-06-23T16:21:56

// Commit: Add API client wrapper with retry logic - 2026-07-04T11:52:11
