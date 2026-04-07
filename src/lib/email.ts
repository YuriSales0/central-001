import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendAdminAlert(subject: string, body: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  try {
    await transporter.sendMail({
      from: `"Sistema de Gestão" <noreply@${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'app.com'}>`,
      to: adminEmail,
      subject: `[ALERTA] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc2626">${subject}</h2>
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px">
            ${body}
          </div>
          <p style="color:#6b7280;font-size:12px;margin-top:16px">
            Sistema de Gestão de Propriedades — ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
    })
  } catch (err) {
    // Log erro mas não bloqueia o fluxo principal
    console.error('[email] Falha ao enviar alerta:', err)
  }
}

export async function sendNoCrewAlert(propertyName: string, reservationId: string) {
  await sendAdminAlert(
    `Sem crew disponível — ${propertyName}`,
    `
      <p><strong>Problema:</strong> A reserva <code>${reservationId}</code> na propriedade
      <strong>${propertyName}</strong> foi criada, mas <strong>não há nenhum membro de crew cadastrado</strong>
      para receber as tasks de check-in e check-out.</p>
      <p><strong>Ação necessária:</strong> Cadastre um crew member e atribua manualmente as tasks pendentes.</p>
    `
  )
}
