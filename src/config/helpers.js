/**
 * Database Helpers - PostgreSQL via pg
 */

const { Pool } = require('pg');

let pool = null;

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
    run,
    get,
    all,
    transaction
};
