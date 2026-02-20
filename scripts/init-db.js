/**
 * Script para inicializar o schema PostgreSQL
 * Executar com: node scripts/init-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const connectionString = process.env.DATABASE_URL || 
        'postgresql://localhost/tuld';

    console.log('🛠️ Inicializando banco de dados...');
    console.log('📍 Database:', connectionString.split('@')[1] || 'local');

    const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Testar conexão
        const testResult = await pool.query('SELECT NOW()');
        console.log('✓ Conectado ao PostgreSQL');

        // Ler schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        if (!schema || !schema.trim()) {
            console.error('❌ Schema vazio ou não encontrado');
            process.exit(1);
        }

        // Executar schema (pode ter múltiplas statements)
        // Split por ; e execute cada statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📝 Executando ${statements.length} statements...`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                await pool.query(stmt);
                console.log(`  ✓ Statement ${i + 1}/${statements.length}`);
            } catch (err) {
                // Alguns erros como "already exists" são ok
                if (err.code === '42P07' || err.code === '42701') {
                    console.log(`  ⚠️ Statement ${i + 1} (já existe, ignorado)`);
                } else {
                    console.error(`  ❌ Statement ${i + 1} falhou:`, err.message);
                    throw err;
                }
            }
        }

        console.log('✅ Banco de dados inicializado com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initializeDatabase();
