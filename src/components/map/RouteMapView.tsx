'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, PathSegment } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

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

const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface RouteMapViewProps {
    nodes: Location[];
    path?: PathSegment[];
    className?: string;
}

function InvalidateSize() {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
}

// Tile layer URLs
const TILES = {
    standard: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
} as const;

type TileMode = keyof typeof TILES;

function TileLayerSwitcher({ mode }: { mode: TileMode }) {
    const tile = TILES[mode];
    return <TileLayer key={mode} attribution={tile.attribution} url={tile.url} maxZoom={22} maxNativeZoom={19} />;
}

export default function RouteMapView({ nodes, path, className }: RouteMapViewProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [tileMode, setTileMode] = useState<TileMode>('standard');
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return (
        <div className={`w-full bg-slate-100 animate-pulse flex flex-col items-center justify-center rounded-lg border border-slate-200 ${className || 'h-[500px]'}`}>
            <div className="text-slate-400 font-medium italic">Initializing Map...</div>
        </div>
    );

    const center: [number, number] = [8.2415, 124.2435];

    // Build path polylines per segment using stored drawn coords or node fallback
    const segmentPolylines: { coords: [number, number][]; color: string }[] = [];
    const segmentColors = ['#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444'];

    if (path) {
        path.forEach((segment, index) => {
            const anySegment = segment as any;
            if (anySegment.pathCoordinates && anySegment.pathCoordinates.length > 1) {
                // Use the admin-drawn path coordinates
                segmentPolylines.push({
                    coords: anySegment.pathCoordinates,
                    color: segmentColors[index % segmentColors.length],
                });
            } else {
                // Fallback: straight line between nodes
                const fromNode = nodes.find(n => n.name === segment.from || n.id === segment.from);
                const toNode = nodes.find(n => n.name === segment.to || n.id === segment.to);
                if (fromNode?.coordinates && toNode?.coordinates) {
                    segmentPolylines.push({
                        coords: [
                            [fromNode.coordinates.latitude, fromNode.coordinates.longitude],
                            [toNode.coordinates.latitude, toNode.coordinates.longitude],
                        ],
                        color: segmentColors[index % segmentColors.length],
                    });
                }
            }
        });
    }

    // Flatten all segment coords to find start/end markers
    const allCoords = segmentPolylines.flatMap(s => s.coords);

    return (
        <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-xl ${className || 'h-[400px] md:h-[600px]'}`}>
            {/* Tile toggle button */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex rounded-lg overflow-hidden shadow-lg border border-slate-200">
                <button
                    onClick={() => setTileMode('standard')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all ${tileMode === 'standard'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    🗺️ Standard
                </button>
                <button
                    onClick={() => setTileMode('satellite')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all ${tileMode === 'satellite'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    🛰️ Satellite
                </button>
            </div>

            <MapContainer
                center={center}
                zoom={14}
                minZoom={2}
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                ref={mapRef}
            >
                <TileLayerSwitcher mode={tileMode} />
                <InvalidateSize />

                {/* Only visible location nodes that are part of the path */}
                {path && path.length > 0 && nodes.filter(node =>
                    path.some(segment =>
                        segment.from === node.name ||
                        segment.from === node.id ||
                        segment.to === node.name ||
                        segment.to === node.id
                    )
                ).map(node => (
                    node.coordinates && (
                        <Marker
                            key={node.id}
                            position={[node.coordinates.latitude, node.coordinates.longitude]}
                            icon={defaultIcon}
                            opacity={0.8}
                        >
                            <Popup>{node.name}</Popup>
                        </Marker>
                    )
                ))}

                {/* Highlight Path — one polyline per segment with its color */}
                {segmentPolylines.map((seg, i) => (
                    <Polyline
                        key={i}
                        positions={seg.coords}
                        color={seg.color}
                        weight={6}
                        opacity={0.85}
                    />
                ))}

            </MapContainer>
        </div>
    );
}
