// ─────────────────────────────────────────────
// Aethra Waitlist — Google Apps Script
// Deploy as: Web App → Execute as Me → Anyone
// ─────────────────────────────────────────────

const SHEET_ID   = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Waitlist';
const ADMIN_EMAIL = 'aethraglobal@gmail.com';

// ── Receives form submissions from the website ──
function doPost(e) {
  try {
    const name  = (e.parameter.name  || '').trim();
    const email = (e.parameter.email || '').trim();

    if (!email) {
      return respond({ success: false, error: 'no email provided' });
    }

    // Write to sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found');
    sheet.appendRow([new Date(), name, email]);

    // Notify admin
    MailApp.sendEmail(
      ADMIN_EMAIL,
      'new aethra waitlist signup',
      'name: ' + (name || '(none)') + '\nemail: ' + email
    );

    // Confirmation to subscriber
    MailApp.sendEmail({
      to: email,
      subject: "you're on the aethra waitlist",
      htmlBody: confirmationEmail(name)
    });

    return respond({ success: true });

  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ── Run this from the Apps Script editor to notify everyone ──
function notifyWaitlist() {
  const subject  = 'aethra is live';
  const message  = 'we are ready. [edit this message before running]';

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();

  rows.slice(1).forEach(function(row) {   // row[0]=timestamp, row[1]=name, row[2]=email
    const name  = row[1] || '';
    const email = row[2] || '';
    if (!email) return;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: liveEmail(name, message)
    });
  });

  Logger.log('Notified ' + (rows.length - 1) + ' subscribers.');
}

// ── Helpers ──
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function confirmationEmail(name) {
  return [
    '<div style="font-family:monospace;max-width:480px;padding:32px 0;color:#1a1207;">',
    '<p>hi ' + (name || 'there') + ',</p>',
    '<p>you are on the aethra waitlist. we will reach out when research fellowships,',
    'mentorship programs, and applications open.</p>',
    '<p>in the meantime, join the community on Discord:</p>',
    '<p><a href="https://discord.gg/89RvqhYPez" style="color:#0077cc;">discord.gg/89RvqhYPez</a></p>',
    '<p style="margin-top:32px;">— aethra</p>',
    '</div>'
  ].join('');
}

function liveEmail(name, message) {
  return [
    '<div style="font-family:monospace;max-width:480px;padding:32px 0;color:#1a1207;">',
    '<p>hi ' + (name || 'there') + ',</p>',
    '<p>' + message + '</p>',
    '<p style="margin-top:32px;">— aethra</p>',
    '</div>'
  ].join('');
}
