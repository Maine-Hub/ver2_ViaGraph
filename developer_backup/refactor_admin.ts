import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, 'src/app/(app)/admin/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. EditRouteButton State
content = content.replace(
  /const \[hasTransfer, setHasTransfer\] = useState\(false\);\s*const \[routeExtraLegs, setRouteExtraLegs\] = useState<\{[^}]+\}\[\]>\(\[\]\);/,
  `const [regularFare, setRegularFare] = useState(String(edge.regular_fare ?? ''));
  const [discountedFare, setDiscountedFare] = useState(String(edge.discounted_fare ?? ''));
  const [isActive, setIsActive] = useState(edge.is_active !== 0 && edge.is_active !== false);`
);

// 2. EditRouteButton handleSave
const oldHandleSave = `const handleSave = async () => {
    try {
      if (hasTransfer) {
        // Convert edge to transfer: delete edge first then create transfer
        await fetch(\`/api/mysql/edges/\${encodeURIComponent(edge.id)}\`, { method: 'DELETE' });

        const res = await fetch('/api/mysql/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromNodeId: edge.source,
            toNodeId: edge.target,
            name: \`\${nodes.find(n => n.id === edge.source)?.name ?? edge.source} → \${nodes.find(n => n.id === edge.target)?.name ?? edge.target}\`,
            legs: [
              { routeName: edge.routeName, vehicleType: vehicleType, distance: parseFloat(distance), stopAndTransfer: stop || '', note: note || '', pathCoordinates: pathCoordinates },
              ...routeExtraLegs.map(leg => ({
                routeName: leg.routeName,
                vehicleType: leg.vehicleType,
                distance: parseFloat(leg.distance),
                stopAndTransfer: leg.stopAndTransfer || '',
                note: leg.note || '',
                pathCoordinates: []
              }))
            ],
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: 'Converted', description: 'Route segment converted to transfer route.' });
      } else {
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
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: 'Updated', description: 'Route updated.' });
      }
      setOpen(false);
      onEdited();
    } catch (err: any) {`;

const newHandleSave = `const handleSave = async () => {
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
    } catch (err: any) {`;

content = content.replace(oldHandleSave, newHandleSave);

// 3. EditRouteButton openChange
content = content.replace(
  /setHasTransfer\(false\);\s*setRouteExtraLegs\(\[\]\);/,
  `setRegularFare(String(edge.regular_fare ?? ''));
        setDiscountedFare(String(edge.discounted_fare ?? ''));
        setIsActive(edge.is_active !== 0 && edge.is_active !== false);`
);

// 4. EditRouteButton Remove transfer toggle and dynamic legs
// Here we use indexOf to be completely safe
const editToggleStart = content.indexOf('{/* Transfer toggle */}');
const editToggleEndStr = `</Label>\n                    </div>\n                  </div>\n                ))}`;
const editToggleEnd = content.indexOf(editToggleEndStr, editToggleStart);

if (editToggleStart !== -1 && editToggleEnd !== -1) {
  content = content.substring(0, editToggleStart) + `
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <Label className="text-sm font-semibold text-slate-700">Regular Fare</Label>
                    <Input type="number" step="0.01" className="bg-white border-slate-200" value={regularFare} onChange={e => setRegularFare(e.target.value)} placeholder="Auto-calculated if blank" />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-sm font-semibold text-slate-700">Discounted Fare</Label>
                    <Input type="number" step="0.01" className="bg-white border-slate-200" value={discountedFare} onChange={e => setDiscountedFare(e.target.value)} placeholder="Auto-calculated if blank" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors \${isActive ? 'bg-cyan-500' : 'bg-slate-300'}\`}
                  >
                    <span className={\`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow \${isActive ? 'translate-x-6' : 'translate-x-1'}\`} />
                  </button>
                  <Label className="text-sm font-semibold text-slate-700 cursor-pointer" onClick={() => setIsActive(!isActive)}>
                    Active Segment
                  </Label>
                </div>
  ` + content.substring(editToggleEnd + editToggleEndStr.length);
}

// 5. AdminPage State
content = content.replace(
  /const \[hasTransfer, setHasTransfer\] = useState\(false\);\s*const \[routeExtraLegs, setRouteExtraLegs\] = useState<\{[\s\S]*?\}\[\]>\(\[\]\);/,
  `const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [isActive, setIsActive] = useState(true);`
);

// 6. AdminPage handleAddRoute extract data
content = content.replace(
  /const note = formData\.get\('note'\) as string;/,
  `const note = formData.get('note') as string;
    const regFare = formData.get('regularFare') as string;
    const discFare = formData.get('discountedFare') as string;
    const act = formData.get('isActive') === 'on';`
);

// 7. AdminPage handleAddRoute save logic
const addHandleSaveStart = content.indexOf('if (hasTransfer) {', content.indexOf('const handleAddRoute = async'));
const addHandleSaveEndStr = `} catch (error: any) {\n        toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to add route.' });\n      }\n    }`;
const addHandleSaveEnd = content.indexOf(addHandleSaveEndStr, addHandleSaveStart);

if (addHandleSaveStart !== -1 && addHandleSaveEnd !== -1) {
  content = content.substring(0, addHandleSaveStart) + `try {
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
            regularFare: regFare,
            discountedFare: discFare,
            isActive: act,
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
      ` + content.substring(addHandleSaveEnd);
}

// 8. AdminPage RouteMap extraPaths
content = content.replace(
  /extraPaths=\{routeExtraLegs[\s\S]*?\}\]\}[^\}]*?\}\)\)\s*\}/,
  `extraPaths={[]}`
);

// 9. AdminPage AddRoute Dialog onOpenChange
content = content.replace(
  /setHasTransfer\(false\);\s*setRouteExtraLegs\(\[\]\);/,
  `setRegularFare('');
                    setDiscountedFare('');
                    setIsActive(true);`
);

// 10. AdminPage Remove Legend
const legendStart = content.indexOf('{/* Legend for transfer leg paths */}');
if (legendStart !== -1) {
  const legendEnd = content.indexOf('</div>', legendStart) + 6;
  content = content.substring(0, legendStart) + content.substring(legendEnd);
}

// 11. AdminPage Remove Add Form Transfer toggle
const addToggleStart = content.indexOf('{/* Transfer toggle */}');
if (addToggleStart !== -1) {
  const addToggleEndStr = `</Label>\n                            </div>\n                          </div>\n                        ))}`;
  const addToggleEnd = content.indexOf(addToggleEndStr, addToggleStart);

  if (addToggleEnd !== -1) {
    content = content.substring(0, addToggleStart) + `
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
    ` + content.substring(addToggleEnd + addToggleEndStr.length);
  }
}

// 12. Fix edges Data Table to show active/inactive and fare
content = content.replace(
  /<TableHead>Source<\/TableHead>\s*<TableHead>Target<\/TableHead>\s*<TableHead>Distance<\/TableHead>\s*<TableHead>Line<\/TableHead>\s*<TableHead className="text-right">Actions<\/TableHead>/g,
  `<TableHead>Source</TableHead>
   <TableHead>Target</TableHead>
   <TableHead>Distance</TableHead>
   <TableHead>Line</TableHead>
   <TableHead>Fare</TableHead>
   <TableHead>Status</TableHead>
   <TableHead className="text-right">Actions</TableHead>`
);

content = content.replace(
  /<TableCell>\{edge\.routeName\}<\/TableCell>\s*<TableCell className="text-right">/g,
  `<TableCell>{edge.routeName}</TableCell>
   <TableCell>₱{edge.regularFare ?? '-'}</TableCell>
   <TableCell>
     <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${edge.is_active !== 0 && edge.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
       {edge.is_active !== 0 && edge.is_active !== false ? 'Active' : 'Inactive'}
     </span>
   </TableCell>
   <TableCell className="text-right">`
);

fs.writeFileSync(file, content);
console.log('Successfully updated page.tsx');
