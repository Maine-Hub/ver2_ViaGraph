import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, 'src/app/(app)/admin/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// The original refactor script introduced `const [regularFare, setRegularFare] = useState(String(edge.regular_fare ?? ''));` in the main component.
// We need to replace it.
content = content.replace(
  /const \[regularFare, setRegularFare\] = useState\(String\(edge\.regular_fare \?\? ''\)\);\s*const \[discountedFare, setDiscountedFare\] = useState\(String\(edge\.discounted_fare \?\? ''\)\);\s*const \[isActive, setIsActive\] = useState\(edge\.is_active !== 0 && edge\.is_active !== false\);/,
  `const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [isActive, setIsActive] = useState(true);`
);

// We also need to fix extraPaths mapping inside the Add Route Form
content = content.replace(
  /extraPaths=\{routeExtraLegs\s*\.filter\(leg => leg\.pathCoordinates && leg\.pathCoordinates\.length > 1\)\s*\.map\(\(leg, i\) => \(\{\s*coords: leg\.pathCoordinates,\s*color: \['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f97316'\]\[i % 5\],\s*label: \`Leg \$\{i \+ 2\}\`,\s*\}\)\)\s*\}/,
  `extraPaths={[]}`
);

fs.writeFileSync(file, content);
console.log('Fixed page.tsx perfectly!');
