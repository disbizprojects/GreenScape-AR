"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

// Interface for the new Hardware Devices
interface DeviceData {
  _id: string;
  serialNumber: string;
  name: string;
  telemetry: {
    temperature: number;
    humidity: number;
    lightLevel: number;
    soilMoisture: number;
    lastUpdated: string;
  };
}

export default function DashboardPage() {
  // Analytics State
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  
  // Hardware State
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [claimError, setClaimError] = useState('');

  // Fetch both Analytics and Devices on load
  const fetchData = async () => {
    // 1. Fetch Analytics
    const resAnalytics = await fetch("/api/analytics");
    if (resAnalytics.ok) {
      setData(await resAnalytics.json());
    }
    
    // 2. Fetch Hardware Devices
    const resDevices = await fetch("/api/devices");
    if (resDevices.ok) {
      const devData = await resDevices.json();
      setDevices(devData.devices || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle claiming a new device
  const handleClaimDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber: newSerial, name: newDeviceName })
      });
      
      const textResponse = await res.text();
      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (parseError) {
        setClaimError(`Server Error (${res.status}): Endpoint is not responding correctly.`);
        return;
      }
      
      if (!res.ok) {
        setClaimError(result.error || 'Failed to claim device');
        return;
      }
      
      setShowAddDevice(false);
      setNewSerial('');
      setNewDeviceName('');
      fetchData(); // Refresh device list
    } catch (err) {
      setClaimError('Network error: Could not reach the server.');
    }
  };

  // Handle unclaiming/deleting a device
  const handleUnclaim = async (deviceId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to unclaim this device? It will be removed from your account.");
    if (!confirmDelete) return;

    await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
    fetchData(); // Refresh list after deleting
  };

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Loading…</main>
    );
  }

  const role = data.role as string;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      
      {/* --- GARDENING ANALYTICS --- */}
      <h1 className="text-2xl font-semibold text-emerald-950">Gardening analytics</h1>
      <p className="mt-1 text-sm text-zinc-600 mb-8">
        Impact estimates are illustrative — tune coefficients with your agronomy data.
      </p>

      {/* CUSTOMER ANALYTICS */}
      {role === "CUSTOMER" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Plants purchased</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.plantsPurchased ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Est. CO₂ offset (kg/yr)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.estimatedCo2KgPerYear ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Water estimate (L/yr)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.waterLitersEstimateYear ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active care plans</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.carePlans ?? 0)}
            </p>
          </div>
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-sm text-zinc-700">
            {String(data.survivalHint ?? "")}
          </div>
        </div>
      ) : null}

      {/* VENDOR ANALYTICS */}
      {role === "VENDOR" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Units sold (your plants)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.totalUnitsSold ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-emerald-950">Top listings</p>
            <ul className="mt-2 text-sm text-zinc-700">
              {(data.topPlants as { name: string; sold: number }[] | undefined)?.map((r) => (
                <li key={r.name} className="flex justify-between border-b border-emerald-50 py-1">
                  <span>{r.name}</span>
                  <span>{r.sold} sold</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* ADMIN ANALYTICS */}
      {role === "ADMIN" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Users</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.users ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active plants</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.activePlants ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Paid orders</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.paidOrders ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Revenue (recorded)</p>
            <p className="mt-1 text-3xl font-semibold">${String(data.revenue ?? 0)}</p>
          </div>
        </div>
      ) : null}

      {/* --- SMART HARDWARE DASHBOARD --- */}
      <div className="mt-16 pt-8 border-t border-emerald-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-emerald-950">My Smart Hardware</h2>
          <button 
            onClick={() => setShowAddDevice(!showAddDevice)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 text-sm font-medium shadow-sm transition-colors"
          >
            {showAddDevice ? 'Cancel' : '+ Add Hardware'}
          </button>
        </div>

        {/* Claim Device Form */}
        {showAddDevice && (
          <form onSubmit={handleClaimDevice} className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 mb-8 shadow-inner">
            <h3 className="font-semibold text-emerald-900 mb-4">Register New ESP32 Device</h3>
            {claimError && <div className="bg-red-100 text-red-700 p-2 text-sm rounded mb-4">{claimError}</div>}
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Hardware Serial Number</label>
                <input required type="text" value={newSerial} onChange={e => setNewSerial(e.target.value)} placeholder="e.g. GS-ESP-12345" className="w-full p-2 border rounded text-sm outline-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Location / Name</label>
                <input required type="text" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="e.g. Living Room Hub" className="w-full p-2 border rounded text-sm outline-emerald-500" />
              </div>
            </div>
            <button type="submit" className="bg-emerald-700 text-white px-6 py-2 rounded font-medium hover:bg-emerald-800 transition-colors">Claim Device</button>
          </form>
        )}

        {/* Device Grid */}
        {devices.length === 0 && !showAddDevice ? (
          <div className="text-center p-8 border-2 border-dashed border-emerald-200 rounded-xl text-zinc-500 bg-zinc-50">
            No hardware claimed yet. Connect an ESP32 to unlock live environmental data.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {devices.map(device => (
              <div key={device._id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-800">{device.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-1">SN: {device.serialNumber}</p>
                  </div>
                  <button 
                    onClick={() => handleUnclaim(device._id)}
                    className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 border border-red-100"
                    title="Unclaim / Release Device"
                  >
                    Unclaim
                  </button>
                </div>

                {/* Telemetry Data Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Temperature</p>
                    <p className="text-2xl font-semibold text-blue-900">{device.telemetry?.temperature || 0}°C</p>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Humidity</p>
                    <p className="text-2xl font-semibold text-emerald-900">{device.telemetry?.humidity || 0}%</p>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Light (Lux)</p>
                    <p className="text-2xl font-semibold text-amber-900">{device.telemetry?.lightLevel || 0}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Soil Moisture</p>
                    <p className="text-2xl font-semibold text-indigo-900">{device.telemetry?.soilMoisture || 0}%</p>
                  </div>
                </div>

                {/* Footer: Last Updated */}
                <div className="text-right text-xs text-zinc-400 italic">
                  {device.telemetry?.lastUpdated ? (
                    `Last synced: ${formatDistanceToNow(new Date(device.telemetry.lastUpdated), { addSuffix: true })}`
                  ) : (
                    'Waiting for sensor data...'
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- NAVIGATION LINKS --- */}
      <div className="mt-12 pt-6 border-t border-emerald-100 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/dashboard/watering-schedule" className="rounded-md bg-blue-100 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-200 flex items-center gap-2 shadow-sm">
           Smart Watering Schedule
        </Link>
        <Link href="/orders" className="text-emerald-700 hover:underline px-2">
          Orders
        </Link>
        <Link href="/profile" className="text-emerald-700 hover:underline px-2">
          Profile & addresses
        </Link>
        <Link href="/plants" className="text-emerald-700 hover:underline px-2">
          Browse plants
        </Link>
      </div>
    </main>
  );
}