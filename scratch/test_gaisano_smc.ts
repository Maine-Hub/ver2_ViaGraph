import { findRouteAction } from '../src/lib/actions';

async function main() {
  const formData = new FormData();
  formData.append('startLocation', 'gaisano-mall');
  formData.append('endLocation', 'st.michael\'s-college');

  const response = await findRouteAction({ message: '' }, formData);
  console.log('--- RESPONSE MESSAGE ---');
  console.log(response.message);

  if (response.result) {
    response.result.path.forEach((seg: any, i) => {
      console.log(`Segment ${i + 1}: ${seg.from} -> ${seg.to}`);
      if (seg.pathCoordinates) {
        console.log('  Coords format:', Array.isArray(seg.pathCoordinates) ? 'Array' : 'Object');
        const list = Array.isArray(seg.pathCoordinates) ? seg.pathCoordinates : seg.pathCoordinates.ridingCoords;
        console.log('  Coords count:', list?.length);
        if (list && list.length > 0) {
          console.log('  First coord:', list[0]);
          console.log('  Last coord:', list[list.length - 1]);
        }
      } else {
        console.log('  No coordinates.');
      }
    });
  }

  process.exit(0);
}

main().catch(console.error);
