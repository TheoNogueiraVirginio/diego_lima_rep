import 'dotenv/config';
import prisma from './src/db.js';

async function test() {
  try {
    await prisma.simuladoSubmission.findUnique({
      where: {
        studentName_simuladoId: {
          studentName: "Diego",
          simuladoId: "simulado1"
        }
      }
    });
    console.log("OK!");
  } catch (e) {
    console.error("ERRO:", e);
  }
}
test();
