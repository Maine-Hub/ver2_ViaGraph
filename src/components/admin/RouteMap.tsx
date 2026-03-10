'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, RouteSegment } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

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
}


export default function RouteMap({ nodes, edges, selectedSource, selectedTarget, className, onNodeClick, onPathDrawn, initialPath }: RouteMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const featureGroupRef = useRef<L.FeatureGroup>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return (
        <div className={`w-full bg-slate-100 animate-pulse flex flex-col items-center justify-center rounded-lg border border-slate-200 ${className || 'h-[500px]'}`}>
            <div className="text-slate-400 font-medium italic">Initializing Map...</div>
        </div>
    );

    // Iligan City (MSU-IIT Area) as default center
    const center: [number, number] = [8.2415, 124.2435];

    const sourceNode = nodes.find(n => n.id === selectedSource);
    const targetNode = nodes.find(n => n.id === selectedTarget);

    const flattenLatLngs = (latlngs: any): L.LatLng[] => {
        if (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
            return (latlngs as any).flat(Infinity);
        }
        return latlngs as L.LatLng[];
    };

    const handleCreated = (e: any) => {
        const layer = e.layer;
        if (layer instanceof L.Polyline) {
            const rawLatLngs = layer.getLatLngs();
            const latlngs = flattenLatLngs(rawLatLngs);
            const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);
            if (onPathDrawn) onPathDrawn(coords);
        }
    };

    const handleDeleted = () => {
        if (onPathDrawn) onPathDrawn([]);
    };

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

                {/* Draw Controls */}
                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={handleCreated}
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
                    {initialPath && initialPath.length > 0 && (
                        <Polyline positions={initialPath} color="#22d3ee" weight={5} />
                    )}
                </FeatureGroup>

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
