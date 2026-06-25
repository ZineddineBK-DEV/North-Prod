const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// ── Base send function ────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  console.log(`📧  Email sent to ${to}: ${info.messageId}`);
  return info;
};

// ── Email templates ───────────────────────────────────────
const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #0d0d0d; color: #e0e0e0; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; text-align: center; border-bottom: 2px solid #c0a060; }
    .header h1 { color: #c0a060; margin: 0; font-size: 28px; letter-spacing: 3px; }
    .header p  { color: #888; margin: 5px 0 0; font-size: 12px; letter-spacing: 2px; }
    .body { padding: 35px; }
    .body h2 { color: #c0a060; margin-top: 0; }
    .body p  { line-height: 1.7; color: #ccc; }
    .btn { display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #c0a060, #a08040); color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; letter-spacing: 1px; }
    .footer { text-align: center; padding: 20px; color: #555; font-size: 12px; border-top: 1px solid #2a2a2a; }
    .detail-box { background: #222; border-left: 3px solid #c0a060; padding: 15px 20px; border-radius: 4px; margin: 15px 0; }
    .detail-box p { margin: 5px 0; }
    .detail-label { color: #c0a060; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NORTH PROD</h1>
      <p>STUDIO DE PRODUCTION SON & IMAGE</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NORTH PROD — Ariana Nkhillet, Tunisie</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;

// ── Specific email senders ────────────────────────────────

const sendEmailVerification = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'NORTH PROD — Vérifiez votre adresse email',
    html: baseLayout(`
      <h2>Bienvenue, ${user.aka} ! 🎵</h2>
      <p>Merci de rejoindre NORTH PROD Studio. Pour activer votre compte artiste, veuillez vérifier votre adresse email.</p>
      <a href="${link}" class="btn">Vérifier mon email</a>
      <p style="font-size:12px;color:#666;">Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
    `),
  });
};

const sendPasswordReset = async (user, token) => {
  const link = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'NORTH PROD — Réinitialisation de mot de passe',
    html: baseLayout(`
      <h2>Réinitialisation de mot de passe</h2>
      <p>Bonjour <strong>${user.aka}</strong>,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
      <a href="${link}" class="btn">Réinitialiser mon mot de passe</a>
      <p style="font-size:12px;color:#666;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `),
  });
};

const sendBookingConfirmation = async (user, booking) => {
  const typeLabels = {
    record_hourly:  'Séance Record (Horaire)',
    record_forfait: 'Séance Record (Forfait/Titre)',
    location:       'Location Studio',
    mix_mastering:  'Mixage / Mastering',
  };
  await sendEmail({
    to: user.email,
    subject: `NORTH PROD — Réservation confirmée ✅`,
    html: baseLayout(`
      <h2>Votre réservation est confirmée ! ✅</h2>
      <p>Bonjour <strong>${user.aka}</strong>, nous avons le plaisir de confirmer votre réservation.</p>
      <div class="detail-box">
        <p><span class="detail-label">Type</span><br/>${typeLabels[booking.type]}</p>
        <p><span class="detail-label">Date</span><br/>${new Date(booking.date).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        <p><span class="detail-label">Heure</span><br/>${booking.startTime}${booking.endTime ? ' → ' + booking.endTime : ''}</p>
        <p><span class="detail-label">Montant total</span><br/><strong>${booking.totalPrice} DT</strong></p>
      </div>
      <p>À très bientôt en studio ! 🎵</p>
    `),
  });
};

const sendBookingRejection = async (user, booking, reason) => {
  await sendEmail({
    to: user.email,
    subject: `NORTH PROD — Demande de réservation non disponible`,
    html: baseLayout(`
      <h2>Demande de réservation</h2>
      <p>Bonjour <strong>${user.aka}</strong>,</p>
      <p>Nous sommes désolés de vous informer que votre demande de réservation du <strong>${new Date(booking.date).toLocaleDateString('fr-FR')}</strong> n'a pas pu être confirmée.</p>
      ${reason ? `<div class="detail-box"><p><span class="detail-label">Motif</span><br/>${reason}</p></div>` : ''}
      <p>N'hésitez pas à effectuer une nouvelle réservation pour une autre date.</p>
    `),
  });
};

const sendBookingReminder = async (user, booking) => {
  await sendEmail({
    to: user.email,
    subject: `NORTH PROD — Rappel de séance demain 🎵`,
    html: baseLayout(`
      <h2>Rappel : Séance demain !</h2>
      <p>Bonjour <strong>${user.aka}</strong>, n'oubliez pas votre séance demain.</p>
      <div class="detail-box">
        <p><span class="detail-label">Date</span><br/>${new Date(booking.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</p>
        <p><span class="detail-label">Heure</span><br/>${booking.startTime}</p>
      </div>
      <p>Adresse : Studio NORTH PROD, Ariana Nkhillet</p>
    `),
  });
};

const sendProjectUpdate = async (user, project, comment) => {
  const stageLabels = {
    pending: 'En attente', recording: 'Enregistrement', mixing: 'Mixage',
    mastering: 'Mastering', finalization: 'Finalisation', delivered: 'Livré',
  };
  await sendEmail({
    to: user.email,
    subject: `NORTH PROD — Mise à jour de votre projet "${project.title}"`,
    html: baseLayout(`
      <h2>Mise à jour de projet 🎚️</h2>
      <p>Bonjour <strong>${user.aka}</strong>, votre projet a été mis à jour.</p>
      <div class="detail-box">
        <p><span class="detail-label">Projet</span><br/>${project.title}</p>
        <p><span class="detail-label">Nouvelle étape</span><br/><strong>${stageLabels[project.stage]}</strong></p>
        <p><span class="detail-label">Progression</span><br/>${project.progress}%</p>
        ${comment ? `<p><span class="detail-label">Note de l'ingénieur</span><br/>${comment}</p>` : ''}
      </div>
    `),
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
