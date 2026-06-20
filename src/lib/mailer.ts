import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function enviarEmail({
  para,
  assunto,
  html,
}: {
  para: string
  assunto: string
  html: string
}) {
  if (!process.env.SMTP_USER) {
    console.log('[MAILER] SMTP não configurado — email não enviado:', { para, assunto })
    return { messageId: 'dev-mode' }
  }
  return transporter.sendMail({
    from: `"TRUXZ" <${process.env.SMTP_USER}>`,
    to: para,
    subject: assunto,
    html,
  })
}

export const emailRecuperacaoSenha = (nome: string, link: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="background:#ea580c;padding:32px 32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">🚗 TRUXZ</h1>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Redefinição de senha</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Olá, <strong>${nome}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <a href="${link}" style="display:inline-block;background:#ea580c;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">Redefinir minha senha</a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">Este link expira em <strong>1 hora</strong>. Se você não solicitou, ignore este email.</p>
    </div>
  </div>
</body>
</html>
`
