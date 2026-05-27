import * as fs from 'fs';
import { query } from './src/lib/mysql';

async function generateReport() {
    console.log("Fetching live route_blocks from DB...");
    const existingBlocks: any[] = await query('SELECT route_name, source_id, target_id, distance, path_coordinates FROM route_blocks');
    console.log(`Found ${existingBlocks.length} live route blocks.`);

const officialSamples = [
    { name: "Hinaplanon-San Roque-City Proper and VV", length: 12.7, stops: ["Hinaplanon", "San Roque", "IBJT", "City Proper"] },
    { name: "Tambo-Gerona-Barinaut-City Proper and VV", length: 13.9, stops: ["Tambo", "IBJT", "Gerona", "Barinaut", "City Proper"] },
    { name: "Dalipuga-City Proper and VV", length: 30.0, stops: ["Dalipuga", "Kiwalan", "Tibanga", "City Proper"] },
    { name: "Tubod-Orellana-C3-City Proper and VV", length: 8.8, stops: ["Tubod", "Orellana", "C3", "City Proper"] },
    { name: "Suarez-IBJT-City Proper-ICNHS-VV", length: 17.9, stops: ["Suarez", "IBJT", "City Proper", "ICNHS"] },
    { name: "Pugaan-City Proper and VV", length: 12.9, stops: ["Pugaan", "C3", "Palao", "City Proper"] }
];

    const liveRouteNames = Array.from(new Set(existingBlocks.map(b => b.route_name)));
    const report: any[] = [];

    officialSamples.forEach(official => {
        // Fuzzy match existing blocks by name
        const matches = existingBlocks.filter(b => {
            const nameMatch = b.route_name.toLowerCase().includes(official.name.split('-')[0].toLowerCase()) ||
                             official.name.toLowerCase().includes(b.route_name.toLowerCase());
            return nameMatch;
        });

        const totalExistingDist = matches.reduce((sum, b) => sum + b.distance, 0);
        const hasGeoJSON = matches.length > 0 && matches.every(b => b.path_coordinates && b.path_coordinates.length > 10);
        
        // Check stop alignment (simple check)
        const matchedStops = official.stops.filter(stop => 
            matches.some(b => b.source_id.toLowerCase().includes(stop.toLowerCase()) || 
                             b.target_id.toLowerCase().includes(stop.toLowerCase()))
        );

        report.push({
            official_name: official.name,
            official_length_km: official.length,
            existing_matches_count: matches.length,
            existing_total_distance_km: parseFloat(totalExistingDist.toFixed(2)),
            distance_variance_km: parseFloat((totalExistingDist - official.length).toFixed(2)),
            has_geojson: hasGeoJSON,
            matched_stops: matchedStops,
            missing_stops: official.stops.filter(s => !matchedStops.includes(s)),
            validation_status: (matches.length > 0 && Math.abs(totalExistingDist - official.length) < 5) ? "Validated" : "Discrepancy",
            needs_geojson: !hasGeoJSON,
            needs_nodes: official.stops.filter(s => !matchedStops.includes(s)).length > 0,
            manual_digitization_needed: !hasGeoJSON || matchedStops.length < official.stops.length
        });
    });

    const finalReport = {
        summary: {
            total_live_blocks_checked: existingBlocks.length,
            live_route_names_found: liveRouteNames,
            total_official_samples: officialSamples.length,
            matched_official_routes: report.filter(r => r.existing_matches_count > 0).map(r => r.official_name),
            unmatched_official_routes: report.filter(r => r.existing_matches_count === 0).map(r => r.official_name)
        },
        details: report
    };

    fs.writeFileSync('official_route_validation_report.json', JSON.stringify(finalReport, null, 2));
    console.log("Validation report generated successfully.");
}

generateReport().catch(console.error);
