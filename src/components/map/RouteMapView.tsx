'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JeepneyRoute, Location, PathSegment, ShortestPathResult } from '@/lib/types';
import { useEffect, useRef, useState, useMemo, Fragment } from 'react';

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

type AltRoute = ShortestPathResult & { isRecommended?: boolean };

interface RouteMapViewProps {
    nodes: Location[];
    routes?: JeepneyRoute[];
    path?: PathSegment[];
    alternatives?: AltRoute[];
    isRecommended?: boolean;
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

const ALT_COLORS = [
    '#f97316', // orange-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#eab308', // yellow-500
];

function PathDirectionArrows({ coords, color }: { coords: [number, number][], color: string }) {
    if (coords.length < 2) return null;

    // Determine how many arrows based on distance or point count
    // For now, let's put arrows at 1/4, 1/2, and 3/4 if the segment is long enough
    const step = Math.max(1, Math.floor(coords.length / 4));
    const indices = coords.length > 5
        ? [step, step * 2, step * 3]
        : [Math.floor(coords.length / 2)];

    return (
        <>
            {indices.map((idx, i) => {
                if (idx >= coords.length - 1) return null;
                const p1 = coords[idx];
                const p2 = coords[idx + 1];

                // Calculate angle: rotate(0) points East (Right). 
                // Leaflet coords are [lat, lng]. standard atan2 is (y, x) -> (lat, lng)
                const angle = -(Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI);

                const icon = L.divIcon({
                    html: `<div style="transform: rotate(${angle}deg); color: ${color}; font-size: 14px; text-shadow: 0 0 3px white, 0 0 1px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold;">➤</div>`,
                    className: 'bg-transparent border-0',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                return (
                    <Marker
                        key={`${idx}-${i}`}
                        position={p1}
                        icon={icon}
                        interactive={false}
                        zIndexOffset={500}
                    />
                );
            })}
        </>
    );
}

function MovingJeepneyMarker({ segments, speed = 100 }: { segments: { coords: [number, number][], color?: string, routeName?: string, isWalking?: boolean }[], speed?: number }) {
    const markerRef = useRef<L.Marker | null>(null);
    const map = useMap();
    const frameRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stateRef = useRef({ segIdx: 0, ptIdx: 0, progress: 0, lastTime: 0, isPaused: false });

    const [pausedPos, setPausedPos] = useState<[number, number] | null>(null);
    const [showTransferStop, setShowTransferStop] = useState(false);
    const [isWalkingSegment, setIsWalkingSegment] = useState(false);

    useEffect(() => {
        if (!segments || segments.length === 0 || !segments[0].coords || segments[0].coords.length < 2) {
            return;
        }

        // Initialize state
        stateRef.current = { segIdx: 0, ptIdx: 0, progress: 0, lastTime: performance.now(), isPaused: false };
        setPausedPos(null);
        setShowTransferStop(false);
        setIsWalkingSegment(segments[0].isWalking || segments[0].routeName === 'JUST WALK' || false);

        // Initial set position
        if (markerRef.current) {
            markerRef.current.setLatLng(segments[0].coords[0]);
        }

        const animate = (time: number) => {
            const state = stateRef.current;

            if (state.isPaused) {
                return;
            }

            const delta = Math.min(time - state.lastTime, 100);
            state.lastTime = time;

            if (state.segIdx >= segments.length) return;

            const currentSegment = segments[state.segIdx];

            if (state.ptIdx >= currentSegment.coords.length - 1) {
                if (state.segIdx >= segments.length - 1) {
                    return; // Reached final destination
                }

                // Pause for transfer
                state.isPaused = true;

                setPausedPos(currentSegment.coords[state.ptIdx]);
                setShowTransferStop(true);

                timeoutRef.current = setTimeout(() => {
                    setShowTransferStop(false);

                    const nextSeg = segments[state.segIdx + 1];
                    if (nextSeg && nextSeg.coords.length > 0) {
                        setPausedPos(nextSeg.coords[0]);
                        setIsWalkingSegment(nextSeg.isWalking || nextSeg.routeName === 'JUST WALK' || false);
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

            // Calculate distance in PIXELS so the visual speed is constant regardless of zoom level
            const zoom = map.getZoom();
            const p1Px = map.project(p1 as L.LatLngExpression, zoom);
            const p2Px = map.project(p2 as L.LatLngExpression, zoom);
            const distPx = p1Px.distanceTo(p2Px);

            if (distPx === 0) {
                state.ptIdx++;
                state.progress = 0;
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            // Speed: Jeepneys go at 'speed' (pixels per sec), walking goes at 40% of the speed
            const currentSpeed = currentSegment.isWalking || currentSegment.routeName === 'JUST WALK' ? speed * 0.4 : speed;
            const requiredTimeMs = (distPx / currentSpeed) * 1000;

            state.progress += delta / requiredTimeMs;

            const clampedProgress = Math.min(state.progress, 1);

            const newLat = Number(p1[0]) + (Number(p2[0]) - Number(p1[0])) * clampedProgress;
            const newLng = Number(p1[1]) + (Number(p2[1]) - Number(p1[1])) * clampedProgress;

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

    const createIcon = (isWalk: boolean) => L.divIcon({
        html: `<div style="font-size: 28px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transform: translate(-50%, -50%);">${isWalk ? '🚶' : '🚐'}</div>`,
        className: 'jeepney-anim-icon bg-transparent border-0',
        iconSize: [0, 0]
    });

    return (
        <Marker ref={markerRef} position={pausedPos || segments[0].coords[0]} icon={createIcon(isWalkingSegment)} zIndexOffset={1000}>
            {showTransferStop && (
                <Tooltip permanent direction="top" opacity={1} offset={[0, -20]} className="bg-transparent border-0 shadow-none p-0 m-0">
                    <div style={{ textAlign: 'center', background: 'white', padding: '6px 10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', border: '2px solid #fca5a5' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>STOP HERE</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                            {(segments[stateRef.current.segIdx + 1]?.routeName === 'JUST WALK' || segments[stateRef.current.segIdx + 1]?.isWalking)
                                ? 'Walk to Destination'
                                : 'Transfer to another jeepney'}
                        </div>
                    </div>
                </Tooltip>
            )}
        </Marker>
    );
}

export default function RouteMapView({ nodes, routes, path, alternatives = [], isRecommended = true, className }: RouteMapViewProps) {
    const [tileMode, setTileMode] = useState<TileMode>('standard');
    const [showAlternatives, setShowAlternatives] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    const recommendedStats = useMemo(() => {
        if (!path) return { distance: 0, fare: 0 };
        const distance = path.reduce((acc, seg) => acc + Number(seg.distance || 0), 0);
        const fare = path.reduce((acc, seg) => acc + Number(seg.regularFare || 0), 0);
        return { distance, fare };
    }, [path]);

    const segmentPolylines = useMemo(() => {
        const polylines: { coords: [number, number][]; color: string; routeName: string; isWalking?: boolean }[] = [];
        if (!path) return polylines;

        const routeColorMap: Record<string, string> = {};
        if (routes && routes.length > 0) {
            routes.forEach((r, i) => {
                routeColorMap[r.name] = r.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            });
        }

        path.forEach((segment, index) => {
            const anySegment = segment as any;

            // IF showAlternatives is ON: Use GREEN for the recommended path
            // IF showAlternatives is OFF: Use original line colors
            const color = showAlternatives
                ? '#16a34a'
                : (routeColorMap[segment.routeName] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]);

            // Check if pathCoordinates is the new Object format (contains ridingCoords/walkingCoords)
            if (anySegment.pathCoordinates && anySegment.pathCoordinates.ridingCoords) {
                if (anySegment.pathCoordinates.ridingCoords.length > 1) {
                    polylines.push({
                        coords: anySegment.pathCoordinates.ridingCoords,
                        color,
                        routeName: segment.routeName,
                        isWalking: false,
                    });
                }
                // Render walking path as dashed if it truly has walking
                const hasWalking = anySegment.pathCoordinates.walkingDist > 0;
                if (hasWalking && anySegment.pathCoordinates.walkingCoords?.length > 1) {
                    polylines.push({
                        coords: anySegment.pathCoordinates.walkingCoords,
                        color: '#94a3b8', // slate-400 for walking
                        routeName: 'Walk',
                        isWalking: true
                    });
                }
            } else if (anySegment.pathCoordinates && anySegment.pathCoordinates.length > 1) {
                // Legacy flat array format
                polylines.push({
                    coords: anySegment.pathCoordinates,
                    color,
                    routeName: segment.routeName,
                    isWalking: false,
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
                        isWalking: false,
                    });
                }
            }
        });
        return polylines;
    }, [path, nodes, routes, showAlternatives]);

    const alternativePolylines = useMemo(() => {
        if (!alternatives || !showAlternatives) return [];

        return alternatives.map((alt, altIdx) => {
            const altRoute = alt as AltRoute;
            const routeColor = altRoute.isRecommended ? '#16a34a' : ALT_COLORS[altIdx % ALT_COLORS.length];
            const lines: { coords: [number, number][]; color: string; routeName: string; altIdx: number; isWalking?: boolean }[] = [];

            alt.path.forEach((segment: PathSegment, index: number) => {
                const anySegment = segment as any;
                const pc = anySegment.pathCoordinates;

                if (pc && pc.ridingCoords) {
                    // Structured format: { ridingCoords, walkingCoords, ridingDist, walkingDist }
                    if (pc.ridingCoords.length > 1) {
                        lines.push({
                            coords: pc.ridingCoords,
                            color: routeColor,
                            routeName: segment.routeName,
                            altIdx,
                            isWalking: false
                        });
                    }
                    if (pc.walkingDist > 0 && pc.walkingCoords?.length > 1) {
                        lines.push({
                            coords: pc.walkingCoords,
                            color: '#94a3b8',
                            routeName: 'Walk',
                            altIdx,
                            isWalking: true
                        });
                    }
                } else if (Array.isArray(pc) && pc.length > 1) {
                    // Legacy flat array format
                    lines.push({
                        coords: pc,
                        color: routeColor,
                        routeName: segment.routeName,
                        altIdx,
                        isWalking: false
                    });
                } else {
                    // Fallback: straight line between nodes
                    const fromNode = nodes.find(n => n.name === segment.from || n.id === segment.from);
                    const toNode = nodes.find(n => n.name === segment.to || n.id === segment.to);
                    if (fromNode?.coordinates && toNode?.coordinates) {
                        lines.push({
                            coords: [
                                [fromNode.coordinates.latitude, fromNode.coordinates.longitude],
                                [toNode.coordinates.latitude, toNode.coordinates.longitude]
                            ],
                            color: routeColor,
                            routeName: segment.routeName,
                            altIdx,
                            isWalking: false
                        });
                    }
                }
            });
            return lines;
        }).flat();
    }, [alternatives, showAlternatives, nodes]);

    const center: [number, number] = [8.2415, 124.2435];

    return (
        <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-xl ${className || 'h-[400px] md:h-[600px]'}`}>
            {/* Control Bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-3 w-full px-4 max-w-md">
                <div className="flex rounded-lg overflow-hidden shadow-lg border border-slate-200 bg-white">
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

                {alternatives && alternatives.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-2 flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showAlternatives}
                                onChange={(e) => setShowAlternatives(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Show Alternative Paths</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Map legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-3 py-2.5 space-y-2 max-w-[240px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-1">Map Legend</p>

                {showAlternatives ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-2 rounded-full bg-[#16a34a] shadow-[0_0_5px_rgba(22,163,74,0.5)] flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-700 leading-tight">Recommended Route</span>
                                    <span className="text-[9px] text-green-700 font-medium">
                                        {recommendedStats.distance.toFixed(2)}km • ₱{recommendedStats.fare.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {(() => {
                                const uniqueLines = Array.from(new Set(path?.map(p => p.routeName))).filter(l => l !== 'JUST WALK');
                                return uniqueLines.length > 0 && (
                                    <p className="text-[8px] text-green-600 pl-6 leading-tight truncate">
                                        Ride: {uniqueLines.join(' ➜ ')}
                                    </p>
                                );
                            })()}
                            {/* Node chain for debugging */}
                            {path && path.length > 0 && (
                                <p className="text-[8px] text-slate-400 pl-6 leading-tight" title={[path[0].from, ...path.map(p => p.to)].join(' → ')}>
                                    🗺 {[path[0].from, ...path.map(p => p.to)].join(' → ')}
                                </p>
                            )}
                        </div>

                        {alternatives && alternatives.length > 0 && (
                            <div className="pt-2 mt-1 border-t border-slate-100 space-y-2">
                                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">Alternative Options</p>
                                {alternatives.map((alt, idx) => {
                                    const altRoute = alt as AltRoute;
                                    const color = altRoute.isRecommended ? '#16a34a' : ALT_COLORS[idx % ALT_COLORS.length];
                                    const uniqueLines = Array.from(new Set(alt.path.map((p: any) => p.routeName))).filter(l => l !== 'JUST WALK');
                                    const nodeChain = alt.path.length > 0
                                        ? [alt.path[0].from, ...alt.path.map((p: any) => p.to)]
                                        : [];
                                    return (
                                        <div key={idx} className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-4 h-1.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-700 leading-tight">Option {idx + 1}</span>
                                                    <span className="text-[8px] text-slate-500">
                                                        {Number(alt.totalDistance || 0).toFixed(2)}km • ₱{Number(alt.totalFare || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            {uniqueLines.length > 0 && (
                                                <p className="text-[8px] text-slate-400 pl-6 leading-tight truncate" title={uniqueLines.join(' ➜ ')}>
                                                    Ride: {uniqueLines.join(' ➜ ')}
                                                </p>
                                            )}
                                            {/* Node chain for debugging */}
                                            {nodeChain.length > 0 && (
                                                <p className="text-[8px] text-slate-400 pl-6 leading-tight" title={nodeChain.join(' → ')}>
                                                    🗺 {nodeChain.join(' → ')}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-1.5">
                        {/* Show actual line colors if alternatives are off */}
                        {(() => {
                            const uniqueRoutes = Array.from(new Set(path?.map(p => p.routeName)));
                            return uniqueRoutes.map(routeName => {
                                const route = routes?.find(r => r.name === routeName);
                                const color = route?.color || FALLBACK_COLORS[uniqueRoutes.indexOf(routeName) % FALLBACK_COLORS.length];
                                return (
                                    <div key={routeName} className="flex items-center gap-2">
                                        <span
                                            className="inline-block w-4 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-[11px] font-bold text-slate-700 truncate">{routeName}</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
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

                {/* Markers */}
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

                {/* Alternative Paths (Lighter/Transparent) */}
                {alternativePolylines.map((seg, i) => (
                    <Fragment key={`alt-group-${seg.routeName}-${seg.isWalking ? 'walk' : 'ride'}-${i}`}>
                        <Polyline
                            positions={seg.coords}
                            color={seg.color}
                            weight={5}
                            opacity={0.6}
                            dashArray="5, 8"
                            lineCap="round"
                        >
                            <Tooltip sticky>
                                <div className="text-[11px]">
                                     <span className="font-bold text-slate-700">Option {seg.altIdx + 1}</span>
                                     <div className="flex items-center gap-1.5 mt-0.5">
                                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                                         <span className="font-semibold">{seg.routeName}</span>
                                     </div>
                                 </div>
                             </Tooltip>
                         </Polyline>
                         <PathDirectionArrows coords={seg.coords} color={seg.color} />
                     </Fragment>
                 ))}
 
                 {/* Recommended Path (Shortest) */}
                 {segmentPolylines.map((seg, i) => (
                     <Fragment key={`rec-group-${seg.routeName}-${seg.isWalking ? 'walk' : 'ride'}-${i}`}>
                        {/* Glow/Outline for better contrast */}
                        <Polyline
                            positions={seg.coords}
                            color="white"
                            weight={11}
                            opacity={0.4}
                            lineCap="round"
                            dashArray=""
                        />
                        <Polyline
                            positions={seg.coords}
                            color={seg.color}
                            weight={7}
                            opacity={1}
                            lineCap="round"
                            dashArray={seg.isWalking ? "10, 10" : ""}
                        >
                            <Tooltip sticky>
                                <div className="text-[11px]">
                                    <span className="font-bold text-green-700">Recommended Route</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                                        <span className="font-semibold">{seg.routeName}</span>
                                    </div>
                                </div>
                            </Tooltip>
                        </Polyline>
                        <PathDirectionArrows coords={seg.coords} color={seg.color} />
                    </Fragment>
                ))}

                {/* Animated Jeepney */}
                {segmentPolylines.length > 0 && (
                    <MovingJeepneyMarker
                        segments={segmentPolylines}
                        speed={350}
                    />
                )}
            </MapContainer>
        </div>
    );
}
