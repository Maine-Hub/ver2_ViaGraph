import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, 'src/app/(app)/admin/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add states to EditRouteButton
content = content.replace(
  /const \[routeInputMode, setRouteInputMode\] = useState\<'manual' \| 'json'\>\('manual'\);\s*const \[jsonImportError, setJsonImportError\] = useState\(''\);/,
  `const [routeInputMode, setRouteInputMode] = useState<'manual' | 'json'>('manual');
  const [jsonImportError, setJsonImportError] = useState('');
  const [regularFare, setRegularFare] = useState(String(edge.regular_fare ?? ''));
  const [discountedFare, setDiscountedFare] = useState(String(edge.discounted_fare ?? ''));
  const [isActive, setIsActive] = useState(edge.is_active !== 0 && edge.is_active !== false);`
);

// 2. Remove transfer states from EditRouteButton dialog onOpenChange
content = content.replace(
  /setJsonImportError\(''\);\s*setHasTransfer\(false\);\s*setRouteExtraLegs\(\[\]\);/g,
  `setJsonImportError('');
        setRegularFare(String(edge.regular_fare ?? ''));
        setDiscountedFare(String(edge.discounted_fare ?? ''));
        setIsActive(edge.is_active !== 0 && edge.is_active !== false);`
);

// 3. EditRouteButton handleSave
const editHandleSaveRegex = /const handleSave = async \(\) => \{\s*try \{\s*if \(hasTransfer\) \{[\s\S]*?\} else \{\s*const res = await fetch\('\/api\/mysql\/edges', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{\s*source: edge\.source,\s*target: edge\.target,\s*distance: parseFloat\(distance\),\s*routeName: edge\.routeName,\s*vehicleType: vehicleType,\s*stopAndTransfer: stop,\s*note: note,\s*pathCoordinates: pathCoordinates,\s*\}\),\s*\}\);\s*const data = await res\.json\(\);\s*if \(!data\.success\) throw new Error\(data\.message\);\s*toast\(\{ title: 'Updated', description: 'Route updated\.' \};\s*\}\s*setOpen\(false\);\s*onEdited\(\);\s*\} catch \(err: any\) \{\s*toast\(\{ variant: 'destructive', title: 'Error', description: err\.message \}\);\s*\}\s*\};/g;

content = content.replace(editHandleSaveRegex, `const handleSave = async () => {
    try {
      const res = await fetch('/api/mysql/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: edge.source,
          target: edge.target,
          distance: parseFloat(distance),
          routeName: edge.routeName,
          vehicleType: vehicleType,
          stopAndTransfer: stop,
          note: note,
          pathCoordinates: pathCoordinates,
          regularFare,
          discountedFare,
          isActive,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Updated', description: 'Route updated.' });
      setOpen(false);
      onEdited();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };`);

// 4. EditRouteButton transfer toggle UI
const editTransferToggleRegex = /\{\/\* Transfer toggle \*\/\}\s*<div className="flex items-center gap-3 pt-1">[\s\S]*?\{\/\* Dynamic extra legs \*\/\}\s*\{hasTransfer && routeExtraLegs\.map\(\(leg, idx\) => \([\s\S]*?\}\)\)}/g;

content = content.replace(editTransferToggleRegex, `<div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-slate-700">Regular Fare</Label>
                    <Input name="regularFare" type="number" step="0.01" className="bg-white border-slate-200" placeholder="Auto-calculated if blank" value={regularFare} onChange={e => setRegularFare(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-slate-700">Discounted Fare</Label>
                    <Input name="discountedFare" type="number" step="0.01" className="bg-white border-slate-200" placeholder="Auto-calculated if blank" value={discountedFare} onChange={e => setDiscountedFare(e.target.value)} />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" name="isActive" id="editIsActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                  <Label htmlFor="editIsActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Active Segment
                  </Label>
                </div>`);

// 5. AdminPage States
content = content.replace(
  /const \[routeExtraLegs, setRouteExtraLegs\] = useState<any\[\]>\(\[\]\);/,
  `const [routeExtraLegs, setRouteExtraLegs] = useState<any[]>([]);
  const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [isActive, setIsActive] = useState(true);`
);

// 6. AdminPage Add Dialog onOpenChange
content = content.replace(
  /setHasTransfer\(false\);\s*setRouteExtraLegs\(\[\]\);\s*setRouteInputMode\('manual'\);\s*setJsonImportError\(''\);/,
  `setHasTransfer(false);
                    setRouteExtraLegs([]);
                    setRouteInputMode('manual');
                    setJsonImportError('');
                    setRegularFare('');
                    setDiscountedFare('');
                    setIsActive(true);`
);

// 7. AdminPage handleAddRoute
const addHandleSaveRegex = /const handleAddRoute = async \(formData: FormData\) => \{\s*const source = formData\.get\('source'\) as string;[\s\S]*?\} else \{\s*\/\/ Save as a direct edge\s*try \{\s*const res = await fetch\('\/api\/mysql\/edges', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{\s*source,\s*target,\s*distance,\s*routeName,\s*vehicleType,\s*stopAndTransfer,\s*note,\s*pathCoordinates: drawnPath,\s*\}\),\s*\}\);\s*const data = await res\.json\(\);\s*if \(!data\.success\) throw new Error\(data\.message\);\s*toast\(\{ title: 'Success', description: 'Route added successfully\.' \}\);\s*setDrawnPath\(\[\]\);\s*setVehicleType\('jeepney'\);\s*setSelectedSource\(''\); setSelectedTarget\(''\); setRouteDistance\(''\);\s*loadData\(\);\s*\} catch \(error: any\) \{\s*toast\(\{ variant: 'destructive', title: 'Error', description: error\?\.message \|\| 'Failed to add route\.' \}\);\s*\}\s*\}\s*\};/g;

content = content.replace(addHandleSaveRegex, `const handleAddRoute = async (formData: FormData) => {
    const source = formData.get('source') as string;
    const target = formData.get('target') as string;
    const distance = parseFloat(formData.get('distance') as string);
    const routeName = formData.get('routeName') as string;
    const stopAndTransfer = formData.get('stopAndTransfer') as string;
    const note = formData.get('note') as string;
    if (!source || !target || !routeName || isNaN(distance)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }

    try {
      const res = await fetch('/api/mysql/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          target,
          distance,
          routeName,
          vehicleType,
          stopAndTransfer,
          note,
          pathCoordinates: drawnPath,
          regularFare,
          discountedFare,
          isActive,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Success', description: 'Route added successfully.' });
      setDrawnPath([]);
      setVehicleType('jeepney');
      setSelectedSource(''); setSelectedTarget(''); setRouteDistance('');
      setRegularFare(''); setDiscountedFare(''); setIsActive(true);
      loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add route.' });
    }
  };`);

// 8. AdminPage RouteMap extraPaths
content = content.replace(
  /extraPaths=\{routeExtraLegs[\s\S]*?\}\s*\/>/g,
  `extraPaths={[]}
                        />`
);

// 9. AdminPage Map legend
content = content.replace(
  /\{\/\* Legend for transfer leg paths \*\/\}\s*\{hasTransfer && routeExtraLegs\.some[\s\S]*?\}\)\s*\}/g,
  ``
);

// 10. AdminPage Form transfer toggle
content = content.replace(
  /\{\/\* Transfer toggle \*\/\}\s*<div className="flex items-center gap-3 pt-1">[\s\S]*?\{\/\* Dynamic extra legs \*\/\}\s*\{hasTransfer && routeExtraLegs\.map\(\(leg, idx\) => \([\s\S]*?\}\)\)}/g,
  `<div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Regular Fare</Label>
                                <Input name="regularFare" type="number" step="0.01" className="bg-white border-slate-200" placeholder="Auto-calculated if blank" value={regularFare} onChange={e => setRegularFare(e.target.value)} />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-slate-700">Discounted Fare</Label>
                                <Input name="discountedFare" type="number" step="0.01" className="bg-white border-slate-200" placeholder="Auto-calculated if blank" value={discountedFare} onChange={e => setDiscountedFare(e.target.value)} />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 pt-2">
                              <input type="checkbox" name="isActive" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                              <Label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                Active Segment
                              </Label>
                            </div>`
);

// 11. AdminPage hide transfer-routes tab
content = content.replace(
  /<TabsTrigger value="fare-rules">Fare Rules<\/TabsTrigger>\s*<TabsTrigger value="transfer-routes">Transfer Routes<\/TabsTrigger>/,
  `<TabsTrigger value="fare-rules">Fare Rules</TabsTrigger>`
);

// 12. Fix the Routes Table Header
content = content.replace(
  /<TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick=\{\(\) => toggleSort\(setEdgesSort, edgesSort, 'routeName'\)\}>\s*<div className="flex items-center">Line <SortIcon sort=\{edgesSort\} column="routeName" \/><\/div>\s*<\/TableHead>\s*<TableHead>Stop & Transfer<\/TableHead>\s*<TableHead>Suggestion<\/TableHead>\s*<TableHead className="text-right">Actions<\/TableHead>/,
  `<TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'routeName')}>
    <div className="flex items-center">Line <SortIcon sort={edgesSort} column="routeName" /></div>
  </TableHead>
  <TableHead>Stop & Transfer</TableHead>
  <TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort(setEdgesSort, edgesSort, 'regularFare')}>
    <div className="flex items-center">Fare <SortIcon sort={edgesSort} column="regularFare" /></div>
  </TableHead>
  <TableHead>Status</TableHead>
  <TableHead className="text-right">Actions</TableHead>`
);

// 13. Fix the Routes Table Cells
content = content.replace(
  /<TableCell>\{edge\.stopAndTransfer\}<\/TableCell>\s*<TableCell>\{edge\.note\}<\/TableCell>/g,
  `<TableCell>{edge.stopAndTransfer}</TableCell>
   <TableCell>₱{edge.regularFare ?? '-'}</TableCell>
   <TableCell>
     <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${edge.is_active !== 0 && edge.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
       {edge.is_active !== 0 && edge.is_active !== false ? 'Active' : 'Inactive'}
     </span>
   </TableCell>`
);

fs.writeFileSync(file, content);
console.log('Fixed page.tsx');
