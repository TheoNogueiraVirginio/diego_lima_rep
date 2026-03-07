
import { PrismaClient } from '@prisma/client';
import bucket from '../src/config/firebase.js';

const prisma = new PrismaClient();

async function checkEstatistica() {
  try {
        console.log(`Listing ALL files in bucket with prefix 'pdfs/'...`);

        const [files] = await bucket.getFiles({ prefix: 'pdfs/' });
        
        console.log(`Listing bucket files:`);
        files.forEach(file => {
          const name = file.name; 
          const basename = name.replace('pdfs/', '');
          console.log(`- ${basename}`);
        });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEstatistica();
