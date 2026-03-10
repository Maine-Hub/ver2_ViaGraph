'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix Leaflet marker icons
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerMapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    selectedLat?: number;
    selectedLng?: number;
    className?: string;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to handle map resizing
function InvalidateSize() {
    const map = (window as any).L ? (window as any).L.map : null; // This is a hack, use better way
    // Actually react-leaflet way:
    const mapInstance = useMapEvents({}); // This hook gives access to map
    useEffect(() => {
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 200);
    }, [mapInstance]);
    return null;
}

export default function LocationPickerMap({ onLocationSelect, selectedLat, selectedLng, className }: LocationPickerMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return (
        <div className={`w-full bg-slate-100 animate-pulse flex flex-col items-center justify-center rounded-lg border border-slate-200 ${className || 'h-[500px]'}`}>
            <div className="text-slate-400 font-medium italic">Initializing Map...</div>
        </div>
    );

    const center: [number, number] = selectedLat && selectedLng ? [selectedLat, selectedLng] : [8.2415, 124.2435];

    return (
        <div className={`w-full rounded-lg overflow-hidden border border-slate-200 shadow-md ${className || 'h-[500px]'}`}>
            <MapContainer
                center={center}
                zoom={14}
                minZoom={2}
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={22}
                    maxNativeZoom={19}
                />

                <MapEvents onLocationSelect={onLocationSelect} />

                {selectedLat !== undefined && selectedLng !== undefined && (
                    <Marker position={[selectedLat, selectedLng]} icon={defaultIcon} />
                )}
            </MapContainer>
        </div>
    );
}
