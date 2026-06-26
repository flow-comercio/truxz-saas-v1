import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.truxz.com.br',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: { rejectUnauthorized: false },
})

const FROM = `"TRUXZ" <${process.env.SMTP_USER || 'sac@truxz.com.br'}>`

export async function enviarEmail({
  para,
  assunto,
  html,
}: {
  para: string
  assunto: string
  html: string
}) {
  if (!process.env.SMTP_PASS) {
    console.log('[MAILER] SMTP não configurado — email não enviado:', { para, assunto })
    return { messageId: 'dev-mode' }
  }
  return transporter.sendMail({ from: FROM, to: para, subject: assunto, html })
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const emailRecuperacaoSenha = (nome: string, link: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#9D4EDD,#7B2FBE);padding:32px 32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">TRUXZ</h1>
      <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px">Gestão para Serviços Automotivos</p>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Redefinição de senha</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        Olá, <strong>${nome}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta.
      </p>
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#9D4EDD,#7B2FBE);color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">
        Redefinir minha senha
      </a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">Este link expira em <strong>1 hora</strong>. Se você não solicitou, ignore este e-mail.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#9ca3af">sac@truxz.com.br · truxz.com.br</p>
    </div>
  </div>
</body>
</html>
`

export const emailVerificacaoCadastro = (nome: string, nomeLoja: string, link: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#9D4EDD,#7B2FBE);padding:32px 32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">TRUXZ</h1>
      <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px">Gestão para Serviços Automotivos</p>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Confirme seu e-mail</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px">
        Olá, <strong>${nome}</strong>! Sua loja <strong>${nomeLoja}</strong> foi criada com sucesso.
      </p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        Clique no botão abaixo para confirmar seu e-mail e liberar o acesso ao painel.
      </p>
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#9D4EDD,#7B2FBE);color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">
        Confirmar meu e-mail
      </a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
        Este link expira em <strong>24 horas</strong>. Se você não criou uma conta no TRUXZ, ignore este e-mail.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#9ca3af">sac@truxz.com.br · truxz.com.br</p>
    </div>
  </div>
</body>
</html>
`

export const emailBoasVindas = (nome: string, nomeLoja: string, slug: string, adminEmail: string) => {
  const BASE_DOMAIN = process.env.BASE_DOMAIN || 'truxz.com.br'
  const linkAdmin = `https://${slug}.${BASE_DOMAIN}/login`
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#9D4EDD,#7B2FBE);padding:32px 32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">TRUXZ</h1>
      <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px">Gestão para Serviços Automotivos</p>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:18px;color:#111827;margin:0 0 8px">Sua loja está no ar!</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px">
        Olá, <strong>${nome}</strong>! O e-mail foi confirmado e a loja <strong>${nomeLoja}</strong> está pronta para uso.
        Você tem <strong>14 dias de trial gratuito</strong>.
      </p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#374151"><strong>🌐 Link público:</strong></p>
        <a href="https://${slug}.${BASE_DOMAIN}" style="color:#9D4EDD;font-weight:700;font-size:13px">
          https://${slug}.${BASE_DOMAIN}
        </a>
        <p style="margin:16px 0 8px;font-size:13px;color:#374151"><strong>🔐 Painel admin:</strong></p>
        <a href="${linkAdmin}" style="color:#9D4EDD;font-weight:700;font-size:13px">${linkAdmin}</a>
        <p style="margin:16px 0 4px;font-size:13px;color:#374151"><strong>📧 E-mail:</strong> ${adminEmail}</p>
      </div>
      <a href="${linkAdmin}" style="display:inline-block;background:linear-gradient(135deg,#9D4EDD,#7B2FBE);color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">
        Acessar meu painel
      </a>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#9ca3af">sac@truxz.com.br · truxz.com.br</p>
    </div>
  </div>
</body>
</html>
`
}
