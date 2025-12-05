const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const env = require('./env');

const dbPath = path.resolve(env.databasePath);
const dbDir = path.dirname(dbPath);

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Promisify database methods
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Initialize database with schema
const initDatabase = async () => {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await dbRun(statement);
                } catch (err) {
                    // Ignore "table already exists" errors
                    if (!err.message.includes('already exists') && !err.message.includes('UNIQUE constraint failed')) {
                        console.error('Erro ao executar SQL:', err.message);
                    }
                }
            }
        }
        console.log('Banco de dados inicializado com sucesso');
    }
};

module.exports = {
    db,
    dbRun,
    dbGet,
    dbAll,
    initDatabase
};
