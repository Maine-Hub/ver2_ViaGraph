# ViaGraph - 50 Beta Testing Scenarios

Use this list of 50 pre-validated scenarios to run your manual tests on the ViaGraph interface. These test cases ensure that the route finder, fare calculations, and map visualizations are working properly without errors.

### Legend for Highlight Column:
* **🔥 ViaGraph Optimized**: ViaGraph avoids unnecessary transfers, saving money and vehicle changes.
* **✅ Baseline Validated**: Dijkstra and ViaGraph return the same logical route.

---

## Scenario Verification Table

| # | Start Location | Destination | ViaGraph (Rides / Fare) | Dijkstra (Rides / Fare) | Comparison Highlight |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | **Children's Park** | **St. Michael's Cathedral** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 2 | **Crown Paper Aguinaldo** | **Anahaw Amphitheater** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 3 | **Crown Paper Aguinaldo** | **Iligan City Hall** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 4 | **Gaisano Mall** | **Anahaw Amphitheater** | 2 ride(s) / ₱26.00 | 2 ride(s) / ₱26.00 | ✅ Baseline Validated |
| 5 | **Gaisano Mall** | **Children's Park** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 6 | **Gaisano Mall** | **Robinsons Mall** | 1 ride(s) / ₱15.00 | 1 ride(s) / ₱15.00 | ✅ Baseline Validated |
| 7 | **Gaisano Mall** | **St. Michael's Cathedral** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 8 | **Gaisano Mall** | **St. Michael's College** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 9 | **Gaisano Mall** | **Unicity** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 10 | **Gaisano Mall** | **Zoey's Cafe** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 11 | **Highway 30 Gym** | **Paseo de Santiago** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 12 | **MSU IIT** | **Anahaw Amphitheater** | 2 ride(s) / ₱26.00 | 2 ride(s) / ₱26.00 | ✅ Baseline Validated |
| 13 | **MSU IIT** | **Centennial Park** | 1 ride(s) / ₱27.00 | 1 ride(s) / ₱27.00 | ✅ Baseline Validated |
| 14 | **MSU IIT** | **Children's Park** | 2 ride(s) / ₱26.00 | 2 ride(s) / ₱26.00 | ✅ Baseline Validated |
| 15 | **MSU IIT** | **Crown Paper Aguinaldo** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 16 | **MSU IIT** | **Gaisano Mall** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 17 | **MSU IIT** | **Gaisano Suki Club** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 18 | **MSU IIT** | **Highway 30 Gym** | 2 ride(s) / ₱26.00 | 2 ride(s) / ₱26.00 | ✅ Baseline Validated |
| 19 | **MSU IIT** | **167 HyperMart** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 20 | **MSU IIT** | **Iligan City Hospital** | 2 ride(s) / ₱28.00 | 2 ride(s) / ₱28.00 | ✅ Baseline Validated |
| 21 | **MSU IIT** | **Iligan City Hall** | 2 ride(s) / ₱26.00 | 2 ride(s) / ₱26.00 | ✅ Baseline Validated |
| 22 | **MSU IIT** | **Iligan Medical Center College** | 2 ride(s) / ₱28.00 | 2 ride(s) / ₱28.00 | ✅ Baseline Validated |
| 23 | **MSU IIT** | **Iligan Medical Center Hospital** | 2 ride(s) / ₱28.00 | 2 ride(s) / ₱28.00 | ✅ Baseline Validated |
| 24 | **MSU IIT** | **Port of Iligan** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 25 | **MSU IIT** | **Landbank Iligan Main** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 26 | **MSU IIT** | **Iligan Night Market** | 1 ride(s) / ₱13.00 | 1 ride(s) / ₱13.00 | ✅ Baseline Validated |
| 27 | **Tambo Public Market** | **Anahaw Amphitheater** | 2 ride(s) / ₱28.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱11.00 |
| 28 | **Tambo Public Market** | **Crown Paper Aguinaldo** | 1 ride(s) / ₱15.00 | 2 ride(s) / ₱26.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱11.00 |
| 29 | **Tambo Public Market** | **Iligan City Hospital** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 30 | **Tambo Public Market** | **Iligan City Hall** | 2 ride(s) / ₱28.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱11.00 |
| 31 | **Tambo Public Market** | **Iligan Medical Center College** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 32 | **Tambo Public Market** | **Iligan Medical Center Hospital** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 33 | **Tambo Public Market** | **PSA** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 34 | **Tambo Public Market** | **Robinsons Mall** | 2 ride(s) / ₱28.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱13.00 |
| 35 | **Tambo Public Market** | **St. Michael's Cathedral** | 2 ride(s) / ₱30.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 36 | **Tambo Public Market** | **St. Michael's College** | 2 ride(s) / ₱30.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 37 | **Tambo Public Market** | **Jollibee Aguinaldo** | 1 ride(s) / ₱19.00 | 2 ride(s) / ₱28.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 38 | **Tambo Public Market** | **Zoey's Cafe** | 1 ride(s) / ₱15.00 | 2 ride(s) / ₱26.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱11.00 |
| 39 | **Tambo Terminal** | **Anahaw Amphitheater** | 2 ride(s) / ₱29.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱10.00 |
| 40 | **Tambo Terminal** | **Crown Paper Aguinaldo** | 1 ride(s) / ₱16.00 | 2 ride(s) / ₱26.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱10.00 |
| 41 | **Tambo Terminal** | **Iligan City Hospital** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 42 | **Tambo Terminal** | **Iligan City Hall** | 2 ride(s) / ₱29.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱10.00 |
| 43 | **Tambo Terminal** | **Iligan Medical Center College** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 44 | **Tambo Terminal** | **Iligan Medical Center Hospital** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 45 | **Tambo Terminal** | **PSA** | 2 ride(s) / ₱32.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 46 | **Tambo Terminal** | **Robinsons Mall** | 2 ride(s) / ₱28.00 | 3 ride(s) / ₱41.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱13.00 |
| 47 | **Tambo Terminal** | **St. Michael's Cathedral** | 1 ride(s) / ₱13.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 2 transfer(s) and ₱26.00 |
| 48 | **Tambo Terminal** | **St. Michael's College** | 1 ride(s) / ₱13.00 | 3 ride(s) / ₱39.00 | 🔥 ViaGraph Saves 2 transfer(s) and ₱26.00 |
| 49 | **Tambo Terminal** | **Jollibee Aguinaldo** | 1 ride(s) / ₱19.00 | 2 ride(s) / ₱28.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱9.00 |
| 50 | **Tambo Terminal** | **Zoey's Cafe** | 1 ride(s) / ₱15.00 | 2 ride(s) / ₱26.00 | 🔥 ViaGraph Saves 1 transfer(s) and ₱11.00 |

---

## How to use this for testing:
1. Open the ViaGraph **Route Finder** page.
2. Select the **Start Location** and **Destination** matching the table row.
3. Click **Find Route**.
4. Verify that:
   - The route details show the expected number of rides/segments and regular fares.
   - The interactive map renders the colored paths correctly.
   - Switching between **Recommended Route** and **Standard Dijkstra's Path** tabs updates the routes and highlights the differences described in the table.
