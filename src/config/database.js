const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./env');

// Garantir que o diretório do banco existe
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Criar conexão com o banco
const db = new sqlite3.Database(config.databasePath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Inicializar banco de dados com o schema
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            console.error('Arquivo schema.sql não encontrado');
            return reject(new Error('Schema não encontrado'));
        }

        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        // Separar as instruções SQL
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        db.serialize(() => {
            statements.forEach(statement => {
                db.run(statement + ';', (err) => {
                    if (err) {
                        // Ignorar erros de "table already exists" para INSERT OR IGNORE
                        if (!err.message.includes('UNIQUE constraint failed')) {
                            console.error('Erro ao executar SQL:', err.message);
                        }
                    }
                });
            });
            
            console.log('Banco de dados inicializado com sucesso');
            resolve();
        });
    });
};

// Função helper para executar queries com promise
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Função helper para buscar uma linha
const getOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Função helper para buscar todas as linhas
const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

module.exports = {
    db,
    initDatabase,
    runQuery,
    getOne,
    getAll
};
