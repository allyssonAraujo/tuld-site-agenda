/**
 * Configuração do Banco de Dados - usando sql.js
 */

const { getDb } = require('./helpers');

async function obterBanco() {
    return await getDb();
}

function inicializarBanco() {
    // Inicializa o banco carregando/criando o arquivo e executando schema via helpers
    getDb().then(() => {
        console.log('✓ Banco de dados inicializado');
    }).catch((err) => {
        console.error('Erro ao inicializar banco:', err);
    });
}

function fecharBanco() {
    // sql.js mantém estado em memória; nossas helpers persistem após operações.
}

module.exports = {
    obterBanco,
    inicializarBanco,
    fecharBanco
};
