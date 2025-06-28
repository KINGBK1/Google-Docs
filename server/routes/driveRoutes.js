import express from 'express';
import { uploadToDrive } from '../controllers/driveController.js'; 

const router = express.Router();

router.post('/upload', uploadToDrive); 

export default router;
