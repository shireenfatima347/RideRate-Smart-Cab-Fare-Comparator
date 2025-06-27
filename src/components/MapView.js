import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = ({ routeCoords }) => {
  if (!routeCoords.length) return null;

  const center = routeCoords[Math.floor(routeCoords.length / 2)];

  return (
    <MapContainer center={center} zoom={7} style={{ height: '400px', width: '100%', marginTop: '20px' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={routeCoords} color="blue" />
    </MapContainer>
  );
};

export default MapView;
