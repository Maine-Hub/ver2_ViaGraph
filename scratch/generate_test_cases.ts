import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  viagraph: {
    distance: number;
    fare: number;
    rides: number;
  };
  dijkstra: {
    distance: number;
    fare: number;
    rides: number;
  };
  metrics: {
    fare_saved: number;
    transfers_saved: number;
    extra_dist_walked: number;
  };
}

function generate() {
  const jsonPath = path.join(__dirname, '../scratch/exhaustive_comparison_results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Exhaustive comparison results not found! Run exhaustive_evaluation.ts first.');
    return;
  }

  const results: TestResult[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Separate into "differing paths" and "identical paths"
  const differing = results.filter(r => r.metrics.fare_saved !== 0 || r.metrics.transfers_saved !== 0);
  const identical = results.filter(r => r.metrics.fare_saved === 0 && r.metrics.transfers_saved === 0);

  // We want to combine all differing ones first (they are the most interesting to test)
  // then fill the rest of the 50 cases with identical ones
  const selected: TestResult[] = [];
  selected.push(...differing);

  // Fill up to 50 with identical paths
  const remaining = 50 - selected.length;
  for (let i = 0; i < Math.min(remaining, identical.length); i++) {
    selected.push(identical[i]);
  }

  // Sort them by starting location name to make it easy for user to go through in the UI
  selected.sort((a, b) => a.from_name.localeCompare(b.from_name));

  let mdContent = `# ViaGraph - 50 Beta Testing Scenarios

Use this list of 50 pre-validated scenarios to run your manual tests on the ViaGraph interface. These test cases ensure that the route finder, fare calculations, and map visualizations are working properly without errors.

### Legend for Highlight Column:
* **🔥 ViaGraph Optimized**: ViaGraph avoids unnecessary transfers, saving money and vehicle changes.
* **✅ Baseline Validated**: Dijkstra and ViaGraph return the same logical route.

---

## Scenario Verification Table

| # | Start Location | Destination | ViaGraph (Rides / Fare) | Dijkstra (Rides / Fare) | Comparison Highlight |
| :--- | :--- | :--- | :---: | :---: | :--- |
`;

  selected.forEach((r, idx) => {
    let highlight = '✅ Baseline Validated';
    if (r.metrics.fare_saved > 0 || r.metrics.transfers_saved > 0) {
      const savings: string[] = [];
      if (r.metrics.transfers_saved > 0) savings.push(`${r.metrics.transfers_saved} transfer(s)`);
      if (r.metrics.fare_saved > 0) savings.push(`₱${r.metrics.fare_saved.toFixed(2)}`);
      highlight = `🔥 ViaGraph Saves ${savings.join(' and ')}`;
    }

    mdContent += `| ${idx + 1} | **${r.from_name}** | **${r.to_name}** | ${r.viagraph.rides} ride(s) / ₱${r.viagraph.fare.toFixed(2)} | ${r.dijkstra.rides} ride(s) / ₱${r.dijkstra.fare.toFixed(2)} | ${highlight} |\n`;
  });

  mdContent += `
---

## How to use this for testing:
1. Open the ViaGraph **Route Finder** page.
2. Select the **Start Location** and **Destination** matching the table row.
3. Click **Find Route**.
4. Verify that:
   - The route details show the expected number of rides/segments and regular fares.
   - The interactive map renders the colored paths correctly.
   - Switching between **Recommended Route** and **Standard Dijkstra's Path** tabs updates the routes and highlights the differences described in the table.
`;

  const outputDir = path.join(__dirname, '../scratch');
  fs.writeFileSync(path.join(outputDir, '50_testing_scenarios.md'), mdContent);
  console.log('Successfully generated 50 test cases in scratch/50_testing_scenarios.md!');
}

generate();
