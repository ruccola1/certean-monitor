/**
 * Simple Express server for certean-monitor
 * Handles email notifications via Resend
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { emailRouter } from './routes/email.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',      // Vite dev server
    'http://localhost:4173',      // Vite preview server
    'https://monitor.certean.com' // Production frontend
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/email', emailRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'certean-monitor-server',
    timestamp: new Date().toISOString(),
    emailServiceEnabled: !!process.env.RESEND_API_KEY
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Certean Monitor server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? '✅ Enabled (Resend)' : '⚠️  Disabled (no API key)'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://monitor.certean.com'}`);
});

