'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, PlusCircle, Trash2, Edit, Database, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Bus, RefreshCw, AlertCircle, Map } from 'lucide-react';
import { calculateFare, type VehicleType } from '@/lib/fare';
import { graph as localGraph } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState, Fragment, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Textarea } from '@/components/ui/textarea';


const RouteMap = dynamic(() => import('@/components/admin/RouteMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
import { calculateDistance } from '@/lib/utils';

const LocationPickerMap = dynamic(() => import('@/components/admin/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
import { Graph } from '@/lib/types';


function DeleteButton({ type, id, onDeleted }: { type: 'location' | 'route' | 'jeepney-line', id: string, onDeleted: () => void }) {
  const { toast } = useToast();
  const handleDelete = async () => {
    try {
      let endpoint = '';
      switch (type) {
        case 'location': endpoint = `/api/mysql/nodes/${encodeURIComponent(id)}`; break;
        case 'route': endpoint = `/api/mysql/edges/${encodeURIComponent(id)}`; break;
        case 'jeepney-line': endpoint = `/api/mysql/routes/${encodeURIComponent(id)}`; break;
      }
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Deleted', description: `${type} removed successfully.` });
      onDeleted();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${type}.` });
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
      <span className="sr-only">Delete</span>
    </Button>
  );
}

function EditLocationButton({ node, onEdited }: { node: any; onEdited: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(node.name);
  const [lat, setLat] = useState(String(node.coordinates?.latitude ?? ''));
  const [lng, setLng] = useState(String(node.coordinates?.longitude ?? ''));

  const handleSave = async () => {
    try {
      const res = await fetch('/api/mysql/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: node.id, name, latitude: parseFloat(lat), longitude: parseFloat(lng) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Updated', description: 'Location updated.' });
      setOpen(false);
      onEdited();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setName(node.name); setLat(String(node.coordinates?.latitude ?? '')); setLng(String(node.coordinates?.longitude ?? '')); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Location</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1"><Label>ID (cannot change)</Label><Input value={node.id} disabled /></div>
          <div className="grid gap-1"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Latitude</Label><Input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Longitude</Label><Input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRouteButton({ edge, nodes, onEdited }: { edge: any; nodes: any[]; onEdited: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [distance, setDistance] = useState(String(edge.distance ?? ''));
  const [stop, setStop] = useState(edge.stopAndTransfer ?? '');
  const [note, setNote] = useState(edge.note ?? '');
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][]>(edge.pathCoordinates ?? []);
  const [vehicleType, setVehicleType] = useState(edge.vehicle_type || 'jeepney');

  const handleSave = async () => {
    try {
      const res = await fetch('/api/mysql/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: edge.source,
          target: edge.target,
          distance: parseFloat(distance),
          routeName: edge.routeName,
          vehicleType: vehicleType,
          stopAndTransfer: stop,
          note: note,
          pathCoordinates: pathCoordinates,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Updated', description: 'Route updated.' });
      setOpen(false);
      onEdited();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        setDistance(String(edge.distance ?? ''));
        setStop(edge.stopAndTransfer ?? '');
        setNote(edge.note ?? '');
        setPathCoordinates(edge.pathCoordinates ?? []);
        setVehicleType(edge.vehicle_type || 'jeepney');
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Left Column: Map */}
          <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
            <RouteMap
              nodes={nodes.filter(n => n.id === edge.source || n.id === edge.target)}
              edges={[]}
              className="h-full w-full border-none shadow-none rounded-none"
              onPathDrawn={setPathCoordinates}
              initialPath={pathCoordinates}
            />
          </div>

          {/* Right Column: Form */}
          <div className="w-full md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold text-slate-800">Edit Route</DialogTitle>
              <DialogDescription className="text-slate-500 mb-6">
                Redraw the path or update details for {edge.source} → {edge.target}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <Label className="text-sm font-semibold text-slate-700">Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jeepney">Jeepney</SelectItem>
                    <SelectItem value="minibus">Mini Bus</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-sm font-semibold text-slate-700">Distance (km)</Label>
                <Input type="number" step="0.01" className="bg-white border-slate-200" value={distance} onChange={e => setDistance(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label className="text-sm font-semibold text-slate-700">Stop & Transfer</Label>
                <Input className="bg-white border-slate-200" value={stop} onChange={e => setStop(e.target.value)} placeholder="e.g. Transfer at Terminal" />
              </div>
              <div className="grid gap-1">
                <Label className="text-sm font-semibold text-slate-700">Suggestion</Label>
                <Input className="bg-white border-slate-200" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Take this route for faster travel" />
              </div>

              {pathCoordinates.length > 0 && (
                <p className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                  ✓ {pathCoordinates.length} coordinate points recorded.
                </p>
              )}
            </div>

            <DialogFooter className="mt-8 pt-4 border-t border-slate-100">
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSave} className="bg-cyan-400 hover:bg-cyan-500 text-white font-bold px-6">
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTransferButton({ transfer, nodes, onEdited, initialLegIdx = 0 }: { transfer: any; nodes: any[]; onEdited: () => void, initialLegIdx?: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(transfer.name || '');
  const [from, setFrom] = useState(transfer.from_node_id);
  const [to, setTo] = useState(transfer.to_node_id);
  const [legs, setLegs] = useState<any[]>(transfer.legs || []);
  const [activeLegIdx, setActiveLegIdx] = useState(0);

  const handleSave = async () => {
    if (!from || !to || legs.some((l: any) => !l.route_name || !l.distance)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fill in all fields.' });
      return;
    }
    try {
      const res = await fetch('/api/mysql/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transfer.id,
          fromNodeId: from,
          toNodeId: to,
          name: name,
          legs: legs.map((l: any) => ({
            routeName: l.route_name,
            vehicleType: l.vehicle_type || 'jeepney',
            distance: parseFloat(l.distance),
            stopAndTransfer: l.stop_and_transfer,
            note: l.note,
            pathCoordinates: l.pathCoordinates,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Updated', description: 'Transfer route updated.' });
      setOpen(false);
      onEdited();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        setName(transfer.name || '');
        setFrom(transfer.from_node_id);
        setTo(transfer.to_node_id);
        setLegs(transfer.legs || []);
        setActiveLegIdx(initialLegIdx);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transfer Route</DialogTitle>
          <DialogDescription>Update the multi-leg route details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1">
            <Label>Route Name / Description</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tambo Terminal to Anahaw Amphitheater" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>From (Start Location)</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>To (End Location)</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Legs</Label>
              <Button size="sm" variant="outline" type="button" onClick={() => {
                setLegs(prev => [...prev, { route_name: '', vehicle_type: 'jeepney', distance: '', stop_and_transfer: '', pathCoordinates: [] }]);
                setActiveLegIdx(legs.length);
              }}>
                <PlusCircle className="mr-1 h-3 w-3" /> Add Leg
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {legs.map((_, i) => (
                <button key={i} type="button"
                  className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${activeLegIdx === i ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setActiveLegIdx(i)}>
                  Leg {i + 1}
                </button>
              ))}
            </div>
            {legs[activeLegIdx] && (
              <div className="border rounded-lg p-3 space-y-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Leg {activeLegIdx + 1}</span>
                  {legs.length > 1 && (
                    <Button size="sm" variant="ghost" type="button" className="text-destructive h-7" onClick={() => {
                      setLegs(prev => prev.filter((_, i) => i !== activeLegIdx));
                      setActiveLegIdx(Math.max(0, activeLegIdx - 1));
                    }}>Remove</Button>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Vehicle Type</Label>
                  <Select value={legs[activeLegIdx].vehicle_type || 'jeepney'}
                    onValueChange={val => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, vehicle_type: val } : l))}>
                    <SelectTrigger className="h-8 text-sm bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jeepney">Jeepney</SelectItem>
                      <SelectItem value="minibus">Mini Bus</SelectItem>
                      <SelectItem value="walking">Walking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Jeepney Line</Label>
                    <Input className="h-8 text-sm" value={legs[activeLegIdx].route_name}
                      onChange={e => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, route_name: e.target.value } : l))} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Distance (km)</Label>
                    <Input className="h-8 text-sm" type="number" step="0.01" value={legs[activeLegIdx].distance}
                      onChange={e => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, distance: e.target.value } : l))} />
                  </div>
                </div>
                {activeLegIdx < legs.length - 1 && (
                  <div className="grid gap-1">
                    <Label className="text-xs">Stop & Transfer Info</Label>
                    <Input className="h-8 text-sm" value={legs[activeLegIdx].stop_and_transfer}
                      placeholder="e.g. Stop at Crown Paper then transfer"
                      onChange={e => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, stop_and_transfer: e.target.value } : l))} />
                  </div>
                )}
                <div className="grid gap-1">
                  <Label className="text-xs">Suggestion</Label>
                  <Input className="h-8 text-sm" value={legs[activeLegIdx].note}
                    placeholder="e.g. Recommended route"
                    onChange={e => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, note: e.target.value } : l))} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Draw Path for this Leg</Label>
                  <div className="h-[250px]">
                    <RouteMap
                      nodes={nodes.filter(n => n.id === from || n.id === to)}
                      edges={[]}
                      className="h-[250px]"
                      onPathDrawn={(coords) => setLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, pathCoordinates: coords } : l))}
                      initialPath={legs[activeLegIdx].pathCoordinates}
                    />
                  </div>
                  {legs[activeLegIdx].pathCoordinates?.length > 1 && (
                    <p className="text-xs text-cyan-600">✓ {legs[activeLegIdx].pathCoordinates.length} coordinate points drawn.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditJeepneyLineButton({ route, onEdited }: { route: any; onEdited: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(route.name);
  const [description, setDescription] = useState(route.description ?? '');

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/mysql/routes/${encodeURIComponent(route.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: name, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Updated', description: 'Jeepney line updated.' });
      setOpen(false);
      onEdited();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setName(route.name); setDescription(route.description ?? ''); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Jeepney Line</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label>Line Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tibanga-Palao" />
          </div>
          <div className="grid gap-1">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Route from downtown to..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') ?? 'routes');
  const [graph, setGraph] = useState<Graph>(localGraph);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [pickedLat, setPickedLat] = useState<number | undefined>();
  const [pickedLng, setPickedLng] = useState<number | undefined>();
  const [drawnPath, setDrawnPath] = useState<[number, number][]>([]);
  const [routeInputMode, setRouteInputMode] = useState<'manual' | 'json'>('manual');
  const [jsonImportError, setJsonImportError] = useState<string>('');
  const [isMysqlSyncing, setIsMysqlSyncing] = useState(false);
  const [hasTransfer, setHasTransfer] = useState(false);
  const [transfer2RouteName, setTransfer2RouteName] = useState('');
  const [transfer2Distance, setTransfer2Distance] = useState('');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transferLegs, setTransferLegs] = useState<any[]>([
    { routeName: '', vehicleType: 'jeepney', distance: '', stopAndTransfer: '', note: '', pathCoordinates: [] as [number, number][] },
  ]);
  const [vehicleType, setVehicleType] = useState('jeepney');
  const [vehicleType2, setVehicleType2] = useState('jeepney');
  const [transfer2StopInfo, setTransfer2StopInfo] = useState('');
  const [transfer2Note, setTransfer2Note] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferName, setTransferName] = useState('');
  const [activeLegIdx, setActiveLegIdx] = useState(0);
  const [fareRules, setFareRules] = useState<any[]>([]);
  const [isUpdatingFares, setIsUpdatingFares] = useState(false);

  // Sorting State
  const [nodesSort, setNodesSort] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
  const [edgesSort, setEdgesSort] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'source', direction: 'asc' });
  const [routesSort, setRoutesSort] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
  const [transfersSort, setTransfersSort] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'from_node_id', direction: 'asc' });

  const toggleSort = (setter: any, current: any, key: string) => {
    if (current.key === key) {
      setter({ key, direction: current.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setter({ key, direction: 'asc' });
    }
  };

  const fetchFareRules = async () => {
    try {
      const res = await fetch('/api/mysql/fare-rules');
      const data = await res.json();
      if (data.success) setFareRules(data.data);
    } catch (err) {
      console.error('Failed to load fare rules:', err);
    }
  };

  const SortIcon = ({ sort, column }: { sort: any; column: string }) => {
    if (sort.key !== column) return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-400" />;
    return sort.direction === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3 text-cyan-600 font-bold" />
      : <ChevronDown className="ml-1 h-3 w-3 text-cyan-600 font-bold" />;
  };

  const sortedNodes = useMemo(() => {
    if (!nodesSort.direction) return graph.nodes;
    return [...graph.nodes].sort((a, b) => {
      const valA = String(a[nodesSort.key as keyof typeof a] || '').toLowerCase();
      const valB = String(b[nodesSort.key as keyof typeof b] || '').toLowerCase();
      return nodesSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [graph.nodes, nodesSort]);

  const sortedRoutes = useMemo(() => {
    if (!routesSort.direction) return graph.routes;
    return [...graph.routes].sort((a, b) => {
      const valA = String(a[routesSort.key as keyof typeof a] || '').toLowerCase();
      const valB = String(b[routesSort.key as keyof typeof b] || '').toLowerCase();
      return routesSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [graph.routes, routesSort]);

  const sortedEdges = useMemo(() => {
    if (!edgesSort.direction) return graph.edges;
    return [...graph.edges].sort((a, b) => {
      let valA: any, valB: any;
      if (edgesSort.key === 'source' || edgesSort.key === 'target') {
        valA = graph.nodes.find(n => n.id === a[edgesSort.key as keyof typeof a])?.name || '';
        valB = graph.nodes.find(n => n.id === b[edgesSort.key as keyof typeof b])?.name || '';
      } else {
        valA = a[edgesSort.key as keyof typeof a];
        valB = b[edgesSort.key as keyof typeof b];
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return edgesSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (valA < valB) return edgesSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return edgesSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [graph.edges, graph.nodes, edgesSort]);

  const sortedTransfers = useMemo(() => {
    if (!transfersSort.direction) return transfers;
    return [...transfers].sort((a, b) => {
      let valA = a[transfersSort.key] || '';
      let valB = b[transfersSort.key] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return transfersSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (valA < valB) return transfersSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return transfersSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transfers, transfersSort]);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
      const [graphRes, transferRes] = await Promise.all([
        fetch('/api/data/graph'),
        fetch('/api/mysql/transfers'),
      ]);
      const data = await graphRes.json();
      const tData = await transferRes.json();
      setGraph({
        nodes: data.nodes ?? [],
        routes: data.routes ?? [],
        edges: data.edges ?? [],
      });
      if (tData.success) setTransfers(tData.transfers ?? []);
      fetchFareRules(); // Call fetchFareRules here
    } catch (err) {
      console.error('Failed to load transfers:', err);
    }
    setIsDataLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
      return;
    }
    if (!authLoading && user && role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You must be an admin to view this page.',
      });
      router.replace('/find-route');
    }
    if (!authLoading && user && role === 'admin') {
      loadData();
      fetchFareRules(); // Also call fetchFareRules here
    }
  }, [user, role, authLoading, router, toast]);

  useEffect(() => {
    if (selectedSource && selectedTarget) {
      const s = graph.nodes.find(n => n.id === selectedSource);
      const t = graph.nodes.find(n => n.id === selectedTarget);
      if (s?.coordinates && t?.coordinates) {
        const dist = calculateDistance(
          s.coordinates.latitude,
          s.coordinates.longitude,
          t.coordinates.latitude,
          t.coordinates.longitude
        );
        setRouteDistance(dist.toString());
      }
    }
  }, [selectedSource, selectedTarget, graph.nodes]);

  const handleNodeClick = (nodeId: string) => {
    if (!selectedSource) {
      setSelectedSource(nodeId);
    } else if (selectedSource === nodeId) {
      setSelectedSource('');
      setSelectedTarget('');
      setRouteDistance('');
    } else {
      setSelectedTarget(nodeId);
    }
  };

  const handleFareUpdate = async (vehicleType: string, rules: any) => {
    setIsUpdatingFares(true);
    try {
      const res = await fetch('/api/mysql/fare-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleType, ...rules }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: `Fare rules for ${vehicleType} updated.` });
      fetchFareRules();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to update fare rules.' });
    } finally {
      setIsUpdatingFares(false);
    }
  };

  const handleUpdateAllFares = async () => {
    setIsUpdatingFares(true);
    try {
      // Re-run init to update all fares based on new rules
      const res = await fetch('/api/mysql/init', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: 'All route fares updated successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update all route fares.' });
    } finally {
      setIsUpdatingFares(false);
    }
  };

  if (authLoading || isDataLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading admin dashboard...</div>;
  }

  if (role !== 'admin') {
    return null;
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      // Re-initialize MySQL tables then notify user to manually add data
      await fetch('/api/mysql/init', { method: 'POST' });
      toast({ title: "MySQL Ready", description: "Tables initialized. Use the forms below to add data." });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to initialize MySQL tables." });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddLocation = async (formData: FormData) => {
    const id = (formData.get('id') as string)?.trim();
    const name = (formData.get('name') as string)?.trim();
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    if (!id || !name || isNaN(latitude) || isNaN(longitude)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }
    try {
      const res = await fetch('/api/mysql/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, latitude, longitude }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: 'Location added successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add location.' });
    }
  };

  const handleAddRoute = async (formData: FormData) => {
    const source = formData.get('source') as string;
    const target = formData.get('target') as string;
    const distance = parseFloat(formData.get('distance') as string);
    const routeName = formData.get('routeName') as string;
    const stopAndTransfer = formData.get('stopAndTransfer') as string;
    const note = formData.get('note') as string;
    if (!source || !target || !routeName || isNaN(distance)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }

    if (hasTransfer) {
      // Save as a transfer route with 2 legs
      if (!transfer2RouteName || !transfer2Distance) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill in the transfer leg jeepney line and distance.' });
        return;
      }
      try {
        const res = await fetch('/api/mysql/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromNodeId: source,
            toNodeId: target,
            name: `${graph.nodes.find(n => n.id === source)?.name ?? source} → ${graph.nodes.find(n => n.id === target)?.name ?? target}`,
            legs: [
              { routeName, vehicleType, distance, stopAndTransfer: stopAndTransfer || '', note: note || '', pathCoordinates: drawnPath },
              { routeName: transfer2RouteName, vehicleType: vehicleType2, distance: parseFloat(transfer2Distance), stopAndTransfer: transfer2StopInfo || '', note: transfer2Note || '', pathCoordinates: [] },
            ],
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: 'Success', description: 'Transfer route added with 2 legs.' });
        setDrawnPath([]); setHasTransfer(false);
        setTransfer2RouteName(''); setTransfer2Distance(''); setTransfer2StopInfo(''); setTransfer2Note('');
        setVehicleType('jeepney'); setVehicleType2('jeepney');
        setSelectedSource(''); setSelectedTarget(''); setRouteDistance('');
        loadData();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add transfer route.' });
      }
    } else {
      // Save as a direct edge
      try {
        const res = await fetch('/api/mysql/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source,
            target,
            distance,
            routeName,
            vehicleType,
            stopAndTransfer,
            note,
            pathCoordinates: drawnPath,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: 'Success', description: 'Route added successfully.' });
        setDrawnPath([]);
        setVehicleType('jeepney');
        setSelectedSource(''); setSelectedTarget(''); setRouteDistance('');
        loadData();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add route.' });
      }
    }
  };

  const handleAddJeepneyLine = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    if (!name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Line name is required.' });
      return;
    }
    try {
      const res = await fetch('/api/mysql/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: 'Jeepney line added successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add jeepney line.' });
    }
  };


  const handleInitMySQL = async () => {
    setIsMysqlSyncing(true);
    try {
      const res = await fetch('/api/mysql/init', { method: 'POST' });
      const data = await res.json();
      toast({ title: data.success ? 'MySQL Ready' : 'Error', description: data.message });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to MySQL. Make sure XAMPP is running.' });
    } finally {
      setIsMysqlSyncing(false);
    }
  };

  const handleSyncToMySQL = async () => {
    setIsMysqlSyncing(true);
    try {
      const res = await fetch('/api/mysql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      });
      const data = await res.json();
      toast({ title: data.success ? 'Synced!' : 'Error', description: data.message });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Sync failed. Make sure MySQL tables are initialized first.' });
    } finally {
      setIsMysqlSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={handleSeed}
          disabled={isSeeding}
          className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
        >
          {isSeeding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          Initialize System Data
        </Button>
      </div>


      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        router.replace(`/admin?tab=${tab}`, { scroll: false });
      }}>
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="jeepney-lines">Jeepney Lines</TabsTrigger>
          <TabsTrigger value="fare-rules">Fare Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Routes</CardTitle>
                <CardDescription>
                  Add, edit, or delete route segments.
                </CardDescription>
              </div>
              <Dialog onOpenChange={(o) => {
                if (o) {
                  setSelectedSource('');
                  setSelectedTarget('');
                  setRouteDistance('');
                  setDrawnPath([]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Route</Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl">
                  <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Left Column: Map */}
                    <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
                      <RouteMap
                        nodes={graph.nodes.filter(n => n.id === selectedSource || n.id === selectedTarget)}
                        edges={graph.edges}
                        selectedSource={selectedSource}
                        selectedTarget={selectedTarget}
                        className="h-full w-full border-none shadow-none rounded-none"
                        onNodeClick={handleNodeClick}
                        onPathDrawn={(coords) => setDrawnPath(coords)}
                        initialPath={drawnPath}
                      />
                    </div>

                    {/* Right Column: Form */}
                    <div className="w-full md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
                      <DialogHeader className="mb-2">
                        <DialogTitle className="text-2xl font-bold text-slate-800">Add New Route Segment</DialogTitle>
                      </DialogHeader>
                      <DialogDescription className="text-slate-500 mb-6">
                        Choose how you want to create the route and Fill in the details for the new route segment.
                      </DialogDescription>

                      <form action={handleAddRoute} className="space-y-6">
                        <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 rounded-lg transition-all ${routeInputMode === 'manual'
                              ? 'bg-cyan-400 text-white shadow-sm hover:bg-cyan-500'
                              : 'text-slate-500 hover:bg-slate-200'
                              }`}
                            onClick={() => { setRouteInputMode('manual'); setJsonImportError(''); }}
                          >
                            <Map className="mr-2 h-4 w-4" /> Manual
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 rounded-lg transition-all ${routeInputMode === 'json'
                              ? 'bg-cyan-400 text-white shadow-sm hover:bg-cyan-500'
                              : 'text-slate-500 hover:bg-slate-200'
                              }`}
                            onClick={() => { setRouteInputMode('json'); setJsonImportError(''); }}
                          >
                            <Database className="mr-2 h-4 w-4" /> Import JSON
                          </Button>
                        </div>

                        {/* Import Panel */}
                        {routeInputMode === 'json' && (
                          <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <p className="text-sm text-slate-600 font-medium">Supported formats:</p>
                            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                              <li><code>.geojson</code> — GeoJSON LineString or Feature</li>
                              <li><code>.topojson</code> — TopoJSON file</li>
                              <li><code>.json</code> — Array of <code>[lat, lng]</code> pairs</li>
                            </ul>
                            <input
                              type="file"
                              accept=".json,.geojson,.topojson"
                              className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  try {
                                    const parsed = JSON.parse(ev.target?.result as string);
                                    let coords: [number, number][] = [];

                                    // GeoJSON LineString geometry
                                    if (parsed?.type === 'LineString' && Array.isArray(parsed.coordinates)) {
                                      coords = parsed.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                    }
                                    // GeoJSON Feature with LineString
                                    else if (parsed?.type === 'Feature' && parsed.geometry?.type === 'LineString') {
                                      coords = parsed.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                    }
                                    // GeoJSON FeatureCollection — merge ALL LineStrings into one continuous path
                                    else if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
                                      parsed.features.forEach((f: any) => {
                                        if (f.geometry?.type === 'LineString') {
                                          const seg: [number, number][] = f.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                          coords.push(...seg);
                                        } else if (f.geometry?.type === 'MultiLineString') {
                                          f.geometry.coordinates.forEach((line: number[][]) => {
                                            const seg: [number, number][] = line.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                            coords.push(...seg);
                                          });
                                        }
                                      });
                                    }
                                    // TopoJSON — extract first arc
                                    else if (parsed?.type === 'Topology' && parsed.arcs) {
                                      const firstArc: number[][] = Object.values<any>(parsed.arcs)[0] ?? [];
                                      const scale = parsed.transform?.scale ?? [1, 1];
                                      const translate = parsed.transform?.translate ?? [0, 0];
                                      let x = 0, y = 0;
                                      coords = firstArc.map((delta: number[]) => {
                                        x += delta[0]; y += delta[1];
                                        const lng = x * scale[0] + translate[0];
                                        const lat = y * scale[1] + translate[1];
                                        return [lat, lng] as [number, number];
                                      });
                                    }
                                    // Fallback: plain [[lat, lng], ...] array
                                    else if (Array.isArray(parsed) && parsed.every(p => Array.isArray(p) && p.length === 2)) {
                                      coords = parsed as [number, number][];
                                    }

                                    if (coords.length > 0) {
                                      setDrawnPath(coords);
                                      setJsonImportError('');
                                    } else {
                                      setJsonImportError('Could not extract coordinates. Check that the file contains a LineString route.');
                                    }
                                  } catch {
                                    setJsonImportError('Failed to parse file. Make sure it is valid JSON.');
                                  }
                                };
                                reader.readAsText(file);
                              }}
                            />
                            {jsonImportError && (
                              <p className="text-xs text-red-500">{jsonImportError}</p>
                            )}
                            {drawnPath.length > 0 && !jsonImportError && (
                              <p className="text-xs text-cyan-600">
                                ✓ Loaded {drawnPath.length} coordinate points.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="grid gap-2" key={`source-select-${graph.nodes.length}`}>
                            <Label className="text-sm font-semibold text-slate-700">Source</Label>
                            <Select name="source" value={selectedSource} onValueChange={setSelectedSource}>
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                {graph.nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2" key={`target-select-${graph.nodes.length}`}>
                            <Label className="text-sm font-semibold text-slate-700">Target</Label>
                            <Select name="target" value={selectedTarget} onValueChange={setSelectedTarget}>
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select target" />
                              </SelectTrigger>
                              <SelectContent>
                                {graph.nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Distance (km)</Label>
                            <Input
                              id="distance"
                              name="distance"
                              type="number"
                              step="0.1"
                              placeholder="Enter distance"
                              className="bg-white border-slate-200"
                              value={routeDistance}
                              onChange={(e) => setRouteDistance(e.target.value)}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Vehicle Type</Label>
                            <Select value={vehicleType} onValueChange={setVehicleType}>
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="jeepney">Jeepney</SelectItem>
                                <SelectItem value="minibus">Mini Bus</SelectItem>
                                <SelectItem value="walking">Walking</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Jeepney Line</Label>
                            <Select name="routeName">
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select line" />
                              </SelectTrigger>
                              <SelectContent>
                                {graph.routes.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Stop & Transfer (if any)</Label>
                            <Textarea name="stopAndTransfer" placeholder="Enter stop details or transfer info" className="bg-white border-slate-200 min-h-[60px]" />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Suggestion</Label>
                            <Textarea name="note" placeholder="Enter additional suggestions or notes" className="bg-white border-slate-200 min-h-[60px]" />
                          </div>

                          {/* Transfer toggle */}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => setHasTransfer(h => !h)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasTransfer ? 'bg-cyan-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${hasTransfer ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <Label className="text-sm font-semibold text-slate-700 cursor-pointer" onClick={() => setHasTransfer(h => !h)}>
                              Has Transfer (add 2nd leg)
                            </Label>
                          </div>

                          {/* Second leg fields */}
                          {hasTransfer && (
                            <div className="border-l-4 border-cyan-400 pl-4 space-y-3 py-2 bg-cyan-50/50 rounded-r-xl">
                              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide">Transfer Leg 2</p>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Vehicle Type (Leg 2)</Label>
                                <Select value={vehicleType2} onValueChange={setVehicleType2}>
                                  <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="jeepney">Jeepney</SelectItem>
                                    <SelectItem value="minibus">Mini Bus</SelectItem>
                                    <SelectItem value="walking">Walking</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Jeepney Line (Leg 2)</Label>
                                <Select value={transfer2RouteName} onValueChange={setTransfer2RouteName}>
                                  <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Select line" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {graph.routes.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Distance (km) (Leg 2)</Label>
                                <Input type="number" step="0.1" placeholder="Enter distance" className="bg-white border-slate-200"
                                  value={transfer2Distance} onChange={e => setTransfer2Distance(e.target.value)} />
                              </div>

                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Note / Suggestion (Leg 2)</Label>
                                <Textarea placeholder="Enter suggestions for this leg" className="bg-white border-slate-200 min-h-[50px]"
                                  value={transfer2Note} onChange={e => setTransfer2Note(e.target.value)} />
                              </div>

                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Stop & Transfer (Leg 1 to Leg 2)</Label>
                                <Textarea placeholder="e.g. Stop at Crown Paper then transfer" className="bg-white border-slate-200 min-h-[50px]"
                                  value={transfer2StopInfo} onChange={e => setTransfer2StopInfo(e.target.value)} />
                              </div>
                            </div>
                          )}
                        </div>

                        {drawnPath.length > 0 && (
                          <div className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                            ✓ Path drawn: {drawnPath.length} points recorded
                          </div>
                        )}
                        <input type="hidden" name="drawnPath" value={JSON.stringify(drawnPath)} />
                        <div className="pt-4">
                          <Button type="submit" className="w-full bg-cyan-400 hover:bg-cyan-500 text-white h-12 text-lg font-bold rounded-xl shadow-lg shadow-cyan-50 transition-all active:scale-95">
                            Add Route
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'source')}>
                      <div className="flex items-center">Source <SortIcon sort={edgesSort} column="source" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'target')}>
                      <div className="flex items-center">Target <SortIcon sort={edgesSort} column="target" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'distance')}>
                      <div className="flex items-center">Distance <SortIcon sort={edgesSort} column="distance" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'routeName')}>
                      <div className="flex items-center">Line <SortIcon sort={edgesSort} column="routeName" /></div>
                    </TableHead>
                    <TableHead>Stop & Transfer</TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'regularFare')}>
                      <div className="flex items-center">Regular <SortIcon sort={edgesSort} column="regularFare" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'discountedFare')}>
                      <div className="flex items-center">Discounted <SortIcon sort={edgesSort} column="discountedFare" /></div>
                    </TableHead>
                    <TableHead>Suggestion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEdges.map((edge, i) => (
                    <TableRow key={i}>
                      <TableCell>{graph.nodes.find(n => n.id === edge.source)?.name}</TableCell>
                      <TableCell>{graph.nodes.find(n => n.id === edge.target)?.name}</TableCell>
                      <TableCell>{edge.distance} km</TableCell>
                      <TableCell>{edge.routeName}</TableCell>
                      <TableCell>{(edge as any).stopAndTransfer || '—'}</TableCell>
                      <TableCell className="font-mono text-green-700">₱{(edge as any).regularFare ? Number((edge as any).regularFare).toFixed(2) : '—'}</TableCell>
                      <TableCell className="font-mono text-blue-700">₱{(edge as any).discountedFare ? Number((edge as any).discountedFare).toFixed(2) : '—'}</TableCell>
                      <TableCell>{(edge as any).note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <EditRouteButton edge={edge} nodes={graph.nodes} onEdited={loadData} />
                        <DeleteButton type="route" id={edge.id ?? `${edge.source}_${edge.target}_${edge.routeName}`} onDeleted={loadData} />
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Transfer routes shown inline */}
                  {sortedTransfers.map((t: any) => (
                    <Fragment key={t.id}>
                      {/* Transfer header row */}
                      <TableRow key={`t-${t.id}`} className="bg-cyan-50/60">
                        <TableCell className="font-semibold text-cyan-800" colSpan={2}>
                          {t.from_name || t.from_node_id} → {t.to_name || t.to_node_id}
                        </TableCell>
                        <TableCell colSpan={6}>
                          <span className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                            TRANSFER · {t.legs?.length} legs
                          </span>
                          {t.name && <span className="ml-2 text-xs text-slate-500">{t.name}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <EditTransferButton transfer={t} nodes={graph.nodes} onEdited={loadData} />
                          <Button variant="ghost" size="icon" onClick={async () => {
                            if (!confirm('Are you sure you want to delete this entire transfer route?')) return;
                            try {
                              const res = await fetch(`/api/mysql/transfers/${encodeURIComponent(t.id)}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (!data.success) throw new Error(data.message);
                              toast({ title: 'Deleted', description: 'Transfer route removed.' });
                              loadData();
                            } catch (err: any) {
                              toast({ variant: 'destructive', title: 'Error', description: err.message });
                            }
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Leg rows */}
                      {(t.legs ?? []).map((leg: any, li: number) => (
                        <TableRow key={`t-${t.id}-leg-${li}`} className="bg-cyan-50/20 text-sm">
                          <TableCell className="text-muted-foreground pl-6" colSpan={2}>
                            Leg {li + 1}
                          </TableCell>
                          <TableCell>{leg.distance} km</TableCell>
                          <TableCell>{leg.route_name}</TableCell>
                          <TableCell>{leg.stop_and_transfer || '—'}</TableCell>
                          <TableCell className="font-mono text-green-700">₱{leg.regular_fare ? Number(leg.regular_fare).toFixed(2) : '—'}</TableCell>
                          <TableCell className="font-mono text-blue-700">₱{leg.discounted_fare ? Number(leg.discounted_fare).toFixed(2) : '—'}</TableCell>
                          <TableCell>{leg.note || '—'}</TableCell>
                          <TableCell />
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Locations</CardTitle>
                <CardDescription>Add, edit, or delete key locations.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Location</Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl">
                  <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Left Column: Map */}
                    <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
                      <LocationPickerMap
                        onLocationSelect={(lat, lng) => {
                          setPickedLat(lat);
                          setPickedLng(lng);
                        }}
                        selectedLat={pickedLat}
                        selectedLng={pickedLng}
                        className="h-full w-full border-none shadow-none rounded-none"
                      />
                    </div>

                    {/* Right Column: Form */}
                    <div className="w-full md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
                      <DialogHeader className="mb-2">
                        <DialogTitle className="text-2xl font-bold text-slate-800">Add New Location</DialogTitle>
                      </DialogHeader>
                      <DialogDescription className="text-slate-500 mb-6">
                        Provide a unique ID and name for the new location.
                      </DialogDescription>

                      <form action={handleAddLocation} className="space-y-6">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Location ID</Label>
                            <Input id="id" name="id" className="bg-white border-slate-200" placeholder="e.g. msu-iit" required />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Location Name</Label>
                            <Input id="name" name="name" className="bg-white border-slate-200" placeholder="Enter location name" required />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Latitude</Label>
                            <Input
                              id="latitude"
                              name="latitude"
                              type="number"
                              step="any"
                              className="bg-white border-slate-200"
                              value={pickedLat || ''}
                              onChange={(e) => setPickedLat(parseFloat(e.target.value))}
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-slate-700">Longitude</Label>
                            <Input
                              id="longitude"
                              name="longitude"
                              type="number"
                              step="any"
                              className="bg-white border-slate-200"
                              value={pickedLng || ''}
                              onChange={(e) => setPickedLng(parseFloat(e.target.value))}
                              required
                            />
                          </div>
                        </div>

                        <div className="pt-4">
                          <Button type="submit" className="w-full bg-cyan-400 hover:bg-cyan-500 text-white h-12 text-lg font-bold rounded-xl shadow-lg shadow-cyan-50 transition-all active:scale-95">
                            Add Location
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setNodesSort, nodesSort, 'id')}>
                      <div className="flex items-center">ID <SortIcon sort={nodesSort} column="id" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setNodesSort, nodesSort, 'name')}>
                      <div className="flex items-center">Name <SortIcon sort={nodesSort} column="name" /></div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNodes.map(node => (
                    <TableRow key={node.id}>
                      <TableCell className="font-mono">{node.id}</TableCell>
                      <TableCell>{node.name}</TableCell>
                      <TableCell className="text-right">
                        <EditLocationButton node={node} onEdited={loadData} />
                        <DeleteButton type="location" id={node.id} onDeleted={loadData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="jeepney-lines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Jeepney Lines</CardTitle>
                <CardDescription>View and manage jeepney line information.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Jeepney Line</Button>
                </DialogTrigger>
                <DialogContent>
                  <form action={handleAddJeepneyLine}>
                    <DialogHeader>
                      <DialogTitle>Add New Jeepney Line</DialogTitle>
                      <DialogDescription>Enter the name and description of the new jeepney line.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="line-name" className="text-right">Line Name</Label>
                        <Input id="line-name" name="name" className="col-span-3" placeholder="e.g., Tibanga-Palao" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="line-description" className="text-right">Description</Label>
                        <Input id="line-description" name="description" className="col-span-3" placeholder="e.g., Routes through Tibanga and Palao" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button type="submit">Add Line</Button></DialogClose>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setRoutesSort, routesSort, 'name')}>
                      <div className="flex items-center">Line Name <SortIcon sort={routesSort} column="name" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setRoutesSort, routesSort, 'description')}>
                      <div className="flex items-center">Description <SortIcon sort={routesSort} column="description" /></div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRoutes.map(route => (
                    <TableRow key={route.name}>
                      <TableCell className="font-bold">{route.name}</TableCell>
                      <TableCell>{route.description}</TableCell>
                      <TableCell className="text-right">
                        <EditJeepneyLineButton route={route} onEdited={loadData} />
                        <DeleteButton type="jeepney-line" id={route.name} onDeleted={loadData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer-routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Transfer Routes</CardTitle>
                <CardDescription>Multi-leg routes that require a jeepney transfer.</CardDescription>
              </div>
              <Dialog onOpenChange={(open) => {
                if (open) {
                  setTransferFrom(''); setTransferTo(''); setTransferName('');
                  setActiveLegIdx(0);
                  setTransferLegs([{ routeName: '', vehicleType: 'jeepney', distance: '', stopAndTransfer: '', note: '', pathCoordinates: [] as [number, number][] }]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Transfer Route</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Transfer Route</DialogTitle>
                    <DialogDescription>Define a multi-leg route that requires switching jeepneys.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    {/* Route name */}
                    <div className="grid gap-1">
                      <Label>Route Name / Description</Label>
                      <Input value={transferName} onChange={e => setTransferName(e.target.value)} placeholder="e.g. Tambo Terminal to Anahaw Amphitheater" />
                    </div>
                    {/* From / To */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label>From (Start Location)</Label>
                        <Select value={transferFrom} onValueChange={setTransferFrom}>
                          <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                          <SelectContent>{graph.nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>To (End Location)</Label>
                        <Select value={transferTo} onValueChange={setTransferTo}>
                          <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                          <SelectContent>{graph.nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Legs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Legs</Label>
                        <Button size="sm" variant="outline" type="button" onClick={() => {
                          setTransferLegs(prev => [...prev, { routeName: '', vehicleType: 'jeepney', distance: '', stopAndTransfer: '', note: '', pathCoordinates: [] }]);
                          setActiveLegIdx(transferLegs.length);
                        }}>
                          <PlusCircle className="mr-1 h-3 w-3" /> Add Leg
                        </Button>
                      </div>

                      {/* Leg tabs */}
                      <div className="flex gap-1 flex-wrap">
                        {transferLegs.map((_, i) => (
                          <button key={i} type="button"
                            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${activeLegIdx === i ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            onClick={() => setActiveLegIdx(i)}>
                            Leg {i + 1}
                          </button>
                        ))}
                      </div>

                      {/* Active leg fields */}
                      {transferLegs[activeLegIdx] && (
                        <div className="border rounded-lg p-3 space-y-3 bg-slate-50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">Leg {activeLegIdx + 1}</span>
                            {transferLegs.length > 1 && (
                              <Button size="sm" variant="ghost" type="button" className="text-destructive h-7" onClick={() => {
                                setTransferLegs(prev => prev.filter((_, i) => i !== activeLegIdx));
                                setActiveLegIdx(Math.max(0, activeLegIdx - 1));
                              }}>Remove</Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-1">
                              <Label className="text-xs">Jeepney Line</Label>
                              <Input className="h-8 text-sm" value={transferLegs[activeLegIdx].routeName}
                                onChange={e => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, routeName: e.target.value } : l))} />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">Distance (km)</Label>
                              <Input className="h-8 text-sm" type="number" step="0.01" value={transferLegs[activeLegIdx].distance}
                                onChange={e => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, distance: e.target.value } : l))} />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">Vehicle Type</Label>
                              <Select value={transferLegs[activeLegIdx].vehicleType}
                                onValueChange={val => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, vehicleType: val } : l))}>
                                <SelectTrigger className="h-8 text-sm bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="jeepney">Jeepney</SelectItem>
                                  <SelectItem value="minibus">Mini Bus</SelectItem>
                                  <SelectItem value="walking">Walking</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {activeLegIdx < transferLegs.length - 1 && (
                            <div className="grid gap-1">
                              <Label className="text-xs">Stop & Transfer Info</Label>
                              <Input className="h-8 text-sm" value={transferLegs[activeLegIdx].stopAndTransfer}
                                placeholder="e.g. Stop at Crown Paper then transfer"
                                onChange={e => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, stopAndTransfer: e.target.value } : l))} />
                            </div>
                          )}
                          <div className="grid gap-1">
                            <Label className="text-xs">Suggestion</Label>
                            <Input className="h-8 text-sm" value={transferLegs[activeLegIdx].note}
                              placeholder="e.g. Fast route"
                              onChange={e => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, note: e.target.value } : l))} />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Draw Path for this Leg</Label>
                            <RouteMap
                              nodes={graph.nodes}
                              edges={graph.edges}
                              className="h-[250px]"
                              onPathDrawn={(coords) => setTransferLegs(prev => prev.map((l, i) => i === activeLegIdx ? { ...l, pathCoordinates: coords } : l))}
                            />
                            {transferLegs[activeLegIdx].pathCoordinates?.length > 1 && (
                              <p className="text-xs text-cyan-600">✓ {transferLegs[activeLegIdx].pathCoordinates.length} coordinate points drawn.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={async () => {
                      if (!transferFrom || !transferTo || transferLegs.some(l => !l.routeName || !l.distance)) {
                        toast({ variant: 'destructive', title: 'Error', description: 'Fill in From, To, and all leg route names & distances.' });
                        return;
                      }
                      try {
                        const res = await fetch('/api/mysql/transfers', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fromNodeId: transferFrom,
                            toNodeId: transferTo,
                            name: transferName,
                            legs: transferLegs.map(l => ({
                              routeName: l.routeName,
                              vehicleType: l.vehicleType || 'jeepney',
                              distance: parseFloat(l.distance),
                              stopAndTransfer: l.stopAndTransfer,
                              note: l.note,
                              pathCoordinates: l.pathCoordinates,
                            })),
                          }),
                        });
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message);
                        toast({ title: 'Success', description: 'Transfer route added.' });
                        loadData();
                      } catch (err: any) {
                        toast({ variant: 'destructive', title: 'Error', description: err.message });
                      }
                    }}>Save Transfer Route</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Legs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name || '—'}</TableCell>
                      <TableCell>{t.from_name || t.from_node_id}</TableCell>
                      <TableCell>{t.to_name || t.to_node_id}</TableCell>
                      <TableCell>{t.legs?.length ?? 0} leg{t.legs?.length !== 1 ? 's' : ''}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={async () => {
                          try {
                            const res = await fetch(`/api/mysql/transfers/${encodeURIComponent(t.id)}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (!data.success) throw new Error(data.message);
                            toast({ title: 'Deleted', description: 'Transfer route removed.' });
                            loadData();
                          } catch (err: any) {
                            toast({ variant: 'destructive', title: 'Error', description: err.message });
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transfers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No transfer routes added yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fare-rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fare Rules Management</CardTitle>
                  <CardDescription>Manage base fares, distance thresholds, and kilometer addons for different vehicle types.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleUpdateAllFares}
                  disabled={isUpdatingFares}
                  className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
                >
                  {isUpdatingFares ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Recalculate & Sync All Fares
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {['jeepney', 'minibus'].map((type) => {
                  const rules = fareRules.find(r => r.vehicle_type === type);
                  if (!rules) return null;

                  return (
                    <Card key={type} className="border-slate-200 shadow-sm overflow-hidden">
                      <div className={`h-2 ${type === 'jeepney' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <CardHeader className="pb-3 text-slate-700 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bus className="h-5 w-5" />
                          <CardTitle className="text-lg capitalize">{type} Fare Matrix</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Base Fare (₱)</Label>
                            <Input
                              type="number"
                              step="0.10"
                              defaultValue={rules.base_fare}
                              onBlur={(e) => handleFareUpdate(type, { ...rules, baseFare: parseFloat(e.target.value) })}
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">First distance (km)</Label>
                            <Input
                              type="number"
                              step="1"
                              defaultValue={rules.first_km}
                              onBlur={(e) => handleFareUpdate(type, { ...rules, firstKm: parseFloat(e.target.value) })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Succeeding Km (₱)</Label>
                            <Input
                              type="number"
                              step="0.05"
                              defaultValue={rules.succeeding_km_fare}
                              onBlur={(e) => handleFareUpdate(type, { ...rules, succeedingKmFare: parseFloat(e.target.value) })}
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Discount (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={rules.discount_percentage * 100}
                              onBlur={(e) => handleFareUpdate(type, { ...rules, discountPercentage: parseFloat(e.target.value) / 100 })}
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <div className="pt-4 mt-2 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-400 mb-2">QUICK PREVIEW</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 5, 10].map(km => (
                              <div key={km} className="bg-slate-50 rounded p-2 text-center">
                                <p className="text-[10px] text-slate-500">{km}km</p>
                                <p className="font-bold text-slate-700">₱{
                                  Number(calculateFare(km, type as VehicleType, {
                                    vehicle_type: type,
                                    base_fare: rules.base_fare,
                                    first_km: rules.first_km,
                                    succeeding_km_fare: rules.succeeding_km_fare,
                                    discount_percentage: rules.discount_percentage
                                  })).toFixed(2)
                                }</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-amber-800">Important Note</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Changing fare rules will only affect <strong>newly created</strong> routes immediately.
                    To apply these changes to all existing routes in the system, click the <strong>"Recalculate & Sync All Fares"</strong> button at the top right.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}
