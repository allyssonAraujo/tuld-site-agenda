const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const Evento = require('../models/Evento');
const { run, get, all } = require('../config/helpers');
const Usuario = require('../models/Usuario');

// Middleware: somente admin (usuário id === 1)
function verificarAdmin(req, res, next) {
    if (!req.session || !req.session.usuario) return res.status(401).json({ error: 'Não autenticado' });
    if (req.session.usuario.id !== 1) return res.status(403).json({ error: 'Acesso negado' });
    next();
}

/**
 * POST /api/admin/eventos - Criar evento (admin)
 */
router.post('/eventos', verificarSessao, verificarAdmin, async (req, res) => {
    const dados = req.body;

    try {
        const resultado = await Evento.criar(dados);
        if (resultado.error) return res.status(400).json({ error: resultado.error });
        return res.json({ success: true, id: resultado.id });
    } catch (err) {
        console.error('Erro ao criar evento (admin):', err);
        return res.status(500).json({ error: 'Erro ao criar evento' });
    }
});

/**
 * GET /api/admin/relatorio/agendamentos - Relatório de agendamentos (opcional: ?evento_id=)
 */
router.get('/relatorio/agendamentos', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const eventoId = req.query.evento_id;
        let sql = `
            SELECT a.id as agendamento_id, a.numero_senha, a.status as agendamento_status, a.data_agendamento,
                   u.id as usuario_id, u.nome as usuario_nome, u.email as usuario_email, u.telefone as usuario_telefone,
                   e.id as evento_id, e.titulo as evento_titulo
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            JOIN eventos e ON a.evento_id = e.id
        `;
        const params = [];
        if (eventoId) {
            sql += ` WHERE e.id = ?`;
            params.push(eventoId);
        }
        sql += ` ORDER BY e.data_evento ASC, a.data_agendamento ASC`;

        const rows = await all(sql, params);
        return res.json({ agendamentos: rows });
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

/**
 * PUT /api/admin/eventos/:id - Editar evento (admin)
 */
router.put('/eventos/:id', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await Evento.atualizar(id, req.body);
        if (resultado.error) return res.status(400).json({ error: resultado.error });
        return res.json({ success: true });
    } catch (err) {
        console.error('Erro ao editar evento (admin):', err);
        return res.status(500).json({ error: 'Erro ao editar evento' });
    }
});

/**
 * DELETE /api/admin/eventos/:id - Deletar evento (admin)
 */
router.delete('/eventos/:id', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await Evento.deletar(id);
        if (resultado.error) return res.status(400).json({ error: resultado.error });
        return res.json({ success: true });
    } catch (err) {
        console.error('Erro ao deletar evento (admin):', err);
        return res.status(500).json({ error: 'Erro ao deletar evento' });
    }
});

/**
 * GET /api/admin/usuarios - Listar usuários (admin)
 */
router.get('/usuarios', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const rows = await all('SELECT id, nome, email, telefone, status, data_cadastro FROM usuarios ORDER BY data_cadastro DESC');
        return res.json({ usuarios: rows });
    } catch (err) {
        console.error('Erro ao listar usuários (admin):', err);
        return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

/**
 * PUT /api/admin/usuarios/:id - Editar usuário (admin)
 */
router.put('/usuarios/:id', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { nome, telefone, status } = req.body;

        // Apenas campos permitidos
        const updates = {};
        if (typeof nome !== 'undefined') updates.nome = nome;
        if (typeof telefone !== 'undefined') updates.telefone = telefone;
        if (typeof status !== 'undefined') updates.status = status;

        // Reusar método de atualizar perfil para nome/telefone
        if (updates.nome || updates.telefone) {
            const r = await Usuario.atualizarPerfil(id, { nome: updates.nome, telefone: updates.telefone });
            if (r.error) return res.status(400).json({ error: r.error });
        }

        if (updates.status) {
            // Atualizar status diretamente
            await run('UPDATE usuarios SET status = ? WHERE id = ?', [updates.status, id]);
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('Erro ao editar usuário (admin):', err);
        return res.status(500).json({ error: 'Erro ao editar usuário' });
    }
});

/**
 * GET /api/admin/relatorio/usuarios - Relatório de usuários com agendamentos (admin)
 */
router.get('/relatorio/usuarios', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const rows = await all(`
            SELECT DISTINCT u.id, u.nome, u.email, u.telefone, u.status, u.data_cadastro,
                   COUNT(a.id) as total_agendamentos,
                   SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as presencas,
                   SUM(CASE WHEN a.status = 'ausente' THEN 1 ELSE 0 END) as ausencias,
                   SUM(CASE WHEN a.status = 'confirmado' THEN 1 ELSE 0 END) as confirmados
            FROM usuarios u
            LEFT JOIN agendamentos a ON u.id = a.usuario_id
            GROUP BY u.id
            ORDER BY u.data_cadastro DESC
        `);
        return res.json({ usuarios: rows });
    } catch (err) {
        console.error('Erro ao gerar relatório de usuários:', err);
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

/**
 * GET /api/admin/relatorio/presencas - Lista de presença por agendamento (opcional: ?evento_id=)
 * Retorna linhas com: nome, titulo_evento, data_evento, presencia (campo vazio para impressão)
 */
router.get('/relatorio/presencas', verificarSessao, verificarAdmin, async (req, res) => {
    try {
        const eventoId = req.query.evento_id;
        let sql = `
            SELECT a.numero_senha as senha, u.nome as nome, e.titulo as titulo_evento, e.data_evento as data_evento,
                   a.observacoes as justificativa
            FROM agendamentos a
            JOIN usuarios u ON a.usuario_id = u.id
            JOIN eventos e ON a.evento_id = e.id
        `;
        const params = [];
        if (eventoId) {
            sql += ` WHERE e.id = ?`;
            params.push(eventoId);
        }
        sql += ` ORDER BY e.data_evento ASC, u.nome ASC`;

        const rows = await all(sql, params);
        // add empty presencia field
        const result = rows.map(r => ({
            senha: r.senha,
            nome: r.nome,
            titulo_evento: r.titulo_evento,
            data_evento: r.data_evento,
            justificativa: r.justificativa || '',
            presencia: ''
        }));
        return res.json({ presencas: result });
    } catch (err) {
        console.error('Erro ao gerar lista de presenças:', err);
        return res.status(500).json({ error: 'Erro ao gerar lista de presenças' });
    }
});

module.exports = router;
