import { query } from './src/lib/mysql';

async function insertDalipugaRoute() {
    console.log("Starting insertion of Dalipuga proof-of-concept...");

    // 1. Insert Missing Nodes
    // dalipuga_vista_village: [124.2700, 8.3065]
    // kiwalan_port: [124.2650, 8.2750]
    const newNodes = [
        { id: 'dalipuga_vista_village', name: 'Dalipuga Vista Village', lat: 8.3065, lng: 124.2700 },
        { id: 'kiwalan_port', name: 'Kiwalan Port Area', lat: 8.2750, lng: 124.2650 }
    ];

    for (const node of newNodes) {
        await query(
            'INSERT IGNORE INTO nodes (id, name, latitude, longitude) VALUES (?, ?, ?, ?)',
            [node.id, node.name, node.lat, node.lng]
        );
        console.log(`Inserted/Verified node: ${node.name}`);
    }

    // 2. Insert Digitized Route Blocks
    // Map preview IDs to existing DB IDs
    const blocks = [
        {
            route_name: "Dalipuga-City Proper and VV",
            source_id: "dalipuga_vista_village",
            target_id: "centennial-park",
            distance: 1.5,
            regular_fare: 13.00,
            path_coordinates: "[[124.2700, 8.3065], [124.2694, 8.3062], [124.2682, 8.3051], [124.2669, 8.3034], [124.2659, 8.3019], [124.2648, 8.3006]]"
        },
        {
            route_name: "Dalipuga-City Proper and VV",
            source_id: "centennial-park",
            target_id: "kiwalan_port",
            distance: 4.0,
            regular_fare: 15.00,
            path_coordinates: "[[124.2648, 8.3006], [124.2643, 8.2988], [124.2644, 8.2975], [124.2650, 8.2959], [124.2659, 8.2942], [124.2663, 8.2925], [124.2659, 8.2903], [124.2652, 8.2882], [124.2648, 8.2864], [124.2647, 8.2843], [124.2650, 8.2822], [124.2656, 8.2802], [124.2660, 8.2784], [124.2660, 8.2765], [124.2655, 8.2755], [124.2650, 8.2750]]"
        },
        {
            route_name: "Dalipuga-City Proper and VV",
            source_id: "kiwalan_port",
            target_id: "msu-iit",
            distance: 5.0,
            regular_fare: 17.00,
            path_coordinates: "[[124.2650, 8.2750], [124.2639, 8.2736], [124.2626, 8.2719], [124.2613, 8.2702], [124.2606, 8.2684], [124.2600, 8.2663], [124.2596, 8.2642], [124.2589, 8.2622], [124.2576, 8.2602], [124.2560, 8.2582], [124.2542, 8.2562], [124.2524, 8.2539], [124.2506, 8.2516], [124.2489, 8.2492], [124.2469, 8.2466], [124.2455, 8.2440], [124.2443, 8.2415]]"
        },
        {
            route_name: "Dalipuga-City Proper and VV",
            source_id: "msu-iit",
            target_id: "public-plaza",
            distance: 3.4,
            regular_fare: 15.00,
            path_coordinates: "[[124.2443, 8.2415], [124.2436, 8.2409], [124.2426, 8.2402], [124.2416, 8.2395], [124.2406, 8.2388], [124.2399, 8.2379], [124.2394, 8.2366], [124.2389, 8.2352], [124.2389, 8.2336], [124.2390, 8.2315], [124.2393, 8.2285]]"
        }
    ];

    for (const block of blocks) {
        const blockId = `${block.source_id}-${block.target_id}-${block.route_name.toLowerCase().replace(/\s+/g, '-')}`.slice(0, 255);
        await query(
            `INSERT INTO route_blocks (id, source_id, target_id, route_name, distance, regular_fare, path_coordinates) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             distance = VALUES(distance), 
             regular_fare = VALUES(regular_fare), 
             path_coordinates = VALUES(path_coordinates)`,
            [blockId, block.source_id, block.target_id, block.route_name, block.distance, block.regular_fare, block.path_coordinates]
        );
        console.log(`Inserted/Updated route block: ${block.source_id} -> ${block.target_id}`);
    }

    console.log("Insertion complete. Dalipuga route is now live in experiment DB.");
}

insertDalipugaRoute().catch(console.error);
