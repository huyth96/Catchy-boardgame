const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

/**
 * Escapes user provided values to avoid HTML injection.
 * @param {string} value
 * @returns {string}
 */
const escapeHtml = (value = '') => {
  return value.toString().replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return character;
    }
  });
};

/**
 * Parses Firebase functions config and environment variables.
 * Supports both `firebase functions:config:set mailer.*` and
 * deployment-time environment variables prefixed with `MAILER_`.
 * @returns {{host: string|undefined, port: number, secure: boolean, user: string|undefined, pass: string|undefined, from: string|undefined, replyTo: string|undefined}}
 */
const loadMailerConfig = () => {
  const mailerConfig = functions.config().mailer || {};
  const pick = (key) => process.env[`MAILER_${key.toUpperCase()}`] || mailerConfig[key];
  const asBoolean = (value) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
  };

  return {
    host: pick('host'),
    port: Number(pick('port') || 587),
    secure: asBoolean(pick('secure')),
    user: pick('user'),
    pass: pick('pass'),
    from: pick('from'),
    replyTo: pick('reply_to') || pick('replyto')
  };
};

/**
 * Attempts to format an ISO timestamp into Vietnamese locale time.
 * Falls back to the original value if parsing fails.
 * @param {string|number|Date} value
 * @returns {string}
 */
const formatOrderTimestamp = (value) => {
  if (!value) {
    return 'Chua xac dinh';
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch (error) {
    functions.logger.warn('Could not parse order timestamp', { error: error.message, value });
    return String(value);
  }
};

/**
 * Builds the plain text and HTML content for the confirmation email.
 * @param {Object} order
 * @param {string} orderId
 * @returns {{subject: string, text: string, html: string}}
 */
const buildEmailContent = (order, orderId) => {
  const name = order.fullName || 'ban';
  const quantity = order.quantity != null ? order.quantity : 'Chua ro';
  const createdAt = formatOrderTimestamp(order.createdAt);
  const subject = `Catchy - Xac nhan don hang #${orderId.slice(-6)}`;

  const textLines = [
    `Chao ${name},`,
    '',
    'Cam on ban da dat mua Catchy - Boardgame hoc tieng Anh! Doi ngu Catchy da nhan duoc yeu cau cua ban va se lien he som nhat.',
    '',
    'Thong tin don hang cua ban:',
    `- Ho ten: ${order.fullName || 'Chua cung cap'}`,
    `- So dien thoai: ${order.phone || 'Chua cung cap'}`,
    `- Email: ${order.email || 'Chua cung cap'}`,
    `- So luong: ${quantity}`,
    `- Thoi gian gui: ${createdAt}`,
    '',
    'Neu ban can chinh sua thong tin, hay tra loi email nay hoac lien he truc tiep voi Catchy.',
    '',
    'Chuc ban co nhung gio choi vui ve cung Catchy!',
    'Doi ngu Catchy'
  ];

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1d1d1f;">
      <p>Chao ${escapeHtml(name)},</p>
      <p>Cam on ban da dat mua <strong>Catchy - Boardgame hoc tieng Anh</strong>! Doi ngu Catchy da nhan duoc yeu cau cua ban va se lien he som nhat.</p>
      <h3 style="margin-top:24px;margin-bottom:12px;">Thong tin don hang</h3>
      <table style="border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#555;">Ho ten:</td>
            <td style="padding:4px 0;">${escapeHtml(order.fullName || 'Chua cung cap')}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#555;">So dien thoai:</td>
            <td style="padding:4px 0;">${escapeHtml(order.phone || 'Chua cung cap')}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#555;">Email:</td>
            <td style="padding:4px 0;">${escapeHtml(order.email || 'Chua cung cap')}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#555;">So luong:</td>
            <td style="padding:4px 0;">${escapeHtml(quantity)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#555;">Thoi gian gui:</td>
            <td style="padding:4px 0;">${escapeHtml(createdAt)}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:20px;">Neu ban can chinh sua thong tin, hay tra loi email nay hoac lien he truc tiep voi Catchy.</p>
      <p>Chuc ban co nhung gio choi vui ve cung Catchy!<br/>Doi ngu Catchy</p>
    </div>
  `;

  return {
    subject,
    text: textLines.join('\n'),
    html
  };
};

exports.sendOrderConfirmation = functions
  .firestore
  .document('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.data();
    const orderId = context.params.orderId;

    if (!order) {
      functions.logger.warn('Could not find new order data.', { orderId });
      return null;
    }

    const email = (order.email || '').trim();
    if (!email) {
      functions.logger.info('Order missing email, skipping confirmation.', { orderId });
      return null;
    }

    const mailer = loadMailerConfig();
    if (!mailer.host || !mailer.user || !mailer.pass || !mailer.from) {
      functions.logger.error('Missing mailer configuration, cannot send confirmation.', { orderId });
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: mailer.host,
      port: mailer.port,
      secure: mailer.secure,
      auth: {
        user: mailer.user,
        pass: mailer.pass
      }
    });

    const { subject, text, html } = buildEmailContent(order, orderId);

    try {
      await transporter.sendMail({
        to: email,
        from: mailer.from,
        replyTo: mailer.replyTo || mailer.from,
        subject,
        text,
        html
      });
      functions.logger.info('Sent order confirmation email.', { orderId, to: email });
    } catch (error) {
      functions.logger.error('Failed to send order confirmation email.', { orderId, error: error.message });
    }

    return null;
  });
