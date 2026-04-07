import bucket from './api/src/config/firebase.js';
async function run() {
  const [files] = await bucket.getFiles({ prefix: 'images/Simulados/' });
  console.log(files.map(f => f.name));
}
run().catch(console.error);
