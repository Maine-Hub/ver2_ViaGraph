'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JeepneyRoute, Location, PathSegment } from '@/lib/types';
import { useEffect, useRef, useState, useMemo } from 'react';

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
    routes?: JeepneyRoute[];
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
    const safeMode = mode === "satellite" ? "satellite" : "standard";
    const tile = TILES[safeMode];

    return (
        <TileLayer
            key={safeMode}
            attribution={tile.attribution}
            url={tile.url}
            maxZoom={22}
            maxNativeZoom={19}
        />
    );
}

// Fallback palette when a route has no color defined
const FALLBACK_COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

function MovingJeepneyMarker({ segments, speed = 350 }: { segments: { coords: [number, number][], color?: string, routeName?: string }[], speed?: number }) {
    const markerRef = useRef<L.Marker | null>(null);
    const map = useMap();
    const frameRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stateRef = useRef({ segIdx: 0, ptIdx: 0, progress: 0, lastTime: 0, isPaused: false });

    const [pausedPos, setPausedPos] = useState<[number, number] | null>(null);
    const [showTransferStop, setShowTransferStop] = useState(false);

    useEffect(() => {
        console.log(
            "MovingJeepneyMarker received segments:",
            segments.map((s, i) => ({
                index: i,
                routeName: s.routeName,
                coordCount: s.coords?.length || 0,
            }))
        );

        if (!segments || segments.length === 0 || !segments[0].coords || segments[0].coords.length < 2) {
            return;
        }

        // Initialize state
        stateRef.current = { segIdx: 0, ptIdx: 0, progress: 0, lastTime: performance.now(), isPaused: false };
        setPausedPos(null);
        setShowTransferStop(false);
        
        // Initial set position
        if (markerRef.current) {
            console.log("MovingJeepneyMarker: Initialized at segment 0");
            markerRef.current.setLatLng(segments[0].coords[0]);
        }

        const animate = (time: number) => {
            const state = stateRef.current;
            
            if (state.isPaused) {
                // If paused, just wait
                return;
            }

            // clamp delta to avoid big jumps if tab was inactive
            const delta = Math.min(time - state.lastTime, 100);
            state.lastTime = time;

            if (state.segIdx >= segments.length) return;

            const currentSegment = segments[state.segIdx];

            if (state.ptIdx >= currentSegment.coords.length - 1) {
                if (state.segIdx >= segments.length - 1) {
                    return; // Reached final destination
                }

                console.log(`Reached transfer point at segment ${state.segIdx}.`);
                console.log("Showing STOP HERE");

                // Pause for transfer
                state.isPaused = true;
                
                // Update React state to show tooltip safely without teleporting
                setPausedPos(currentSegment.coords[state.ptIdx]);
                setShowTransferStop(true);

                // Stop requestAnimationFrame loop temporarily
                timeoutRef.current = setTimeout(() => {
                    console.log(`Continuing to segment ${state.segIdx + 1}`);
                    setShowTransferStop(false);
                    
                    const nextSeg = segments[state.segIdx + 1];
                    if (nextSeg && nextSeg.coords.length > 0) {
                        setPausedPos(nextSeg.coords[0]);
                        if (markerRef.current) {
                            markerRef.current.setLatLng(nextSeg.coords[0]);
                        }
                    }

                    state.isPaused = false;
                    state.segIdx++;
                    state.ptIdx = 0;
                    state.progress = 0;
                    state.lastTime = performance.now();

                    frameRef.current = requestAnimationFrame(animate);
                }, 3000);

                return;
            }

            const p1 = currentSegment.coords[state.ptIdx];
            const p2 = currentSegment.coords[state.ptIdx + 1];

            const dist = map.distance(p1, p2);
            
            if (dist === 0) {
                state.ptIdx++;
                state.progress = 0;
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            const requiredTimeMs = (dist / speed) * 1000;
            
            state.progress += delta / requiredTimeMs;
            
            // Clamp progress between 0 and 1
            const clampedProgress = Math.min(state.progress, 1);

            const newLat = p1[0] + (p2[0] - p1[0]) * clampedProgress;
            const newLng = p1[1] + (p2[1] - p1[1]) * clampedProgress;
            
            if (markerRef.current) {
                markerRef.current.setLatLng([newLat, newLng]);
            }

            if (state.progress >= 1) {
                state.ptIdx++;
                state.progress = 0;
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [segments, speed, map]);

    if (!segments || segments.length === 0 || !segments[0].coords) return null;

    const jeepneyIcon = L.divIcon({
        html: '<div style="font-size: 28px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transform: translate(-50%, -50%);">🚐</div>',
        className: 'jeepney-anim-icon bg-transparent border-0',
        iconSize: [0, 0]
    });

    return (
        <Marker ref={markerRef} position={pausedPos || segments[0].coords[0]} icon={jeepneyIcon} zIndexOffset={1000}>
            {showTransferStop && (
                <Tooltip permanent direction="top" opacity={1} offset={[0, -20]} className="bg-transparent border-0 shadow-none p-0 m-0">
                    <div style={{ textAlign: 'center', background: 'white', padding: '6px 10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', border: '2px solid #fca5a5' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>STOP HERE</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>Transfer to another jeepney</div>
                    </div>
                </Tooltip>
            )}
        </Marker>
    );
}

export default function RouteMapView({ nodes, routes, path, className }: RouteMapViewProps) {
    const [tileMode, setTileMode] = useState<TileMode>('standard');
    const mapRef = useRef<L.Map | null>(null);

    const segmentPolylines = useMemo(() => {
        const polylines: { coords: [number, number][]; color: string; routeName: string }[] = [];
        if (!path) return polylines;

        const routeColorMap: Record<string, string> = {};
        if (routes && routes.length > 0) {
            routes.forEach((r, i) => {
                routeColorMap[r.name] = r.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            });
        }

        path.forEach((segment, index) => {
            const anySegment = segment as any;
            const color = routeColorMap[segment.routeName]
                || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

            if (anySegment.pathCoordinates && anySegment.pathCoordinates.length > 1) {
                polylines.push({
                    coords: anySegment.pathCoordinates,
                    color,
                    routeName: segment.routeName,
                });
            } else {
                const fromNode = nodes.find(n => n.name === segment.from || n.id === segment.from);
                const toNode = nodes.find(n => n.name === segment.to || n.id === segment.to);
                if (fromNode?.coordinates && toNode?.coordinates) {
                    polylines.push({
                        coords: [
                            [fromNode.coordinates.latitude, fromNode.coordinates.longitude],
                            [toNode.coordinates.latitude, toNode.coordinates.longitude],
                        ],
                        color,
                        routeName: segment.routeName,
                    });
                }
            }
        });
        return polylines;
    }, [path, nodes, routes]);




    const center: [number, number] = [8.2415, 124.2435];

    // Unique lines actually used in this path (for the legend)
    const legendLines: { name: string; color: string }[] = [];
    const seen = new Set<string>();
    segmentPolylines.forEach(s => {
        if (!seen.has(s.routeName)) {
            seen.add(s.routeName);
            legendLines.push({ name: s.routeName, color: s.color });
        }
    });

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

            {/* Route legend */}
            {legendLines.length > 0 && (
                <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-3 py-2.5 space-y-1.5 max-w-[180px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Route Lines</p>
                    {legendLines.map(line => (
                        <div key={line.name} className="flex items-center gap-2">
                            <span
                                className="inline-block w-4 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: line.color }}
                            />
                            <span className="text-xs font-medium text-slate-700 truncate">{line.name}</span>
                        </div>
                    ))}
                </div>
            )}

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

                {/* Highlight Path — one polyline per segment with its line color */}
                {segmentPolylines.map((seg, i) => (
                    <Polyline
                        key={`${seg.routeName}-${i}`}
                        positions={seg.coords}
                        color={seg.color}
                        weight={6}
                        opacity={0.85}
                    />
                ))}

                {/* Animated Jeepney */}
                {(() => {
                    if (segmentPolylines.length > 0) {
                        console.log(
                            "segmentPolylines passed to jeepney:",
                            segmentPolylines.map((s, i) => ({
                                index: i,
                                routeName: s.routeName,
                                coordCount: s.coords.length,
                                first: s.coords[0],
                                last: s.coords[s.coords.length - 1],
                            }))
                        );
                        return (
                            <MovingJeepneyMarker 
                                segments={segmentPolylines} 
                                speed={350} 
                            />
                        );
                    }
                    return null;
                })()}
            </MapContainer>
        </div>
    );
}
