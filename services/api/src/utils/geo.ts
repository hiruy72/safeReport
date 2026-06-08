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
