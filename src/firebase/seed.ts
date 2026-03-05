import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { graph } from '@/lib/data';

/**
 * Seeds the transport graph data from data.ts to Firestore.
 * This should be run once or as needed to initialize the database.
 */
export async function seedGraphData(db: any) {
    const batch = writeBatch(db);

    // Seed Nodes
    for (const node of graph.nodes) {
        const nodeRef = doc(db, 'nodes', node.id);
        batch.set(nodeRef, node);
    }

    // Seed Routes (Metadata)
    for (const route of graph.routes) {
        const routeRef = doc(db, 'routes', route.name);
        batch.set(routeRef, route);
    }

    // Seed Edges
    // Note: Firestore auto-generates IDs if we don't provide them, 
    // but for edges, we can create a unique key or just let it auto-id.
    for (const edge of graph.edges) {
        const edgeId = `${edge.source}_${edge.target}_${edge.routeName}`;
        const edgeRef = doc(db, 'edges', edgeId);
        batch.set(edgeRef, edge);
    }

    await batch.commit();
    console.log('Graph data seeded successfully!');
}
