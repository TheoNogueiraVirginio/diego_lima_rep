import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import enrollmentRoutes from "./src/routes/enrollmentRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import progressRoutes from "./src/routes/progressRoutes.js";
import noticeRoutes from "./src/routes/noticeRoutes.js";


const __filename = fileURLToPath(import.meta.url);
// Este arquivo está em: api/server.js
const __dirname = path.dirname(__filename);


const app = express();

// Permitir credenciais (cookies) e refletir a origem da requisição.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Parser para cookies (HttpOnly)
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

//ROTA DA API - CADASTRO
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/avisos", noticeRoutes);


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