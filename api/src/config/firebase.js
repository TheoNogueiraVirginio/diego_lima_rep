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
  const config = {
    storageBucket: 'diegolima-pdfs.firebasestorage.app'
  };

  // Aplica as credenciais apenas se existirem variáveis de ambiente
  if (serviceAccount.projectId && serviceAccount.privateKey) {
    config.credential = admin.credential.cert(serviceAccount);
  } else {
    console.warn("⚠️ [Aviso]: Variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY) ausentes. O Storage não deve funcionar sem o .env corretamente configurado.");
  }

  admin.initializeApp(config);
}

const bucket = admin.storage().bucket();

// Exportação moderna
export default bucket;