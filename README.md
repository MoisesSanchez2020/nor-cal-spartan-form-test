# Nor-Cal Spartan Scaffold — Customer Request Form

A complete website form with image/file upload and backend email sending.

## What it does

- Customer fills out scaffold request form
- Customer uploads photos, PDFs, plans, or drawings
- Backend sends the request to 4 emails
- Uploaded files are attached to the email
- Customer sees success/error message

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Then open:

```txt
http://localhost:3001
```

## Important

Edit `.env` and replace:

```env
SMTP_USER=info@norcalspartanscaffold.com
SMTP_PASS=PUT_YOUR_EMAIL_PASSWORD_HERE
MAIL_TO=moises@norcalspartanscaffold.com,office@norcalspartanscaffold.com,estimating@norcalspartanscaffold.com,dispatch@norcalspartanscaffold.com
```

For Hostinger email, use:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
```

## Accepted uploads

- JPG
- PNG
- WEBP
- PDF
- DWG
- DOC / DOCX
- XLS / XLSX

Default max: 10 files, 25MB each.
# nor-cal-spartan-form
