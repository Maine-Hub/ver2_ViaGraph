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
import { Upload, PlusCircle, Trash2, Edit, Database, Loader2 } from 'lucide-react';
import { graph as localGraph } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Textarea } from '@/components/ui/textarea';
import { Map } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const RouteMap = dynamic(() => import('@/components/admin/RouteMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
import { calculateDistance } from '@/lib/utils';

const LocationPickerMap = dynamic(() => import('@/components/admin/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
import { seedGraphData } from '@/firebase/seed';
import { useFirestore } from '@/firebase/provider';
import { fetchGraphData } from '@/lib/db';
import { Graph } from '@/lib/types';

function DeleteButton({ type, id, db, onDeleted }: { type: 'location' | 'route' | 'jeepney-line', id: string, db: Firestore, onDeleted: () => void }) {
  const { toast } = useToast();
  const handleDelete = async () => {
    try {
      let collectionName = '';
      switch (type) {
        case 'location': collectionName = 'nodes'; break;
        case 'route': collectionName = 'edges'; break;
        case 'jeepney-line': collectionName = 'routes'; break;
      }
      await deleteDoc(doc(db, collectionName, id));
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

export default function AdminPage() {
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAppContext();
  const db = useFirestore();
  const router = useRouter();
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

  const loadData = async () => {
    setIsDataLoading(true);
    const data = await fetchGraphData(db);
    if (data.nodes.length > 0) {
      setGraph(data);
    }
    setIsDataLoading(false);
  };

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
    }
  }, [user, role, authLoading, router, toast, db]);

  if (authLoading || isDataLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading admin dashboard...</div>;
  }

  if (role !== 'admin') {
    return null;
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedGraphData(db);
      toast({ title: "Success", description: "System data seeded successfully!" });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to seed data." });
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
      await setDoc(doc(db, 'nodes', id), {
        id, name,
        coordinates: { latitude, longitude }
      });
      toast({ title: 'Success', description: 'Location added successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add location. Check your permissions.' });
    }
  };

  const handleAddRoute = async (formData: FormData) => {
    const source = formData.get('source') as string;
    const target = formData.get('target') as string;
    const distance = parseFloat(formData.get('distance') as string);
    const routeName = formData.get('routeName') as string;
    const stopAndTransfer = formData.get('stopAndTransfer') as string;
    const fareDetails = formData.get('fareDetails') as string;
    if (!source || !target || !routeName || isNaN(distance)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }
    try {
      const edgeId = `${source}_${target}_${routeName}`;
      await setDoc(doc(db, 'edges', edgeId), {
        source, target, distance, routeName,
        stopAndTransfer: stopAndTransfer || '',
        fareDetails: fareDetails || '',
      });
      toast({ title: 'Success', description: 'Route added successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add route.' });
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
      await setDoc(doc(db, 'routes', name), { name, description: description || '' });
      toast({ title: 'Success', description: 'Jeepney line added successfully.' });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add jeepney line.' });
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

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="jeepney-lines">Jeepney Lines</TabsTrigger>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Route</Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl">
                  <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Left Column: Map */}
                    <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
                      <RouteMap
                        nodes={graph.nodes}
                        edges={graph.edges}
                        selectedSource={selectedSource}
                        selectedTarget={selectedTarget}
                        className="h-full w-full border-none shadow-none rounded-none"
                        onNodeClick={handleNodeClick}
                        onPathDrawn={(coords) => setDrawnPath(coords)}
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
                                    // GeoJSON FeatureCollection — use first LineString found
                                    else if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
                                      const first = parsed.features.find((f: any) =>
                                        f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
                                      );
                                      if (first?.geometry?.type === 'LineString') {
                                        coords = first.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                      } else if (first?.geometry?.type === 'MultiLineString') {
                                        coords = first.geometry.coordinates.flat().map((c: number[]) => [c[1], c[0]] as [number, number]);
                                      }
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
                            <Label className="text-sm font-semibold text-slate-700">Fare Details</Label>
                            <Textarea name="fareDetails" placeholder="Enter fare breakdown (e.g. Student, Regular, etc.)" className="bg-white border-slate-200 min-h-[60px]" />
                          </div>
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
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {graph.edges.map((edge, i) => (
                    <TableRow key={i}>
                      <TableCell>{graph.nodes.find(n => n.id === edge.source)?.name}</TableCell>
                      <TableCell>{graph.nodes.find(n => n.id === edge.target)?.name}</TableCell>
                      <TableCell>{edge.distance} km</TableCell>
                      <TableCell>{edge.routeName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <DeleteButton type="route" id={`${edge.source}-${edge.target}-${i}`} db={db} onDeleted={loadData} />
                      </TableCell>
                    </TableRow>
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
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {graph.nodes.map(node => (
                    <TableRow key={node.id}>
                      <TableCell className="font-mono">{node.id}</TableCell>
                      <TableCell>{node.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <DeleteButton type="location" id={node.id} db={db} onDeleted={loadData} />
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
                    <TableHead>Line Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {graph.routes.map(route => (
                    <TableRow key={route.name}>
                      <TableCell className="font-bold">{route.name}</TableCell>
                      <TableCell>{route.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <DeleteButton type="jeepney-line" id={route.name} db={db} onDeleted={loadData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>LTFRB Data</CardTitle>
              <CardDescription>
                Upload LTFRB documents (PDF or Word) related to jeepney lines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full items-center space-x-2">
                <Input id="doc-upload" type="file" accept=".pdf,.doc,.docx" />
                <Button>
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}
