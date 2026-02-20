/**
 * Model Agendamento
 */

const { run, get, all, transaction } = require('../config/helpers');
const Evento = require('./Evento');
const Usuario = require('./Usuario');

class Agendamento {
    
    /**
     * Criar novo agendamento
     */
    static async criar(usuarioId, eventoId) {
        try {
            // Verificar se já agendou
            const ja = await this.usuarioJaAgendou(usuarioId, eventoId);
            if (ja) return { error: 'Você já possui um agendamento para este evento.' };

            // Verificar vagas
            const temVagas = await Evento.temVagasDisponiveis(eventoId);
            if (!temVagas) return { error: 'Não há mais vagas disponíveis para este evento.' };

            // Inserir agendamento e histórico em transação (sem numero_senha)
            const queries = [
                { sql: `INSERT INTO agendamentos (usuario_id, evento_id, status, confirmacao_presenca) VALUES (?, ?, 'confirmado', 'pendente')`, params: [usuarioId, eventoId] },
                { sql: `INSERT INTO historico (usuario_id, tipo, descricao) VALUES (?, 'agendamento', ?)`, params: [usuarioId, `Agendado para: ${ (await Evento.buscarPorId(eventoId)).titulo }`] }
            ];

            const results = await transaction(queries);

            // Decrementar vaga
            await Evento.decrementarVaga(eventoId);

            return { success: true, id: results[0].lastID };
        } catch (err) {
            console.error('Erro ao criar agendamento:', err);
            return { error: 'Erro ao criar agendamento.' };
        }
    }
    
    /**
     * Verificar se usuário já agendou
     */
    static async usuarioJaAgendou(usuarioId, eventoId) {
        const res = await get(`SELECT COUNT(*) as total FROM agendamentos WHERE usuario_id = ? AND evento_id = ? AND status IN ('confirmado', 'presente')`, [usuarioId, eventoId]);
        return res && res.total > 0;
    }
    
    /**
     * Gerar número de senha sequencial
     */
    static async gerarNumeroSenha(eventoId) {
        const res = await get(`SELECT MAX(numero_senha) as ultima_senha FROM agendamentos WHERE evento_id = ?`, [eventoId]);
        return (res && res.ultima_senha ? res.ultima_senha : 0) + 1;
    }
    
    /**
     * Listar agendamentos do usuário
     */
    static async listarPorUsuario(usuarioId) {
        try {
            return await all(`
                SELECT 
                    a.id, a.numero_senha, a.status, a.confirmacao_presenca, 
                    a.data_agendamento, a.data_cancelamento,
                    e.id as evento_id, e.titulo, e.data_evento, e.hora_evento, 
                    e.local, e.abertura_portao
                FROM agendamentos a
                JOIN eventos e ON a.evento_id = e.id
                WHERE a.usuario_id = ?
                ORDER BY e.data_evento DESC
            `, [usuarioId]);
        } catch (err) {
            console.error('Erro ao listar agendamentos por usuário:', err);
            return [];
        }
    }
    
    /**
     * Cancelar agendamento
     */
    static async cancelar(agendamentoId, usuarioId) {
        try {
            const agendamento = await this.buscarPorId(agendamentoId);
            if (!agendamento) return { error: 'Agendamento não encontrado.' };

            if (agendamento.usuario_id !== usuarioId && usuarioId !== 1) return { error: 'Você não tem permissão para cancelar este agendamento.' };

            const evento = await Evento.buscarPorId(agendamento.evento_id);
            const agora = new Date();
            const dataEvento = new Date(evento.data_evento + ' ' + evento.hora_evento);
            const horasRestantes = (dataEvento - agora) / (1000 * 60 * 60);

            if (horasRestantes < 24) return { error: 'Não é possível cancelar menos de 24 horas antes do evento.' };

            await run(`UPDATE agendamentos SET status = 'cancelado', data_cancelamento = CURRENT_TIMESTAMP WHERE id = ?`, [agendamentoId]);

            await Evento.incrementarVaga(agendamento.evento_id);

            await run(`INSERT INTO historico (usuario_id, tipo, descricao) VALUES (?, 'cancelamento', ?)`, [usuarioId, `Cancelado: ${evento.titulo}`]);

            return { success: true };
        } catch (err) {
            console.error('Erro ao cancelar agendamento:', err);
            return { error: 'Erro ao cancelar agendamento.' };
        }
    }
    
    /**
     * Buscar agendamento por ID
     */
    static async buscarPorId(id) {
        return await get('SELECT * FROM agendamentos WHERE id = ?', [id]);
    }
    
    /**
     * Registrar presença
     */
    static async registrarPresenca(agendamentoId) {
        try {
            await run(`UPDATE agendamentos SET status = 'presente', confirmacao_presenca = 'confirmado', data_presenca = CURRENT_TIMESTAMP WHERE id = ?`, [agendamentoId]);
            return { success: true };
        } catch (err) {
            console.error('Erro ao registrar presença:', err);
            return { error: 'Erro ao registrar presença.' };
        }
    }
    
    /**
     * Registrar ausência
     */
    static async registrarAusencia(agendamentoId, usuarioId) {
        try {
            await run(`UPDATE agendamentos SET status = 'ausente', confirmacao_presenca = 'ausente' WHERE id = ?`, [agendamentoId]);
            await Usuario.registrarFalta(usuarioId);
            return { success: true };
        } catch (err) {
            console.error('Erro ao registrar ausência:', err);
            return { error: 'Erro ao registrar ausência.' };
        }
    }
    
    /**
     * Obter estatísticas do usuário
     */
    static async obterEstatisticasUsuario(usuarioId) {
        try {
            const totalR = await get(`SELECT COUNT(*) as total FROM agendamentos WHERE usuario_id = ? AND status != 'cancelado'`, [usuarioId]);
            const presentesR = await get(`SELECT COUNT(*) as total FROM agendamentos WHERE usuario_id = ? AND status = 'presente'`, [usuarioId]);
            const ausentesR = await get(`SELECT COUNT(*) as total FROM agendamentos WHERE usuario_id = ? AND status = 'ausente'`, [usuarioId]);
            const canceladosR = await get(`SELECT COUNT(*) as total FROM agendamentos WHERE usuario_id = ? AND status = 'cancelado'`, [usuarioId]);

            const total = totalR ? totalR.total : 0;
            const presentes = presentesR ? presentesR.total : 0;
            const ausentes = ausentesR ? ausentesR.total : 0;
            const cancelados = canceladosR ? canceladosR.total : 0;

            return {
                total,
                presentes,
                ausentes,
                cancelados,
                taxa_presenca: total > 0 ? Math.round((presentes / total) * 100) : 0
            };
        } catch (err) {
            console.error('Erro ao obter estatísticas do usuário:', err);
            return { total:0, presentes:0, ausentes:0, cancelados:0, taxa_presenca:0 };
        }
    }
}

module.exports = Agendamento;
