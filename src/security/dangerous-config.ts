import { formatIso8601 } from '../shared/index.js'

export type DangerousConfigFinding = {
  code: 'public_bind' | 'weak_operator_token' | 'missing_ai_api_key'
  severity: 'warn' | 'error'
  message: string
}

export type SecurityAuditReport = {
  generated_at: string
  findings: DangerousConfigFinding[]
}

export function detectDangerousConfig(config: {
  host?: string
  appHost?: string
  operatorToken?: string
  aiApiKey?: string
}): DangerousConfigFinding[] {
  const findings: DangerousConfigFinding[] = []
  const host = config.host ?? config.appHost

  if (host === '0.0.0.0') {
    findings.push({
      code: 'public_bind',
      severity: 'warn',
      message: 'APP_HOST binds all interfaces; prefer 127.0.0.1 for local runtime.',
    })
  }

  if (!config.operatorToken || config.operatorToken.trim().length < 12) {
    findings.push({
      code: 'weak_operator_token',
      severity: 'error',
      message: 'OPERATOR_TOKEN is missing or too short for operator mutations.',
    })
  }

  if (!config.aiApiKey || config.aiApiKey.trim().length === 0) {
    findings.push({
      code: 'missing_ai_api_key',
      severity: 'warn',
      message: 'AI_API_KEY is missing; provider readiness will fail.',
    })
  }

  return findings
}

export function generateSecurityAuditReport(config: {
  host?: string
  appHost?: string
  operatorToken?: string
  aiApiKey?: string
}): SecurityAuditReport {
  return {
    generated_at: formatIso8601(new Date()),
    findings: detectDangerousConfig(config),
  }
}

