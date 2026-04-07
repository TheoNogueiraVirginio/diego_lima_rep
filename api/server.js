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
import PdfRoutes from "./src/routes/pdfRoutes.js";
import courseRoutes from "./src/routes/courseRoutes.js";
import materiaisRoutes from './src/routes/materialRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import couponRoutes from './src/routes/couponRoutes.js';
import simuladoRoutes from './src/routes/simuladoRoutes.js';


const __filename = fileURLToPath(import.meta.url);
// Este arquivo está em: api/server.js
const __dirname = path.dirname(__filename);


const app = express();

app.use('/api/materiais', materiaisRoutes);

// Permitir credenciais (cookies) e refletir a origem da requisição.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Parser para cookies (HttpOnly)
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Atender requests legados para `/images/assuntos/...` mapeando para images_assuntos
app.use('/images/assuntos', express.static(path.join(__dirname, '../public/images/images_assuntos')));

//ROTA DA API - CADASTRO
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/avisos", noticeRoutes);
app.use("/api/pdf", PdfRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/simulado", simuladoRoutes);


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

app.get('/modulos', (req, res) => {
    res.redirect('/modulos.html');
});

app.get('/simulados', (req, res) => {
    res.redirect('/simulados.html');
});

app.get('/informes', (req, res) => {
    res.redirect('/informes.html');
});

app.get('/materiais', (req, res) => {
    res.redirect('/materiais.html');
});

app.get('/monitoramento', (req, res) => {
    res.redirect('/monitoramento.html');
});

app.get('/simulado1.html', (req, res) => {
    res.redirect('/simulado1.html');
});


// --- ROTAS PRIVADAS / 404 ---
app.get('*', (req, res) => {
    res.status(404).send('<h1>Página não encontrada ou acesso restrito.</h1>');
});


// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});