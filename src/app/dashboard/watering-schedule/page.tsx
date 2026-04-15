'use client';

import { useState, useEffect } from 'react';

// Define the shape of your data
interface PlantData {
  _id: string;
  name: string;
  currentMoisture: number;
  idealMoisture: number; // e.g., 60 for 60%
  nextWateringDate: string;
}

export default function WateringSchedule() {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch plant data and sensor readings from your DB
  useEffect(() => {
    const fetchMoistureData = async () => {
      try {
        // You would create a GET route at /api/plants/user to fetch this
        const res = await fetch('/api/plants/user');
        const data = await res.json();
        setPlants(data.plants);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoistureData();
    // Optional: Poll every 30 seconds for live updates
    const interval = setInterval(fetchMoistureData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8">Loading schedule...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-800">Smart Watering Schedule</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {plants.map((plant) => {
          const needsWater = plant.currentMoisture < plant.idealMoisture - 15;

          return (
            <div key={plant._id} className="border rounded-xl p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">{plant.name}</h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Soil Moisture</span>
                  <span className="font-medium">{plant.currentMoisture}%</span>
                </div>
                {/* Visual Moisture Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${needsWater ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{ width: `${plant.currentMoisture}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold block text-gray-900">Action Required:</span>
                  {needsWater 
                    ? "Soil is dry! Water this plant today." 
                    : `Optimal moisture. Next scheduled watering: ${new Date(plant.nextWateringDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}