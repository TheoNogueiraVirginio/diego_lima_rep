import bucket from './src/config/firebase.js';
import fs from 'fs';

async function run() {
  const [files] = await bucket.getFiles({ prefix: 'images/Simulados/Simulado1/' });
  const [files2] = await bucket.getFiles({ prefix: 'Simulados/Simulado1/' });
  const [files3] = await bucket.getFiles({ prefix: 'simulados/simulado1/' });
  
  const all = [...files, ...files2, ...files3].map(f => f.name);
  console.log(JSON.stringify(all));
}
run().catch(console.error);
