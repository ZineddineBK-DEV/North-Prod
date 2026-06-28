const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM, to, subject, html, text,
  });
  console.log(`📧  Email sent to ${to}: ${info.messageId}`);
  return info;
};

// ── Outlook-safe base layout (table-based, inline CSS) ────
const baseLayout = (content) => `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <title>NORTH PRODUCTION</title>
  <style>
    body, html { margin:0; padding:0; background:#0d0d0d; }
    body { font-family: Arial, Helvetica, sans-serif !important; }
    img  { border:0; display:block; }
    a    { color:#c0a060; }
    @media only screen and (max-width:600px) {
      .email-wrapper { width:100% !important; }
      .content-cell  { padding:24px 16px !important; }
      .btn-cell      { padding:8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#0d0d0d;min-width:100%;">
  <tr>
    <td align="center" style="padding:32px 8px;">

      <!-- Email card -->
      <table class="email-wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0"
             border="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#161616;border-bottom:2px solid #c0a060;padding:28px 40px;text-align:center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <!-- Logo text fallback (works in all clients) -->
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:bold;letter-spacing:6px;color:#c0a060;">NORTH PRODUCTION</p>
                  <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:4px;color:#888888;text-transform:uppercase;">Studio de Production Son &amp; Image</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="content-cell" style="padding:36px 40px;font-family:Arial,Helvetica,sans-serif;">
            ${content}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:1px solid #2a2a2a;font-size:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;">
            <p style="margin:0 0 4px;">© ${new Date().getFullYear()} NORTH PRODUCTION — Ariana Nkhillet, Tunisie</p>
            <p style="margin:0;font-size:11px;color:#444444;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </td>
        </tr>

      </table>
      <!-- /Email card -->

    </td>
  </tr>
</table>
</body>
</html>`;

// ── Reusable button block (table-based for Outlook) ────────
const btnBlock = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td class="btn-cell" align="left">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%"
        strokecolor="#c0a060" fillcolor="#c0a060">
        <w:anchorlock/>
        <center style="color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;">
          ${label}
        </center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}"
         style="display:inline-block;padding:14px 32px;background:#c0a060;color:#000000;
                text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                font-weight:bold;letter-spacing:1px;border-radius:6px;mso-hide:all;">
        ${label}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;

// ── Detail box ────────────────────────────────────────────
const detailBox = (rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#222222;border-left:3px solid #c0a060;border-radius:4px;margin:16px 0;">
  <tr><td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
    ${rows}
  </td></tr>
</table>`;

const detailRow = (label, value) => `
<p style="margin:6px 0;">
  <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;text-transform:uppercase;
               letter-spacing:1px;color:#c0a060;">${label}</span><br/>
  <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#cccccc;">${value}</span>
</p>`;

const bodyText = (text) =>
  `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#cccccc;margin:0 0 12px;">${text}</p>`;

const bodyH2 = (text) =>
  `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#c0a060;margin:0 0 16px;">${text}</h2>`;

const smallText = (text) =>
  `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;margin:12px 0 0;">${text}</p>`;

// ── Email senders ─────────────────────────────────────────

const sendEmailVerification = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'NORTH PRODUCTION — Vérifiez votre adresse email',
    html: baseLayout(`
      ${bodyH2('Bienvenue, ' + user.aka + ' !')}
      ${bodyText('Merci de rejoindre NORTH PRODUCTION Studio. Pour activer votre compte artiste, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.')}
      ${btnBlock(link, 'Vérifier mon email')}
      ${smallText('Ce lien expire dans <strong>24 heures</strong>. Si vous n\'êtes pas à l\'origine de cette inscription, ignorez cet email.')}
      ${smallText('Ou copiez ce lien dans votre navigateur :<br/><a href="${link}" style="color:#888888;font-size:11px;word-break:break-all;">${link}</a>')}
    `),
    text: `Bonjour ${user.aka},\n\nVérifiez votre email ici : ${link}\n\nCe lien expire dans 24h.`,
  });
};

const sendPasswordReset = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'NORTH PRODUCTION — Réinitialisation de mot de passe',
    html: baseLayout(`
      ${bodyH2('Réinitialisation de mot de passe')}
      ${bodyText('Bonjour <strong style="color:#e0e0e0;">' + user.aka + '</strong>,')}
      ${bodyText('Vous avez demandé la réinitialisation de votre mot de passe NORTH PRODUCTION. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.')}
      ${btnBlock(link, 'Réinitialiser mon mot de passe')}
      ${smallText('Ce lien expire dans <strong>1 heure</strong>. Si vous n\'avez pas fait cette demande, ignorez cet email — votre compte est en sécurité.')}
    `),
    text: `Bonjour ${user.aka},\n\nRéinitialisez votre mot de passe ici : ${link}\n\nCe lien expire dans 1h.`,
  });
};

const sendBookingConfirmation = async (user, booking) => {
  const typeLabels = {
    record_hourly:  'Séance Record (Horaire)',
    record_forfait: 'Séance Record (Forfait / Titre)',
    location:       'Location Studio',
    mix_mastering:  'Mixage / Mastering',
  };
  const dateStr = new Date(booking.date).toLocaleDateString('fr-FR', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });
  await sendEmail({
    to: user.email,
    subject: 'NORTH PRODUCTION — Réservation confirmée ✅',
    html: baseLayout(`
      ${bodyH2('Votre réservation est confirmée !')}
      ${bodyText('Bonjour <strong style="color:#e0e0e0;">' + user.aka + '</strong>, nous avons le plaisir de confirmer votre réservation en studio.')}
      ${detailBox(`
        ${detailRow('Type de séance', typeLabels[booking.type] || booking.type)}
        ${detailRow('Date', dateStr)}
        ${detailRow('Heure', booking.startTime + (booking.endTime ? ' → ' + booking.endTime : ''))}
        ${detailRow('Montant total', '<strong>' + booking.totalPrice + ' DT</strong>')}
      `)}
      ${bodyText('À très bientôt en studio !')}
    `),
    text: `Bonjour ${user.aka},\n\nRéservation confirmée pour le ${dateStr} à ${booking.startTime}. Montant : ${booking.totalPrice} DT.`,
  });
};

const sendBookingRejection = async (user, booking, reason) => {
  const dateStr = new Date(booking.date).toLocaleDateString('fr-FR');
  await sendEmail({
    to: user.email,
    subject: 'NORTH PRODUCTION — Demande de réservation non disponible',
    html: baseLayout(`
      ${bodyH2('Demande de réservation')}
      ${bodyText('Bonjour <strong style="color:#e0e0e0;">' + user.aka + '</strong>,')}
      ${bodyText('Nous sommes désolés de vous informer que votre demande de réservation du <strong style="color:#e0e0e0;">' + dateStr + '</strong> n\'a pas pu être confirmée.')}
      ${reason ? detailBox(detailRow('Motif', reason)) : ''}
      ${bodyText('N\'hésitez pas à effectuer une nouvelle réservation pour une autre date.')}
    `),
    text: `Bonjour ${user.aka},\n\nVotre réservation du ${dateStr} n'a pas pu être confirmée.${reason ? '\nMotif : ' + reason : ''}`,
  });
};

const sendBookingReminder = async (user, booking) => {
  const dateStr = new Date(booking.date).toLocaleDateString('fr-FR', {
    weekday:'long', day:'numeric', month:'long',
  });
  await sendEmail({
    to: user.email,
    subject: 'NORTH PRODUCTION — Rappel de séance demain 🎵',
    html: baseLayout(`
      ${bodyH2('Rappel : Séance demain !')}
      ${bodyText('Bonjour <strong style="color:#e0e0e0;">' + user.aka + '</strong>, n\'oubliez pas votre séance demain.')}
      ${detailBox(`
        ${detailRow('Date', dateStr)}
        ${detailRow('Heure', booking.startTime)}
        ${detailRow('Adresse', 'Studio NORTH PRODUCTION, Ariana Nkhillet, Tunisie')}
      `)}
      ${bodyText('Pensez à arriver 10 minutes avant l\'heure prévue. À demain !')}
    `),
    text: `Bonjour ${user.aka},\n\nRappel : séance le ${dateStr} à ${booking.startTime}.\nAdresse : Studio NORTH PRODUCTION, Ariana Nkhillet.`,
  });
};

const sendProjectUpdate = async (user, project, comment) => {
  const stageLabels = {
    pending:      'En attente',
    recording:    'Enregistrement',
    mixing:       'Mixage',
    mastering:    'Mastering',
    finalization: 'Finalisation',
    delivered:    'Livré ✅',
  };
  await sendEmail({
    to: user.email,
    subject: `NORTH PRODUCTION — Mise à jour de votre projet "${project.title}"`,
    html: baseLayout(`
      ${bodyH2('Mise à jour de projet')}
      ${bodyText('Bonjour <strong style="color:#e0e0e0;">' + user.aka + '</strong>, votre projet a été mis à jour.')}
      ${detailBox(`
        ${detailRow('Projet', project.title)}
        ${detailRow('Nouvelle étape', '<strong>' + (stageLabels[project.stage] || project.stage) + '</strong>')}
        ${detailRow('Progression', project.progress + '%')}
        ${comment ? detailRow("Note de l'ingénieur", comment) : ''}
      `)}
      ${bodyText('Connectez-vous à votre espace artiste pour consulter le détail de votre projet.')}
    `),
    text: `Bonjour ${user.aka},\n\nProjet "${project.title}" mis à jour.\nÉtape : ${stageLabels[project.stage] || project.stage} (${project.progress}%)${comment ? '\nNote : ' + comment : ''}`,
  });
};

module.exports = {
  sendEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendBookingConfirmation,
  sendBookingRejection,
  sendBookingReminder,
  sendProjectUpdate,
};
