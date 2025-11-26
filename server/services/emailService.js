/**
 * Email service using Resend
 */

/**
 * Send notification email via Resend
 */
export async function sendNotificationEmail({
  to,
  type = 'info',
  title,
  message,
  productName,
  step,
  priority = 'medium'
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@certean.com';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Check if Resend is configured
  if (!RESEND_API_KEY) {
    console.warn('⚠️  Resend API key not configured - email sending disabled');
    return {
      success: false,
      error: 'Email service not configured',
      emailsSent: 0
    };
  }

  // Validate recipients
  if (!to || !Array.isArray(to) || to.length === 0) {
    return {
      success: false,
      error: 'No recipients provided',
      emailsSent: 0
    };
  }

  try {
    // Format email content
    const subject = formatSubject(type, title, priority);
    const htmlContent = formatHtmlContent({
      type,
      title,
      message,
      productName,
      step,
      priority,
      frontendUrl: FRONTEND_URL
    });
    const textContent = formatTextContent({
      type,
      title,
      message,
      productName,
      step,
      frontendUrl: FRONTEND_URL
    });

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Certean Monitor <${RESEND_FROM_EMAIL}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Resend API error ${response.status}:`, errorText);
      return {
        success: false,
        error: `Email service error: ${response.status}`,
        emailsSent: 0
      };
    }

    const result = await response.json();
    console.log(`✅ Email sent to ${to.length} recipient(s) via Resend`);

    return {
      success: true,
      emailsSent: to.length,
      messageId: result.id
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error.message,
      emailsSent: 0
    };
  }
}

/**
 * Format email subject line
 */
function formatSubject(type, title, priority) {
  let prefix = '';
  if (priority === 'high') {
    prefix = '[URGENT] ';
  } else if (priority === 'low') {
    prefix = '[INFO] ';
  }

  const emoji = {
    'success': '✓',
    'error': '✗',
    'info': 'ℹ'
  }[type] || '';

  return `${prefix}Certean Monitor ${emoji} ${title}`;
}

/**
 * Format HTML email content with Certean Monitor design system
 */
function formatHtmlContent({ type, title, message, productName, step, priority, frontendUrl }) {
  // Design system colors (EXACT match to frontend globals.css)
  // hsl(220, 30%, 45%) = rgb(91, 118, 147) = #5b7693
  const greyishBlue = '#5b7693'; // --dashboard-link-color (exact conversion from HSL)
  const pageBackground = '#EEEFF0'; // --dashboard-view-background
  const cardBackground = '#FFFFFF'; // white
  const primaryText = '#5b7693'; // Same as greyishBlue for headings
  const secondaryText = '#6b7280'; // gray-500 for body text
  const mutedText = '#9ca3af'; // gray-400 for disclaimers
  
  const colors = {
    'success': { bg: '#10b981', text: '#065f46', icon: '✓' },
    'error': { bg: '#ef4444', text: '#991b1b', icon: '✗' },
    'info': { bg: greyishBlue, text: primaryText, icon: 'ℹ' }
  };
  const color = colors[type] || colors['info'];

  // Priority badge (sharp corners, no shadow)
  let priorityBadge = '';
  if (priority === 'high') {
    priorityBadge = '<div style="margin-bottom: 16px;"><span style="background-color: #dc2626; color: white; padding: 4px 12px; font-size: 12px; font-weight: 600; font-family: \'Geist Mono\', monospace;">HIGH PRIORITY</span></div>';
  } else if (priority === 'low') {
    priorityBadge = '<div style="margin-bottom: 16px;"><span style="background-color: #6b7280; color: white; padding: 4px 12px; font-size: 12px; font-weight: 600; font-family: \'Geist Mono\', monospace;">LOW PRIORITY</span></div>';
  }

  // Product and step info
  let contextInfo = '';
  if (productName) {
    contextInfo += `<div style='margin: 12px 0; padding: 12px; background-color: ${pageBackground};'><p style='margin: 0; color: ${primaryText}; font-size: 14px;'><strong style='font-weight: 700;'>Product:</strong> ${productName}</p></div>`;
  }
  if (step !== undefined) {
    const stepNames = {
      0: 'Product Decomposition',
      1: 'Compliance Assessment',
      2: 'Identify Compliance Elements',
      3: 'Generate Compliance Descriptions',
      4: 'Track Compliance Updates'
    };
    const stepName = stepNames[step] || `Step ${step}`;
    contextInfo += `<div style='margin: 12px 0; padding: 12px; background-color: ${pageBackground};'><p style='margin: 0; color: ${primaryText}; font-size: 14px; font-family: "Geist Mono", monospace;'><strong style='font-weight: 700;'>Step:</strong> ${stepName}</p></div>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;600;700&family=Geist+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-shadow: none !important; }
  </style>
</head>
<body style="font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: ${primaryText}; margin: 0; padding: 0; background-color: ${pageBackground};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${pageBackground}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${cardBackground}; border: none; box-shadow: none;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background-color: ${primaryText}; padding: 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Certean Logo Icon -->
                    <svg width="48" height="48" viewBox="0 0 100 100" style="margin-bottom: 12px;">
                      <circle cx="50" cy="50" r="45" fill="white" opacity="0.2"/>
                      <text x="50" y="70" font-family="Geist Sans, sans-serif" font-size="60" font-weight="700" fill="white" text-anchor="middle">C</text>
                    </svg>
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; font-family: 'Geist Sans', sans-serif;">Certean Monitor</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: ${cardBackground};">
              ${priorityBadge}
              
              <!-- Notification Type Badge -->
              <div style="margin-bottom: 20px;">
                <span style="background-color: ${color.bg}; color: white; padding: 6px 12px; font-size: 13px; font-weight: 600; font-family: 'Geist Mono', monospace;">${color.icon} ${type.toUpperCase()}</span>
              </div>
              
              <h2 style="color: ${primaryText}; margin: 20px 0 16px 0; font-size: 20px; font-weight: 700; font-family: 'Geist Sans', sans-serif;">${title}</h2>
              
              <p style="color: ${secondaryText}; margin: 16px 0; font-size: 15px; line-height: 1.6; font-family: 'Geist Sans', sans-serif;">${message}</p>
              
              ${contextInfo}
              
              <!-- CTA Button -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid ${pageBackground};">
                <table cellpadding="0" cellspacing="0" style="margin: 0;">
                  <tr>
                    <td>
                      <a href="${frontendUrl}" 
                         style="display: inline-block; background-color: ${primaryText}; color: white; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Geist Sans', sans-serif; transition: opacity 0.15s ease;">
                        View in Dashboard →
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${pageBackground}; padding: 24px; text-align: center; border-top: none;">
              <p style="color: ${primaryText}; font-size: 14px; margin: 0 0 8px 0; font-weight: 600; font-family: 'Geist Sans', sans-serif;">
                Certean Monitor
              </p>
              <p style="color: ${secondaryText}; font-size: 13px; margin: 0; font-family: 'Geist Sans', sans-serif;">
                Compliance Made Simple
              </p>
              <p style="color: ${mutedText}; font-size: 12px; margin: 12px 0 0 0; font-family: 'Geist Sans', sans-serif;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Format plain text email content
 */
function formatTextContent({ type, title, message, productName, step, frontendUrl }) {
  const lines = [
    'CERTEAN MONITOR NOTIFICATION',
    '=' * 50,
    '',
    `Type: ${type.toUpperCase()}`,
    `Title: ${title}`,
    '',
    'Message:',
    message,
    ''
  ];

  if (productName) {
    lines.push(`Product: ${productName}`);
  }

  if (step !== undefined) {
    const stepNames = {
      0: 'Product Decomposition',
      1: 'Compliance Assessment',
      2: 'Identify Compliance Elements',
      3: 'Generate Compliance Descriptions',
      4: 'Track Compliance Updates'
    };
    const stepName = stepNames[step] || `Step ${step}`;
    lines.push(`Step: ${stepName}`);
  }

  lines.push(
    '',
    `View in dashboard: ${frontendUrl}`,
    '',
    '-'.repeat(50),
    'Certean Monitor - Compliance Made Simple',
    'This is an automated notification.'
  );

  return lines.join('\n');
}

