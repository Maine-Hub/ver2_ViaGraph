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
import { PlusCircle, Trash2, Edit, Database, Map, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/components/admin/RouteMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
const LocationPickerMap = dynamic(() => import('@/components/admin/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 italic">Loading Map...</div>
});
import RouteMeasurer from '@/components/admin/RouteMeasurer';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAppContext();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('route-blocks');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Data States
  const [nodes, setNodes] = useState<any[]>([]);
  const [routeBlocks, setRouteBlocks] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [fareMatrix, setFareMatrix] = useState<any[]>([]);

  // Search States
  const [nodesSearch, setNodesSearch] = useState('');
  const [blocksSearch, setBlocksSearch] = useState('');
  const [routesSearch, setRoutesSearch] = useState('');

  // Add Route Block States
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [blockSource, setBlockSource] = useState('');
  const [blockTarget, setBlockTarget] = useState('');
  const [blockRouteName, setBlockRouteName] = useState('');
  const [blockVehicleType, setBlockVehicleType] = useState('jeepney');
  const [blockDistance, setBlockDistance] = useState('');
  const [blockPathCoords, setBlockPathCoords] = useState<[number, number][]>([]);
  const [routeInputMode, setRouteInputMode] = useState<'manual' | 'json'>('manual');
  const [jsonImportError, setJsonImportError] = useState('');

  // Add Node States
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [nodeLat, setNodeLat] = useState('');
  const [nodeLng, setNodeLng] = useState('');

  // Confirm Delete State
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; label: string } | null>(null);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
      const [graphRes, fareRes] = await Promise.all([
        fetch('/api/data/graph'),
        fetch('/api/mysql/fare-matrix'),
      ]);
      const graphData = await graphRes.json();
      const fareData = await fareRes.json();
      
      setNodes(graphData.nodes || []);
      setRouteBlocks(graphData.edges || []);
      setRoutes(graphData.routes || []);
      
      if (fareData.success) {
        setFareMatrix(fareData.data || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setIsDataLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
      return;
    }
    if (!authLoading && user && role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Admin access required.' });
      router.replace('/find-route');
    }
    if (!authLoading && user && role === 'admin') {
      loadData();
    }
  }, [user, role, authLoading, router, toast]);

  // Handle Deletions
  const requestDelete = (type: string, id: string, label: string) => {
    setConfirmDelete({ type, id, label });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setConfirmDelete(null);
    try {
      let endpoint = '';
      if (type === 'node') endpoint = `/api/mysql/nodes/${encodeURIComponent(id)}`;
      if (type === 'route-block') endpoint = `/api/mysql/route-blocks/${encodeURIComponent(id)}`;
      if (type === 'route') endpoint = `/api/mysql/routes/${encodeURIComponent(id)}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Deleted', description: `${type} removed successfully.` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Handle Saving Route Block
  const handleSaveBlock = async () => {
    if (!blockSource || !blockTarget || !blockRouteName || !blockDistance) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
      return;
    }
    try {
      const isEdit = !!editBlockId;
      const url = isEdit ? `/api/mysql/route-blocks/${editBlockId}` : '/api/mysql/route-blocks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: blockSource,
          targetId: blockTarget,
          routeName: blockRouteName,
          vehicleType: blockVehicleType,
          distance: parseFloat(blockDistance),
          pathCoordinates: blockPathCoords.length > 0 ? blockPathCoords.map(c => [c[1], c[0]]) : null
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: `Route Block ${isEdit ? 'updated' : 'added'} successfully.` });
      setIsAddingBlock(false);
      
      // Reset state
      setEditBlockId(null);
      setBlockSource('');
      setBlockTarget('');
      setBlockRouteName('');
      setBlockDistance('');
      setBlockPathCoords([]);
      
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // Handle Saving Node
  const handleSaveNode = async () => {
    if (!nodeId || !nodeName || !nodeLat || !nodeLng) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
      return;
    }
    try {
      const res = await fetch('/api/mysql/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nodeId,
          name: nodeName,
          latitude: parseFloat(nodeLat),
          longitude: parseFloat(nodeLng)
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: 'Node saved successfully.' });
      setIsAddingNode(false);
      setNodeId('');
      setNodeName('');
      setNodeLat('');
      setNodeLng('');
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (authLoading || isDataLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading viaGraph Admin...</div>;
  }
  if (role !== 'admin') return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between bg-slate-900 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">Manage locations, route blocks, and standard fare rules.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="text-slate-900 bg-white hover:bg-slate-100 font-semibold shadow-sm transition-all">
          <RefreshCcw className={`mr-2 h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
          {isDataLoading ? 'Initializing...' : 'Initialize System Data'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="route-blocks" className="rounded-lg data-[state=active]:bg-white">Route Blocks</TabsTrigger>
          <TabsTrigger value="locations" className="rounded-lg data-[state=active]:bg-white">Locations (Nodes)</TabsTrigger>
          <TabsTrigger value="routes" className="rounded-lg data-[state=active]:bg-white">Jeepney Lines (Colors)</TabsTrigger>
          <TabsTrigger value="fares" className="rounded-lg data-[state=active]:bg-white">Fare Matrix</TabsTrigger>
          <TabsTrigger value="measure" className="rounded-lg data-[state=active]:bg-white">Measure Route</TabsTrigger>
        </TabsList>

        {/* --- ROUTE BLOCKS TAB --- */}
        <TabsContent value="route-blocks">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Route Blocks</CardTitle>
                  <CardDescription>Manage the segments that connect locations.</CardDescription>
                </div>
                <Dialog open={isAddingBlock} onOpenChange={(open) => {
                  setIsAddingBlock(open);
                  if (!open) {
                    setEditBlockId(null);
                    setBlockSource('');
                    setBlockTarget('');
                    setBlockRouteName('');
                    setBlockDistance('');
                    setBlockPathCoords([]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 shadow-md" onClick={() => setEditBlockId(null)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Route Block
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                      {/* Left: Map */}
                      <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
                        <RouteMap
                          nodes={nodes.filter(n => n.id === blockSource || n.id === blockTarget)}
                          edges={[]}
                          className="h-full w-full border-none shadow-none rounded-none"
                          onPathDrawn={setBlockPathCoords}
                          initialPath={blockPathCoords}
                        />
                      </div>
                      {/* Right: Form */}
                      <div className="w-full md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
                        <DialogHeader className="mb-2">
                          <DialogTitle className="text-2xl font-bold">{editBlockId ? 'Edit Route Block' : 'Add Route Block'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                              <Label>Source Node</Label>
                              <Select value={blockSource} onValueChange={setBlockSource}>
                                <SelectTrigger><SelectValue placeholder="Select start" /></SelectTrigger>
                                <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label>Target Node</Label>
                              <Select value={blockTarget} onValueChange={setBlockTarget}>
                                <SelectTrigger><SelectValue placeholder="Select end" /></SelectTrigger>
                                <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid gap-1">
                            <Label>Route Name (Line)</Label>
                            <Input value={blockRouteName} onChange={e => setBlockRouteName(e.target.value)} placeholder="e.g. Tibanga-Palao" />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                              <Label>Vehicle Type</Label>
                              <Select value={blockVehicleType} onValueChange={setBlockVehicleType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="jeepney">Jeepney</SelectItem>
                                  <SelectItem value="minibus">Minibus</SelectItem>
                                  <SelectItem value="walking">Walking</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label>Distance (km)</Label>
                              <Input type="number" step="0.01" value={blockDistance} onChange={e => setBlockDistance(e.target.value)} />
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <Label className="mb-2 block text-sm">Path Coordinates Input</Label>
                            <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                              <Button type="button" variant="ghost" size="sm" className={`flex-1 text-xs rounded ${routeInputMode === 'manual' ? 'bg-white shadow-sm' : ''}`} onClick={() => setRouteInputMode('manual')}>Draw on Map</Button>
                              <Button type="button" variant="ghost" size="sm" className={`flex-1 text-xs rounded ${routeInputMode === 'json' ? 'bg-white shadow-sm' : ''}`} onClick={() => setRouteInputMode('json')}>Import GeoJSON</Button>
                            </div>
                            {routeInputMode === 'json' && (
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <input
                                  type="file"
                                  accept=".json,.geojson"
                                  className="text-xs"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      try {
                                        const parsed = JSON.parse(ev.target?.result as string);
                                        let coords: [number, number][] = [];
                                        if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
                                          parsed.features.forEach((f: any) => {
                                            if (f.geometry?.type === 'LineString') {
                                              const seg: [number, number][] = f.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                                              coords.push(...seg);
                                            }
                                          });
                                          setBlockPathCoords(coords);
                                        }
                                      } catch (err) {
                                        console.error('Failed parsing geojson', err);
                                      }
                                    };
                                    reader.readAsText(file);
                                  }}
                                />
                              </div>
                            )}
                            {blockPathCoords.length > 0 && <p className="text-xs text-cyan-600 mt-2">✓ {blockPathCoords.length} points defined.</p>}
                          </div>
                        </div>
                        <DialogFooter className="mt-auto pt-4">
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={handleSaveBlock} className="bg-cyan-500 hover:bg-cyan-600 text-white">{editBlockId ? 'Update Block' : 'Save Block'}</Button>
                        </DialogFooter>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Jeepney Line</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dist (km)</TableHead>
                    <TableHead>Reg. Fare</TableHead>
                    <TableHead>Disc. Fare</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeBlocks.map(b => {
                    const sourceName = nodes.find(n => n.id === b.source)?.name || b.source;
                    const targetName = nodes.find(n => n.id === b.target)?.name || b.target;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-slate-700">{sourceName}</TableCell>
                        <TableCell className="font-medium text-slate-700">{targetName}</TableCell>
                        <TableCell>{b.routeName}</TableCell>
                        <TableCell className="capitalize">{b.stopAndTransfer || 'jeepney'}</TableCell>
                        <TableCell>{b.distance}</TableCell>
                        <TableCell className="text-green-600 font-semibold">₱{Number(b.regularFare || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-emerald-600">₱{Number(b.discountedFare || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditBlockId(b.id);
                              setBlockSource(b.source);
                              setBlockTarget(b.target);
                              setBlockRouteName(b.routeName);
                              setBlockVehicleType(b.stopAndTransfer || 'jeepney');
                              setBlockDistance(b.distance.toString());
                              setBlockPathCoords(b.pathCoordinates || []);
                              setIsAddingBlock(true);
                            }}>
                              <Edit className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => requestDelete('route-block', b.id, `route block: ${sourceName} → ${targetName}`)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- LOCATIONS TAB --- */}
        <TabsContent value="locations">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <CardTitle>Locations (Nodes)</CardTitle>
                <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 shadow-md">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add / Edit Node</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label>Node ID (e.g., centennial-park)</Label>
                        <Input value={nodeId} onChange={e => setNodeId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="Lower-case, no spaces" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Display Name</Label>
                        <Input value={nodeName} onChange={e => setNodeName(e.target.value)} placeholder="e.g., Dalipuga Centennial Park" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Latitude</Label>
                          <Input type="number" value={nodeLat} onChange={e => setNodeLat(e.target.value)} placeholder="e.g., 8.3198" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Longitude</Label>
                          <Input type="number" value={nodeLng} onChange={e => setNodeLng(e.target.value)} placeholder="e.g., 124.2482" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button onClick={handleSaveNode} className="bg-cyan-500 hover:bg-cyan-600 text-white">Save Node</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Lat</TableHead>
                    <TableHead>Lng</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-xs">{n.id}</TableCell>
                      <TableCell className="font-medium text-slate-700">{n.name}</TableCell>
                      <TableCell>{n.coordinates?.latitude}</TableCell>
                      <TableCell>{n.coordinates?.longitude}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setNodeId(n.id);
                            setNodeName(n.name);
                            setNodeLat(String(n.coordinates?.latitude ?? ''));
                            setNodeLng(String(n.coordinates?.longitude ?? ''));
                            setIsAddingNode(true);
                          }}>
                            <Edit className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => requestDelete('node', n.id, `location: ${n.name}`)  }>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ROUTES TAB (COLORS) --- */}
        <TabsContent value="routes">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <CardTitle>Jeepney Lines</CardTitle>
              <CardDescription>Manage descriptions and map colors for route lines.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map(r => (
                    <TableRow key={r.name}>
                      <TableCell className="font-bold text-slate-800">{r.name}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full" style={{ backgroundColor: r.color }}></div>
                           <span className="font-mono text-xs text-slate-500">{r.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => requestDelete('route', r.name, `jeepney line: ${r.name}`)  }>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- FARE MATRIX TAB --- */}
        <TabsContent value="fares">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <CardTitle>Global Fare Matrix</CardTitle>
              <CardDescription>
                Updates here will automatically recalculate the cached fares for all existing Route Blocks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {fareMatrix.map(f => (
                  <div key={f.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                    <h3 className="text-lg font-bold capitalize text-slate-800 mb-4">{f.vehicle_type} Fare Rules</h3>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      try {
                        const res = await fetch('/api/mysql/fare-matrix', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            vehicleType: f.vehicle_type,
                            baseFare: parseFloat(formData.get('baseFare') as string),
                            baseKm: parseFloat(formData.get('baseKm') as string),
                            succeedingKmRate: parseFloat(formData.get('succeedingKmRate') as string),
                            discountRate: parseFloat(formData.get('discountRate') as string),
                          })
                        });
                        const data = await res.json();
                        if(data.success) {
                           toast({ title: 'Success', description: 'Fare Matrix updated and all route blocks recalculated.' });
                           loadData();
                        } else {
                           toast({ variant: 'destructive', title: 'Error', description: data.message });
                        }
                      } catch (err: any) {
                        toast({ variant: 'destructive', title: 'Error', description: err.message });
                      }
                    }} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                          <Label>Base Fare (₱)</Label>
                          <Input name="baseFare" type="number" step="0.25" defaultValue={f.base_fare} />
                        </div>
                        <div className="grid gap-1">
                          <Label>Base Distance (km)</Label>
                          <Input name="baseKm" type="number" step="0.5" defaultValue={f.base_km} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                          <Label>Succeeding Rate / km (₱)</Label>
                          <Input name="succeedingKmRate" type="number" step="0.25" defaultValue={f.succeeding_km_rate} />
                        </div>
                        <div className="grid gap-1">
                          <Label>Discount Rate (e.g. 0.20 = 20%)</Label>
                          <Input name="discountRate" type="number" step="0.01" defaultValue={f.discount_rate} />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-sm mt-2">
                        Update & Recalculate
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- MEASURE ROUTE TAB --- */}
        <TabsContent value="measure">
          <RouteMeasurer onDataChange={loadData} />
        </TabsContent>
      </Tabs>

      {/* --- CONFIRM DELETE DIALOG --- */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete the{' '}
              <span className="font-semibold text-slate-800">{confirmDelete?.label}</span>?
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
