'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DENVER_CENTER = [39.7392, -104.9903] as const;

const AIRPORTS = [
  { code: 'DEN', name: 'Denver International', lat: 39.8561, lng: -104.6737 },
  { code: 'APA', name: 'Centennial Airport', lat: 39.5701, lng: -104.8492 },
  { code: 'BJC', name: 'Rocky Mountain Metro', lat: 39.9088, lng: -105.1169 },
  { code: 'FTG', name: 'Front Range', lat: 39.7853, lng: -104.5436 },
];

const NO_FLY_ZONES = [
  { name: 'Downtown Denver', lat: 39.7392, lng: -104.9903, radius: 2000 },
  { name: 'DEN Airport', lat: 39.8561, lng: -104.6737, radius: 5000 },
  { name: 'Buckley SFB', lat: 39.7017, lng: -104.7517, radius: 4000 },
];

interface MapWrapperProps {
  tfrData: {
    tfrs: Array<{
      id: string;
      title: string;
      text: string;
    }>;
    activeInArea: boolean;
  } | null;
}

export default function MapWrapper({ tfrData }: MapWrapperProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-cyan-500/30" style={{ height: '350px' }}>
      <MapContainer
        center={DENVER_CENTER}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#0a0a0f' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {AIRPORTS.map(airport => (
          <CircleMarker
            key={airport.code}
            center={[airport.lat, airport.lng]}
            radius={8}
            color="#06b6d4"
            fillColor="#06b6d4"
            fillOpacity={0.5}
            weight={2}
          >
            <Popup>
              <strong>{airport.code}</strong><br />
              {airport.name}
            </Popup>
          </CircleMarker>
        ))}

        {NO_FLY_ZONES.map((zone, idx) => (
          <CircleMarker
            key={`nofly-${idx}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius / 500}
            color="#f59e0b"
            fillColor="#f59e0b"
            fillOpacity={0.2}
            weight={2}
            dashArray="5, 5"
          >
            <Popup>
              <strong>Restricted Area</strong><br />
              {zone.name}
            </Popup>
          </CircleMarker>
        ))}

        <CircleMarker
          center={DENVER_CENTER}
          radius={5}
          color="#34d399"
          fillColor="#34d399"
          fillOpacity={0.8}
          weight={2}
        />
      </MapContainer>
    </div>
  );
}
