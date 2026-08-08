require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

const TABLES = ['companies', 'users', 'leads'];

async function backupDatabase() {
    try {
        const backup = {};

        for (const table of TABLES) {
            const result = await pool.query(`SELECT * FROM ${table}`);
            backup[table] = result.rows;
            console.log(`Tabela '${table}': ${result.rows.length} registros exportados.`);
        }

        const backupsDir = path.join(__dirname, 'backups');

        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(backupsDir, `backup-domus-${timestamp}.json`);

        fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

        console.log('Backup salvo em:', filePath);
        process.exit(0);

    } catch (err) {
        console.error('Erro ao gerar backup:', err);
        process.exit(1);
    }
}

backupDatabase();