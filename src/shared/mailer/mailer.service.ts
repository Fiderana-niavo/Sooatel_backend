import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"] ?? "smtp.gmail.com",
  port: Number(process.env["SMTP_PORT"] ?? 587),
  secure: false,
  auth: {
    user: process.env["SMTP_USER"],
    pass: process.env["SMTP_PASS"],
  },
});

export const MailerService = {
  sendPasswordReset: async (to: string, key: string, username: string): Promise<void> => {
    const resetLink = `${process.env["FRONTEND_URL"] ?? "http://localhost:5173"}/reset-password?key=${key}`;

    await transporter.sendMail({
      from: process.env["SMTP_FROM"] ?? "noreply@sooatel.com",
      to,
      subject: "Réinitialisation de votre mot de passe — Sooatel",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #223c56; margin-bottom: 8px;">Réinitialisation du mot de passe</h2>
          <p style="color: #64748b;">Bonjour <strong>${username}</strong>,</p>
          <p style="color: #64748b;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.
            Ce lien est valable <strong>24 heures</strong>.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #223c56; color: white;
                    text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #94a3b8; font-size: 13px;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 12px;">Sooatel Hôtel — Système de gestion</p>
        </div>
      `,
    });
  },
};
