const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const propertyController = require('../controllers/propertyController');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/public/:slug', propertyController.getPublicCatalog);
router.get('/', authMiddleware, checkSubscription, propertyController.getProperties);
router.get('/:id', authMiddleware, checkSubscription, propertyController.getPropertyById);
router.post('/', authMiddleware, checkSubscription, propertyController.createProperty);
router.put('/:id', authMiddleware, checkSubscription, propertyController.updateProperty);
router.delete('/:id', authMiddleware, checkSubscription, propertyController.deleteProperty);

router.post('/:id/photos', authMiddleware, checkSubscription, upload.array('photos', 10), propertyController.uploadPropertyPhotos);
router.delete('/:id/photos/:photoId', authMiddleware, checkSubscription, propertyController.deletePropertyPhoto);

module.exports = router;