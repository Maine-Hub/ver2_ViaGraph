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
import { Textarea } from '@/components/ui/textarea';
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
import { PlusCircle, Trash2, Edit, Database, Map, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCcw, AlertTriangle, Eye } from 'lucide-react';
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
  const [blockNote, setBlockNote] = useState('');
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

  // View Route Details State
  const [viewRouteDetails, setViewRouteDetails] = useState<string | null>(null);

  // Preview Route Block State
  const [previewBlock, setPreviewBlock] = useState<any | null>(null);

  // Preview Node State
  const [previewNode, setPreviewNode] = useState<any | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);

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
          pathCoordinates: blockPathCoords.length > 0 ? blockPathCoords : null,
          note: blockNote || null
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
      setBlockNote('');
      
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
      setIsEditingNode(false);
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
                    setBlockNote('');
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
                                  <SelectItem value="minibus">Mini Bus</SelectItem>
                                  <SelectItem value="bus">Bus</SelectItem>
                                  <SelectItem value="walking">Walking</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label>Distance (km)</Label>
                              <Input type="number" step="0.01" value={blockDistance} onChange={e => setBlockDistance(e.target.value)} />
                            </div>
                          </div>

                          <div className="grid gap-1">
                            <Label>Note (Tip/Instructions)</Label>
                            <Textarea 
                              value={blockNote} 
                              onChange={e => setBlockNote(e.target.value)} 
                              placeholder="e.g. Tip: Wait at the terminal or walk towards highway."
                              className="min-h-[60px]"
                            />
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
                            <Button variant="ghost" size="icon" title="Preview Path on Map" onClick={() => setPreviewBlock(b)}>
                              <Eye className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditBlockId(b.id);
                              setBlockSource(b.source);
                              setBlockTarget(b.target);
                              setBlockRouteName(b.routeName);
                              setBlockVehicleType(b.stopAndTransfer || 'jeepney');
                              setBlockDistance(b.distance.toString());
                              setBlockPathCoords(
                                Array.isArray(b.pathCoordinates) 
                                  ? b.pathCoordinates 
                                  : (b.pathCoordinates?.ridingCoords || [])
                              );
                              setBlockNote(b.note || '');
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
                <Dialog open={isAddingNode} onOpenChange={(open) => {
                  setIsAddingNode(open);
                  if (!open) {
                    setNodeId('');
                    setNodeName('');
                    setNodeLat('');
                    setNodeLng('');
                    setIsEditingNode(false);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 shadow-md" onClick={() => {
                      setNodeId('');
                      setNodeName('');
                      setNodeLat('');
                      setNodeLng('');
                      setIsEditingNode(false);
                    }}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                      {/* Left: Map */}
                      <div className="hidden md:block md:w-3/5 bg-slate-50 relative border-r border-slate-100 min-h-[500px]">
                        <LocationPickerMap
                          selectedLat={nodeLat ? parseFloat(nodeLat) : undefined}
                          selectedLng={nodeLng ? parseFloat(nodeLng) : undefined}
                          onLocationSelect={(lat, lng) => {
                            setNodeLat(lat.toFixed(6));
                            setNodeLng(lng.toFixed(6));
                          }}
                          className="h-full w-full border-none shadow-none rounded-none"
                        />
                      </div>
                      {/* Right: Form */}
                      <div className="w-full md:w-2/5 p-8 flex flex-col bg-white overflow-y-auto">
                        <DialogHeader className="mb-4">
                          <DialogTitle className="text-2xl font-bold">{isEditingNode ? 'Edit Node' : 'Add Node'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 flex-1">
                          <div className="grid gap-2">
                            <Label>Node ID (e.g., centennial-park)</Label>
                            <Input 
                              value={nodeId} 
                              onChange={e => setNodeId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} 
                              placeholder="Lower-case, no spaces" 
                              disabled={isEditingNode}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Display Name</Label>
                            <Input value={nodeName} onChange={e => setNodeName(e.target.value)} placeholder="e.g., Dalipuga Centennial Park" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Latitude</Label>
                              <Input type="number" step="any" value={nodeLat} onChange={e => setNodeLat(e.target.value)} placeholder="e.g., 8.3198" />
                            </div>
                            <div className="grid gap-2">
                              <Label>Longitude</Label>
                              <Input type="number" step="any" value={nodeLng} onChange={e => setNodeLng(e.target.value)} placeholder="e.g., 124.2482" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 italic mt-2">💡 Tip: You can click anywhere on the map to automatically fill in the coordinates.</p>
                        </div>
                        <DialogFooter className="mt-8">
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={handleSaveNode} className="bg-cyan-500 hover:bg-cyan-600 text-white">Save Node</Button>
                        </DialogFooter>
                      </div>
                    </div>
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
                          <Button variant="ghost" size="icon" title="Preview Node on Map" onClick={() => setPreviewNode(n)}>
                            <Eye className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setNodeId(n.id);
                            setNodeName(n.name);
                            setNodeLat(String(n.coordinates?.latitude ?? ''));
                            setNodeLng(String(n.coordinates?.longitude ?? ''));
                            setIsEditingNode(true);
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
                    <TableHead>Usage Stats</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map(r => {
                    const lineBlocks = routeBlocks.filter(b => b.routeName === r.name);
                    const blockCount = lineBlocks.length;
                    
                    const nodeIds = new Set<string>();
                    lineBlocks.forEach(b => {
                      nodeIds.add(b.source);
                      nodeIds.add(b.target);
                    });
                    const nodeCount = nodeIds.size;

                    return (
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
                          <div className="flex flex-col text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{blockCount} block{blockCount !== 1 && 's'}</span>
                            <span>{nodeCount} node{nodeCount !== 1 && 's'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewRouteDetails(r.name)}>
                              <Eye className="h-4 w-4 text-cyan-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => requestDelete('route', r.name, `jeepney line: ${r.name}`)  }>
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

              {confirmDelete?.type === 'node' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Affected Route Blocks:
                  </p>
                  {(() => {
                    const affected = routeBlocks.filter(b => b.source === confirmDelete.id || b.target === confirmDelete.id);
                    if (affected.length === 0) {
                      return <p className="italic text-amber-700 mt-1">✓ No route blocks use this node. Safe to delete.</p>;
                    }
                    return (
                      <ul className="list-disc pl-5 mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {affected.map(b => (
                          <li key={b.id}>
                            <span className="font-medium">{nodes.find(n => n.id === b.source)?.name || b.source}</span> → <span className="font-medium">{nodes.find(n => n.id === b.target)?.name || b.target}</span>
                            <span className="text-amber-600 ml-1 text-xs">({b.routeName})</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}
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

      {/* --- VIEW ROUTE DETAILS DIALOG --- */}
      <Dialog open={!!viewRouteDetails} onOpenChange={(open) => { if (!open) setViewRouteDetails(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-cyan-600" /> 
              {viewRouteDetails} Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-6">
            {(() => {
              const lineBlocks = routeBlocks.filter(b => b.routeName === viewRouteDetails);
              
              const nodeIds = new Set<string>();
              lineBlocks.forEach(b => {
                nodeIds.add(b.source);
                nodeIds.add(b.target);
              });
              
              const usedNodes = nodes.filter(n => nodeIds.has(n.id));

              return (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2 border-b pb-1">Nodes / Stops ({usedNodes.length})</h4>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-100">
                      {usedNodes.map(n => (
                        <span key={n.id} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-700">
                          {n.name}
                        </span>
                      ))}
                      {usedNodes.length === 0 && <span className="text-xs text-slate-400 italic">No nodes assigned.</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2 border-b pb-1">Route Blocks ({lineBlocks.length})</h4>
                    <div className="max-h-64 overflow-y-auto border border-slate-100 rounded bg-slate-50">
                      <Table>
                        <TableHeader className="bg-white">
                          <TableRow>
                            <TableHead className="text-xs">Source</TableHead>
                            <TableHead className="text-xs">Target</TableHead>
                            <TableHead className="text-xs">Dist</TableHead>
                            <TableHead className="text-xs">Fare</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineBlocks.map(b => (
                            <TableRow key={b.id}>
                              <TableCell className="text-xs font-medium text-slate-700">{nodes.find(n => n.id === b.source)?.name || b.source}</TableCell>
                              <TableCell className="text-xs font-medium text-slate-700">{nodes.find(n => n.id === b.target)?.name || b.target}</TableCell>
                              <TableCell className="text-xs text-slate-500">{b.distance} km</TableCell>
                              <TableCell className="text-xs text-emerald-600 font-semibold">₱{Number(b.regularFare || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          {lineBlocks.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-xs text-slate-400 italic py-4">No route blocks assigned.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- PREVIEW ROUTE BLOCK PATH DIALOG --- */}
      <Dialog open={!!previewBlock} onOpenChange={(open) => { if (!open) setPreviewBlock(null); }}>
        <DialogContent className="max-w-4xl border-none shadow-2xl p-6 bg-white rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Map className="h-5 w-5 text-cyan-500" />
              Route Block Preview
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Showing path for <span className="font-semibold text-slate-700">{nodes.find(n => n.id === previewBlock?.source)?.name || previewBlock?.source}</span> to <span className="font-semibold text-slate-700">{nodes.find(n => n.id === previewBlock?.target)?.name || previewBlock?.target}</span> ({previewBlock?.distance} km) via <span className="font-semibold text-slate-700">{previewBlock?.routeName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="h-[450px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
            {previewBlock && (
              <RouteMap
                nodes={nodes.filter(n => n.id === previewBlock.source || n.id === previewBlock.target)}
                edges={[]}
                initialPath={
                  Array.isArray(previewBlock.pathCoordinates) 
                    ? previewBlock.pathCoordinates 
                    : (previewBlock.pathCoordinates?.ridingCoords || [])
                }
                className="h-full w-full border-none shadow-none rounded-none"
                selectedSource={previewBlock.source}
                selectedTarget={previewBlock.target}
              />
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button className="bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm transition-all px-6">Close Preview</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- PREVIEW NODE DIALOG --- */}
      <Dialog open={!!previewNode} onOpenChange={(open) => { if (!open) setPreviewNode(null); }}>
        <DialogContent className="max-w-4xl border-none shadow-2xl p-6 bg-white rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Map className="h-5 w-5 text-cyan-500" />
              Node Location Review
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Reviewing accuracy of node: <span className="font-semibold text-slate-700">{previewNode?.name}</span> ({previewNode?.id})
            </DialogDescription>
          </DialogHeader>
          <div className="h-[450px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
            {previewNode && (
              <LocationPickerMap
                selectedLat={previewNode.coordinates?.latitude}
                selectedLng={previewNode.coordinates?.longitude}
                onLocationSelect={() => {}}
                className="h-full w-full border-none shadow-none rounded-none"
              />
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button className="bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm transition-all px-6">Close Preview</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
