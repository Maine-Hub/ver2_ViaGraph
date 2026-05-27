import { findRouteAction } from '../src/lib/actions';

// Replication of RouteMapView's useMemo for segmentPolylines
function getSegmentPolylines(path: any[], routes: any[]) {
    const polylines: any[] = [];
    if (!path) return polylines;

    const routeColorMap: Record<string, string> = {};
    if (routes && routes.length > 0) {
        routes.forEach((r, i) => {
            routeColorMap[r.name] = r.color || '#6366f1';
        });
    }

    path.forEach((segment, index) => {
        const anySegment = segment as any;
        const color = routeColorMap[segment.routeName] || '#6366f1';

        // Check if pathCoordinates is the new Object format (contains ridingCoords/walkingCoords)
        if (anySegment.pathCoordinates && anySegment.pathCoordinates.ridingCoords) {
            if (anySegment.pathCoordinates.ridingCoords.length > 1) {
                polylines.push({
                    coordsCount: anySegment.pathCoordinates.ridingCoords.length,
                    color,
                    routeName: segment.routeName,
                    isWalking: anySegment.isWalking, // wait, did anySegment have isWalking?
                });
            }
            const hasWalking = anySegment.pathCoordinates.walkingDist > 0;
            if (hasWalking && anySegment.pathCoordinates.walkingCoords?.length > 1) {
                polylines.push({
                    coordsCount: anySegment.pathCoordinates.walkingCoords.length,
                    color: '#94a3b8',
                    routeName: 'Walk',
                    isWalking: true
                });
            }
        } else if (anySegment.pathCoordinates && anySegment.pathCoordinates.length > 1) {
            polylines.push({
                coordsCount: anySegment.pathCoordinates.length,
                color,
                routeName: segment.routeName,
            });
        }
    });
    return polylines;
}

async function main() {
  const formData = new FormData();
  formData.append('startLocation', 'gaisano-mall');
  formData.append('endLocation', 'anahaw-amphitheater');
  
  const state = await findRouteAction({ message: '' }, formData);
  if (state.result) {
    const uniqueRouteNames = Array.from(new Set(state.result.path.map((e: any) => e.routeName)));
    const routes = uniqueRouteNames.map(name => ({
        name: name,
        color: '#6366f1'
    }));
    const polylines = getSegmentPolylines(state.result.path, routes);
    console.log("Simulated frontend polylines:", JSON.stringify(polylines, null, 2));
  } else {
    console.log("No path found.");
  }
  process.exit(0);
}

main().catch(console.error);
