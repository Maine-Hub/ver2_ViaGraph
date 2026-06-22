'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { findRouteAction } from '@/lib/actions';
import { Graph } from '@/lib/types';
import dynamic from 'next/dynamic';

const RouteMapView = dynamic(() => import('@/components/map/RouteMapView'), {
  ssr: false,
  loading: () => <div className="h-[400px] md:h-[600px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 italic font-medium">Loading Interactive Map...</div>
});
import { Bus, Footprints, Hourglass, Route, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const formSchema = z.object({
  startLocation: z.string().min(1, 'Please select a starting location.'),
  endLocation: z.string().min(1, 'Please select a destination.'),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Hourglass className="mr-2 h-4 w-4 animate-spin" />
          Calculating...
        </>
      ) : (
        <>
          <Route className="mr-2 h-4 w-4" />
          Find Route
        </>
      )}
    </Button>
  );
}

export default function FindRoutePage() {
  const [state, formAction] = useActionState(findRouteAction, { message: '' });
  const [activeRouteTab, setActiveRouteTab] = React.useState<'custom' | 'dijkstra'>('custom');
  const [graphData, setGraphData] = React.useState<Graph>({ nodes: [], routes: [], edges: [] });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/data/graph');
        const data = await res.json();
        
        // Filter nodes to only include those present in edges (route blocks)
        const usedNodeIds = new Set<string>();
        if (data.edges) {
          data.edges.forEach((e: any) => {
            usedNodeIds.add(e.source);
            usedNodeIds.add(e.target);
          });
        }
        const filteredNodes = data.nodes 
          ? data.nodes.filter((n: any) => usedNodeIds.has(n.id)) 
          : [];
        filteredNodes.sort((a: any, b: any) => a.name.localeCompare(b.name));

        setGraphData({
          ...data,
          nodes: filteredNodes
        });
      } catch { }
      setIsLoading(false);
    };
    loadData();
  }, []);

  React.useEffect(() => {
    if (state.result && !state.result.path && state.result.rawDijkstraPath) {
      setActiveRouteTab('dijkstra');
    }
  }, [state]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startLocation: '',
      endLocation: '',
    },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
      <div className="lg:col-span-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Trip</CardTitle>
            <CardDescription>
              Enter your location and destination to view mapped transportation
              routes and fare information.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form action={(formData) => {
              const data = form.getValues();
              const customFormData = new FormData();
              customFormData.append('startLocation', data.startLocation);
              customFormData.append('endLocation', data.endLocation);
              setActiveRouteTab('custom');
              formAction(customFormData);
            }}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="startLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        name="startLocation"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your starting point" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {graphData.nodes.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        name="endLocation"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {graphData.nodes.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <SubmitButton />
              </CardFooter>
            </form>
          </Form>
        </Card>

        {state.message && state.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.result && (
          <Card className="mt-4 overflow-hidden border-slate-200 shadow-md">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800">Your Route Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {state.result.rawDijkstraPath && (
                <Tabs value={activeRouteTab} onValueChange={(val: any) => setActiveRouteTab(val)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl mb-4">
                    <TabsTrigger value="custom" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-800 transition-all py-2">
                      Recommended Route
                    </TabsTrigger>
                    <TabsTrigger value="dijkstra" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-800 transition-all py-2 text-rose-600 data-[state=active]:text-rose-700">
                      Standard Dijkstra's Path
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {/* Render route content based on activeRouteTab */}
              {(() => {
                const activePathObj = activeRouteTab === 'dijkstra' && state.result.rawDijkstraPath 
                  ? state.result.rawDijkstraPath 
                  : state.result;

                const pathSegments = activePathObj.path;

                if (!pathSegments || pathSegments.length === 0) {
                  return (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center space-y-3 shadow-sm">
                      <div className="text-rose-600 font-bold text-lg flex items-center justify-center gap-1.5">
                        <span>Error</span>
                      </div>
                      <p className="text-rose-700 text-sm leading-relaxed font-semibold">
                        No route found between the selected locations.
                      </p>
                      <p className="text-[11px] text-rose-500 leading-normal">
                        Please try checking the "Standard Dijkstra's Path" tab above for alternative physical options.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 text-sm">
                    {/* Totals */}
                    <div className="rounded-2xl p-4 space-y-2.5 border shadow-sm relative overflow-hidden bg-white">
                      {activeRouteTab === 'dijkstra' ? (
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Total Distance</span>
                        <span className="font-bold text-slate-800">{Number(activePathObj.totalDistance).toFixed(2)} km</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                        <span className="text-slate-500 font-medium">Regular Fare</span>
                        <span className="font-bold text-green-700">₱{Number(activePathObj.totalFare).toFixed(2)}</span>
                      </div>
                      
                      {activePathObj.discountedFare != null && (() => {
                        const totalCeiled = pathSegments.reduce((sum: number, seg: any) => sum + Math.ceil(Number(seg.discountedFare || 0)), 0);
                        return (
                          <div className="flex flex-col border-t border-slate-50 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Discounted Fare</span>
                              <span className="font-bold text-blue-700 text-base">₱{totalCeiled.toFixed(2)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 italic">
                              † Always rounded up to nearest peso per segment
                            </span>
                          </div>
                        );
                      })()}
                      
                      {activeRouteTab === 'dijkstra' && (
                        <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] leading-relaxed space-y-1.5 shadow-inner">
                          <p className="font-bold flex items-center gap-1.5">
                            ⚠️ Panelist Analysis: Dijkstra Limitations
                          </p>
                          <p>
                            Dijkstra strictly minimizes physical distance. It requires <strong className="font-semibold">{activePathObj.rideCount} transfers</strong>, creating a high-fare, disjointed commute (₱{Number(activePathObj.totalFare).toFixed(2)} total) because it ignores network transfer penalties and fare resets.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Per-segment details */}
                    <div className="space-y-3">
                      {pathSegments.map((segment: any, index: number) => {
                        return (
                          <div key={index} className="rounded-xl border border-slate-100 p-3.5 space-y-3 bg-slate-50/40 relative">
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                              {segment.routeName === 'JUST WALK' ? (
                                <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
                                  <Footprints className="h-4 w-4 shrink-0" />
                                </div>
                              ) : (
                                <div className="bg-cyan-50 p-1.5 rounded-lg text-cyan-600">
                                  <Bus className="h-4 w-4 shrink-0" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Segment {index + 1}</p>
                                <p className="text-slate-700 font-bold">{segment.routeName}</p>
                              </div>
                              {(() => {
                                const lineColor = graphData.routes.find((r: any) => r.name === segment.routeName)?.color;
                                return lineColor ? (
                                  <span
                                    className="inline-block w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                                    style={{ backgroundColor: lineColor }}
                                  />
                                ) : null;
                              })()}
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 border-t border-slate-100/60 pt-2.5">
                              <span className="text-slate-400 font-medium">{segment.routeName === 'JUST WALK' ? 'Arrive at' : 'Get off at'}</span>
                              <span className="font-bold text-slate-700 truncate">{segment.to}</span>
                              
                              <span className="text-slate-400 font-medium">Distance</span>
                              <span className="font-bold text-slate-700">
                                {segment.pathCoordinates?.ridingDist
                                  ? `${Number(segment.pathCoordinates.ridingDist).toFixed(2)} km`
                                  : `${Number(segment.distance).toFixed(2)} km`}
                              </span>
                              
                              {segment.pathCoordinates?.walkingDist ? (
                                <>
                                  <span className="text-slate-400 font-medium flex items-center gap-1">
                                    Walk Distance
                                  </span>
                                  <span className="font-bold text-slate-500">
                                    {Number(segment.pathCoordinates.walkingDist).toFixed(2)} km
                                  </span>
                                </>
                              ) : null}

                              {segment.stopAndTransfer && (
                                <>
                                  <span className="text-slate-400 font-medium">Transfer Stop</span>
                                  <span className="font-bold text-slate-700 truncate">{segment.stopAndTransfer}</span>
                                </>
                              )}

                              {segment.note && (
                                <div className="col-span-2 mt-1.5 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-[11px] text-amber-800 italic leading-relaxed">
                                  <strong>Tip:</strong> {segment.note}
                                </div>
                              )}

                              {segment.regularFare !== undefined && segment.regularFare > 0 && (
                                <>
                                  <span className="text-slate-400 font-medium border-t border-slate-100/60 pt-2">Regular Fare</span>
                                  <span className="font-bold text-green-700 text-right border-t border-slate-100/60 pt-2">
                                    ₱{Number(segment.regularFare).toFixed(2)}
                                  </span>
                                  
                                  <span className="text-slate-400 font-medium">Discounted Fare</span>
                                  <span className="font-bold text-blue-700 text-right">
                                    ₱{Math.ceil(Number(segment.discountedFare)).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Destination */}
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <div className="bg-cyan-500/10 p-2 rounded-xl text-cyan-600">
                        <Footprints className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Destination</p>
                        <p className="font-bold text-slate-800 text-xs">{pathSegments[pathSegments.length - 1].to}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 h-full min-h-[400px]">
        <RouteMapView
          nodes={graphData.nodes}
          routes={graphData.routes}
          path={
            state.result 
              ? (activeRouteTab === 'dijkstra' && state.result.rawDijkstraPath
                  ? state.result.rawDijkstraPath.path 
                  : state.result.path) 
              : undefined
          }
          alternatives={
            state.result 
              ? (activeRouteTab === 'dijkstra' && state.result.rawDijkstraPath
                  ? (state.result.rawDijkstraPath.alternatives ?? undefined)
                  : state.result.alternatives)
              : undefined
          }
          className="h-full"
        />
      </div>
    </div>
  );
}
