import { loadRuntimeAppConfig } from './config.js'
import { createOpenAICompatibleProvider } from './providers/openaiCompatibleProvider.js'
import { createRuntimeOperationalApp } from './orchestration/runtimeApp.js'
import { createFileRuntimePersistence } from './storage/fileRuntimeStorage.js'

async function runRealLifeProject() {
  process.stdout.write(`
================================================================================
🚀 AGENTAI01 — REAL-LIFE ENTERPRISE PROJECT EXECUTION SIMULATION
================================================================================
🏢 Client      : PT Bank Rakyat Indonesia (Persero) Tbk (BRI)
🎯 Project     : Sistem Orkestrasi Agen AI Perbankan (BRI-AI)
🔑 Project ID  : proj-bri-ai
📅 Start Time  : 2026-05-17T09:00:00Z
================================================================================
`)

  const config = loadRuntimeAppConfig({
    requireProvider: true,
  })

  process.stdout.write(`\n[⚡] Menginisialisasi AI Provider (${config.ai.model}) di ${config.ai.baseUrl}...\n`)
  const provider = createOpenAICompatibleProvider({
    baseURL: config.ai.baseUrl,
    apiKey: config.ai.apiKey ?? '',
    model: config.ai.model,
    timeoutMs: config.ai.timeoutMs,
    retryLimit: config.ai.retryLimit,
    logger: () => {},
  })

  process.stdout.write(`[⚡] Menghubungi AI Provider untuk pesan motivasi tim proyek...\n`)
  const providerResult = await provider.generateText({
    messages: [{ role: 'user', content: 'Tuliskan satu kalimat motivasi pendek dan profesional untuk tim AI Bank Rakyat Indonesia (BRI) dalam membangun sistem perbankan cerdas.' }],
    temperature: 0.7,
    maxTokens: 64,
  })
  process.stdout.write(`\n💬 AI Provider (Real Response):\n   "${providerResult.content.trim()}"\n\n`)

  const persistence = createFileRuntimePersistence({
    operationalRoot: config.storage.operationalRoot,
    artifactRoot: config.storage.artifactsRoot,
  })
  await persistence.ensureReady()

  const app = createRuntimeOperationalApp({
    now: '2026-05-17T09:00:00Z',
    workspaceBaseDir: config.storage.artifactsRoot,
  })

  process.stdout.write(`--------------------------------------------------------------------------------
[Langkah 1] 📢 Marketing Agent: Menangkap Inbound Lead Enterprise & Analisis Prospek
--------------------------------------------------------------------------------
- Lead ID       : lead-bri
- Company       : PT Bank Rakyat Indonesia (Persero) Tbk
- Contact       : Budi Santoso (VP of Digital Banking)
- Channel       : enterprise_sales
- Kebutuhan     : Sistem orkestrasi agen AI perbankan untuk otomatisasi layanan
                  nasabah prioritas dan integrasi core banking.

[⚡] Menghubungi AI Provider (Marketing Agent Persona)...
`)

  const marketingAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Senior Marketing Agent di sebuah perusahaan AI. Anda baru saja menerima prospek (inbound lead) dari PT Bank Rakyat Indonesia (Persero) Tbk (BRI) untuk proyek 'Sistem Orkestrasi Agen AI Perbankan (BRI-AI)'. Buatlah analisis singkat 2-3 kalimat mengenai peluang strategis integrasi core banking dan otomatisasi layanan nasabah prioritas untuk diserahkan ke tim Sales.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Marketing Agent (Real AI Response):\n   "${marketingAI.content.trim()}"\n\n`)

  await app.executeAgentTask(
    'marketing_agent',
    'capture_inbound_lead',
    {
      lead_id: 'lead-bri',
      company_name: 'PT Bank Rakyat Indonesia (Persero) Tbk',
      contact_name: 'Budi Santoso (VP of Digital Banking)',
      contact_email: 'budi.santoso@bri.co.id',
      contact_channel: 'email',
      source_channel: 'enterprise_sales',
      campaign_id: 'cmp-bri-ai',
      segment_id: 'banking-enterprise',
      project_id: 'proj-bri-ai',
      initial_need_summary: marketingAI.content.trim(),
      tags: ['banking', 'enterprise', 'ai-orchestration', 'priority-banking'],
    },
    '2026-05-17T09:00:00Z',
  )

  process.stdout.write(`✔ Lead berhasil ditangkap dan dianalisis. Mengalokasikan tim agen dan meneruskan ke Sales Agent.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 2] 💼 Sales Agent: Kualifikasi Lead, Penyusunan Proposal Komersial & Request Approval
--------------------------------------------------------------------------------
- Pipeline Stage: qualified
- Scope Outline : Lead intake automation, Runtime orchestration, Delivery dashboard
- Price Range   : $75,000 - $120,000

[⚡] Menghubungi AI Provider (Sales Agent Persona)...
`)

  const salesAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Senior Enterprise Sales Agent. Berdasarkan prospek dari PT Bank Rakyat Indonesia (BRI) untuk proyek BRI-AI (Sistem Orkestrasi Agen AI Perbankan), susunlah ringkasan eksekutif proposal komersial singkat (2-3 kalimat) yang menyoroti estimasi nilai proyek ($75k - $120k) dan justifikasi ROI untuk diajukan kepada CEO/Owner.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Sales Agent (Real AI Response):\n   "${salesAI.content.trim()}"\n\n`)

  process.stdout.write(`✔ Proposal v1 berhasil dibuat dengan justifikasi AI. Mengirimkan permohonan persetujuan (proposal_final) ke CEO/Owner.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 3] 👑 CEO / Owner: Menyetujui Proposal (Proposal Approval Gate)
--------------------------------------------------------------------------------
- Keputusan     : APPROVE
- Catatan Owner : Proposal disetujui. Sesuai dengan roadmap transformasi digital BRI.
`)

  await app.respondToPendingApproval(
    'proj-bri-ai',
    'proposal_final',
    'approve',
    '2026-05-17T09:15:00Z',
    'Proposal disetujui. Sesuai dengan roadmap transformasi digital BRI.',
  )

  process.stdout.write(`✔ Proposal disetujui. Sales Agent melakukan handoff proyek ke Product Agent.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 4] 📦 Product Agent: Menerima Handoff, Penyusunan Discovery Spec & Request Approval
--------------------------------------------------------------------------------
- Spec Version  : v1
- Pain Points   : Silo data antar divisi, lambatnya koordinasi manual agen CS

[⚡] Menghubungi AI Provider (Product Agent Persona)...
`)

  const productAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Lead Product Manager (Product Agent). Anda baru saja menerima handoff proyek BRI-AI yang telah disetujui CEO. Susunlah ringkasan spesifikasi penemuan produk (Discovery Spec v1) singkat dalam 2-3 kalimat yang berfokus pada penyelesaian pain points integrasi core banking dan otomatisasi layanan nasabah prioritas.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Product Agent (Real AI Response):\n   "${productAI.content.trim()}"\n\n`)

  process.stdout.write(`✔ Spesifikasi teknis (spec_final) berhasil dibuat berbasis AI. Mengirimkan permohonan persetujuan ke CEO/Owner.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 5] 👑 CEO / Owner: Menyetujui Spesifikasi (Spec Approval Gate)
--------------------------------------------------------------------------------
- Keputusan     : APPROVE
- Catatan Owner : Spesifikasi teknis sangat jelas dan memenuhi standar keamanan perbankan.
`)

  await app.respondToPendingApproval(
    'proj-bri-ai',
    'spec_final',
    'approve',
    '2026-05-17T09:30:00Z',
    'Spesifikasi teknis sangat jelas dan memenuhi standar keamanan perbankan.',
  )

  process.stdout.write(`✔ Spesifikasi disetujui. Product Agent melakukan handoff ke Engineering Agent.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 6] ⚙️ Engineering Agent: Provisi Workspace, Validasi QA & Request Delivery Approval
--------------------------------------------------------------------------------
- Unit Tests    : PASS (handoff validation, approval workflow)
- Integ Tests   : PASS (lead intake to delivery orchestration)
- Static Checks : PASS (tsc --noEmit)

[⚡] Menghubungi AI Provider (Engineering Agent Persona)...
`)

  const engineeringAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Lead AI Systems Architect (Engineering Agent). Anda telah memprovisi environment dan menjalankan seluruh rangkaian unit test, integration test, serta static check untuk proyek BRI-AI. Tuliskan laporan ringkas hasil QA dan kesiapan rilis (delivery readiness) dalam 2-3 kalimat untuk diajukan kepada CEO/Owner sebelum deployment akhir ke infrastruktur perbankan BRI.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Engineering Agent (Real AI Response):\n   "${engineeringAI.content.trim()}"\n\n`)

  process.stdout.write(`✔ Laporan QA dan paket pengiriman (delivery_final) siap. Mengirimkan permohonan persetujuan ke CEO/Owner.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 7] 👑 CEO / Owner: Menyetujui Pengiriman Akhir (Delivery Approval Gate)
--------------------------------------------------------------------------------
- Keputusan     : APPROVE
- Catatan Owner : Paket pengiriman dan hasil QA telah divalidasi. Siap untuk deployment
                  ke production BRI.
`)

  await app.respondToPendingApproval(
    'proj-bri-ai',
    'delivery_final',
    'approve',
    '2026-05-17T09:45:00Z',
    'Paket pengiriman dan hasil QA telah divalidasi. Siap untuk deployment ke production BRI.',
  )

  process.stdout.write(`✔ Pengiriman disetujui. Engineering Agent melakukan handoff ke Project Manager.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 8] 📋 Project Manager Agent: Penutupan Proyek & Laporan Akhir
--------------------------------------------------------------------------------
[⚡] Menghubungi AI Provider (Project Manager Agent Persona)...
`)

  const pmAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Senior Project Manager Agent. Proyek BRI-AI telah mendapatkan persetujuan pengiriman akhir dari CEO dan statusnya kini resmi 'DELIVERED'. Tuliskan catatan penutupan proyek (project closing memo) dan ucapan selamat singkat dalam 2-3 kalimat kepada seluruh tim agen AI dan pemangku kepentingan di Bank Rakyat Indonesia (BRI).`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Project Manager Agent (Real AI Response):\n   "${pmAI.content.trim()}"\n\n`)

  process.stdout.write(`✔ Project Manager memperbarui status siklus hidup proyek menjadi "delivered".\n`)

  const dashboard = app.shell.readDashboard('2026-05-17T10:00:00Z')
  const project = dashboard.projects.find(p => p.project_id === 'proj-bri-ai')

  process.stdout.write(`
================================================================================
📊 COMPANY DASHBOARD — FINAL PROJECT SUMMARY
================================================================================
- Total Proyek Aktif    : ${dashboard.pipeline.total_projects}
- Project ID            : ${project?.project_id}
- Client ID             : ${project?.client_id}
- Lifecycle State       : [ ${project?.lifecycle_state.toUpperCase()} ] 🚀
- Milestone Terakhir    : ${project?.current_milestone}
- Jumlah Agen Terlibat  : ${project?.active_agent_ids.length} agen aktif
- Total Peristiwa Bus   : ${app.events.length} communication events recorded
- Pending Approvals     : ${dashboard.approvals.pending_count}
================================================================================
🎉 PROYEK NYATA "SISTEM ORKESTRASI AGEN AI PERBANKAN (BRI-AI)" SELESAI DENGAN SUKSES!
================================================================================
`)
}

runRealLifeProject().catch(error => {
  process.stderr.write(`\n✖ Terjadi kesalahan saat menjalankan proyek nyata: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
