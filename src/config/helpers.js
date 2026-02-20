/**
 * Database Helpers - PostgreSQL via pg
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let dbInitialized = false;

function getPool() {
    if (!pool) {
        // Render fornece DATABASE_URL automaticamente
        const connectionString = process.env.DATABASE_URL || 
            'postgresql://user:password@localhost:5432/tuld';

        pool = new Pool({
            connectionString,
            // Para Render, pode precisar de ssl
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        pool.on('error', (err) => {
            console.error('Erro no pool PostgreSQL:', err);
        });
    }
    return pool;
}

/**
 * Inicializar banco de dados (executar schema se não existir)
 */
async function initializeDatabase() {
    if (dbInitialized) return;

    const pool = getPool();
    
    try {
        // Verificar se tabela usuarios existe
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'usuarios'
            );
        `);

        if (result.rows[0].exists) {
            console.log('✓ Banco de dados já inicializado');
            dbInitialized = true;
            return;
        }

        // Executar schema
        console.log('📝 Inicializando banco de dados...');
        const schemaPath = path.join(__dirname, '../../database/schema-postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            try {
                await pool.query(stmt);
            } catch (err) {
                // Erros como "already exists" são ignorados
                if (err.code !== '42P07' && err.code !== '42701') {
                    throw err;
                }
            }
        }

        console.log('✓ Banco de dados inicializado com sucesso');
        dbInitialized = true;
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        throw err;
    }
}

async function run(sql, params = []) {
    const pool = getPool();
    try {
        // Para INSERT, adicionar RETURNING id se não tiver
        let finalSql = sql;
        if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
            finalSql = sql.trim();
            if (!finalSql.endsWith(';')) finalSql += ';';
            finalSql = finalSql.slice(0, -1) + ' RETURNING id;';
        }

        const result = await pool.query(finalSql, params);
        return {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount
        };
    } catch (err) {
        throw err;
    }
}

async function get(sql, params = []) {
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result.rows[0] || undefined;
}

async function all(sql, params = []) {
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result.rows;
}

async function transaction(queries) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const results = [];
        
        for (const q of queries) {
            // Para INSERT, adicionar RETURNING id se não tiver
            let finalSql = q.sql;
            if (q.sql.trim().toUpperCase().startsWith('INSERT') && !q.sql.toUpperCase().includes('RETURNING')) {
                finalSql = q.sql.trim();
                if (!finalSql.endsWith(';')) finalSql += ';';
                finalSql = finalSql.slice(0, -1) + ' RETURNING id;';
            }

            const result = await client.query(finalSql, q.params || []);
            results.push({
                lastID: result.rows[0]?.id || null,
                changes: result.rowCount
            });
        }
        
        await client.query('COMMIT');
        return results;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    getPool,
    initializeDatabase,
    run,
    get,
    all,
    transaction
};
