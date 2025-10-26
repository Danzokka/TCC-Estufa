"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number) => void;
}

// Função para criar ícone personalizado baseado no tema
const createCustomPinIcon = (isDark: boolean) => {
  const pinColor = isDark ? "#8fc999" : "#FF1F13"; // Cor primária do tema dark ou vermelho para light
  
  return L.divIcon({
    html: `
      <svg width="26" height="32" viewBox="0 0 39 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M33.2887 33.2887L19.5 47.0771L5.71142 33.2887C-1.90381 25.6733 -1.90381 13.3266 5.71142 5.71142C13.3266 -1.90381 25.6733 -1.90381 33.2887 5.71142C40.9039 13.3266 40.9039 25.6733 33.2887 33.2887ZM19.5 23.8333C21.8933 23.8333 23.8333 21.8933 23.8333 19.5C23.8333 17.1068 21.8933 15.1667 19.5 15.1667C17.1067 15.1667 15.1667 17.1068 15.1667 19.5C15.1667 21.8933 17.1067 23.8333 19.5 23.8333Z" fill="${pinColor}"/>
      </svg>
    `,
    className: "custom-pin-icon",
    iconSize: [26, 32], // Reduzido de 39x48 para 26x32
    iconAnchor: [13, 32], // Ajustado proporcionalmente
    popupAnchor: [0, -32], // Ajustado proporcionalmente
  });
};

function DraggableMarker({ position, onDragEnd, isDark }: any) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return (
    <Marker
      position={markerPosition}
      draggable={true}
      icon={createCustomPinIcon(isDark)}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setMarkerPosition([pos.lat, pos.lng]);
          onDragEnd(pos.lat, pos.lng);
        },
      }}
    />
  );
}

export function LocationMap({ latitude, longitude, onLocationChange }: LocationMapProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const position: [number, number] = [latitude, longitude];

  // Evita hidratação incorreta
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determina se está no tema escuro
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // URL do MapTiler baseada no tema
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const tileUrl = isDark 
    ? `https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${mapTilerKey}`
    : `https://api.maptiler.com/maps/streets-v4-light/{z}/{x}/{y}.png?key=${mapTilerKey}`;

  // Fallback para tema light durante SSR
  if (!mounted) {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-border shadow-lg bg-muted animate-pulse" />
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-border shadow-lg">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
        key={`${isDark ? 'dark' : 'light'}`} // Força re-render ao mudar tema
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <DraggableMarker
          position={position}
          isDark={isDark}
          onDragEnd={(lat: number, lon: number) => {
            onLocationChange(lat, lon);
          }}
        />
      </MapContainer>
    </div>
  );
}
