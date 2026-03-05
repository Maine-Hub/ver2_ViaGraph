import type { Graph } from '@/lib/types';

// The graph data is now dynamically fetched from Firestore.
// This file can be used for initial local fallbacks if needed, 
// but is largely replaced by dynamic fetching in src/lib/db.ts.
export const graph: Graph = {
  nodes: [],
  routes: [],
  edges: [],
};
