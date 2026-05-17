/**
 * Support Department Sub-Agents — Barrel Index
 *
 * File implementasi:
 * - supportHead.ts       — Support Head config + baton chains
 * - ticketClassifier.ts — TicketClassifier specialist
 * - faqResponder.ts     — FAQResponder specialist
 * - escalationRouter.ts — EscalationRouter specialist
 * - csatAnalyzer.ts     — CSATAnalyzer specialist
 * - knowledgeBuilder.ts — KnowledgeBuilder specialist
 * - waBotHandler.ts     — WABotHandler specialist
 */

export {
  SUPPORT_HEAD_CONFIG,
  SUPPORT_TRIAGE_CHAIN,
  SUPPORT_KNOWLEDGE_CHAIN,
} from './supportHead.js'
export { TICKET_CLASSIFIER_CONFIG } from './ticketClassifier.js'
export { FAQ_RESPONDER_CONFIG } from './faqResponder.js'
export { ESCALATION_ROUTER_CONFIG } from './escalationRouter.js'
export { CSAT_ANALYZER_CONFIG } from './csatAnalyzer.js'
export { KNOWLEDGE_BUILDER_CONFIG } from './knowledgeBuilder.js'
export { WA_BOT_HANDLER_CONFIG } from './waBotHandler.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { SUPPORT_HEAD_CONFIG } from './supportHead.js'
import { TICKET_CLASSIFIER_CONFIG } from './ticketClassifier.js'
import { FAQ_RESPONDER_CONFIG } from './faqResponder.js'
import { ESCALATION_ROUTER_CONFIG } from './escalationRouter.js'
import { CSAT_ANALYZER_CONFIG } from './csatAnalyzer.js'
import { KNOWLEDGE_BUILDER_CONFIG } from './knowledgeBuilder.js'
import { WA_BOT_HANDLER_CONFIG } from './waBotHandler.js'

export const SUPPORT_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  SUPPORT_HEAD_CONFIG,
  TICKET_CLASSIFIER_CONFIG,
  FAQ_RESPONDER_CONFIG,
  ESCALATION_ROUTER_CONFIG,
  CSAT_ANALYZER_CONFIG,
  KNOWLEDGE_BUILDER_CONFIG,
  WA_BOT_HANDLER_CONFIG,
]

export function registerSupportDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(SUPPORT_DEPARTMENT_CONFIGS)
}
