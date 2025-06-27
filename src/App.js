import React, { useState } from 'react';
import axios from 'axios';
import MapView from './components/MapView';

// 🔐 Your API keys
const OPENCAGE_KEY = '192b1bf50ba3410aa4085cbdaa9226ae';
const ORS_TOKEN = '5b3ce3597851110001cf6248c78750bc60c840c79abd72ec8f54b023';

// 💰 Cab pricing data
const fareData = [
  { service: 'Uber', baseFare: 50, perKm: 10, logo: '🚗' },
  { service: 'Ola', baseFare: 45, perKm: 11, logo: '🚕' },
  { service: 'Rapido', baseFare: 30, perKm: 13, logo: '🛵' }
];

function App() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [distance, setDistance] = useState(null);
  const [results, setResults] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [message, setMessage] = useState('');

  // 🌍 Convert address to coordinates
  const geocode = async (address) => {
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        address
      )}&key=${OPENCAGE_KEY}&limit=1`;

      const res = await axios.get(url);

      if (res.data.results.length === 0) return null;

      const { lat, lng } = res.data.results[0].geometry;
      return [lat, lng];
    } catch (err) {
      console.error('Geocode error:', err.message);
      return null;
    }
  };

  // 📍 Use browser location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_KEY}`
        );
        if (res.data.results.length > 0) {
          setPickup(res.data.results[0].formatted);
          setMessage('📍 Pickup set to your current location.');
        }
      } catch (err) {
        setMessage('Failed to fetch address from your location.');
      }
    });
  };

  // 🔢 Calculate route, distance, fares
  const calculateFare = async () => {
    setMessage('');
    if (!pickup || !drop) {
      setMessage('⚠️ Please enter both pickup and drop addresses.');
      return;
    }

    try {
      const pickupCoords = await geocode(pickup);
      const dropCoords = await geocode(drop);

      if (!pickupCoords) {
        setMessage('⚠️ Invalid pickup address. Try full address with city and pin.');
        return;
      }
      if (!dropCoords) {
        setMessage('⚠️ Invalid drop address. Try full address with city and pin.');
        return;
      }

      const routeRes = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [
            [pickupCoords[1], pickupCoords[0]],
            [dropCoords[1], dropCoords[0]]
          ]
        },
        {
          headers: {
            Authorization: ORS_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      const distanceMeters = routeRes.data.features[0].properties.summary.distance;
      const distanceKm = distanceMeters / 1000;
      setDistance(distanceKm.toFixed(2));

      const pathCoords = routeRes.data.features[0].geometry.coordinates.map(
        ([lon, lat]) => [lat, lon]
      );
      setRouteCoords(pathCoords);

      const fares = fareData.map(cab => ({
        ...cab,
        totalFare: cab.baseFare + cab.perKm * distanceKm
      }));

      setResults(fares);
    } catch (error) {
      console.error('Routing error:', error.response?.data || error.message);
      setMessage('❌ Something went wrong while fetching route or distance.');
    }
  };

  const cheapestFare =
    results.length > 0 ? Math.min(...results.map(r => r.totalFare)) : null;

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial',
      backgroundColor: '#fefefe',
      boxShadow: '0 0 15px rgba(0,0,0,0.1)',
      borderRadius: '10px'
    }}>
      <h1 style={{ textAlign: 'center' }}>🚖 Cab Fare Comparator</h1>

      <label>Pickup Address</label>
      <input
        type="text"
        placeholder="e.g. MG Road, Pune 411001"
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      <button onClick={handleUseMyLocation} style={{ marginBottom: '15px' }}>
        📍 Use My Location
      </button>

      <label>Drop Address</label>
      <input
        type="text"
        placeholder="e.g. BTM Layout, Bangalore 560076"
        value={drop}
        onChange={(e) => setDrop(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />

      <button
        onClick={calculateFare}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🔍 Compare Fare
      </button>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '5px',
          color: '#856404'
        }}>
          {message}
        </div>
      )}

      {distance && (
        <p style={{ marginTop: '15px', fontSize: '16px' }}>
          🧭 Distance: <strong>{distance} km</strong>
        </p>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Fare Results:</h3>
          {results.map((cab, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ccc',
                borderRadius: '5px',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: cab.totalFare === cheapestFare ? '#d4edda' : '#f8f9fa'
              }}
            >
              <strong>{cab.logo} {cab.service}</strong><br />
              Base Fare: ₹{cab.baseFare}<br />
              Per Km: ₹{cab.perKm}<br />
              <strong>Total Fare: ₹{cab.totalFare.toFixed(2)}</strong>
              {cab.totalFare === cheapestFare && (
                <span style={{ color: 'green', marginLeft: '10px' }}>
                  ✅ Cheapest
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <MapView routeCoords={routeCoords} />
    </div>
  );
}

export default App;
