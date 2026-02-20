/**
 * Servidor Principal - Sistema T.U.L.D. v2.0
 * Node.js + Express + JavaScript Puro
 */

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Importar configuração do banco
const { inicializarBanco } = require('./config/database');
const { getPool } = require('./config/helpers');

// Importar rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const agendamentoRoutes = require('./routes/agendamento');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Necessário em ambientes com proxy (ex.: Render) para cookies seguros funcionarem
app.set('trust proxy', 1);

// Inicializar banco de dados
inicializarBanco();

// Configurar middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
// Servir imagens da pasta raiz /img
app.use('/img', express.static(path.join(__dirname, '../img')));

// Configurar sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'tuld-secret-key-change-in-production',
    store: new pgSession({
        pool: getPool(),
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Middleware para disponibilizar dados da sessão em APIs
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Rotas
app.use('/', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agendamento', agendamentoRoutes);
app.use('/api/admin', adminRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Sistema de Agendamento T.U.L.D.     ║');
    console.log('║        Node.js Edition v2.0           ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    // Credenciais padrão removidas do log por segurança
    console.log('Pressione Ctrl+C para parar o servidor\n');
});
