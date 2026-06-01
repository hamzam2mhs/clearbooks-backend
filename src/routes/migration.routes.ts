import { Router } from 'express';
import multer from 'multer';
import { createMigrationPreview } from '../services/migration/migrationPreview.service';

const router = Router();

const maxFileSize = Number(process.env.MIGRATION_MAX_FILE_SIZE_BYTES || 1048576);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxFileSize,
    },
});

function isCsvFile(file: Express.Multer.File) {
    const fileName = file.originalname.toLowerCase();

    return (
        fileName.endsWith('.csv') ||
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel'
    );
}

/**
 * POST /api/migration/preview
 * Upload CSV and create preview session.
 */
router.post('/preview', upload.single('file'), async (req, res) => {
    try {
        const businessId = req.context?.businessId;
        const userId = req.context?.userId;

        if (!businessId || !userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'FILE_REQUIRED',
                message: 'CSV file is required',
            });
        }

        if (!isCsvFile(req.file)) {
            return res.status(400).json({
                error: 'INVALID_FILE_TYPE',
                message: 'Only CSV files are supported for Migration V1',
            });
        }

        const preview = await createMigrationPreview({
            businessId,
            userId,
            file: req.file,
            sourceSoftware: req.body.sourceSoftware,
        });

        return res.status(201).json(preview);
    } catch (err) {
        console.error('Migration preview failed:', err);

        return res.status(500).json({
            error: 'MIGRATION_PREVIEW_FAILED',
            message:
                err instanceof Error
                    ? err.message
                    : 'Failed to create migration preview',
        });
    }
});

export default router;