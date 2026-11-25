import nodemailer, { Transporter } from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_SECURE,
  APP_URL,
} = process.env;

const FROM = SMTP_FROM || "HtLearn <no-reply@htlearn.local>";
const APP = APP_URL || "http://localhost:5173";

const smtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter: Transporter | null = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER!, pass: SMTP_PASS! },
  });
  console.log("✉️  SMTP configured");
} else {
  console.log("✉️  SMTP not configured — emails will be logged to the console");
}

const send = async (to: string, subject: string, html: string, text: string) => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: FROM,
        to,
        subject,
        html,
        text,
        replyTo: process.env.SMTP_USER,
        headers: {
          // Helps Gmail/Outlook classify as transactional, not bulk.
          "X-Entity-Ref-ID": `htlearn-${Date.now()}`,
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "OOF, AutoReply",
          "List-Unsubscribe": `<mailto:${process.env.SMTP_USER}?subject=Unsubscribe>`,
        },
      });
      return;
    } catch (e: any) {
      console.error("[mailer] send failed:", e.message);
      // fall through to console logging so dev still sees the content
    }
  }
  console.log("───────── EMAIL (not sent) ─────────");
  console.log("To:      ", to);
  console.log("Subject: ", subject);
  console.log(text);
  console.log("───────────────────────────────────");
};

const wrap = (title: string, body: string) => `
<!doctype html>
<html lang="fr">
  <body style="font-family: Inter, system-ui, -apple-system, sans-serif; background:#f8fafc; padding:24px; margin:0;">
    <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">
      <div style="background:#0B0B0B; padding:20px 28px; color:#F5C518; font-weight:900; font-size:22px;">
        Ht<span style="color:#E11D2A;">Learn</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px 0; font-size:20px; color:#0f172a;">${title}</h1>
        ${body}
      </div>
      <div style="background:#f8fafc; padding:16px 28px; font-size:12px; color:#64748b; border-top:1px solid #e2e8f0;">
        HtLearn — Plateforme d'apprentissage de l'École High-Tech.
      </div>
    </div>
  </body>
</html>`;

export const sendWelcomeEmail = async (
  user: { name: string; email: string },
  tempPassword: string
) => {
  const subject = "Bienvenue sur HtLearn — vos identifiants";
  const text = [
    `Bonjour ${user.name},`,
    ``,
    `Un compte HtLearn vient d'être créé pour vous.`,
    ``,
    `Plateforme : ${APP}`,
    `Email      : ${user.email}`,
    `Mot de passe temporaire : ${tempPassword}`,
    ``,
    `Pour des raisons de sécurité, vous devrez changer ce mot de passe dès votre première connexion.`,
    ``,
    `À très bientôt,`,
    `L'équipe HtLearn`,
  ].join("\n");

  const html = wrap(
    `Bienvenue, ${user.name} !`,
    `
    <p style="color:#475569; line-height:1.6;">Un compte HtLearn vient d'être créé pour vous. Voici vos identifiants :</p>
    <table style="margin:16px 0; border-collapse:collapse;">
      <tr><td style="padding:6px 0; color:#64748b;">Email</td><td style="padding:6px 0 6px 16px; font-weight:600;">${user.email}</td></tr>
      <tr><td style="padding:6px 0; color:#64748b;">Mot de passe temporaire</td>
          <td style="padding:6px 0 6px 16px;"><code style="background:#F5C518; color:#0B0B0B; padding:4px 10px; border-radius:6px; font-weight:700; letter-spacing:0.5px;">${tempPassword}</code></td></tr>
    </table>
    <p style="margin-top:20px;">
      <a href="${APP}/login" style="background:#0B0B0B; color:#fff; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:600; display:inline-block;">Se connecter</a>
    </p>
    <p style="color:#94a3b8; font-size:13px; margin-top:24px;">
      Pour des raisons de sécurité, la plateforme vous demandera de changer ce mot de passe dès votre première connexion.
    </p>`
  );

  await send(user.email, subject, html, text);
};

export const sendResetEmail = async (
  user: { name: string; email: string },
  rawToken: string
) => {
  const url = `${APP}/reset-password?token=${rawToken}`;
  const subject = "HtLearn — réinitialisation du mot de passe";
  const text = [
    `Bonjour ${user.name},`,
    ``,
    `Vous avez demandé à réinitialiser votre mot de passe HtLearn.`,
    `Ouvrez ce lien (valide 30 minutes, utilisable une seule fois) :`,
    ``,
    url,
    ``,
    `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  ].join("\n");

  const html = wrap(
    "Réinitialisation du mot de passe",
    `
    <p style="color:#475569; line-height:1.6;">Bonjour ${user.name},</p>
    <p style="color:#475569; line-height:1.6;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Le lien est valide <strong>30 minutes</strong> et ne peut être utilisé qu'une seule fois.</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="background:#F5C518; color:#0B0B0B; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:700; display:inline-block;">Réinitialiser mon mot de passe</a>
    </p>
    <p style="color:#94a3b8; font-size:13px;">Ou copiez ce lien :<br><span style="word-break:break-all;">${url}</span></p>
    <p style="color:#94a3b8; font-size:13px; margin-top:24px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>`
  );

  await send(user.email, subject, html, text);
};

export const sendPasswordResetByAdminEmail = async (
  user: { name: string; email: string },
  tempPassword: string
) => {
  const subject = "HtLearn — votre mot de passe a été réinitialisé";
  const text = [
    `Bonjour ${user.name},`,
    ``,
    `Un administrateur a réinitialisé votre mot de passe.`,
    ``,
    `Plateforme : ${APP}`,
    `Email      : ${user.email}`,
    `Nouveau mot de passe temporaire : ${tempPassword}`,
    ``,
    `Vous devrez le changer dès votre prochaine connexion.`,
  ].join("\n");

  const html = wrap(
    "Mot de passe réinitialisé",
    `
    <p style="color:#475569; line-height:1.6;">Bonjour ${user.name},</p>
    <p style="color:#475569; line-height:1.6;">Un administrateur a réinitialisé votre mot de passe. Voici votre nouveau mot de passe temporaire :</p>
    <p style="margin:16px 0;"><code style="background:#F5C518; color:#0B0B0B; padding:6px 12px; border-radius:6px; font-weight:700; letter-spacing:0.5px;">${tempPassword}</code></p>
    <p style="margin:24px 0;">
      <a href="${APP}/login" style="background:#0B0B0B; color:#fff; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:600; display:inline-block;">Se connecter</a>
    </p>
    <p style="color:#94a3b8; font-size:13px; margin-top:24px;">Vous devrez le changer dès votre prochaine connexion.</p>`
  );

  await send(user.email, subject, html, text);
};
