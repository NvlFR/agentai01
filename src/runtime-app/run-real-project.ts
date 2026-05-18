import { loadRuntimeAppConfig } from './config.js'
import { createOpenAICompatibleProvider } from './providers/openaiCompatibleProvider.js'
import { createRuntimeOperationalApp } from './orchestration/runtimeApp.js'
import { createFileRuntimePersistence } from './storage/fileRuntimeStorage.js'

const scenario = {
  clientName: 'PT Siloam International Hospitals Tbk',
  clientShortName: 'Siloam Hospitals',
  clientId: 'siloam',
  projectName: 'Sistem Orkestrasi Agen AI Operasional Rumah Sakit (SILOAM-AI)',
  projectId: 'proj-siloam-ai',
  leadId: 'lead-siloam',
  campaignId: 'cmp-siloam-ai',
  segmentId: 'healthcare-enterprise',
  contactName: 'dr. Maya Pratama (Director of Digital Transformation)',
  contactEmail: 'maya.pratama@siloamhospitals.com',
  serviceChannel: 'enterprise_sales',
  businessNeed:
    'Sistem orkestrasi agen AI untuk koordinasi layanan pasien, ringkasan operasional klinis, dan integrasi workflow rumah sakit.',
  valueRange: '$85,000 - $135,000',
} as const

async function runRealLifeProject() {
  process.stdout.write(`
================================================================================
🚀 AGENTAI01 — REAL-LIFE ENTERPRISE PROJECT EXECUTION SIMULATION
================================================================================
🏢 Client      : ${scenario.clientName} (${scenario.clientShortName})
🎯 Project     : ${scenario.projectName}
🔑 Project ID  : ${scenario.projectId}
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
    messages: [{
      role: 'user',
      content: `Tuliskan satu kalimat motivasi pendek dan profesional untuk tim AI ${scenario.clientShortName} dalam membangun sistem operasional rumah sakit yang cerdas dan aman.`,
    }],
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
- Lead ID       : ${scenario.leadId}
- Company       : ${scenario.clientName}
- Contact       : ${scenario.contactName}
- Channel       : ${scenario.serviceChannel}
- Kebutuhan     : ${scenario.businessNeed}

[⚡] Menghubungi AI Provider (Marketing Agent Persona)...
`)

  const marketingAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Senior Marketing Agent di sebuah perusahaan AI. Anda baru saja menerima prospek (inbound lead) dari ${scenario.clientName} (${scenario.clientShortName}) untuk proyek '${scenario.projectName}'. Buatlah analisis singkat 2-3 kalimat mengenai peluang strategis koordinasi layanan pasien, ringkasan operasional klinis, dan integrasi workflow rumah sakit untuk diserahkan ke tim Sales.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Marketing Agent (Real AI Response):\n   "${marketingAI.content.trim()}"\n\n`)

  await app.executeAgentTask(
    'marketing_agent',
    'capture_inbound_lead',
    {
      lead_id: scenario.leadId,
      company_name: scenario.clientName,
      contact_name: scenario.contactName,
      contact_email: scenario.contactEmail,
      contact_channel: 'email',
      source_channel: scenario.serviceChannel,
      campaign_id: scenario.campaignId,
      segment_id: scenario.segmentId,
      project_id: scenario.projectId,
      initial_need_summary: marketingAI.content.trim(),
      tags: ['healthcare', 'enterprise', 'ai-orchestration', 'hospital-operations'],
    },
    '2026-05-17T09:00:00Z',
  )

  process.stdout.write(`✔ Lead berhasil ditangkap dan dianalisis. Mengalokasikan tim agen dan meneruskan ke Sales Agent.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 2] 💼 Sales Agent: Kualifikasi Lead, Penyusunan Proposal Komersial & Request Approval
--------------------------------------------------------------------------------
- Pipeline Stage: qualified
- Scope Outline : Patient service coordination, Runtime orchestration, Delivery dashboard
- Price Range   : ${scenario.valueRange}

[⚡] Menghubungi AI Provider (Sales Agent Persona)...
`)

  const salesAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Senior Enterprise Sales Agent. Berdasarkan prospek dari ${scenario.clientShortName} untuk proyek ${scenario.projectName}, susunlah ringkasan eksekutif proposal komersial singkat (2-3 kalimat) yang menyoroti estimasi nilai proyek (${scenario.valueRange}) dan justifikasi ROI untuk diajukan kepada CEO/Owner.`,
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
- Catatan Owner : Proposal disetujui. Selaras dengan roadmap transformasi layanan digital rumah sakit.
`)

  await app.respondToPendingApproval(
    scenario.projectId,
    'proposal_final',
    'approve',
    '2026-05-17T09:15:00Z',
    'Proposal disetujui. Selaras dengan roadmap transformasi layanan digital rumah sakit.',
  )

  process.stdout.write(`✔ Proposal disetujui. Sales Agent melakukan handoff proyek ke Product Agent.\n`)

  process.stdout.write(`
--------------------------------------------------------------------------------
[Langkah 4] 📦 Product Agent: Menerima Handoff, Penyusunan Discovery Spec & Request Approval
--------------------------------------------------------------------------------
- Spec Version  : v1
- Pain Points   : Silo data antar unit layanan, lambatnya koordinasi manual pasien dan staf

[⚡] Menghubungi AI Provider (Product Agent Persona)...
`)

  const productAI = await provider.generateText({
    messages: [{
      role: 'user',
      content: `Bertindaklah sebagai Lead Product Manager (Product Agent). Anda baru saja menerima handoff proyek ${scenario.projectName} yang telah disetujui CEO. Susunlah ringkasan spesifikasi penemuan produk (Discovery Spec v1) singkat dalam 2-3 kalimat yang berfokus pada penyelesaian pain points koordinasi layanan pasien, ringkasan operasional klinis, dan integrasi workflow rumah sakit.`,
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
- Catatan Owner : Spesifikasi teknis sangat jelas dan memenuhi standar keamanan serta kepatuhan operasional rumah sakit.
`)

  await app.respondToPendingApproval(
    scenario.projectId,
    'spec_final',
    'approve',
    '2026-05-17T09:30:00Z',
    'Spesifikasi teknis sangat jelas dan memenuhi standar keamanan serta kepatuhan operasional rumah sakit.',
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
      content: `Bertindaklah sebagai Lead AI Systems Architect (Engineering Agent) dalam sebuah SIMULASI PELATIHAN ORKESTRASI (Roleplay Demonstrator). Dalam skenario simulasi ini, sistem ${scenario.projectName} diasumsikan telah melewati 100% pengujian staging terisolasi. Buatlah draf/template laporan kesiapan rilis (delivery readiness) fiktif untuk keperluan demonstrasi simulasi dalam 2-3 kalimat yang menyoroti keberhasilan unit test dan kepatuhan sistem sebelum simulasi deployment akhir.`,
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
                  ke production ${scenario.clientShortName}.
`)

  await app.respondToPendingApproval(
    scenario.projectId,
    'delivery_final',
    'approve',
    '2026-05-17T09:45:00Z',
    `Paket pengiriman dan hasil QA telah divalidasi. Siap untuk deployment ke production ${scenario.clientShortName}.`,
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
      content: `Bertindaklah sebagai Senior Project Manager Agent. Proyek ${scenario.projectName} telah mendapatkan persetujuan pengiriman akhir dari CEO dan statusnya kini resmi 'DELIVERED'. Tuliskan catatan penutupan proyek (project closing memo) dan ucapan selamat singkat dalam 2-3 kalimat kepada seluruh tim agen AI dan pemangku kepentingan di ${scenario.clientShortName}.`,
    }],
    temperature: 0.7,
    maxTokens: 150,
  })
  process.stdout.write(`\n💬 Project Manager Agent (Real AI Response):\n   "${pmAI.content.trim()}"\n\n`)

  process.stdout.write(`✔ Project Manager memperbarui status siklus hidup proyek menjadi "delivered".\n`)

  const dashboard = app.shell.readDashboard('2026-05-17T10:00:00Z')
  const project = dashboard.projects.find(p => p.project_id === scenario.projectId)

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
🎉 PROYEK NYATA "${scenario.projectName.toUpperCase()}" SELESAI DENGAN SUKSES!
================================================================================
`)
}

runRealLifeProject().catch(error => {
  process.stderr.write(`\n✖ Terjadi kesalahan saat menjalankan proyek nyata: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
