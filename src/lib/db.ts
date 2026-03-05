import { collection, getDocs } from 'firebase/firestore';
import type { Graph, Location, RouteSegment, JeepneyRoute } from './types';

export async function fetchGraphData(db: any): Promise<Graph> {
    try {
        const nodesCol = collection(db, 'nodes');
        const routesCol = collection(db, 'routes');
        const edgesCol = collection(db, 'edges');

        const [nodesSnap, routesSnap, edgesSnap] = await Promise.all([
            getDocs(nodesCol),
            getDocs(routesCol),
            getDocs(edgesCol),
        ]);

        const nodes = nodesSnap.docs.map(doc => doc.data() as Location);
        const routes = routesSnap.docs.map(doc => doc.data() as JeepneyRoute);
        const edges = edgesSnap.docs.map(doc => doc.data() as RouteSegment);

        return { nodes, routes, edges };
    } catch (error) {
        console.error('Error fetching graph data from Firestore:', error);
        // Return empty graph or fallback
        return { nodes: [], routes: [], edges: [] };
    }
}
