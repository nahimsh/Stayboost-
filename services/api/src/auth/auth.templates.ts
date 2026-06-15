interface Email {
  subject: string;
  html: string;
}

const wrap = (body: string): string =>
  `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">${body}<p style="margin-top:24px;color:#64748b;font-size:12px">If you didn't request this, you can safely ignore this email.</p></div>`;

const button = (href: string, label: string): string =>
  `<a href="${href}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${label}</a>`;

export function verifyEmailTemplate(name: string, link: string): Email {
  return {
    subject: "Verify your StayBoost email",
    html: wrap(
      `<h2>Welcome to StayBoost, ${escapeHtml(name)}!</h2><p>Confirm your email to activate your account.</p><p>${button(link, "Verify email")}</p><p style="color:#64748b;font-size:12px">This link expires in 24 hours.</p>`,
    ),
  };
}

export function passwordResetTemplate(link: string): Email {
  return {
    subject: "Reset your StayBoost password",
    html: wrap(
      `<h2>Reset your password</h2><p>Click below to choose a new password.</p><p>${button(link, "Reset password")}</p><p style="color:#64748b;font-size:12px">This link expires in 1 hour.</p>`,
    ),
  };
}

export function magicLinkTemplate(link: string): Email {
  return {
    subject: "Your StayBoost login link",
    html: wrap(
      `<h2>Log in to StayBoost</h2><p>Click below to log in. No password needed.</p><p>${button(link, "Log in")}</p><p style="color:#64748b;font-size:12px">This link expires in 15 minutes.</p>`,
    ),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
