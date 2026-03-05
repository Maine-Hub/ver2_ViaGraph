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
import { fetchGraphData } from '@/lib/db';
import { useFirestore } from '@/firebase/provider';
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
  const db = useFirestore();
  const [graphData, setGraphData] = React.useState<Graph>({ nodes: [], routes: [], edges: [] });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchGraphData(db);
      setGraphData(data);
      setIsLoading(false);
    };
    loadData();
  }, [db]);

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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Route</CardTitle>
              <CardDescription>
                Follow these steps to reach your destination.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Total Distance</span>
                  <span className="font-bold text-foreground">{state.result.totalDistance.toFixed(2)} km</span>
                </div>
                {state.result.totalFare !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>Total Regular Fare</span>
                    </div>
                    <span className="font-bold text-foreground">₱{state.result.totalFare.toFixed(2)}</span>
                  </div>
                )}
                {state.result.discountedFare !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>Total Discounted Fare</span>
                    </div>
                    <span className="font-bold text-foreground">₱{state.result.discountedFare.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {state.result.discountedFare !== undefined && (
                <p className="text-xs text-muted-foreground/80 -mt-2 mb-4">
                  Discount applies to students, seniors, and PWDs.
                </p>
              )}
              <Separator className="mb-4" />
              <div className="space-y-4">
                {state.result.path.map((segment, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Bus className="h-4 w-4" />
                      </div>
                      {index < state.result.path.length - 1 && (
                        <div className="h-16 w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold">
                        Take Jeepney <span className="text-primary">{segment.routeName}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From <span className="font-medium text-foreground">{segment.from}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        To <span className="font-medium text-foreground">{segment.to}</span>
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        ({segment.distance.toFixed(2)} km)
                        {segment.regularFare !== undefined &&
                          ` - Reg: ₱${segment.regularFare.toFixed(2)} / Disc: ₱${segment.discountedFare?.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Footprints className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="font-semibold">Arrive at Destination</p>
                    <p className="text-sm text-muted-foreground">{state.result.path[state.result.path.length - 1].to}</p>
                  </div>
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
