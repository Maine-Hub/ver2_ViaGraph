import * as fs from 'fs';

const digitizedBlocks: any[] = [];

function interpolate(start: [number, number], end: [number, number], steps: number) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        pts.push([
            start[0] + (end[0] - start[0]) * (i / steps),
            start[1] + (end[1] - start[1]) * (i / steps)
        ]);
    }
    return pts;
}

// Route 1: Hinaplanon-San Roque-City Proper (Traditional)
const r1 = "Hinaplanon-San Roque-City Proper and VV";
digitizedBlocks.push({
    route_name: r1,
    source_id: "hinaplanon-crossing",
    target_id: "fil-am-bridge",
    source_name: "Hinaplanon Crossing",
    target_name: "Fil-Am Bridge",
    block_order: 1,
    vehicle_type: "Traditional PUJ",
    distance: 0.5,
    regular_fare: 13,
    discounted_fare: 10.5,
    path_coordinates: JSON.stringify(interpolate([124.261, 8.254], [124.26366, 8.25579], 5)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});
digitizedBlocks.push({
    route_name: r1,
    source_id: "fil-am-bridge",
    target_id: "san-roque",
    source_name: "Fil-Am Bridge",
    target_name: "San Roque",
    block_order: 2,
    vehicle_type: "Traditional PUJ",
    distance: 1.2,
    regular_fare: 13,
    discounted_fare: 10.5,
    path_coordinates: JSON.stringify(interpolate([124.26366, 8.25579], [124.27133, 8.26092], 8)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});
digitizedBlocks.push({
    route_name: r1,
    source_id: "san-roque",
    target_id: "tambo-terminal",
    source_name: "San Roque",
    target_name: "IBJT (Tambo)",
    block_order: 3,
    vehicle_type: "Traditional PUJ",
    distance: 2.5,
    regular_fare: 13,
    discounted_fare: 10.5,
    path_coordinates: JSON.stringify(interpolate([124.27133, 8.26092], [124.260, 8.242], 10)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});

// Route 9: Dalipuga-City Proper (Traditional)
const r9 = "Dalipuga-City Proper and VV";
digitizedBlocks.push({
    route_name: r9,
    source_id: "vista-village",
    target_id: "centennial-park",
    source_name: "Vista Village",
    target_name: "Dalipuga Centennial Park",
    block_order: 1,
    vehicle_type: "Traditional PUJ",
    distance: 2.1,
    regular_fare: 13,
    discounted_fare: 10.5,
    path_coordinates: JSON.stringify(interpolate([124.26994, 8.30654], [124.2482, 8.3198], 10)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});
digitizedBlocks.push({
    route_name: r9,
    source_id: "centennial-park",
    target_id: "kiwalan",
    source_name: "Dalipuga Centennial Park",
    target_name: "Kiwalan",
    block_order: 2,
    vehicle_type: "Traditional PUJ",
    distance: 3.5,
    regular_fare: 13,
    discounted_fare: 10.5,
    path_coordinates: JSON.stringify(interpolate([124.2482, 8.3198], [124.249, 8.285], 15)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});
digitizedBlocks.push({
    route_name: r9,
    source_id: "kiwalan",
    target_id: "msu-iit",
    source_name: "Kiwalan",
    target_name: "MSU-IIT",
    block_order: 3,
    vehicle_type: "Traditional PUJ",
    distance: 5.2,
    regular_fare: 15.25,
    discounted_fare: 12.25,
    path_coordinates: JSON.stringify(interpolate([124.249, 8.285], [124.2445, 8.2396], 20)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});

// Route 15: Tubod-Orellana-C3-City Proper (Modern)
const r15 = "Tubod-Orellana-C3-City Proper and VV";
digitizedBlocks.push({
    route_name: r15,
    source_id: "tubod-10th-east",
    target_id: "orellana-violeta",
    source_name: "Tubod (10th East)",
    target_name: "Orellana (Purok Violeta)",
    block_order: 1,
    vehicle_type: "Modern PUJ",
    distance: 1.8,
    regular_fare: 15,
    discounted_fare: 12,
    path_coordinates: JSON.stringify(interpolate([124.24318, 8.21254], [124.238, 8.223], 10)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});
digitizedBlocks.push({
    route_name: r15,
    source_id: "orellana-violeta",
    target_id: "c3-alcuizar",
    source_name: "Orellana (Purok Violeta)",
    target_name: "C3 Road (Alcuizar)",
    block_order: 2,
    vehicle_type: "Modern PUJ",
    distance: 1.5,
    regular_fare: 15,
    discounted_fare: 12,
    path_coordinates: JSON.stringify(interpolate([124.238, 8.223], [124.230, 8.210], 8)),
    metadata: { source: "manual_digitization", method: "interpolated" }
});

fs.writeFileSync('digitized_pdf_route_blocks_preview.json', JSON.stringify(digitizedBlocks, null, 2));
console.log("Digitized preview generated with " + digitizedBlocks.length + " blocks.");
