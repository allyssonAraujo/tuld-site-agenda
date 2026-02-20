/**
 * Database Helpers - Wrapper para sql.js (WASM SQLite)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/tuld.db');
const schemaPath = path.join(__dirname, '../../database/schema.sql');

let SQL = null;
let dbInstance = null; // sql.js Database

async function ensureSql() {
    if (!SQL) SQL = await initSqlJs();
}

async function getDb() {
    await ensureSql();

    if (dbInstance) return dbInstance;

    if (fs.existsSync(dbPath)) {
        const filebuffer = fs.readFileSync(dbPath);
        dbInstance = new SQL.Database(new Uint8Array(filebuffer));
    } else {
        dbInstance = new SQL.Database();
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            if (schema && schema.trim()) dbInstance.run(schema);
        }
        persistDb();
    }

    return dbInstance;
}

function persistDb() {
    if (!dbInstance) return;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

async function run(sql, params = []) {
    const db = await getDb();

    try {
        const stmt = db.prepare(sql);
        if (params && params.length) stmt.bind(params);
        stmt.run();
        stmt.free();

        // obter lastID via função SQLite
        let lastID = null;
        try {
            const res = db.exec('SELECT last_insert_rowid() AS id');
            if (res && res[0] && res[0].values && res[0].values[0]) lastID = res[0].values[0][0];
        } catch (e) {
            lastID = null;
        }

        const changes = db.getRowsModified ? db.getRowsModified() : null;
        persistDb();
        return { lastID, changes };
    } catch (err) {
        throw err;
    }
}

async function get(sql, params = []) {
    const db = await getDb();

    const stmt = db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    let row = null;
    if (stmt.step()) {
        row = stmt.getAsObject();
    }
    stmt.free();
    return row || undefined;
}

async function all(sql, params = []) {
    const db = await getDb();

    const stmt = db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

async function transaction(queries) {
    const db = await getDb();

    try {
        db.run('BEGIN TRANSACTION');
        const results = [];
        for (let i = 0; i < queries.length; i++) {
            const q = queries[i];
            const stmt = db.prepare(q.sql);
            if (q.params && q.params.length) stmt.bind(q.params);
            stmt.run();
            stmt.free();

            let lastID = null;
            try {
                const res = db.exec('SELECT last_insert_rowid() AS id');
                if (res && res[0] && res[0].values && res[0].values[0]) lastID = res[0].values[0][0];
            } catch (e) {}

            const changes = db.getRowsModified ? db.getRowsModified() : null;
            results.push({ lastID, changes });
        }
        db.run('COMMIT');
        persistDb();
        return results;
    } catch (err) {
        try { db.run('ROLLBACK'); } catch (e) {}
        throw err;
    }
}

module.exports = {
    getDb,
    run,
    get,
    all,
    transaction
};
