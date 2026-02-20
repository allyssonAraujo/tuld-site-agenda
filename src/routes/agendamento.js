/**
 * Rotas de Agendamento
 */

const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const Agendamento = require('../models/Agendamento');
const Evento = require('../models/Evento');

/**
 * POST /api/agendamento/criar - Criar novo agendamento
 */
router.post('/criar', verificarSessao, async (req, res) => {
    const { evento_id } = req.body;
    const usuarioId = req.session.usuario.id;
    const eventoIdNum = Number(evento_id);
    
    if (!evento_id || Number.isNaN(eventoIdNum)) {
        return res.status(400).json({ error: 'Evento não especificado.' });
    }
    
    try {
        // Verificar se evento existe
        const evento = await Evento.buscarPorId(eventoIdNum);
        if (!evento) {
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }
        
        const resultado = await Agendamento.criar(usuarioId, eventoIdNum);
        
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        
        return res.json({ 
            success: true, 
            message: 'Agendamento realizado com sucesso!',
            agendamento_id: resultado.id
        });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao agendar' });
    }
});

/**
 * POST /api/agendamento/cancelar - Cancelar agendamento
 */
router.post('/cancelar', verificarSessao, async (req, res) => {
    const { agendamento_id, justificativa } = req.body;
    const usuarioId = req.session.usuario.id;
    
    if (!agendamento_id) {
        return res.status(400).json({ error: 'Agendamento não especificado.' });
    }
    
    try {
        const resultado = await Agendamento.cancelar(agendamento_id, usuarioId, justificativa);
        
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        
        return res.json({ 
            success: true, 
            message: 'Agendamento cancelado com sucesso!' 
        });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao cancelar' });
    }
});

/**
 * GET /api/agendamento/:id - Obter detalhes do agendamento
 */
router.get('/:id', verificarSessao, async (req, res) => {
    try {
        const agendamento = await Agendamento.buscarPorId(req.params.id);
        
        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        
        // Verificar permissão
        if (agendamento.usuario_id !== req.session.usuario.id && req.session.usuario.id !== 1) {
            return res.status(403).json({ error: 'Sem permissão.' });
        }
        
        const evento = await Evento.buscarPorId(agendamento.evento_id);
        
        return res.json({ agendamento, evento });
    } catch (err) {
        console.error('Erro:', err);
        return res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
});

module.exports = router;
