import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { RateLimiterMemory } from 'rate-limiter-flexible';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicDir));

const limiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 15,
});

const maxFiles = Number(process.env.MAX_FILES || 10);
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 25);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/acad',
  'application/x-acad',
  'application/autocad_dwg',
  'image/vnd.dwg',
  'application/dwg',
  'application/x-dwg',
  'application/octet-stream',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: maxFiles,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf', '.dwg', '.doc', '.docx', '.xls', '.xlsx'];

    if (allowedMimeTypes.has(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error(`File type not allowed: ${file.originalname}`));
  },
});

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function field(label, value) {
  return `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;width:210px;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value || '—')}</td></tr>`;
}

function makeEmailHtml(data, files) {
  const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f5f5f5;padding:24px;">
      <div style="max-width:820px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ddd;">
        <div style="background:#050505;color:#fff;padding:22px 26px;border-bottom:5px solid #d60b12;">
          <h1 style="margin:0;font-size:24px;">New Scaffold Customer Request</h1>
          <p style="margin:8px 0 0;color:#ddd;">Nor-Cal Spartan Scaffold website submission</p>
        </div>

        <div style="padding:22px 26px;">
          <p style="margin:0 0 16px;"><strong>Submitted:</strong> ${escapeHtml(submittedAt)} PT</p>

          <h2 style="font-size:18px;margin:22px 0 8px;color:#d60b12;">Customer Information</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
            ${field('Company Name', data.companyName)}
            ${field('Contact Person', data.contactPerson)}
            ${field('Phone Number', data.phone)}
            ${field('Email Address', data.email)}
            ${field('Preferred Contact Method', data.preferredContactMethod)}
            ${field('Best Time to Contact', data.bestTimeToContact)}
          </table>

          <h2 style="font-size:18px;margin:22px 0 8px;color:#d60b12;">Project Information</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
            ${field('Project Name', data.projectName)}
            ${field('Project Address', data.projectAddress)}
            ${field('City', data.city)}
            ${field('State', data.state)}
            ${field('ZIP Code', data.zipCode)}
            ${field('Project Type', data.projectType)}
            ${field('Description of Work', data.descriptionOfWork)}
          </table>

          <h2 style="font-size:18px;margin:22px 0 8px;color:#d60b12;">Scaffold Request Details</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
            ${field('Requested Service', data.requestedService)}
            ${field('Service Purpose', data.servicePurpose)}
            ${field('Building Height', data.buildingHeight ? `${data.buildingHeight} ft` : '')}
            ${field('Scaffold Length', data.scaffoldLength ? `${data.scaffoldLength} ft` : '')}
            ${field('Number of Levels', data.numberOfLevels)}
            ${field('Work Area Location', data.workAreaLocation)}
            ${field('Scaffold Type', data.scaffoldType)}
            ${field('Special Requirements', data.specialRequirements)}
          </table>

          <h2 style="font-size:18px;margin:22px 0 8px;color:#d60b12;">Access, Site Conditions & Schedule</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
            ${field('Site Access', data.siteAccess)}
            ${field('Parking Available', data.parkingAvailable)}
            ${field('Access Width', data.accessWidth ? `${data.accessWidth} ft` : '')}
            ${field('Ground Surface Type', data.groundSurface)}
            ${field('Obstacles / Restrictions', data.obstacles)}
            ${field('Requested Start Date', data.startDate)}
            ${field('Requested End Date', data.endDate)}
            ${field('Urgency', data.urgency)}
            ${field('Work Schedule', data.workSchedule)}
            ${field('Additional Notes', data.additionalNotes)}
          </table>

          <h2 style="font-size:18px;margin:22px 0 8px;color:#d60b12;">Attachments</h2>
          <p>${files.length ? `${files.length} file(s) attached to this email.` : 'No files attached.'}</p>
        </div>
      </div>
    </div>
  `;
}

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required .env value: ${name}`);
  }
  return process.env[name];
}

async function sendRequestEmail(data, files) {
  const transporter = nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
  });

  const recipients = requireEnv('MAIL_TO')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  const attachments = files.map((file) => ({
    filename: file.originalname,
    content: file.buffer,
    contentType: file.mimetype,
  }));

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: recipients,
    replyTo: data.email || process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    subject: `New Scaffold Request${data.companyName ? ` - ${data.companyName}` : ''}`,
    html: makeEmailHtml(data, files),
    attachments,
  });

  if (data.email) {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: data.email,
      replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
      subject: 'We received your scaffold request',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
          <h2>Thank you for contacting Nor-Cal Spartan Scaffold</h2>
          <p>We received your scaffold request and our team will review the project information.</p>
          <p>If we need additional details, photos, plans, or a site visit, we will contact you soon.</p>
          <p><strong>Project:</strong> ${escapeHtml(data.projectName || data.projectAddress || 'Scaffold request')}</p>
          <p>Nor-Cal Spartan Scaffold</p>
        </div>
      `,
    });
  }
}

app.post('/api/scaffold-request', async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }
}, upload.array('files', maxFiles), async (req, res) => {
  try {
    const data = req.body;

    if (!data.companyName || !data.contactPerson || !data.phone || !data.email || !data.projectAddress || !data.requestedService) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.',
      });
    }

    await sendRequestEmail(data, req.files || []);

    res.status(200).json({
      success: true,
      message: 'Your request was submitted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'We could not send your request. Please call us or try again later.',
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Nor-Cal Spartan request form running at http://localhost:${port}`);
});
