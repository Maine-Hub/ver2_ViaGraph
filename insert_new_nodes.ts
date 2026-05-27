import { query } from './src/lib/mysql';

interface NodeData {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

async function insertNodes() {
  const newNodes: NodeData[] = [
    { id: 'hypermart-167', name: '167 HyperMart', lat: 8.227786, lng: 124.240999 },
    { id: 'iligan-port', name: 'Port of Iligan', lat: 8.231260, lng: 124.234587 },
    { id: 'imch', name: 'Iligan Medical Center', lat: 8.227799, lng: 124.240733 },
    { id: 'landbank-main', name: 'Landbank Iligan Main', lat: 8.228238, lng: 124.243112 },
    { id: 'psa-office', name: 'PSA Office', lat: 8.227927, lng: 124.239864 },
    { id: 'philhealth-office', name: 'PhilHealth Office', lat: 8.218084, lng: 124.240963 },
    { id: 'v-highway-30', name: 'Highway 30 (Junction)', lat: 8.242090, lng: 124.248380 },
    { id: 'v-mastertech', name: 'MasterTech Stop', lat: 8.240280, lng: 124.245270 },
    { id: 'v-jollibee-aguinaldo', name: 'Jollibee Aguinaldo', lat: 8.227720, lng: 124.240710 },
    { id: 'v-crown-paper', name: 'Crown Paper Stop', lat: 8.227880, lng: 124.239920 },
    { id: 'v-desmark', name: 'Desmark Iligan', lat: 8.228100, lng: 124.239500 },
    { id: 'childrens-park', name: "Children's Park", lat: 8.240148, lng: 124.245157 },
    { id: 'unicity', name: 'Unicity', lat: 8.227736, lng: 124.241318 },
    { id: 'red-cross', name: 'Philippine Red Cross', lat: 8.214718, lng: 124.240015 }
  ];

  console.log('Inserting nodes into viagraph_experiment.nodes...');
  
  for (const node of newNodes) {
    try {
      await query(
        `INSERT IGNORE INTO nodes (id, name, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [node.id, node.name, node.lat, node.lng]
      );
      console.log(`Inserted/Skipped: ${node.id} (${node.name})`);
    } catch (e: unknown) {
      const err = e as Error;
      console.error(`Error inserting ${node.id}:`, err.message);
    }
  }

  console.log('Done.');
  process.exit(0);
}

insertNodes();
