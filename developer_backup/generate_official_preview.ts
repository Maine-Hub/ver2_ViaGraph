import * as fs from 'fs';

interface Node {
    id: string;
    name: string;
}

const nodes: Node[] = JSON.parse(fs.readFileSync('nodes_cache.json', 'utf8'));

// Sample routes extracted from PDF
const officialRoutes = [
    { number: 1, name: "Hinaplanon-San Roque-City Proper and VV", length: 12.7, mode: "Traditional PUJ", stops: ["Hinaplanon", "San Roque", "IBJT", "City Proper"] },
    { number: 2, name: "Tambo-Gerona-Barinaut-City Proper and VV", length: 13.9, mode: "Traditional PUJ", stops: ["Tambo", "IBJT", "Gerona", "Barinaut", "City Proper"] },
    { number: 9, name: "Dalipuga-City Proper and VV", length: 30.0, mode: "Traditional PUJ", stops: ["Dalipuga", "Kiwalan", "Tibanga", "City Proper"] },
    { number: 15, name: "Tubod-Orellana-C3-City Proper and VV", length: 8.8, mode: "Modern PUJ", stops: ["Tubod", "Orellana", "C3", "City Proper"] },
    { number: 23, name: "Suarez-IBJT-City Proper-ICNHS-VV", length: 17.9, mode: "Modern PUJ", stops: ["Suarez", "IBJT", "City Proper", "ICNHS"] },
    { number: 32, name: "Pugaan-City Proper and VV", length: 12.9, mode: "Traditional PUJ", stops: ["Pugaan", "C3", "Palao", "City Proper"] }
];

const aliasMap: Record<string, string> = {
    "Hinaplanon": "Hinaplanon", // New node needed
    "San Roque": "San Roque", // New node needed
    "IBJT": "tambo-terminal",
    "Tambo": "tambo-terminal",
    "City Proper": "public-plaza",
    "Dalipuga": "centennial-park",
    "Tibanga": "msu-iit",
    "Tubod": "Tubod", // New node needed
    "Suarez": "Suarez", // New node needed
    "ICNHS": "icnhs",
    "Pugaan": "Pugaan", // New node needed
    "Palao": "Palao" // New node needed
};

function computeFare(distance: number, mode: string) {
    let base = mode.includes("Modern") ? 15 : 13;
    let rate = mode.includes("Modern") ? 2.20 : 1.80;
    
    let regular = base;
    if (distance > 4) {
        regular += (distance - 4) * rate;
    }
    
    // Round to nearest 0.25 (standard PUV fare rounding)
    regular = Math.ceil(regular * 4) / 4;
    let discounted = Math.ceil((regular * 0.8) * 4) / 4;
    
    return { regular, discounted };
}

const preview: any[] = [];

officialRoutes.forEach(route => {
    // For simplicity in dry-run, we create blocks between adjacent stops
    // We assume equal distance for now just to show the structure
    const segmentDist = route.length / (route.stops.length - 1);
    
    for (let i = 0; i < route.stops.length - 1; i++) {
        const sourceName = route.stops[i];
        const targetName = route.stops[i+1];
        
        const sourceId = aliasMap[sourceName] || sourceName.toLowerCase().replace(/ /g, '-');
        const targetId = aliasMap[targetName] || targetName.toLowerCase().replace(/ /g, '-');
        
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        const fares = computeFare(segmentDist, route.mode);
        
        preview.push({
            route_name: route.name,
            source_id: sourceId,
            target_id: targetId,
            source_name: sourceName,
            target_name: targetName,
            block_order: i + 1,
            vehicle_type: route.mode,
            distance: parseFloat(segmentDist.toFixed(2)),
            computed_regular_fare: fares.regular,
            computed_discounted_fare: fares.discounted,
            path_coordinates_available: false,
            status: (!sourceNode || !targetNode) ? "missing_node" : "ready_for_insert",
            notes: (!sourceNode || !targetNode) ? `One or both nodes (${sourceId}, ${targetId}) not found in DB` : "OK"
        });
    }
});

fs.writeFileSync('official_routes_preview.json', JSON.stringify(preview, null, 2));
console.log(`Generated preview with ${preview.length} route blocks.`);
