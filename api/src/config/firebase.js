import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Carrega as variáveis se necessário (embora no Node 20+ --env-file faça isso nativo, o dotenv é seguro)
dotenv.config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Inicializa apenas se não existir
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'diegolima-pdfs.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

// Exportação moderna
export default bucket;