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
import { PlusCircle, Trash2, Archive, RotateCcw, Search, Edit, Database, Map, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCcw, AlertTriangle, Eye, History, MapPin } from 'lucide-react';
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

  // Archived Data States
  const [archivedBlocks, setArchivedBlocks] = useState<any[]>([]);
  const [archivedNodes, setArchivedNodes] = useState<any[]>([]);
  const [archivedRoutes, setArchivedRoutes] = useState<any[]>([]);
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

  // Version History States
  const [historyBlockId, setHistoryBlockId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<{ active: any; history: any[] } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Route Line Editing/Adding States
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [editRouteName, setEditRouteName] = useState<string | null>(null);
  const [routeInputName, setRouteInputName] = useState('');
  const [routeInputDesc, setRouteInputDesc] = useState('');
  const [routeInputColor, setRouteInputColor] = useState('#6366f1');

  const filteredBlocks = useMemo(() => {
    return routeBlocks.filter((b: any) => {
      const term = blocksSearch.toLowerCase();
      const sourceName = nodes.find(n => n.id === b.source)?.name || b.source;
      const targetName = nodes.find(n => n.id === b.target)?.name || b.target;
      return (
        sourceName.toLowerCase().includes(term) ||
        targetName.toLowerCase().includes(term) ||
        (b.routeName || '').toLowerCase().includes(term) ||
        (b.stopAndTransfer || '').toLowerCase().includes(term) ||
        (b.note || '').toLowerCase().includes(term)
      );
    });
  }, [routeBlocks, blocksSearch, nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n: any) => {
      const term = nodesSearch.toLowerCase();
      return (
        (n.name || '').toLowerCase().includes(term) ||
        (n.id || '').toLowerCase().includes(term)
      );
    });
  }, [nodes, nodesSearch]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r: any) => {
      const term = routesSearch.toLowerCase();
      return (
        (r.name || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term)
      );
    });
  }, [routes, routesSearch]);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
      const [graphRes, fareRes, archiveRes] = await Promise.all([
        fetch('/api/data/graph'),
        fetch('/api/mysql/fare-matrix'),
        fetch('/api/mysql/archive'),
      ]);
      const graphData = await graphRes.json();
      const fareData = await fareRes.json();
      const archiveData = await archiveRes.json();
      
      setNodes(graphData.nodes || []);
      setRouteBlocks(graphData.edges || []);
      setRoutes(graphData.routes || []);
      
      if (fareData.success) {
        setFareMatrix(fareData.data || []);
      }

      if (archiveData.success) {
        setArchivedBlocks(archiveData.data.routeBlocks || []);
        setArchivedNodes(archiveData.data.nodes || []);
        setArchivedRoutes(archiveData.data.routes || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setIsDataLoading(false);
  };

  const handleRestore = async (type: string, id: string) => {
    try {
      const res = await fetch('/api/mysql/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Restored', description: data.message || `${type} restored successfully.` });
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
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
      toast({ title: 'Archived', description: `${type} archived successfully.` });
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

  // Version History Handlers
  const loadHistory = async (id: string) => {
    setIsHistoryLoading(true);
    setHistoryBlockId(id);
    try {
      const res = await fetch(`/api/mysql/route-blocks/${id}/versions`);
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.data);
        setSelectedVersion({
          ...data.data.active,
          isCurrentActive: true
        });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.message });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleRestoreVersion = async (historyId: number) => {
    if (!historyBlockId) return;
    try {
      const res = await fetch(`/api/mysql/route-blocks/${historyBlockId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast({ title: 'Success', description: data.message });
      setHistoryBlockId(null);
      setHistoryData(null);
      setSelectedVersion(null);
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

  // Handle Saving Route Line
  const handleSaveRoute = async () => {
    if (!routeInputName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Route name is required.' });
      return;
    }
    try {
      const isEdit = !!editRouteName;
      const url = isEdit ? `/api/mysql/routes/${encodeURIComponent(editRouteName)}` : '/api/mysql/routes';
      const method = isEdit ? 'PUT' : 'POST';
      
      const body = isEdit ? {
        newName: routeInputName,
        description: routeInputDesc,
        color: routeInputColor
      } : {
        name: routeInputName,
        description: routeInputDesc,
        color: routeInputColor
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast({ title: 'Success', description: data.message || `Jeepney line ${isEdit ? 'updated' : 'added'} successfully.` });
      setIsAddingRoute(false);
      setEditRouteName(null);
      setRouteInputName('');
      setRouteInputDesc('');
      setRouteInputColor('#6366f1');
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
          <TabsTrigger value="archive-manager" className="rounded-lg data-[state=active]:bg-white flex items-center gap-1.5"><Archive className="h-3.5 w-3.5" /> Archive Manager</TabsTrigger>
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
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/20">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search route blocks..."
                    value={blocksSearch}
                    onChange={(e) => setBlocksSearch(e.target.value)}
                    className="pl-8 bg-white border-slate-200"
                  />
                </div>
                {blocksSearch && (
                  <Button
                    variant="ghost"
                    onClick={() => setBlocksSearch('')}
                    className="text-xs h-9 px-3 text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </Button>
                )}
              </div>

               <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[50px] text-slate-500 font-semibold">#</TableHead>
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
                  {filteredBlocks.map((b, index) => {
                    const sourceName = nodes.find(n => n.id === b.source)?.name || b.source;
                    const targetName = nodes.find(n => n.id === b.target)?.name || b.target;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
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
                            <Button variant="ghost" size="icon" title="View Version History" onClick={() => loadHistory(b.id)}>
                              <History className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
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
                            <Button variant="ghost" size="icon" title="Archive Route Block" onClick={() => requestDelete('route-block', b.id, `route block: ${sourceName} → ${targetName}`)}>
                              <Archive className="h-4 w-4 text-slate-500 hover:text-amber-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredBlocks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-6 text-sm">
                        {blocksSearch ? 'No matching route blocks found.' : 'No route blocks found.'}
                      </TableCell>
                    </TableRow>
                  )}
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
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search locations..."
                    value={nodesSearch}
                    onChange={(e) => setNodesSearch(e.target.value)}
                    className="pl-8 bg-white border-slate-200"
                  />
                </div>
                {nodesSearch && (
                  <Button
                    variant="ghost"
                    onClick={() => setNodesSearch('')}
                    className="text-xs h-9 px-3 text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] font-semibold text-slate-700">#</TableHead>
                    <TableHead className="font-semibold text-slate-700">ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Lat/Lng</TableHead>
                    <TableHead className="font-semibold text-slate-700">Connected Lines & Stats</TableHead>
                    <TableHead className="w-[120px] font-semibold text-slate-700"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNodes.map((n, index) => {
                    const connectedRouteBlocks = routeBlocks.filter(b => b.source === n.id || b.target === n.id);
                    const connectedRouteNames = Array.from(new Set(connectedRouteBlocks.map(b => b.routeName).filter(Boolean))) as string[];
                    const connectionCount = connectedRouteBlocks.length;

                    return (
                      <TableRow key={n.id}>
                        <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{n.id}</TableCell>
                        <TableCell className="font-medium text-slate-700">{n.name}</TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {n.coordinates?.latitude != null && n.coordinates?.longitude != null ? (
                            `${Number(n.coordinates.latitude).toFixed(6)}, ${Number(n.coordinates.longitude).toFixed(6)}`
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {connectedRouteNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {connectedRouteNames.map(name => {
                                  const routeObj = routes.find(r => r.name === name);
                                  const color = routeObj?.color || '#6366f1';
                                  return (
                                    <span
                                      key={name}
                                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-sm"
                                      style={{ backgroundColor: color }}
                                    >
                                      {name}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No serving lines</span>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium">
                              {connectionCount} active connection{connectionCount !== 1 && 's'}
                            </span>
                          </div>
                        </TableCell>
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
                            <Button variant="ghost" size="icon" title="Archive Location" onClick={() => requestDelete('node', n.id, `location: ${n.name}`)  }>
                              <Archive className="h-4 w-4 text-slate-500 hover:text-amber-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredNodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                        {nodesSearch ? 'No matching locations found.' : 'No locations found.'}
                      </TableCell>
                    </TableRow>
                  )}
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
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search jeepney lines..."
                      value={routesSearch}
                      onChange={(e) => setRoutesSearch(e.target.value)}
                      className="pl-8 bg-white border-slate-200"
                    />
                  </div>
                  {routesSearch && (
                    <Button
                      variant="ghost"
                      onClick={() => setRoutesSearch('')}
                      className="text-xs h-9 px-3 text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 shadow-md h-9 text-xs" onClick={() => {
                  setEditRouteName(null);
                  setRouteInputName('');
                  setRouteInputDesc('');
                  setRouteInputColor('#6366f1');
                  setIsAddingRoute(true);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Route Line
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] font-semibold text-slate-700">#</TableHead>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Usage Stats</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((r, index) => {
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
                        <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
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
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditRouteName(r.name);
                              setRouteInputName(r.name);
                              setRouteInputDesc(r.description || '');
                              setRouteInputColor(r.color || '#6366f1');
                              setIsAddingRoute(true);
                            }}>
                              <Edit className="h-4 w-4 text-slate-500 hover:text-cyan-600" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Archive Jeepney Line" onClick={() => requestDelete('route', r.name, `jeepney line: ${r.name}`)  }>
                              <Archive className="h-4 w-4 text-slate-500 hover:text-amber-600" />
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

        {/* --- ARCHIVE MANAGER TAB --- */}
        <TabsContent value="archive-manager">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <CardTitle className="text-xl font-bold text-slate-800">Archive Manager</CardTitle>
              <CardDescription>View and restore archived locations, route segments, and jeepney lines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              
              {/* Archived Locations */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-1">Archived Locations (Nodes)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-semibold text-slate-700">#</TableHead>
                        <TableHead>Location ID</TableHead>
                        <TableHead>Location Name</TableHead>
                        <TableHead>Coordinates (Lat, Lng)</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedNodes.map((n, index) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{n.id}</TableCell>
                          <TableCell className="font-medium text-slate-700">{n.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{n.latitude}, {n.longitude}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-1"
                              onClick={() => handleRestore('node', n.id)}
                              title="Restore Location"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {archivedNodes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs italic">
                            No archived locations.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Archived Route Blocks */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-1">Archived Route Blocks (Segments)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-semibold text-slate-700">#</TableHead>
                        <TableHead>Jeepney Line</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedBlocks.map((b, index) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
                          <TableCell className="font-semibold text-xs text-slate-500">{b.route_name}</TableCell>
                          <TableCell className="font-medium text-slate-700">{b.source_name} → {b.target_name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{Number(b.distance).toFixed(3)} km</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-1"
                              onClick={() => handleRestore('route-block', b.id)}
                              title="Restore Route Block"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {archivedBlocks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs italic">
                            No archived route blocks.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Archived Jeepney Lines */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 border-b pb-1">Archived Jeepney Lines (Routes)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-semibold text-slate-700">#</TableHead>
                        <TableHead>Line Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedRoutes.map((r, index) => (
                        <TableRow key={r.name}>
                          <TableCell className="font-mono text-xs text-slate-500">{index + 1}</TableCell>
                          <TableCell className="font-bold text-slate-800">{r.name}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></div>
                              <span className="font-mono text-xs text-slate-500">{r.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-1"
                              onClick={() => handleRestore('route', r.name)}
                              title="Restore Jeepney Line"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {archivedRoutes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs italic">
                            No archived jeepney lines.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- CONFIRM ARCHIVE DIALOG --- */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Archive className="h-5 w-5" /> Confirm Archive
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to archive the{' '}
              <span className="font-semibold text-slate-800">{confirmDelete?.label}</span>?
              <br />
              <span className="text-amber-600 font-medium">Archiving will hide this item from commuter paths and search lists, but keep it in the database.</span>

              {confirmDelete?.type === 'node' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-sm">
                  <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Affected Route Blocks:
                  </p>
                  {(() => {
                    const affected = routeBlocks.filter(b => b.source === confirmDelete.id || b.target === confirmDelete.id);
                    if (affected.length === 0) {
                      return <p className="italic text-amber-700 mt-1">✓ No active route blocks use this node. Safe to archive.</p>;
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
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-medium" onClick={handleDelete}>
              Yes, Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- VIEW ROUTE DETAILS DIALOG --- */}
      <Dialog open={!!viewRouteDetails} onOpenChange={(open) => { if (!open) setViewRouteDetails(null); }}>
        <DialogContent className="max-w-5xl border-none shadow-2xl p-0 bg-white rounded-2xl overflow-hidden">
          {/* Accessibility Title & Description */}
          <DialogTitle className="sr-only">Route Line Details Map Preview</DialogTitle>
          <DialogDescription className="sr-only">View stops, blocks, and path preview for this route line.</DialogDescription>
          
          {(() => {
            const currentRoute = routes.find(r => r.name === viewRouteDetails);
            const lineBlocks = routeBlocks.filter(b => b.routeName === viewRouteDetails);
            
            const nodeIds = new Set<string>();
            lineBlocks.forEach(b => {
              nodeIds.add(b.source);
              nodeIds.add(b.target);
            });
            
            const usedNodes = nodes.filter(n => nodeIds.has(n.id));
            const totalLength = lineBlocks.reduce((sum, b) => sum + Number(b.distance), 0);
            const totalFare = lineBlocks.reduce((sum, b) => sum + Number(b.regularFare || 0), 0);

            // Construct segments paths for RouteMap
            const pathSegments = lineBlocks.map(b => {
              const coords = Array.isArray(b.pathCoordinates) 
                ? b.pathCoordinates 
                : (b.pathCoordinates?.ridingCoords || []);
              return {
                coords,
                color: currentRoute?.color || '#6366f1',
                label: b.routeName
              };
            }).filter(p => p.coords.length > 0);

            // Get starting coordinates for map bounds centering
            const mapInitialPath = pathSegments.length > 0 ? pathSegments[0].coords : undefined;

            return (
              <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                {/* Left: Map Preview */}
                <div className="w-full md:w-3/5 bg-slate-50 relative min-h-[450px]">
                  {viewRouteDetails && (
                    <RouteMap
                      nodes={usedNodes}
                      edges={[]}
                      initialPath={mapInitialPath}
                      extraPaths={pathSegments}
                      className="h-full w-full border-none shadow-none rounded-none"
                    />
                  )}
                </div>

                {/* Right: Details & Stats */}
                <div className="w-full md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-white border-l border-slate-100">
                  <div className="space-y-6">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-200" 
                          style={{ backgroundColor: currentRoute?.color || '#6366f1' }}
                        />
                        {viewRouteDetails}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 mt-1">
                        {currentRoute?.description || 'No description provided.'}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Cumulative Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Length</p>
                        <p className="text-lg font-extrabold text-cyan-600 mt-0.5">{totalLength.toFixed(3)} km</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Base Fare</p>
                        <p className="text-lg font-extrabold text-emerald-600 mt-0.5">₱{totalFare.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Stops</p>
                        <p className="text-lg font-extrabold text-slate-700 mt-0.5">{usedNodes.length} stops</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Segments</p>
                        <p className="text-lg font-extrabold text-slate-700 mt-0.5">{lineBlocks.length} blocks</p>
                      </div>
                    </div>

                    {/* Nodes list */}
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Stops & Landmarks ({usedNodes.length})</h4>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                        {usedNodes.map(n => (
                          <span key={n.id} className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm text-slate-600">
                            {n.name}
                          </span>
                        ))}
                        {usedNodes.length === 0 && <span className="text-[11px] text-slate-400 italic">No stops connected to this line.</span>}
                      </div>
                    </div>

                    {/* Blocks list table */}
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Route Segments ({lineBlocks.length})</h4>
                      <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50">
                        <Table>
                          <TableHeader className="bg-white">
                            <TableRow>
                              <TableHead className="text-[10px] py-2 uppercase font-bold">Source</TableHead>
                              <TableHead className="text-[10px] py-2 uppercase font-bold">Target</TableHead>
                              <TableHead className="text-[10px] py-2 uppercase font-bold text-right">Distance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lineBlocks.map(b => (
                              <TableRow key={b.id} className="hover:bg-slate-100/50">
                                <TableCell className="text-[11px] py-2 font-medium text-slate-600 truncate max-w-[100px]">{nodes.find(n => n.id === b.source)?.name || b.source}</TableCell>
                                <TableCell className="text-[11px] py-2 font-medium text-slate-600 truncate max-w-[100px]">{nodes.find(n => n.id === b.target)?.name || b.target}</TableCell>
                                <TableCell className="text-[11px] py-2 text-slate-500 text-right font-mono">{b.distance} km</TableCell>
                              </TableRow>
                            ))}
                            {lineBlocks.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-xs text-slate-400 italic py-4">No route segments.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <DialogClose asChild>
                      <Button variant="outline" className="px-6 text-xs h-9">Close Details</Button>
                    </DialogClose>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* --- ADD/EDIT ROUTE LINE DIALOG --- */}
      <Dialog open={isAddingRoute} onOpenChange={(open) => {
        setIsAddingRoute(open);
        if (!open) {
          setEditRouteName(null);
          setRouteInputName('');
          setRouteInputDesc('');
          setRouteInputColor('#6366f1');
        }
      }}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <PlusCircle className="h-5 w-5 text-cyan-500" />
              {editRouteName ? 'Edit Jeepney Line' : 'Add Jeepney Line'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editRouteName ? 'Update name, description, or map color of this transit route line.' : 'Define a new jeepney/bus line name, description, and custom map color.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-1">
              <Label htmlFor="routeNameInput" className="text-slate-700 font-medium">Route Name</Label>
              <Input
                id="routeNameInput"
                value={routeInputName}
                onChange={e => setRouteInputName(e.target.value)}
                placeholder="e.g. Tambo-Gerona-City Proper"
                className="border-slate-200"
              />
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="routeDescInput" className="text-slate-700 font-medium">Description</Label>
              <Input
                id="routeDescInput"
                value={routeInputDesc}
                onChange={e => setRouteInputDesc(e.target.value)}
                placeholder="e.g. Jeepney line connecting Tambo Terminal to City Proper"
                className="border-slate-200"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="routeColorInput" className="text-slate-700 font-medium">Map Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="routeColorInput"
                  value={routeInputColor}
                  onChange={e => setRouteInputColor(e.target.value)}
                  className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer bg-transparent"
                />
                <Input
                  value={routeInputColor}
                  onChange={e => setRouteInputColor(e.target.value)}
                  placeholder="#6366f1"
                  className="font-mono text-xs w-28 uppercase border-slate-200"
                />
                <div 
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                  style={{ backgroundColor: routeInputColor }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="px-6 text-xs h-9">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSaveRoute} 
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 text-xs h-9"
            >
              {editRouteName ? 'Update Line' : 'Save Line'}
            </Button>
          </DialogFooter>
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

      {/* --- VERSION HISTORY DIALOG --- */}
      <Dialog open={!!historyBlockId} onOpenChange={(open) => { if (!open) { setHistoryBlockId(null); setHistoryData(null); setSelectedVersion(null); } }}>
        <DialogContent className="max-w-5xl border-none shadow-2xl p-0 bg-white rounded-2xl overflow-hidden">
          {/* Accessibility Title & Description */}
          <DialogTitle className="sr-only">Route Block Version History</DialogTitle>
          <DialogDescription className="sr-only">View and restore previous route block versions.</DialogDescription>
          {isHistoryLoading ? (
            <div className="h-[400px] flex items-center justify-center font-medium italic text-slate-400">Loading version history...</div>
          ) : historyData && (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
              {/* Left: Map Preview */}
              <div className="w-full md:w-3/5 bg-slate-50 relative min-h-[400px]">
                <RouteMap
                  nodes={nodes.filter(n => n.id === historyData.active.source_id || n.id === historyData.active.target_id)}
                  edges={[]}
                  initialPath={
                    selectedVersion
                      ? (() => {
                          try {
                            const parsed = typeof selectedVersion.path_coordinates === 'string'
                              ? JSON.parse(selectedVersion.path_coordinates)
                              : selectedVersion.path_coordinates;
                            return Array.isArray(parsed)
                              ? parsed
                              : (parsed?.ridingCoords || []);
                          } catch {
                            if (Array.isArray(selectedVersion.path_coordinates)) return selectedVersion.path_coordinates;
                            if (selectedVersion.path_coordinates?.ridingCoords) return selectedVersion.path_coordinates.ridingCoords;
                            return [];
                          }
                        })()
                      : []
                  }
                  className="h-full w-full border-none shadow-none rounded-none"
                  selectedSource={historyData.active.source_id}
                  selectedTarget={historyData.active.target_id}
                />
              </div>

              {/* Right: Version List */}
              <div className="w-full md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-white border-l border-slate-100">
                <div>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                      <History className="h-5 w-5 text-cyan-500" />
                      Version History
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Route block between <strong>{nodes.find(n => n.id === historyData.active.source_id)?.name || historyData.active.source_id}</strong> and <strong>{nodes.find(n => n.id === historyData.active.target_id)?.name || historyData.active.target_id}</strong>.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 pr-1 max-h-[45vh] overflow-y-auto">
                    {/* Active Version */}
                    <div
                      onClick={() => setSelectedVersion({ ...historyData.active, isCurrentActive: true })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedVersion?.isCurrentActive
                          ? 'border-cyan-500 bg-cyan-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">ACTIVE VERSION</span>
                        <span className="text-[10px] text-slate-400 font-mono">v{historyData.active.version || 1}</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Line: <span className="font-semibold">{historyData.active.route_name}</span></p>
                        <p>Distance: <span className="font-semibold">{historyData.active.distance} km</span></p>
                        <p>Fare: <span className="font-semibold text-green-700">₱{Number(historyData.active.regular_fare || 0).toFixed(2)}</span></p>
                      </div>
                    </div>

                    {/* Historical Versions */}
                    {historyData.history.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No previous versions available.</p>
                    ) : (
                      historyData.history.map((ver) => (
                        <div
                          key={ver.id}
                          onClick={() => setSelectedVersion({ ...ver, isCurrentActive: false })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedVersion?.id === ver.id && !selectedVersion?.isCurrentActive
                              ? 'border-cyan-500 bg-cyan-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Version {ver.version || 1}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(ver.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 space-y-1">
                            <p>Line: <span className="font-semibold">{ver.route_name}</span></p>
                            <p>Distance: <span className="font-semibold">{ver.distance} km</span></p>
                            <p>Fare: <span className="font-semibold text-green-700">₱{Number(ver.regular_fare || 0).toFixed(2)}</span></p>
                            {ver.note && <p className="text-[10px] italic text-slate-500 truncate">Tip: {ver.note}</p>}
                          </div>
                          {selectedVersion?.id === ver.id && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreVersion(ver.id);
                              }}
                              className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-1 h-7 flex items-center justify-center gap-1 shadow-sm"
                            >
                              <RotateCcw className="h-3 w-3" /> Restore this version
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <DialogClose asChild>
                    <Button variant="outline" className="px-6 text-xs h-9">Close History</Button>
                  </DialogClose>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- PREVIEW NODE DIALOG --- */}
      <Dialog open={!!previewNode} onOpenChange={(open) => { if (!open) setPreviewNode(null); }}>
        <DialogContent className="max-w-5xl border-none shadow-2xl p-0 bg-white rounded-2xl overflow-hidden">
          {previewNode && (() => {
            const connectedBlocks = routeBlocks.filter(
              (b) => b.source === previewNode.id || b.target === previewNode.id
            );
            
            const servingLines = Array.from(
              new Set(connectedBlocks.map((b) => b.routeName).filter(Boolean))
            ) as string[];

            return (
              <div className="flex flex-col md:flex-row h-[550px]">
                {/* Left Panel - Map */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full relative border-r border-slate-100">
                  <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Location Map</span>
                  </div>
                  <LocationPickerMap
                    selectedLat={previewNode.coordinates?.latitude}
                    selectedLng={previewNode.coordinates?.longitude}
                    onLocationSelect={() => {}}
                    className="h-full w-full border-none shadow-none rounded-none"
                  />
                </div>

                {/* Right Panel - stop info & connections */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col p-6 overflow-y-auto bg-slate-50/30">
                  {/* Header */}
                  <DialogHeader className="mb-4 space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="bg-cyan-500/10 p-1.5 rounded-lg">
                        <MapPin className="h-5 w-5 text-cyan-600" />
                      </div>
                      <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                        {previewNode.name}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs font-mono text-slate-500 mt-1">
                      ID: {previewNode.id} • Lat/Lng: {previewNode.coordinates?.latitude != null && previewNode.coordinates?.longitude != null ? `${Number(previewNode.coordinates.latitude).toFixed(6)}, ${Number(previewNode.coordinates.longitude).toFixed(6)}` : '—'}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Serving Lines</span>
                      <span className="text-2xl font-extrabold text-slate-700">{servingLines.length}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Connections</span>
                      <span className="text-2xl font-extrabold text-slate-700">{connectedBlocks.length}</span>
                    </div>
                  </div>

                  {/* Serving Lines Section */}
                  <div className="mb-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Serving Lines</h4>
                    {servingLines.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {servingLines.map((lineName) => {
                          const routeObj = routes.find((r) => r.name === lineName);
                          const color = routeObj?.color || '#6366f1';
                          return (
                            <span
                              key={lineName}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
                              style={{ backgroundColor: color }}
                            >
                              {lineName}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No lines routing through this stop.</p>
                    )}
                  </div>

                  {/* Direct Connections Table */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Direct Connections & Fares
                    </h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl bg-white shadow-inner">
                      {connectedBlocks.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="py-2 text-[10px] font-bold text-slate-500 uppercase">Neighbor</TableHead>
                              <TableHead className="py-2 text-[10px] font-bold text-slate-500 uppercase">Direction</TableHead>
                              <TableHead className="py-2 text-[10px] font-bold text-slate-500 uppercase">Line</TableHead>
                              <TableHead className="py-2 text-[10px] font-bold text-slate-500 uppercase text-right">Fares</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {connectedBlocks.map((b) => {
                              const isSource = b.source === previewNode.id;
                              const neighborId = isSource ? b.target : b.source;
                              const neighborNode = nodes.find((n) => n.id === neighborId);
                              const neighborName = neighborNode?.name || neighborId;
                              const routeObj = routes.find((r) => r.name === b.routeName);
                              const lineColor = routeObj?.color || '#94a3b8';

                              return (
                                <TableRow key={b.id} className="hover:bg-slate-50/50">
                                  <TableCell className="py-2.5 font-medium text-slate-700 text-xs max-w-[120px] truncate" title={neighborName}>
                                    {neighborName}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-xs">
                                    {isSource ? (
                                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                        Outgoing →
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                        Incoming ←
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-xs">
                                    <span
                                      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold text-white max-w-[80px] truncate"
                                      style={{ backgroundColor: lineColor }}
                                      title={b.routeName}
                                    >
                                      {b.routeName}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-right text-xs">
                                    <div className="flex flex-col text-[10px]">
                                      <span className="font-semibold text-slate-700">Reg: ₱{Number(b.regularFare || 0).toFixed(2)}</span>
                                      <span className="text-slate-500">Disc: ₱{Number(b.discountedFare || 0).toFixed(2)}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs italic">
                          No direct neighbors connected.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dialog Footer Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <DialogClose asChild>
                      <Button className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-md px-5 py-2 h-9 rounded-lg transition-all">
                        Close Profile
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
