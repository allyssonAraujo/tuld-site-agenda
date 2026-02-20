/**
 * Configuração do Banco de Dados - PostgreSQL
 */

const { getPool } = require('./helpers');

async function obterBanco() {
    return getPool();
}

async function inicializarBanco() {
    try {
        const pool = getPool();
        // Teste de conexão
        const result = await pool.query('SELECT NOW()');
        console.log('✓ Banco de dados PostgreSQL conectado:', result.rows[0].now);
    } catch (err) {
        console.error('Erro ao conectar banco:', err.message);
        throw err;
    }
}

function fecharBanco() {
    // Pool vai lidar com desconexão ao encerrar o processo
}

module.exports = {
    obterBanco,
    inicializarBanco,
    fecharBanco
};
