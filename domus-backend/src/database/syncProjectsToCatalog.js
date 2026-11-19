require('dotenv').config();
const pool = require('../config/db');
const { syncProjectToCatalog } = require('../services/projectCatalogService');

async function run() {
    try {
    const projects = await pool.query(`SELECT id, title FROM projects_3d ORDER BY id ASC`);

    for (const project of projects.rows) {
        await syncProjectToCatalog(project.id);
        console.log(`Projeto sincronizado: ${project.title}`);
    }

    console.log(`${projects.rows.length} projeto(s) sincronizado(s) com o catalogo.`);
    process.exit(0);
    } catch (err) {
    console.error('Erro ao sincronizar projetos 3D com o catalogo:', err);
    process.exit(1);
    }
}

run();