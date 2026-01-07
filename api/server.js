import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import enrollmentRoutes from "./src/routes/enrollmentRoutes.js";


const __filename = fileURLToPath(import.meta.url);
// Este arquivo está em: api/server.js
const __dirname = path.dirname(__filename);


const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

//ROTA DA API - CADASTRO
app.use("/api/enrollment", enrollmentRoutes);


// --- ROTAS DE PÁGINAS ---
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.get('/cadastro', (req, res) => {
    res.redirect('/cadastro.html');
});



app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

app.get('/videoaulas', (req, res) => {
    res.redirect('/videoaulas.html');
});

app.get('/simulados', (req, res) => {
    res.redirect('/simulados.html');
});

app.get('/informes', (req, res) => {
    res.redirect('/informes.html');
});


// --- ROTAS PRIVADAS / 404 ---
app.get('*', (req, res) => {
    res.status(404).send('<h1>Página não encontrada ou acesso restrito.</h1>');
});


// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta: ${PORT}`);
});