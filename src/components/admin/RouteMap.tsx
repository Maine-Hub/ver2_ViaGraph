'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, RouteSegment } from '@/lib/types';
import { useEffect, useRef, useState, useCallback } from 'react';

// Component to handle map resizing when the dialog opens
function InvalidateSize() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);
    return null;
}

// Fix Leaflet marker icons by using remote URLs
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface RouteMapProps {
    nodes: Location[];
    edges: RouteSegment[];
    selectedSource?: string;
    selectedTarget?: string;
    className?: string;
    onNodeClick?: (nodeId: string) => void;
    onPathDrawn?: (coords: [number, number][]) => void;
    initialPath?: [number, number][];
    extraPaths?: { coords: [number, number][]; color: string; label: string }[];
}


// Helper component to auto-fit map bounds to nodes or initial path
function MapCentering({ initialPath, nodes }: { initialPath?: [number, number][]; nodes: Location[] }) {
    const map = useMap();
    const hasCenteredRef = useRef(false);

    useEffect(() => {
        if (hasCenteredRef.current) return;

        const boundsPoints: L.LatLngExpression[] = [];
        if (initialPath && initialPath.length > 0) {
            initialPath.forEach(pt => boundsPoints.push(pt));
            hasCenteredRef.current = true;
        } else if (nodes.length > 0) {
            nodes.forEach(n => {
                if (n.coordinates) {
                    boundsPoints.push([n.coordinates.latitude, n.coordinates.longitude]);
                }
            });
            if (nodes.length >= 2) {
                hasCenteredRef.current = true;
            }
        }

        if (boundsPoints.length > 0) {
            try {
                const bounds = L.latLngBounds(boundsPoints);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            } catch (err) {
                console.error('Error fitting bounds', err);
            }
        }
    }, [map, initialPath, nodes]);

    // Reset centering lock when nodes list changes (switched blocks)
    useEffect(() => {
        hasCenteredRef.current = false;
    }, [nodes]);

    return null;
}

const flattenLatLngs = (latlngs: any): L.LatLng[] => {
    if (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
        return (latlngs as any).flat(Infinity);
    }
    return latlngs as L.LatLng[];
};

// Helper component to listen to draw events and sync path coords to parent state
function EditEventListener({ onEdit }: { onEdit: () => void }) {
    const map = useMap();
    useEffect(() => {
        const handleEdit = () => {
            onEdit();
        };

        map.on('draw:editvertex', handleEdit);
        map.on('draw:edited', handleEdit);
        map.on('draw:deleted', handleEdit);

        return () => {
            map.off('draw:editvertex', handleEdit);
            map.off('draw:edited', handleEdit);
            map.off('draw:deleted', handleEdit);
        };
    }, [map, onEdit]);

    return null;
}

export default function RouteMap({ nodes, edges, selectedSource, selectedTarget, className, onNodeClick, onPathDrawn, initialPath, extraPaths }: RouteMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [featureGroup, setFeatureGroup] = useState<L.FeatureGroup | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync initialPath changes to raw Leaflet polyline
    useEffect(() => {
        if (!featureGroup) return;

        // Check if current layer is already in sync with incoming initialPath
        if (polylineRef.current) {
            const currentLatLngs = polylineRef.current.getLatLngs();
            const currentCoords = flattenLatLngs(currentLatLngs).map(ll => [ll.lat, ll.lng]);
            const isSame = initialPath && 
                           initialPath.length === currentCoords.length && 
                           initialPath.every((val, index) => val[0] === currentCoords[index][0] && val[1] === currentCoords[index][1]);
            
            if (isSame) {
                return; // Prevent resetting drag handles
            }
        }

        // Recreate the polyline layer
        if (polylineRef.current) {
            featureGroup.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }

        if (initialPath && initialPath.length > 0) {
            const polyline = L.polyline(initialPath, {
                color: '#22d3ee',
                weight: 5,
            });
            featureGroup.addLayer(polyline);
            polylineRef.current = polyline;
        }
    }, [initialPath, featureGroup]);

    const syncCoords = useCallback(() => {
        if (polylineRef.current) {
            const latlngs = flattenLatLngs(polylineRef.current.getLatLngs());
            const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);
            console.log('[RouteMap] syncCoords:', coords);
            if (onPathDrawn) onPathDrawn(coords);
        }
    }, [onPathDrawn]);

    const handleCreated = useCallback((e: any) => {
        const layer = e.layer;
        console.log('[RouteMap] handleCreated layer:', layer);
        if (layer && typeof layer.getLatLngs === 'function') {
            // Remove the drawn layer from the Leaflet feature group.
            // React will render the polyline dynamically via useEffect.
            if (featureGroup) {
                featureGroup.removeLayer(layer);
            }
            const rawLatLngs = layer.getLatLngs();
            const latlngs = flattenLatLngs(rawLatLngs);
            const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);
            console.log('[RouteMap] handleCreated path:', coords);
            if (onPathDrawn) onPathDrawn(coords);
        }
    }, [onPathDrawn]);

    const handleEdited = useCallback((e: any) => {
        const layers = e.layers;
        console.log('[RouteMap] handleEdited layers:', layers);
        layers.eachLayer((layer: any) => {
            console.log('[RouteMap] handleEdited checking layer:', layer);
            if (layer && typeof layer.getLatLngs === 'function') {
                const rawLatLngs = layer.getLatLngs();
                const latlngs = flattenLatLngs(rawLatLngs);
                const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);
                console.log('[RouteMap] handleEdited path:', coords);
                if (onPathDrawn) onPathDrawn(coords);
            }
        });
    }, [onPathDrawn]);

    const handleDeleted = useCallback(() => {
        console.log('[RouteMap] handleDeleted');
        if (onPathDrawn) onPathDrawn([]);
    }, [onPathDrawn]);

    if (!isMounted) return (
        <div className={`w-full bg-slate-100 animate-pulse flex flex-col items-center justify-center rounded-lg border border-slate-200 ${className || 'h-[500px]'}`}>
            <div className="text-slate-400 font-medium italic">Initializing Map...</div>
        </div>
    );

    // Iligan City (MSU-IIT Area) as default center
    const center: [number, number] = [8.2415, 124.2435];

    const sourceNode = nodes.find(n => n.id === selectedSource);
    const targetNode = nodes.find(n => n.id === selectedTarget);

    return (
        <div className={`w-full rounded-lg overflow-hidden border border-slate-200 shadow-md ${className || 'h-[500px]'}`}>
            <MapContainer
                center={center}
                zoom={14}
                minZoom={2}
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={22}
                    maxNativeZoom={19}
                />

                <InvalidateSize />
                <MapCentering initialPath={initialPath} nodes={nodes} />
                <EditEventListener onEdit={syncCoords} />

                {/* Draw Controls */}
                <FeatureGroup ref={setFeatureGroup}>
                    <EditControl
                        position="topright"
                        onCreated={handleCreated}
                        onEdited={handleEdited}
                        onDeleted={handleDeleted}
                        draw={{
                            polyline: {
                                shapeOptions: {
                                    color: '#22d3ee',
                                    weight: 5,
                                },
                                metric: true,
                            },
                            polygon: false,
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: false,
                        }}
                        edit={{}}
                    />
                </FeatureGroup>

                {/* Extra paths for transfer legs */}
                {extraPaths && extraPaths.map((ep, i) =>
                    ep.coords.length > 1 && (
                        <Polyline
                            key={`extra-${i}`}
                            positions={ep.coords}
                            color={ep.color}
                            weight={5}
                            opacity={0.85}
                            dashArray="8 4"
                        />
                    )
                )}

                {nodes.map(node => (
                    node.coordinates && (
                        <Marker
                            key={node.id}
                            position={[node.coordinates.latitude, node.coordinates.longitude]}
                            icon={node.id === selectedSource ? redIcon : (node.id === selectedTarget ? greenIcon : defaultIcon)}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e as any);
                                    if (onNodeClick) onNodeClick(node.id);
                                }
                            }}
                        >
                            <Popup>
                                <div className="p-1">
                                    <div className="font-bold text-cyan-700">{node.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-1">ID: {node.id}</div>
                                    <div className="text-[10px] text-slate-400 mt-2 italic">Click to select as Source/Target</div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                {edges.map((edge, idx) => {
                    const s = nodes.find(n => n.id === edge.source);
                    const t = nodes.find(n => n.id === edge.target);
                    if (s?.coordinates && t?.coordinates) {
                        const isHighlighted = (edge.source === selectedSource && edge.target === selectedTarget) ||
                            (edge.source === selectedTarget && edge.target === selectedSource);
                        return (
                            <Polyline
                                key={idx}
                                positions={[
                                    [s.coordinates.latitude, s.coordinates.longitude],
                                    [t.coordinates.latitude, t.coordinates.longitude]
                                ]}
                                color={isHighlighted ? "#4be0fa" : "#05a7cf"}
                                weight={isHighlighted ? 5 : 3}
                                opacity={isHighlighted ? 0.9 : 0.4}
                            />
                        );
                    }
                    return null;
                })}

            </MapContainer>
        </div>
    );
}
