'use client';

import { useState, useEffect } from 'react';

// Added sensorDeviceId so TypeScript knows it might exist
interface PlantData {
  _id: string;
  name: string;
  currentMoisture: number;
  idealMoisture: number;
  nextWateringDate: string;
  isManual: boolean;
  waterAmount: string;
  frequencyDays: number;
  sensorDeviceId?: string;
}

export default function WateringSchedule() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('250ml');
  const [newFreq, setNewFreq] = useState(7);

  const fetchPlants = async () => {
    try {
      const res = await fetch('/api/plants/user');
      const rawText = await res.text();
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = JSON.parse(rawText);
      setPlants(data.plants || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  // Handle adding a new manual plant
  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/plants/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, waterAmount: newAmount, frequencyDays: newFreq }),
    });
    setShowForm(false);
    setNewName('');
    fetchPlants(); // Refresh the list
  };

  // Handle marking a manual plant as watered
  const handleMarkWatered = async (plantId: string, frequencyDays: number) => {
    await fetch('/api/plants/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantId, frequencyDays }),
    });
    fetchPlants(); // Refresh the list to get the new countdown
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-900">Smart Watering Schedule</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 font-semibold shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Add Custom Plant'}
        </button>
      </div>

      {/* NEW PLANT FORM */}
      {showForm && (
        <form onSubmit={handleAddPlant} className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-emerald-900">Add Custom Plant</h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Plant Name</label>
              <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g., Office Fern" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Water Amount</label>
              <input required type="text" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g., 500ml or 1 Cup" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Water Every (Days)</label>
              <input required type="number" min="1" value={newFreq} onChange={e => setNewFreq(Number(e.target.value))} className="w-full p-2 border rounded-md" />
            </div>
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 font-medium">Save Plant</button>
        </form>
      )}

      {/* PLANT GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => {

          //  THE BULLETPROOF FIX: If there is no sensorDeviceId, it is a custom manual plant!
          const isManualPlant = !plant.sensorDeviceId;

          // Time logic for Manual Plants
          const now = new Date();
          const nextWatering = new Date(plant.nextWateringDate || Date.now());
          const timeDiff = nextWatering.getTime() - now.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
          const isOverdue = daysRemaining <= 0;

          // Sensor logic for ESP32 Plants
          const needsWaterSensor = plant.currentMoisture < (plant.idealMoisture || 60) - 15;

          return (
            <div key={plant._id} className={`border rounded-xl p-5 shadow-sm bg-white ${isManualPlant && isOverdue ? 'border-red-300 ring-2 ring-red-100' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-800">{plant.name}</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border">
                  {isManualPlant ? 'Manual Timer' : 'ESP32 Sensor'}
                </span>
              </div>

              {/* ESP32 SENSOR VIEW (Only shows if a hardware device ID exists) */}
              {!isManualPlant && (
                <div className="mb-4 mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Soil Moisture</span>
                    <span className="font-medium">{plant.currentMoisture}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 inset-inner">
                    <div className={`h-2.5 rounded-full ${needsWaterSensor ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${plant.currentMoisture}%` }}></div>
                  </div>
                  <p className={`text-sm mt-3 font-medium ${needsWaterSensor ? 'text-red-600' : 'text-emerald-600'}`}>
                    {needsWaterSensor ? " Soil is dry! Needs water." : "✓ Moisture is optimal."}
                  </p>
                </div>
              )}

              {/* MANUAL TIMER VIEW (Shows the countdown and the water button) */}
              {isManualPlant && (
                <div className="mb-4 mt-4">
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Amount: <strong className="text-gray-900">{plant.waterAmount || 'As needed'}</strong></span>
                    <span>Every: <strong className="text-gray-900">{plant.frequencyDays || 7} days</strong></span>
                  </div>

                  <div className={`mt-3 p-3 rounded-lg flex items-center justify-between ${isOverdue ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                    <div>
                      <span className="block text-xs uppercase tracking-wide opacity-80 mb-1">Status</span>
                      <span className="font-bold text-lg">
                        {isOverdue ? 'Needs Water Now!' : `Water in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {/* The action button that resets the timer based on the frequency */}
                    <button
                      onClick={() => handleMarkWatered(plant._id, plant.frequencyDays || 7)}
                      className={`px-3 py-1.5 rounded text-sm font-semibold text-white shadow-sm transition-colors ${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                    >
                      Mark Watered
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}