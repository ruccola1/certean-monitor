/**
 * Email notification routes
 */
import express from 'express';
import { sendNotificationEmail } from '../services/emailService.js';

export const emailRouter = express.Router();

/**
 * POST /api/email/notification
 * Send email notification
 */
emailRouter.post('/notification', async (req, res) => {
  try {
    const {
      to,
      type = 'info',
      title,
      message,
      productName,
      step,
      priority = 'medium'
    } = req.body;

    // Validation
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "to" field (must be non-empty array of emails)'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, message'
      });
    }

    // Send email
    const result = await sendNotificationEmail({
      to,
      type,
      title,
      message,
      productName,
      step,
      priority
    });

    if (result.success) {
      return res.json({
        success: true,
        emailsSent: result.emailsSent,
        message: `Email sent to ${result.emailsSent} recipient(s)`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email'
      });
    }

  } catch (error) {
    console.error('Email notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

