import { GET } from '../src/app/api/data/graph/route';

async function testApi() {
  const response = await GET();
  const data = await response.json();
  console.log('--- API routes count ---', data.routes?.length);
  console.log('API routes list:');
  console.log(JSON.stringify(data.routes, null, 2));
  process.exit(0);
}

testApi().catch(console.error);
