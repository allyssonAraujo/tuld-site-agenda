/**
 * Model Evento
 */

const { run, get, all } = require('../config/helpers');

class Evento {
    
    /**
     * Listar eventos disponíveis
     */
    static async listarDisponiveis() {
        try {
            return await all(
                `SELECT * FROM eventos 
                 WHERE status = 'ativo' 
                 AND data_evento >= DATE('now')
                 AND vagas_disponiveis > 0
                 ORDER BY data_evento ASC, hora_evento ASC`
            );
        } catch (err) {
            console.error('Erro ao listar eventos:', err);
            return [];
        }
    }
    
    /**
     * Buscar evento por ID
     */
    static async buscarPorId(id) {
        try {
            return await get('SELECT * FROM eventos WHERE id = ?', [id]);
        } catch (err) {
            console.error('Erro ao buscar evento:', err);
            return null;
        }
    }
    
    /**
     * Verificar se tem vagas disponíveis
     */
    static async temVagasDisponiveis(eventoId) {
        try {
            const evento = await this.buscarPorId(eventoId);
            return evento && evento.vagas_disponiveis > 0;
        } catch (err) {
            console.error('Erro ao verificar vagas:', err);
            return false;
        }
    }
    
    /**
     * Decrementar vaga
     */
    static async decrementarVaga(eventoId) {
        try {
            await run(
                `UPDATE eventos 
                 SET vagas_disponiveis = vagas_disponiveis - 1 
                 WHERE id = ?`,
                [eventoId]
            );
        } catch (err) {
            console.error('Erro ao decrementar vaga:', err);
        }
    }
    
    /**
     * Incrementar vaga (quando cancela agendamento)
     */
    static async incrementarVaga(eventoId) {
        try {
            await run(
                `UPDATE eventos 
                 SET vagas_disponiveis = vagas_disponiveis + 1 
                 WHERE id = ?`,
                [eventoId]
            );
        } catch (err) {
            console.error('Erro ao incrementar vaga:', err);
        }
    }
    
    /**
     * Criar novo evento (admin)
     */
    static async criar(dados) {
        const { titulo, descricao, data_evento, hora_evento, vagas_totais, local, observacoes } = dados;
        
        try {
            const result = await run(
                `INSERT INTO eventos 
                 (titulo, descricao, data_evento, hora_evento, vagas_totais, vagas_disponiveis, local, observacoes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [titulo, descricao, data_evento, hora_evento, vagas_totais, vagas_totais, local, observacoes]
            );
            
            return { success: true, id: result.lastID };
        } catch (err) {
            console.error('Erro ao criar evento:', err);
            return { error: 'Erro ao criar evento.' };
        }
    }
    
    /**
     * Deletar evento (admin)
     */
    static async deletar(id) {
        try {
            await run('DELETE FROM eventos WHERE id = ?', [id]);
            return { success: true };
        } catch (err) {
            console.error('Erro ao deletar evento:', err);
            return { error: 'Erro ao deletar evento.' };
        }
    }
    
    /**
     * Atualizar evento (admin)
     */
    static async atualizar(id, dados) {
        try {
            // Construir UPDATE dinamicamente apenas com campos fornecidos
            const fields = [];
            const params = [];
            
            if (dados.titulo !== undefined) {
                fields.push('titulo = ?');
                params.push(dados.titulo);
            }
            if (dados.descricao !== undefined) {
                fields.push('descricao = ?');
                params.push(dados.descricao);
            }
            if (dados.data_evento !== undefined) {
                fields.push('data_evento = ?');
                params.push(dados.data_evento);
            }
            if (dados.hora_evento !== undefined) {
                fields.push('hora_evento = ?');
                params.push(dados.hora_evento);
            }
            if (dados.status !== undefined) {
                fields.push('status = ?');
                params.push(dados.status);
            }
            if (dados.local !== undefined) {
                fields.push('local = ?');
                params.push(dados.local);
            }
            
            if (fields.length === 0) {
                return { error: 'Nenhum campo para atualizar.' };
            }
            
            params.push(id);
            const sql = `UPDATE eventos SET ${fields.join(', ')} WHERE id = ?`;
            await run(sql, params);
            
            return { success: true };
        } catch (err) {
            console.error('[Evento.atualizar] Error:', err.message);
            return { error: 'Erro ao atualizar evento.' };
        }
    }
    
    /**
     * Obter estatísticas do evento
     */
    static async obterEstatisticas(eventoId) {
        try {
            const evento = await this.buscarPorId(eventoId);
            
            const presentes = await get(
                `SELECT COUNT(*) as total FROM agendamentos 
                 WHERE evento_id = ? AND status = 'presente'`,
                [eventoId]
            );
            
            const ausentes = await get(
                `SELECT COUNT(*) as total FROM agendamentos 
                 WHERE evento_id = ? AND status = 'ausente'`,
                [eventoId]
            );
            
            const confirmados = await get(
                `SELECT COUNT(*) as total FROM agendamentos 
                 WHERE evento_id = ? AND status = 'confirmado'`,
                [eventoId]
            );
            
            return {
                evento,
                presentes: presentes.total,
                ausentes: ausentes.total,
                confirmados: confirmados.total,
                taxa_presenca: evento.vagas_totais > 0 ? Math.round((presentes.total / evento.vagas_totais) * 100) : 0
            };
        } catch (err) {
            console.error('Erro ao obter estatísticas:', err);
            return null;
        }
    }
}

module.exports = Evento;
