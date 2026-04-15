import { Router } from 'express'
import multer from 'multer'
import { transcribeClient } from '../services/transcribeClient.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })
const router = Router()

// POST /api/transcribe — Whisper fallback for browsers without Web Speech API
router.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'audio file is required' })
      return
    }
    const transcript = await transcribeClient.transcribeAudio(
      req.file.buffer,
      req.file.originalname || 'audio.webm'
    )
    res.json({ transcript })
  } catch (err) {
    next(err)
  }
})

export default router
