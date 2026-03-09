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
          Find Shortest Route
        </>
      )}
    </Button>
  );
}

export default function FindRoutePage() {
  const [state, formAction] = useActionState(findRouteAction, { message: '' });
  const [graphData, setGraphData] = React.useState<Graph>({ nodes: [], routes: [], edges: [] });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/data/graph');
        const data = await res.json();
        setGraphData(data);
      } catch { }
      setIsLoading(false);
    };
    loadData();
  }, []);

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
              Enter your location and destination to find the shortest jeepney
              route.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form action={formAction}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="startLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Totals */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="font-bold">{state.result.totalDistance.toFixed(2)} km</span>
                </div>
                {state.result.totalFare !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regular Fare</span>
                    <span className="font-bold text-green-700">₱{state.result.totalFare.toFixed(2)}</span>
                  </div>
                )}
                {state.result.discountedFare !== undefined && (
                  <div className="flex flex-col pt-1">
                    <span className="text-muted-foreground text-sm">Discounted Fare</span>
                    <span className="font-bold text-blue-700 text-lg">₱{state.result.discountedFare.toFixed(2)}</span>
                  </div>
                )}
                {state.result.discountedFare !== undefined && (
                  <p className="text-xs text-muted-foreground/70">* Discount for students, seniors & PWDs</p>
                )}
              </div>

              {/* Per-segment details */}
              {state.result.path.map((segment, index) => {
                const seg = segment as any;
                return (
                  <div key={index} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Bus className="h-4 w-4 shrink-0" />
                      <span>Segment {index + 1}: {seg.routeName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Jeepney Line</span>
                      <span className="font-medium">{seg.routeName}</span>
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium">{seg.distance.toFixed(2)} km</span>
                      {seg.stopAndTransfer && (
                        <>
                          <span className="text-muted-foreground">Stop & Transfer</span>
                          <span className="font-medium">{seg.stopAndTransfer}</span>
                        </>
                      )}
                      {seg.note && (
                        <div className="col-span-2 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 italic">
                          Tip: {seg.note}
                        </div>
                      )}
                      {seg.regularFare !== undefined && (
                        <>
                          <span className="text-muted-foreground">Regular Fare</span>
                          <span className="font-medium text-green-700 text-right">₱{seg.regularFare.toFixed(2)}</span>
                          <div className="col-span-2 flex flex-col pt-1">
                            <span className="text-muted-foreground">Discounted Fare</span>
                            <span className="font-medium text-blue-700 text-sm">₱{seg.discountedFare?.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Destination */}
              <div className="flex items-center gap-2 pt-1">
                <Footprints className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-xs">Arrive at Destination</p>
                  <p className="text-xs text-muted-foreground">{state.result.path[state.result.path.length - 1].to}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 h-full min-h-[400px]">
        <RouteMapView
          nodes={graphData.nodes}
          path={state.result ? state.result.path : undefined}
          className="h-full"
        />
      </div>
    </div>
  );
}
