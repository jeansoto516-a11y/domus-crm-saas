const express = require('express');
const router = express.Router();
const multer = require('multer');

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const projectController = require('../controllers/projectController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

const uploadProjectFiles = (req, res, next) => {
    upload.fields([
        { name: 'model', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'floor_plan', maxCount: 1 },
        { name: 'photos', maxCount: 8 }
    ])(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? 'Arquivo muito grande (maximo 50 MB).'
                : 'Erro no upload dos arquivos.';
            return res.status(400).json({ error: message });
        }
        next();
    });
};

router.get('/', authMiddleware, checkSubscription, projectController.getProjects);
router.post('/', authMiddleware, checkSubscription, uploadProjectFiles, projectController.createProject);
router.put('/:id', authMiddleware, checkSubscription, uploadProjectFiles, projectController.updateProject);
router.delete('/:id/photos/:photoId', authMiddleware, checkSubscription, projectController.deleteProjectPhoto);
router.delete('/:id', authMiddleware, checkSubscription, projectController.deleteProject);

module.exports = router;