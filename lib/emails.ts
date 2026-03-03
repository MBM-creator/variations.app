import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('Missing RESEND_API_KEY');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'Variations <noreply@madebymobbs.com.au>';
const STEVE_EMAIL = process.env.STEVE_EMAIL ?? 'steve@madebymobbs.com.au';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://variations.madebymobbs.com.au';

export type Urgency = 'same_day' | 'low' | 'medium' | 'high' | 'cannot_proceed';

function urgencyLabel(u: Urgency): string {
  const map: Record<Urgency, string> = {
    same_day: 'Same day',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    cannot_proceed: 'Cannot proceed until approved',
  };
  return map[u] ?? u;
}

/** Email client when supervisor submits a variation. */
export async function sendClientVariationEmail(params: {
  clientEmail: string;
  siteName: string;
  shortcode: string;
  description: string;
  urgency: Urgency;
  viewLink: string;
}) {
  const { clientEmail, siteName, shortcode, description, urgency, viewLink } = params;
  const subject = `Variation Request – ${siteName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #166534;">Variation Request – ${siteName}</h2>
  <p>You have received a variation request from your site supervisor.</p>
  <p><strong>Description:</strong></p>
  <p>${description.replace(/\n/g, '<br>')}</p>
  <p><strong>Urgency:</strong> ${urgencyLabel(urgency)}</p>
${urgency === 'same_day' ? `
  <p style="margin: 1em 0;"><input type="checkbox" disabled style="vertical-align: middle; margin-right: 6px;"> I acknowledge this variation requires additional or different materials to allow work to proceed and will incur a same day variation fee of $500. This fee will be in addition to any additional materials or labour required to complete the variation.</p>
` : ''}
  <p>Please approve, request edits, or decline via the secure link below.</p>
  <p><a href="${viewLink}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View & respond</a></p>
  <p style="color: #666; font-size: 12px;">Link: ${viewLink}</p>
  <p style="color: #666; font-size: 12px;">Reference: ${shortcode}</p>
</body>
</html>`;
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: clientEmail,
    subject,
    html,
  });
  if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
}

/** Email Steve when client approves. */
export async function sendSteveApprovedEmail(params: {
  siteName: string;
  shortcode: string;
  description: string;
  urgency: Urgency;
  supervisorName: string;
  approvalTimestamp: string;
  approvalIp: string | null;
  adminLink: string;
  imageCount: number;
}) {
  const subject = `Variation Request Approved – ${params.siteName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #166534;">Variation Request Approved</h2>
  <p><strong>Site:</strong> ${params.siteName}</p>
  <p><strong>Supervisor:</strong> ${params.supervisorName}</p>
  <p><strong>Description:</strong></p>
  <p>${params.description.replace(/\n/g, '<br>')}</p>
  <p><strong>Urgency:</strong> ${urgencyLabel(params.urgency)}</p>
  <p><strong>Approved at:</strong> ${params.approvalTimestamp}</p>
  <p><strong>Approval IP:</strong> ${params.approvalIp ?? '—'}</p>
  <p><strong>Images:</strong> ${params.imageCount}</p>
  <p><a href="${params.adminLink}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View full record</a></p>
  <p style="color: #666; font-size: 12px;">Ref: ${params.shortcode}</p>
</body>
</html>`;
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: STEVE_EMAIL,
    subject,
    html,
  });
  if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
}

/** Email Steve when client requests edit. */
export async function sendSteveEditedEmail(params: {
  siteName: string;
  shortcode: string;
  originalDescription: string;
  editedDescription: string;
  editNotes: string;
  editTimestamp: string;
  editIp: string | null;
  adminLink: string;
  addedImageCount: number;
}) {
  const subject = `Variation Edited – Review Required`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #166534;">Variation Edited – Review Required</h2>
  <p><strong>Site:</strong> ${params.siteName}</p>
  <p><strong>Original description:</strong></p>
  <p>${params.originalDescription.replace(/\n/g, '<br>')}</p>
  <p><strong>Edited description:</strong></p>
  <p>${params.editedDescription.replace(/\n/g, '<br>')}</p>
  <p><strong>Edit notes:</strong></p>
  <p>${params.editNotes.replace(/\n/g, '<br>')}</p>
  <p><strong>Edited at:</strong> ${params.editTimestamp}</p>
  <p><strong>Edit IP:</strong> ${params.editIp ?? '—'}</p>
  <p><strong>Additional images:</strong> ${params.addedImageCount}</p>
  <p><a href="${params.adminLink}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View full record</a></p>
  <p style="color: #666; font-size: 12px;">Ref: ${params.shortcode}</p>
</body>
</html>`;
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: STEVE_EMAIL,
    subject,
    html,
  });
  if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
}

/** Email Steve when client declines. */
export async function sendSteveDeclinedEmail(params: {
  siteName: string;
  shortcode: string;
  description: string;
  supervisorName: string;
  approvalTimestamp: string;
  approvalIp: string | null;
  adminLink: string;
}) {
  const subject = `Variation Declined – ${params.siteName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #991b1b;">Variation Declined</h2>
  <p><strong>Site:</strong> ${params.siteName}</p>
  <p><strong>Supervisor:</strong> ${params.supervisorName}</p>
  <p><strong>Description:</strong></p>
  <p>${params.description.replace(/\n/g, '<br>')}</p>
  <p><strong>Declined at:</strong> ${params.approvalTimestamp}</p>
  <p><strong>IP:</strong> ${params.approvalIp ?? '—'}</p>
  <p><a href="${params.adminLink}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View full record</a></p>
  <p style="color: #666; font-size: 12px;">Ref: ${params.shortcode}</p>
</body>
</html>`;
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: STEVE_EMAIL,
    subject,
    html,
  });
  if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
}

export function getViewLink(shortcode: string): string {
  return `${BASE_URL}/v/${shortcode}`;
}

export function getAdminLink(shortcode: string): string {
  return `${BASE_URL}/v/${shortcode}`;
}
