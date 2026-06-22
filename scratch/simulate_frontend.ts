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
  formData.append('startLocation', 'tambo-terminal');
  formData.append('endLocation', 'st--michael-s-cathedral');
  
  const state = await findRouteAction({ message: '' }, formData);
  if (state.result && state.result.rawDijkstraPath) {
    const rawPath = state.result.rawDijkstraPath.path;
    console.log("Raw Dijkstra Path segments count:", rawPath.length);
    
    // Simulate segmentPolylines computation from RouteMapView
    const polylines: any[] = [];
    rawPath.forEach((segment: any, index: number) => {
      const anySegment = segment as any;
      
      console.log(`\nSegment ${index + 1}: ${segment.from} -> ${segment.to} via "${segment.routeName}"`);
      console.log("  pathCoordinates format:", anySegment.pathCoordinates ? (anySegment.pathCoordinates.ridingCoords ? 'New format' : 'Legacy/Array') : 'None');
      
      if (anySegment.pathCoordinates && anySegment.pathCoordinates.ridingCoords) {
          if (anySegment.pathCoordinates.ridingCoords.length > 1) {
              polylines.push({
                  routeName: segment.routeName,
                  isWalking: false,
                  coordsCount: anySegment.pathCoordinates.ridingCoords.length,
              });
          }
          const hasWalking = anySegment.pathCoordinates.walkingDist > 0;
          if (hasWalking && anySegment.pathCoordinates.walkingCoords?.length > 1) {
              polylines.push({
                  routeName: 'Walk',
                  isWalking: true,
                  coordsCount: anySegment.pathCoordinates.walkingCoords.length,
              });
          }
      } else if (anySegment.pathCoordinates && anySegment.pathCoordinates.length > 1) {
          polylines.push({
              routeName: segment.routeName,
              isWalking: false,
              coordsCount: anySegment.pathCoordinates.length,
          });
      } else {
          polylines.push({
              routeName: segment.routeName,
              isWalking: false,
              coordsCount: 2,
          });
      }
    });

    console.log("\nComputed segmentPolylines for map:");
    console.log(JSON.stringify(polylines, null, 2));
  } else {
    console.log("No path found.");
  }
  process.exit(0);
}

main().catch(console.error);
