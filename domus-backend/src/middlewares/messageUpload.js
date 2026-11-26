const multer = require('multer');
const os = require('os');
const path = require('path');

// Limite por arquivo. Se o plano do Supabase for gratuito, troque 100 por 50.
const MAX_FILE_MB = 100;
const MAX_FILES = 10;

const ALLOWED_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain'
};

// Os arquivos chegam em disco temporario (e nao na memoria) para aguentar arquivos grandes
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
            cb(null, `domus-message-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
        }
    }),
    limits: {
        fileSize: MAX_FILE_MB * 1024 * 1024,
        files: MAX_FILES
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (!ALLOWED_TYPES[ext]) {
            return cb(new Error('Tipo de arquivo nao permitido. Envie imagens (JPG, PNG, WEBP), PDF, Word, Excel ou TXT.'));
        }

        return cb(null, true);
    }
});

const uploadMessageFiles = (req, res, next) => {
    upload.array('files', MAX_FILES)(req, res, (err) => {
        if (err) {
            let message = err.message || 'Erro no upload dos arquivos.';

            if (err.code === 'LIMIT_FILE_SIZE') {
                message = `Arquivo muito grande (maximo ${MAX_FILE_MB} MB por arquivo).`;
            } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
                message = `Envie no maximo ${MAX_FILES} arquivos por mensagem.`;
            }

            return res.status(400).json({ error: message });
        }

        return next();
    });
};

module.exports = { uploadMessageFiles, ALLOWED_TYPES, MAX_FILE_MB, MAX_FILES };