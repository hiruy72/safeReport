"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface Region {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
  policeStations: { id: string; name: string; address: string }[];
}

export default function AdminRegionsPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegion, setNewRegion] = useState("");
  const [newCity, setNewCity] = useState({ regionId: "", name: "" });
  const [newStation, setNewStation] = useState({
    regionId: "", name: "", address: "", phone: "",
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") { router.push("/login"); return; }
    load();
  }, [router]);

  async function load() {
    const res = await api<Region[]>("/api/admin/regions");
    if (res.data) setRegions(res.data);
  }

  async function addRegion(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/admin/regions", { method: "POST", body: JSON.stringify({ name: newRegion }) });
    setNewRegion("");
    load();
  }

  async function addCity(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/admin/cities", { method: "POST", body: JSON.stringify(newCity) });
    setNewCity({ regionId: "", name: "" });
    load();
  }

  async function addStation(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/admin/stations", { method: "POST", body: JSON.stringify(newStation) });
    setNewStation({ regionId: "", name: "", address: "", phone: "" });
    load();
  }

  return (
    <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }} backHref="/admin/dashboard">
      <Link href="/admin/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block">← Dashboard</Link>
      <h1 className="text-2xl font-bold mb-8">Regions & Stations</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <form onSubmit={addRegion} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm">Add Region</h2>
          <input value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="Region name" required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-[var(--primary)] text-white py-2 rounded-lg text-sm">Add</button>
        </form>

        <form onSubmit={addCity} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm">Add City</h2>
          <select value={newCity.regionId} onChange={(e) => setNewCity({ ...newCity, regionId: e.target.value })} required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
            <option value="">Select region</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input value={newCity.name} onChange={(e) => setNewCity({ ...newCity, name: e.target.value })} placeholder="City name" required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-[var(--primary)] text-white py-2 rounded-lg text-sm">Add</button>
        </form>

        <form onSubmit={addStation} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm">Add Police Station</h2>
          <select value={newStation.regionId} onChange={(e) => setNewStation({ ...newStation, regionId: e.target.value })} required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
            <option value="">Select region</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} placeholder="Station name" required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
          <input value={newStation.address} onChange={(e) => setNewStation({ ...newStation, address: e.target.value })} placeholder="Address" required
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-[var(--primary)] text-white py-2 rounded-lg text-sm">Add</button>
        </form>
      </div>

      <div className="space-y-4">
        {regions.map((r) => (
          <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold">{r.name}</h2>
            {r.cities.length > 0 && (
              <p className="text-sm text-[var(--muted)] mt-1">
                Cities: {r.cities.map((c) => c.name).join(", ")}
              </p>
            )}
            {r.policeStations.length > 0 && (
              <ul className="mt-3 space-y-1">
                {r.policeStations.map((s) => (
                  <li key={s.id} className="text-sm">{s.name} — {s.address}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
