import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, 'src/app/(app)/admin/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add states in EditRouteButton (lines 147-155 originally)
content = content.replace(
  /const \[hasTransfer, setHasTransfer\] = useState\(false\);\s*const \[routeExtraLegs, setRouteExtraLegs\] = useState<[\s\S]*?>\(\[\]\);/,
  `const [regularFare, setRegularFare] = useState(String(edge.regular_fare ?? ''));
  const [discountedFare, setDiscountedFare] = useState(String(edge.discounted_fare ?? ''));
  const [isActive, setIsActive] = useState(edge.is_active !== 0 && edge.is_active !== false);`
);

// Add states in AdminPage (around line 704 originally)
content = content.replace(
  /const \[hasTransfer, setHasTransfer\] = useState\(false\);\s*const \[routeExtraLegs, setRouteExtraLegs\] = useState<[\s\S]*?>\(\[\{ routeName: '', vehicleType: 'jeepney', distance: '', stopAndTransfer: '', note: '', pathCoordinates: \[] as \[number, number\]\[], inputMode: 'manual', jsonError: '' \}\]\);/,
  `const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [isActive, setIsActive] = useState(true);`
);

// In case the AdminPage state was something else:
content = content.replace(
  /const \[hasTransfer, setHasTransfer\] = useState\(false\);\s*const \[routeExtraLegs, setRouteExtraLegs\] = useState<any\[\]>\(\[[\s\S]*?\]\);/,
  `const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [isActive, setIsActive] = useState(true);`
);

// Fix the Data Table Header in AdminPage
content = content.replace(
  /<TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick=\{\(\) => toggleSort\(setEdgesSort, edgesSort, 'routeName'\)\}>\s*<div className="flex items-center">Line <SortIcon sort=\{edgesSort\} column="routeName" \/><\/div>\s*<\/TableHead>\s*<TableHead>Stop & Transfer<\/TableHead>\s*<TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick=\{\(\) => toggleSort\(setEdgesSort, edgesSort, 'regularFare'\)\}>\s*<div className="flex items-center">Regular <SortIcon sort=\{edgesSort\} column="regularFare" \/><\/div>\s*<\/TableHead>\s*<TableHead className="cursor-pointer hover:bg-slate-50 transition-colors" onClick=\{\(\) => toggleSort\(setEdgesSort, edgesSort, 'discountedFare'\)\}>\s*<div className="flex items-center">Discounted <SortIcon sort=\{edgesSort\} column="discountedFare" \/><\/div>\s*<\/TableHead>\s*<TableHead>Suggestion<\/TableHead>\s*<TableHead className="text-right">Actions<\/TableHead>/,
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

content = content.replace(
  /<TableCell>\{edge\.stopAndTransfer\}<\/TableCell>\s*<TableCell>₱\{edge\.regularFare ?? '-'\}<\/TableCell>\s*<TableCell>₱\{edge\.discountedFare ?? '-'\}<\/TableCell>\s*<TableCell>\{edge\.note\}<\/TableCell>/,
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
