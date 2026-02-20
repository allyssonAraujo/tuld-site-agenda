/**
 * Rotas do Dashboard
 */

const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const Evento = require('../models/Evento');
const Agendamento = require('../models/Agendamento');
const Usuario = require('../models/Usuario');

/**
 * GET /api/dashboard/eventos - Listar eventos disponíveis com status de agendamento do usuário
 */
router.get('/eventos', verificarSessao, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const eventos = await Evento.listarDisponiveis();
        
        // Obter IDs de eventos que o usuário já agendou
        const agendamentos = await Agendamento.listarPorUsuario(usuarioId);
        const eventosAgendados = agendamentos
            .filter(a => a.status === 'confirmado' || a.status === 'presente')
            .map(a => a.evento_id);
        
        // Adicionar informação de se o usuário já agendou
        const eventosComStatus = eventos.map(e => ({
            ...e,
            ja_agendado: eventosAgendados.includes(e.id)
        }));
        
        return res.json({ eventos: eventosComStatus });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao carregar eventos' });
    }
});

/**
 * GET /api/dashboard/meus-agendamentos - Listar agendamentos do usuário
 */
router.get('/meus-agendamentos', verificarSessao, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const agendamentos = await Agendamento.listarPorUsuario(usuarioId);
        const stats = await Agendamento.obterEstatisticasUsuario(usuarioId);
        
        return res.json({ 
            agendamentos,
            estatisticas: stats 
        });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao carregar agendamentos' });
    }
});

/**
 * GET /api/dashboard/stats - Estatísticas do usuário
 */
router.get('/stats', verificarSessao, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const usuario = await Usuario.buscarPorId(usuarioId);
        const stats = await Agendamento.obterEstatisticasUsuario(usuarioId);
        
        return res.json({
            usuario,
            agendamentos: stats,
            disponivel_para_agendar: usuario.status === 'ativo'
        });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
});

/**
 * PUT /api/dashboard/perfil - Editar perfil do usuário logado
 */
router.put('/perfil', verificarSessao, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const { nome, telefone } = req.body;

        if (!nome || !telefone) {
            return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
        }

        const result = await Usuario.atualizarPerfil(usuarioId, { nome, telefone });
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        // Atualizar dados na sessão
        req.session.usuario.nome = nome;
        
        return res.json({ success: true, message: 'Perfil atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

module.exports = router;
