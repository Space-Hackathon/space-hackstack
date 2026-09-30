import { Router } from 'express';
import { settings } from '../../core/config.js';
import { allProcessors } from '../../processors/index.js';

const router = Router();
router.get('/capabilities', (_req, res) => res.json({
  contract_version: '1',
  max_upload_bytes: settings.maxUploadMb * 1024 * 1024,
  processors: allProcessors().map(({ name, description, extensions }) => ({ name, description, extensions })),
  features: { files: true, processing: true, inference: true },
}));
export default router;
