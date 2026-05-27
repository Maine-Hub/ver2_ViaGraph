import { findRouteAction } from '../src/lib/actions';

async function main() {
  const formData = new FormData();
  formData.append('startLocation', 'gaisano-mall');
  formData.append('endLocation', 'anahaw-amphitheater');
  
  const state = await findRouteAction({ message: '' }, formData);
  console.log("Result path JSON:");
  console.log(JSON.stringify(state.result?.path, null, 2));
  process.exit(0);
}

main().catch(console.error);
