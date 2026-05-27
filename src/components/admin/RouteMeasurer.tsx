'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, AlertCircle, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export interface MeasureResult {
  fileName: string;
  ridingDist: number;
  walkingDist: number;
  totalDist: number;
  regularFare: number;
  discountedFare: number;
  pathCoords: [number, number][];
  walkingCoords: [number, number][];
  error?: string;
  rawFeatures?: [number, number][][];
}

// Module-level cache to persist state across tab switches without modifying parent
let cachedResults: MeasureResult[] = [];

interface RouteMeasurerProps {
  onDataChange?: () => void;
}

export default function RouteMeasurer({ onDataChange }: RouteMeasurerProps) {
  const { toast } = useToast();
  const [results, setResultsState] = useState<MeasureResult[]>(cachedResults);

  const setResults = (action: React.SetStateAction<MeasureResult[]>) => {
    setResultsState((prev) => {
      const nextState = typeof action === 'function' ? action(prev) : action;
      cachedResults = nextState;
      return nextState;
    });
  };

  const [isDragging, setIsDragging] = useState(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeBlocks, setRouteBlocks] = useState<any[]>([]);

  // Dialog State
  const [isSavingBlock, setIsSavingBlock] = useState<MeasureResult | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [routeName, setRouteName] = useState('');
  const [vehicleType, setVehicleType] = useState('jeepney');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/data/graph')
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes || []);
        setRoutes(data.routes || []);
        setRouteBlocks(data.edges || []);
      })
      .catch(err => console.error('Failed to load nodes for measurer', err));
  }, []);

  // Haversine formula translated for the browser
  const haversine = (lon1: number, lat1: number, lon2: number, lat2: number) => {
    const R = 6371.0;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calcFeatureDistance = (coordsArr: [number, number][]) => {
    let dist = 0;
    for (let i = 0; i < coordsArr.length - 1; i++) {
      dist += haversine(coordsArr[i][0], coordsArr[i][1], coordsArr[i + 1][0], coordsArr[i + 1][1]);
    }
    return dist;
  };

  const calcLatLonDistance = (coordsArr: [number, number][]) => {
    let dist = 0;
    for (let i = 0; i < coordsArr.length - 1; i++) {
      dist += haversine(coordsArr[i][1], coordsArr[i][0], coordsArr[i + 1][1], coordsArr[i + 1][0]);
    }
    return dist;
  };

  const calculateLTFRBFares = (distance: number) => {
    let rawRegular = 13.00;
    if (distance > 4) {
      rawRegular += (distance - 4) * 1.80;
    }
    const regularFare = Math.round(rawRegular / 0.25) * 0.25;

    const rawDiscounted = regularFare * 0.80;
    const discountedFare = Math.round(rawDiscounted / 0.25) * 0.25;

    return { regularFare, discountedFare };
  };

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newResults: MeasureResult[] = [];
    let processedCount = 0;

    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        processedCount++;
        try {
          const data = JSON.parse(e.target?.result as string);
          let ridingDist = 0;
          let walkingDist = 0;
          let pathCoords: [number, number][] = [];
          let walkingCoords: [number, number][] = [];
          const rawFeatures: [number, number][][] = [];

          const extractCoords = (geometry: any) => {
            if (geometry.type === 'LineString') return geometry.coordinates;
            if (geometry.type === 'MultiLineString') {
              // Flatten the MultiLineString array (which is an array of LineStrings)
              return geometry.coordinates.reduce((acc: any[], val: any[]) => acc.concat(val), []);
            }
            return [];
          };

          if (data.type === 'FeatureCollection') {
            const features = data.features.filter((f: any) => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'));

            features.forEach((f: any) => {
              const coords = extractCoords(f.geometry);
              if (coords.length > 0) {
                rawFeatures.push(coords.map((c: number[]) => [c[1], c[0]] as [number, number]));
              }
            });

            if (features.length >= 1) {
              const coords = extractCoords(features[0].geometry);
              if (coords.length > 0) {
                  ridingDist = calcFeatureDistance(coords);
                  pathCoords = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
              }
            }
            for (let i = 1; i < features.length; i++) {
              const coords = extractCoords(features[i].geometry);
              if (coords.length > 0) {
                  walkingDist += calcFeatureDistance(coords);
                  walkingCoords.push(...coords.map((c: number[]) => [c[1], c[0]] as [number, number]));
              }
            }
          } else if (data.type === 'Feature' && data.geometry) {
            const coords = extractCoords(data.geometry);
            if (coords.length > 0) {
                ridingDist = calcFeatureDistance(coords);
                pathCoords = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
                rawFeatures.push(pathCoords);
            }
          } else if (data.type === 'LineString' || data.type === 'MultiLineString') {
            const coords = data.type === 'LineString' ? data.coordinates : data.coordinates.reduce((acc: any[], val: any[]) => acc.concat(val), []);
            if (coords.length > 0) {
                ridingDist = calcFeatureDistance(coords);
                pathCoords = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
                rawFeatures.push(pathCoords);
            }
          }

          const totalDistance = ridingDist + walkingDist;

          if (totalDistance === 0 || isNaN(totalDistance)) {
            throw new Error('No valid coordinate lines found in the file.');
          }

          const { regularFare, discountedFare } = calculateLTFRBFares(ridingDist);

          newResults.push({
            fileName: file.name,
            ridingDist,
            walkingDist,
            totalDist: totalDistance,
            regularFare,
            discountedFare,
            pathCoords,
            walkingCoords,
            rawFeatures
          });
        } catch (error: any) {
          console.error('Error parsing file', file.name, error);
          newResults.push({
            fileName: file.name,
            ridingDist: 0,
            walkingDist: 0,
            totalDist: 0,
            regularFare: 0,
            discountedFare: 0,
            pathCoords: [],
            walkingCoords: [],
            error: error.message || 'Invalid Format / No route found',
          });
        }

        if (processedCount === files.length) {
          setResults((prev) => [...prev, ...newResults]);
        }
      };
      
      reader.onerror = () => {
         processedCount++;
         newResults.push({
            fileName: file.name,
            ridingDist: 0, walkingDist: 0, totalDist: 0, regularFare: 0, discountedFare: 0,
            pathCoords: [], walkingCoords: [], error: 'Failed to read file'
         });
         if (processedCount === files.length) {
             setResults((prev) => [...prev, ...newResults]);
         }
      };

      reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openSaveDialog = (r: MeasureResult) => {
    setIsSavingBlock(r);
    setNote('');
    
    // Auto-fill origin and destination from filename (e.g., "Origin-Destination.geojson")
    let defaultSource = '';
    let defaultTarget = '';
    const nameWithoutExt = r.fileName.replace(/\.geojson$/i, '');
    const parts = nameWithoutExt.split('-');
    if (parts.length >= 2) {
      defaultSource = parts[0].trim();
      defaultTarget = parts.slice(1).join('-').trim();
    } else {
      defaultSource = nameWithoutExt.trim();
    }

    setSourceName(defaultSource);
    setTargetName(defaultTarget);
    
    // If the file is parsed as pure walking, default type to walking and line to JUST WALK
    if (r.walkingDist > 0 && r.ridingDist === 0) {
      setVehicleType('walking');
      setRouteName('JUST WALK');
    } else {
      setVehicleType('jeepney');
      setRouteName('');
    }
  };

  const handleSaveToDB = async () => {
    if (!isSavingBlock) return;
    if (!sourceName || !targetName || !routeName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in Source, Target, and Jeepney Line.' });
      return;
    }

    try {
      // 1. Resolve or Create Source Node
      let finalSourceId = '';
      const existingSource = nodes.find(n => n.name.toLowerCase() === sourceName.toLowerCase());
      if (existingSource) {
        finalSourceId = existingSource.id;
      } else {
        finalSourceId = sourceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const startCoord = isSavingBlock.pathCoords[0] || isSavingBlock.walkingCoords[0];
        if (!startCoord) throw new Error('Cannot create source node: missing path coordinates.');
        await fetch('/api/mysql/nodes', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id: finalSourceId, name: sourceName, latitude: startCoord[0], longitude: startCoord[1] })
        });
      }

      // 2. Resolve or Create Target Node
      let finalTargetId = '';
      const existingTarget = nodes.find(n => n.name.toLowerCase() === targetName.toLowerCase());
      if (existingTarget) {
        finalTargetId = existingTarget.id;
      } else {
        finalTargetId = targetName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        let endCoord = isSavingBlock.pathCoords[isSavingBlock.pathCoords.length - 1];
        if (isSavingBlock.walkingCoords && isSavingBlock.walkingCoords.length > 0) {
            endCoord = isSavingBlock.walkingCoords[isSavingBlock.walkingCoords.length - 1];
        }
        if (!endCoord) throw new Error('Cannot create target node: missing path coordinates.');
        await fetch('/api/mysql/nodes', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id: finalTargetId, name: targetName, latitude: endCoord[0], longitude: endCoord[1] })
        });
      }

      // Refresh nodes list quietly
      fetch('/api/data/graph')
        .then(res => res.json())
        .then(data => setNodes(data.nodes || []))
        .catch(() => {});

      // 3. Save Route Block
      const res = await fetch('/api/mysql/route-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: finalSourceId,
          targetId: finalTargetId,
          routeName,
          vehicleType,
          distance: Number(isSavingBlock.totalDist.toFixed(3)),
          pathCoordinates: (isSavingBlock.pathCoords.length > 0 || isSavingBlock.walkingCoords.length > 0) ? {
              ridingCoords: isSavingBlock.pathCoords,
              walkingCoords: isSavingBlock.walkingCoords,
              ridingDist: isSavingBlock.ridingDist,
              walkingDist: isSavingBlock.walkingDist
          } : null,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast({ title: 'Success', description: 'Nodes auto-generated and Route Block saved successfully!' });
      setIsSavingBlock(null);
      if (onDataChange) onDataChange();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <CardTitle>GeoJSON Route Measurer & Importer</CardTitle>
        <CardDescription>
          Upload your .geojson files to calculate distances and insert them directly into the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 hover:border-cyan-400 hover:bg-slate-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('route-file-upload')?.click()}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-700 font-medium mb-1">Click to Browse or Drag & Drop</p>
          <p className="text-slate-500 text-sm">Supports multiple .geojson files</p>
          <input
            id="route-file-upload"
            type="file"
            accept=".geojson"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                processFiles(filesArray);
              }
              e.target.value = ''; // Reset input
            }}
          />
        </div>

        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Measurement Results</h3>
              <button
                onClick={() => setResults([])}
                className="text-sm text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear Results
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Block File</TableHead>
                    <TableHead>Riding Distance</TableHead>
                    <TableHead>Walking Distance</TableHead>
                    <TableHead>Total Distance</TableHead>
                    <TableHead>Reg. Fare</TableHead>
                    <TableHead>Disc. Fare</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-slate-700">{r.fileName}</TableCell>
                      {r.error ? (
                        <TableCell colSpan={6}>
                          <Alert variant="destructive" className="py-2 border-none">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-sm mb-0">Error</AlertTitle>
                            <AlertDescription className="text-xs">{r.error}</AlertDescription>
                          </Alert>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="font-semibold text-blue-500">
                            {r.ridingDist.toFixed(3)} km
                          </TableCell>
                          <TableCell className="font-semibold text-yellow-500">
                            {r.walkingDist > 0 ? `${r.walkingDist.toFixed(3)} km` : '-'}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            {r.totalDist.toFixed(3)} km
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            ₱{r.regularFare.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-500">
                            ₱{r.discountedFare.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openSaveDialog(r)}>
                              <Save className="h-4 w-4 mr-1" /> Insert to DB
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!isSavingBlock} onOpenChange={(open) => {
        if (!open) {
          setIsSavingBlock(null);
          setNote('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Route Block to DB</DialogTitle>
            <DialogDescription>
              Assign the nodes and Jeepney Line for {isSavingBlock?.fileName} ({isSavingBlock?.totalDist.toFixed(3)} km).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source Node</Label>
                <div className="relative">
                  <Input list="nodes-list" value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Type name..." />
                  {sourceName && (
                    <div className="absolute right-2 top-2.5">
                      {nodes.some(n => n.name.toLowerCase() === sourceName.toLowerCase()) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
                {sourceName && !nodes.some(n => n.name.toLowerCase() === sourceName.toLowerCase()) && (
                  <span className="text-[10px] text-amber-600 font-medium leading-tight">⚠️ This name doesn't match existing nodes. A new one will be created.</span>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Target Node</Label>
                <div className="relative">
                  <Input list="nodes-list" value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="Type name..." />
                  {targetName && (
                    <div className="absolute right-2 top-2.5">
                      {nodes.some(n => n.name.toLowerCase() === targetName.toLowerCase()) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
                {targetName && !nodes.some(n => n.name.toLowerCase() === targetName.toLowerCase()) && (
                  <span className="text-[10px] text-amber-600 font-medium leading-tight">⚠️ This name doesn't match existing nodes. A new one will be created.</span>
                )}
              </div>
            </div>
            <datalist id="nodes-list">
              {nodes.map(n => <option key={n.id} value={n.name} />)}
            </datalist>
            <div className="grid gap-2">
              <Label>Jeepney Line</Label>
              <Input list="routes-list" value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="e.g. Tambo-Buru-un" />
              <datalist id="routes-list">
                {routes.map((r, i) => <option key={i} value={r.name} />)}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jeepney">Jeepney</SelectItem>
                  <SelectItem value="minibus">Mini Bus</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Note (Tip/Instructions)</Label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Tip: Wait at the terminal or walk towards highway."
                className="min-h-[60px]"
              />
            </div>
          </div>
          {(() => {
            if (sourceName && targetName && routeName) {
              const sourceMatch = nodes.find(n => n.name.toLowerCase() === sourceName.toLowerCase());
              const targetMatch = nodes.find(n => n.name.toLowerCase() === targetName.toLowerCase());
              
              if (sourceMatch && targetMatch) {
                const isDuplicate = routeBlocks.some(b => 
                  b.source === sourceMatch.id && 
                  b.target === targetMatch.id && 
                  b.routeName.toLowerCase() === routeName.toLowerCase()
                );

                if (isDuplicate) {
                  return (
                    <div className="mt-2 mx-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                      <p className="font-semibold mb-1 flex items-center gap-1.5 text-red-700">
                        <AlertTriangle className="h-4 w-4" /> Duplicate Warning
                      </p>
                      <p className="text-red-700">A route block for <strong>{routeName}</strong> between these exact two nodes already exists. Inserting this will duplicate it.</p>
                    </div>
                  );
                }
              }
            }
            return null;
          })()}
          <DialogFooter className="px-6 pb-6">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveToDB} className="bg-cyan-500 hover:bg-cyan-600 text-white">Insert Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
