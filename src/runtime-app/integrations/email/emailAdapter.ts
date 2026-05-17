import nodemailer, { type Transporter } from 'nodemailer'

export type EmailClient = Pick<Transporter, 'sendMail'>

export function createEmailAdapter(config: nodemailer.TransportOptions | undefined, client?: EmailClient): {
  enabled: boolean
  send: (to: string, subject: string, text: string) => Promise<void>
} {
  const sdk = client ?? (config ? nodemailer.createTransport(config) : undefined)

  return {
    enabled: sdk !== undefined,
    async send(to, subject, text) {
      if (!sdk) {
        throw new Error('Email integration is not configured')
      }

      await sdk.sendMail({
        to,
        subject,
        text,
      })
    },
  }
}
