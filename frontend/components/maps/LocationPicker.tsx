'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface NominatimAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
  state?: string;
  country?: string;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, addressDetails?: NominatimAddress) => void;
  initialLocation?: { lat: number; lng: number };
}

const LocationMarker = ({
  position,
  setPosition,
  onLocationSelect,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  onLocationSelect: (lat: number, lng: number, addressDetails?: NominatimAddress) => void;
}) => {
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        onLocationSelect(lat, lng, data.address || {});
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        onLocationSelect(lat, lng);
      }
      
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const LocationPicker = ({ onLocationSelect, initialLocation }: LocationPickerProps) => {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [33.6844, 73.0479] // Default to Islamabad
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newPos: [number, number] = [parseFloat(first.lat), parseFloat(first.lon)];
        setPosition(newPos);
        onLocationSelect(newPos[0], newPos[1], first.address || {});
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a city or area..."
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-light outline-none focus:border-black transition-colors"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-xl bg-black px-4 py-2 text-xs font-light uppercase tracking-widest text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </form>

      <div className="relative h-[300px] w-full overflow-hidden rounded-[2rem] border border-zinc-100 shadow-inner">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={onLocationSelect}
          />
          <ChangeView center={position} />
        </MapContainer>
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-light uppercase tracking-widest text-black shadow-lg backdrop-blur-sm">
          Click map to drop pin
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
