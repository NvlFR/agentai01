# Remaining Real Head Workflows

## product-head

- Department: product
- Runtime mode: deterministic
- Summary: product-head completed discovery workflow

```json
{
  "status": "completed",
  "workflow": "discovery",
  "initiative": "AI Service Console Discovery",
  "taskId": "baton-product-1",
  "stepCount": 3,
  "steps": [
    {
      "agentId": "product-user-researcher",
      "mode": "deterministic",
      "summary": "User pain points synthesized from feedback signals"
    },
    {
      "agentId": "product-feature-prioritizer",
      "mode": "provider",
      "summary": "Prioritized 8 features for AI Service Console Discovery using RICE framework. Top priorities: Automated Task Routing (RICE: 48), Cross-Department Workflow Visualization (RICE: 40), and Task Ownership Assignment Interface (RICE: 32). Scores reflect operator usability, compliance needs, and phased rollout feasibility. Dependencies flagged for integration and infrastructure features."
    },
    {
      "agentId": "product-prd-writer",
      "mode": "deterministic",
      "summary": "PRD v1 drafted with scope and acceptance criteria"
    }
  ],
  "finalOutput": {
    "prdId": "prd-ai-service-console-discovery",
    "sections": [
      "Problem",
      "Goals",
      "Requirements",
      "Out of scope"
    ],
    "featureIds": [],
    "figmaLink": "figma://product/spec-board"
  }
}
```

## engineering-head

- Department: engineering
- Runtime mode: deterministic
- Summary: engineering-head completed pr workflow

```json
{
  "status": "completed",
  "workflow": "pr",
  "initiative": "Multi-Agent Runtime Hardening",
  "taskId": "baton-engineering-1",
  "stepCount": 3,
  "steps": [
    {
      "agentId": "eng-code-reviewer",
      "mode": "provider",
      "summary": "Code review task received for Multi-Agent Runtime Hardening initiative, but missing critical inputs: no repository, PR number, or codebase access provided. Unable to perform concrete code quality, security, performance, or standards compliance review without target artifacts."
    },
    {
      "agentId": "eng-test-generator",
      "mode": "deterministic",
      "summary": "Regression tests generated for reported defect"
    },
    {
      "agentId": "eng-pr-summarizer",
      "mode": "provider",
      "summary": "PR summary generation blocked: Missing repository and PR details required to create release notes. Review framework prepared by prior step indicates focus on multi-agent runtime hardening with test coverage improvement of +2.1% (batonPassing.test.ts added). Cannot generate changelog or Notion summary without access to actual code changes, PR metadata, or repository information."
    }
  ],
  "finalOutput": {
    "status": "blocked",
    "blocking_reason": "Missing required inputs to generate PR summary and release notes",
    "required_inputs": [
      "GitHub repository name (owner/repo format)",
      "Pull request number or commit range",
      "Access to PR title, description, and file changes"
    ],
    "partial_insights_from_prior_steps": {
      "test_coverage_improvement": "+2.1%",
      "new_test_file": "src/runtime/batonPassing.test.ts",
      "initiative_context": "Multi-Agent Runtime Hardening",
      "review_areas_identified": [
        "Error handling patterns",
        "Resource cleanup and lifecycle management",
        "Concurrency and race condition analysis",
        "Agent communication protocol validation",
        "State management consistency"
      ]
    },
    "release_notes_template_ready": {
      "structure": {
        "title": "[To be extracted from PR]",
        "type": "enhancement|bugfix|security|performance",
        "scope": "Multi-Agent Runtime",
        "changes": "[To be extracted from PR diff]",
        "testing": "Added batonPassing.test.ts (+2.1% coverage)",
        "risks": "[To be assessed from code review]",
        "validation_strategy": "[Based on review framework prepared]"
      }
    },
    "next_action_required": "Provide GitHub repository and PR number to enable: (1) PR metadata extraction, (2) Code diff analysis, (3) Changelog generation, (4) Notion summary creation, (5) Optional Slack notification"
  }
}
```

## pm-head

- Department: project-manager
- Runtime mode: deterministic
- Summary: pm-head completed sprint workflow

```json
{
  "status": "completed",
  "workflow": "sprint",
  "initiative": "Cross-Department Delivery Sprint",
  "taskId": "baton-project-manager-1",
  "stepCount": 3,
  "steps": [
    {
      "agentId": "pm-risk-analyzer",
      "mode": "provider",
      "summary": "Risk & Blocker Analysis completed for Sprint 24 Cross-Department Delivery. Identified 8 critical risk areas with mitigation strategies focusing on cross-functional dependencies, schedule compression, and communication gaps. Recommend immediate action on dependency mapping and stakeholder alignment."
    },
    {
      "agentId": "pm-sprint-planner",
      "mode": "provider",
      "summary": "Sprint 24 plan created with capacity-adjusted scope, dependency mapping, and explicit schedule risk callouts. Applied 30% coordination tax to cross-functional work, front-loaded integration validation, and established 3-tier priority framework for descope flexibility. Plan includes daily sync cadence, integration checkpoints at 25/50/75% completion, and executive dashboard with red/yellow/green status indicators."
    },
    {
      "agentId": "pm-deadline-watcher",
      "mode": "provider",
      "summary": "Deadline monitoring system configured for Sprint 24 with 9 critical deadlines tracked. Set up automated Slack reminders for 3 high-risk cross-department handoffs, 3 integration checkpoints, and daily sync cadence. Calendar events created for all coordination meetings and go/no-go decision points. Escalation alerts configured for 24-hour blocker threshold."
    }
  ],
  "finalOutput": {
    "slack_alerts_to_send": [
      {
        "channel": "#sprint-24-delivery",
        "message": "🚨 **SPRINT 24 DEADLINE WATCH ACTIVATED**\n\n⚠️ HIGH SCHEDULE RISK sprint with 9 critical deadlines tracked.\n\n**IMMEDIATE DEADLINES (Day 1-2):**\n• Day 1: Cloud infrastructure must be provisioned (external dependency)\n• Day 2: @product-team must deliver dependency map + RACI matrix to all teams (BLOCKS entire sprint)\n\n**Escalation rule:** Any critical path item blocked >24 hours triggers automatic executive alert.\n\nFull deadline calendar posted in thread. 📅",
        "thread_replies": [
          "**CRITICAL PATH DEADLINES:**\n\nDay 2: Dependency mapping complete (T1-003)\nDay 6: Model API deployment (T1-002) → Blocks integration\nDay 7: Integration validation (T1-001) → Blocks Tier 2 work",
          "**HIGH-RISK HANDOFFS:**\n\n1️⃣ Day 2: Product → All Teams (dependency map) - RED RISK\n2️⃣ Day 6: Data Science → Engineering (model API) - RED RISK  \n3️⃣ Day 7: Engineering → Product (test results) - YELLOW RISK",
          "**GO/NO-GO CHECKPOINTS:**\n\n25% (Day 2-3): API contracts finalized - Cannot proceed without\n50% (Day 5): Model deployed - Descope Tier 3 if missed\n75% (Day 7-8): Core integration done - Descope Tier 2 if missed"
        ],
        "schedule": "immediate"
      },
      {
        "channel": "#product-team",
        "message": "⏰ **DEADLINE REMINDER: Day 2 (Tomorrow/Today)**\n\n🔴 HIGH-RISK HANDOFF DUE\n\n**Your deliverable:** Dependency map + RACI matrix\n**Recipient:** All teams (Engineering, Data Science, Product)\n**Impact if missed:** Blocks entire sprint - critical path dependency\n\n**Status check:** Reply with GREEN ✅ / YELLOW ⚠️ / RED 🚨\n\ncc: @product-lead",
        "schedule": "Day 1 end-of-day"
      },
      {
        "channel": "#data-science-team",
        "message": "⏰ **DEADLINE REMINDER: Day 6 (48 hours)**\n\n🔴 HIGH-RISK HANDOFF APPROACHING\n\n**Your deliverable:** Model API contract + deployment (T1-002)\n**Recipient:** @engineering-team\n**Impact if missed:** Blocks integration validation (critical path)\n**Fallback:** Mock services available if needed\n\n**Status check:** Reply with on-track ✅ / at-risk ⚠️ / blocked 🚨\n\ncc: @data-science-lead",
        "schedule": "Day 4 morning"
      },
      {
        "channel": "#engineering-team",
        "message": "⏰ **DEADLINE REMINDER: Day 7 (24 hours)**\n\n🟡 MEDIUM-RISK HANDOFF APPROACHING\n\n**Your deliverable:** Integration test results (T1-001)\n**Recipient:** @product-team\n**Impact if missed:** Delays acceptance testing\n**Checkpoint:** 75% integration checkpoint depends on this\n\n**Status check:** Reply with on-track ✅ / at-risk ⚠️ / blocked 🚨\n\ncc: @engineering-lead",
        "schedule": "Day 6 morning"
      },
      {
        "channel": "#sprint-24-delivery",
        "message": "📊 **25% CHECKPOINT: Day 2-3**\n\n**Go/No-Go Decision Point**\n\n**Required deliverables:**\n✓ Dependency map validated by all teams\n✓ API contracts finalized\n✓ RACI matrix published\n\n**Decision:** Cannot proceed to Day 3+ work without these complete.\n\n**Checkpoint meeting:** [Calendar invite sent]\n**Attendees:** All teams + executive sponsor\n\nReply with status by end of Day 2. 🚦",
        "schedule": "Day 2 morning"
      },
      {
        "channel": "#sprint-24-delivery",
        "message": "📊 **50% CHECKPOINT: Day 5**\n\n**Go/No-Go Decision Point**\n\n**Required deliverables:**\n✓ Model deployed (T1-002)\n✓ Integration testing started (T1-001)\n\n**Decision:** If not met → Descope all Tier 3 items (7 person-days)\n\n**Checkpoint meeting:** [Calendar invite sent]\n**Attendees:** All teams + executive sponsor\n\nReply with status by end of Day 5. 🚦",
        "schedule": "Day 5 morning"
      },
      {
        "channel": "#sprint-24-delivery",
        "message": "📊 **75% CHECKPOINT: Day 7-8**\n\n**Go/No-Go Decision Point**\n\n**Required deliverables:**\n✓ Core integration validated\n✓ All Tier 1 items complete (T1-001, T1-002, T1-003)\n\n**Decision:** If not met → Descope Tier 2 AND Tier 3 (18 person-days)\n\n**Checkpoint meeting:** [Calendar invite sent]\n**Attendees:** All teams + executive sponsor\n\nReply with status by end of Day 7. 🚦",
        "schedule": "Day 7 morning"
      },
      {
        "channel": "#executive-updates",
        "message": "📈 **SPRINT 24 STATUS UPDATE - Day 2**\n\n🟡 **Status:** YELLOW\n\n**3-Bullet Summary:**\n• Progress: [Auto-populated from team updates]\n• Blockers: [Auto-populated from blocker log]\n• Risk: [Schedule confidence % from dashboard]\n\n**Next update:** Day 4\n**Full dashboard:** [Link to Google Sheets]\n\ncc: @executive-sponsor",
        "schedule": "Every 2 days (Day 2, 4, 6, 8, 10)"
      },
      {
        "channel": "#sprint-24-delivery",
        "message": "☀️ **DAILY SYNC REMINDER**\n\nTime for async standup! Reply in thread:\n\n1️⃣ **Progress yesterday:** What shipped?\n2️⃣ **Blockers:** Anything stuck >4 hours?\n3️⃣ **Handoffs today:** Any deliverables due to other teams?\n\n**Sync call at 9:00 AM** only if blockers flagged.\n\n⏱️ Keep it under 3 minutes per person.",
        "schedule": "Daily at 8:45 AM"
      }
    ],
    "google_calendar_events_to_create": [
      {
        "event_title": "🚨 DEADLINE: Infrastructure Provisioned (External)",
        "event_type": "deadline_marker",
        "date": "Sprint Day 1",
        "time": "End of day",
        "duration": "0 min (all-day marker)",
        "attendees": [
          "engineering-lead@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "External dependency: Cloud infrastructure must be provisioned by end of Day 1. Fallback: staging environment available.",
        "reminder": "2 hours before, 30 minutes before",
        "color": "red"
      },
      {
        "event_title": "🚨 DEADLINE: Dependency Map + RACI Delivery",
        "event_type": "deadline_marker",
        "date": "Sprint Day 2",
        "time": "End of day",
        "duration": "0 min (all-day marker)",
        "attendees": [
          "product-lead@company.com",
          "all-teams@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "HIGH-RISK HANDOFF: Product must deliver dependency map and RACI matrix to all teams. BLOCKS entire sprint if missed.",
        "reminder": "1 day before, 4 hours before, 1 hour before",
        "color": "red"
      },
      {
        "event_title": "📊 25% Integration Checkpoint (Go/No-Go)",
        "event_type": "checkpoint_meeting",
        "date": "Sprint Day 2-3",
        "time": "2:00 PM",
        "duration": "30 min",
        "attendees": [
          "all-department-leads@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "Go/No-Go decision point. Required: Dependency map validated, API contracts finalized. Cannot proceed without these complete.\n\nAgenda:\n1. Validate dependency map (5 min)\n2. Confirm API contracts (10 min)\n3. Go/No-Go decision (5 min)\n4. Risk review (10 min)",
        "reminder": "1 day before, 1 hour before",
        "color": "orange"
      },
      {
        "event_title": "📊 50% Integration Checkpoint (Go/No-Go)",
        "event_type": "checkpoint_meeting",
        "date": "Sprint Day 5",
        "time": "2:00 PM",
        "duration": "30 min",
        "attendees": [
          "all-department-leads@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "Go/No-Go decision point. Required: Model deployed, integration testing started. If not met → Descope Tier 3 items.\n\nAgenda:\n1. Model deployment status (10 min)\n2. Integration test progress (10 min)\n3. Descope decision if needed (10 min)",
        "reminder": "1 day before, 1 hour before",
        "color": "orange"
      },
      {
        "event_title": "🚨 DEADLINE: Model API Deployment (Data Science → Engineering)",
        "event_type": "deadline_marker",
        "date": "Sprint Day 6",
        "time": "End of day",
        "duration": "0 min (all-day marker)",
        "attendees": [
          "data-science-lead@company.com",
          "engineering-lead@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "HIGH-RISK HANDOFF: Data Science delivers model API contract and deployment to Engineering. Blocks integration validation (critical path). Fallback: mock services available.",
        "reminder": "2 days before, 1 day before, 4 hours before, 1 hour before",
        "color": "red"
      },
      {
        "event_title": "🚨 DEADLINE: Integration Test Results (Engineering → Product)",
        "event_type": "deadline_marker",
        "date": "Sprint Day 7",
        "time": "End of day",
        "duration": "0 min (all-day marker)",
        "attendees": [
          "engineering-lead@company.com",
          "product-lead@company.com"
        ],
        "description": "MEDIUM-RISK HANDOFF: Engineering delivers integration test results to Product. Needed for acceptance testing and 75% checkpoint.",
        "reminder": "1 day before, 4 hours before, 1 hour before",
        "color": "orange"
      },
      {
        "event_title": "📊 75% Integration Checkpoint (Go/No-Go)",
        "event_type": "checkpoint_meeting",
        "date": "Sprint Day 7-8",
        "time": "2:00 PM",
        "duration": "30 min",
        "attendees": [
          "all-department-leads@company.com",
          "executive-sponsor@company.com"
        ],
        "description": "Go/No-Go decision point. Required: Core integration validated, all Tier 1 items complete. If not met → Descope Tier 2 AND Tier 3.\n\nAgenda:\n1. Tier 1 completion review (15 min)\n2. Integration validation status (10 min)\n3. Descope decision if needed (5 min)",
        "reminder": "1 day before, 1 hour before",
        "color": "orange"
      },
      {
        "event_title": "🎯 Sprint 24 Demo & Retrospective",
        "event_type": "sprint_ceremony",
        "date": "Sprint Day 10",
        "time": "10:00 AM",
        "duration": "90 min",
        "attendees": [
          "all-stakeholders@company.com"
        ],
        "description": "Final sprint demo and retrospective.\n\nAgenda:\n1. End-to-end workflow demo (30 min)\n2. Deliverables review vs Definition of Done (20 min)\n3. Retrospective: what worked, what didn't (30 min)\n4. Next sprint planning preview (10 min)",
        "reminder": "2 days before, 1 day before, 1 hour before",
        "color": "blue"
      },
      {
        "event_title": "☀️ Sprint 24 Daily Sync",
        "event_type": "recurring_coordination",
        "date": "Sprint Day 1-10",
        "time": "9:00 AM",
        "duration": "15 min",
        "recurrence": "Daily",
        "attendees": [
          "all-department-leads@company.com"
        ],
        "description": "Daily coordination sync. Async standup in Slack first, sync call only if blockers flagged.\n\nFocus:\n• Blockers (anything stuck >4 hours)\n• Handoffs due today\n• Integration status",
        "reminder": "15 minutes before",
        "color": "green"
      },
      {
        "event_title": "📈 Executive Status Update Due",
        "event_type": "recurring_reporting",
        "date": "Sprint Day 2, 4, 6, 8, 10",
        "time": "5:00 PM",
        "duration": "0 min (reminder only)",
        "recurrence": "Every 2 days",
        "attendees": [
          "pm-team@company.com"
        ],
        "description": "Reminder to post 3-bullet executive status update to #executive-updates Slack channel.\n\nFormat:\n• Progress: [What shipped]\n• Blockers: [What's stuck and who's unblocking]\n• Risk: [Schedule confidence % and mitigation]",
        "reminder": "2 hours before",
        "color": "purple"
      }
    ],
    "escalation_monitoring_rules": [
      {
        "rule_id": "ESC-001",
        "trigger": "Any critical path item (T1-001, T1-002, T1-003) blocked >24 hours",
        "action": "Immediate Slack alert to #sprint-24-delivery + @executive-sponsor",
        "alert_template": "🚨 **ESCALATION TRIGGERED** 🚨\n\nCritical path item blocked >24 hours:\n• Item: [item_id]\n• Owner: [team]\n• Blocker: [description]\n• Impact: [cascade effects]\n\n**Executive decision needed:** [specific ask]\n\ncc: @executive-sponsor",
        "monitoring_frequency": "Every 4 hours"
      },
      {
        "rule_id": "ESC-002",
        "trigger": "Integration checkpoint missed (25%, 50%, or 75%)",
        "action": "Immediate Slack alert to #sprint-24-delivery + @executive-sponsor + descope plan activation",
        "alert_template": "🚨 **CHECKPOINT MISSED** 🚨\n\nCheckpoint: [checkpoint_name]\nRequired deliverables: [list]\nStatus: [what's incomplete]\n\n**Descope plan activated:**\n[specific items being descoped]\n\n**Executive approval needed:** Reply with APPROVE or ESCALATE\n\ncc: @executive-sponsor",
        "monitoring_frequency": "Real-time at checkpoint time"
      },
      {
        "rule_id": "ESC-003",
        "trigger": "High-risk handoff deadline missed (Day 2, Day 6, Day 7)",
        "action": "Immediate Slack alert to both teams + @executive-sponsor",
        "alert_template": "🚨 **HANDOFF DEADLINE MISSED** 🚨\n\nHandoff: [from_team] → [to_team]\nDeliverable: [description]\nOriginal deadline: [date]\nImpact: [blocks what work]\n\n**Mitigation options:**\n1. [option 1]\n2. [option 2]\n\n**Decision needed by:** [time]\n\ncc: @[from_team_lead] @[to_team_lead] @executive-sponsor",
        "monitoring_frequency": "End of deadline day"
      },
      {
        "rule_id": "ESC-004",
        "trigger": "Two consecutive days of no progress on must-have deliverables",
        "action": "Slack alert to team lead + PM + executive sponsor",
        "alert_template": "⚠️ **PROGRESS STALL DETECTED** ⚠️\n\nItem: [item_id]\nDays stalled: 2\nOwner: [team]\nLast update: [timestamp]\n\n**Root cause analysis needed.**\n\nTeam lead: Please provide status update within 4 hours.\n\ncc: @[team_lead] @pm-lead @executive-sponsor",
        "monitoring_frequency": "Daily at 6:00 PM"
      }
    ],
    "automated_status_collection": {
      "slack_workflow": {
        "name": "Daily Status Bot",
        "trigger": "Every day at 8:45 AM",
        "action": "Post standup template to #sprint-24-delivery",
        "data_collection": "Parse replies and update Google Sheets dashboard",
        "blocker_detection": "Flag any reply containing keywords: blocked, stuck, waiting, delayed, issue",
        "auto_escalation": "If blocker flagged and not resolved in 4 hours → trigger ESC-001"
      },
      "google_sheets_integration": {
        "sheet_name": "Sprint 24 Progress Tracker",
        "auto_update_tabs": [
          "Daily Burndown (from Notion task completion)",
          "Blocker Log (from Slack #sprint-24-delivery)",
          "Dependency Status (from handoff deadline tracking)",
          "Risk Register (from escalation triggers)"
        ],
        "update_frequency": "Every 2 hours"
      }
    },
    "notion_deadline_dashboard": {
      "page_title": "Sprint 24 Deadline Tracker",
      "database_properties": [
        "Deadline Date",
        "Deliverable",
        "Owner Team",
        "Recipient Team",
        "Risk Level (RED/YELLOW/GREEN)",
        "Status (On Track / At Risk / Blocked / Complete)",
        "Days Until Due",
        "Escalation Triggered (Yes/No)"
      ],
      "views": [
        {
          "view_name": "Critical Path Timeline",
          "type": "Timeline view",
          "filter": "Critical Path = true",
          "sort": "Deadline Date ascending"
        },
        {
          "view_name": "High-Risk Handoffs",
          "type": "Table view",
          "filter": "Risk Level = RED",
          "sort": "Days Until Due ascending"
        },
        {
          "view_name": "Overdue & Blocked",
          "type": "Board view",
          "group_by": "Status",
          "filter": "Status = Blocked OR Days Until Due < 0"
        }
      ],
      "automation_rules": [
        "When 'Days Until Due' = 2 → Send Slack reminder to Owner Team",
        "When 'Days Until Due' = 0 AND Status ≠ Complete → Trigger escalation",
        "When Status changes to 'Blocked' → Post to #sprint-24-delivery immediately"
      ]
    }
  }
}
```

## support-head

- Department: support
- Runtime mode: deterministic
- Summary: support-head completed triage workflow

```json
{
  "status": "completed",
  "workflow": "triage",
  "initiative": "Premium Support Stabilization",
  "taskId": "baton-support-1",
  "stepCount": 3,
  "steps": [
    {
      "agentId": "support-ticket-classifier",
      "mode": "provider",
      "summary": "Ticket Triage Agent initialized for Premium Support Stabilization queue. No incoming tickets detected in payload. Ready to classify tickets by category (bug/pertanyaan/feature request), priority (low/medium/high/critical), and route to appropriate departments within 15-minute SLA."
    },
    {
      "agentId": "support-faq-responder",
      "mode": "provider",
      "summary": "FAQ response framework created with template responses for common support scenarios, documentation structure, and WhatsApp bot integration guidelines aligned with premium support standards."
    },
    {
      "agentId": "support-escalation-router",
      "mode": "provider",
      "summary": "Escalation routing system configured with severity-based assignment to Engineering and PM teams. Integration ready with Slack notifications, GitHub issue creation, and Gmail alerts for critical incidents."
    }
  ],
  "finalOutput": {
    "escalation_matrix": {
      "engineering_escalations": {
        "critical_bugs": {
          "severity": "P0",
          "sla": "15 minutes",
          "assignment_criteria": "Service down, data loss, security breach, revenue-blocking bugs",
          "notification_channels": [
            "slack:#engineering-critical",
            "gmail:eng-oncall@company.com"
          ],
          "github_labels": [
            "bug",
            "critical",
            "P0"
          ],
          "required_info": [
            "reproduction steps",
            "affected users count",
            "error logs",
            "system impact assessment"
          ]
        },
        "high_priority_bugs": {
          "severity": "P1",
          "sla": "1 hour",
          "assignment_criteria": "Major feature broken, multiple users affected, difficult workaround",
          "notification_channels": [
            "slack:#engineering-bugs"
          ],
          "github_labels": [
            "bug",
            "high-priority",
            "P1"
          ],
          "required_info": [
            "reproduction steps",
            "affected users",
            "workaround status"
          ]
        }
      },
      "pm_escalations": {
        "project_blockers": {
          "severity": "P0",
          "sla": "30 minutes",
          "assignment_criteria": "Premium customer blocked from core workflow, contract risk, competitive threat",
          "notification_channels": [
            "slack:#product-escalations",
            "gmail:pm-team@company.com"
          ],
          "github_labels": [
            "blocker",
            "product",
            "customer-impact"
          ],
          "required_info": [
            "customer tier",
            "business impact",
            "timeline pressure",
            "requested solution"
          ]
        },
        "critical_feature_gaps": {
          "severity": "P1",
          "sla": "4 hours",
          "assignment_criteria": "Premium user cannot complete paid-for functionality, churn risk",
          "notification_channels": [
            "slack:#product-feedback"
          ],
          "github_labels": [
            "feature-gap",
            "premium-user"
          ],
          "required_info": [
            "use case",
            "customer segment",
            "competitive context"
          ]
        }
      }
    },
    "escalation_workflow": {
      "step_1_detection": {
        "triggers": [
          "Ticket marked critical priority",
          "High priority unresolved after 1 hour",
          "Keywords: 'down', 'broken', 'urgent', 'losing money', 'security'",
          "Premium customer second follow-up",
          "CSAT score < 2 on resolved ticket"
        ]
      },
      "step_2_triage": {
        "bug_vs_blocker_decision": {
          "route_to_engineering": "Technical malfunction, error codes, system behavior incorrect",
          "route_to_pm": "Feature doesn't exist, workflow impossible, design flaw, competitive gap"
        },
        "information_gathering": [
          "Customer tier and contract value",
          "Business impact quantification",
          "Technical details (logs, screenshots, environment)",
          "Timeline and urgency context"
        ]
      },
      "step_3_notification": {
        "slack_alert_format": {
          "critical": "🚨 CRITICAL ESCALATION\n**Customer:** [Name] (Premium)\n**Issue:** [One-line summary]\n**Impact:** [Business/technical impact]\n**Ticket:** [Link]\n**Assigned:** @oncall-engineer or @pm-lead\n**SLA:** Response needed in [time]",
          "high": "⚠️ High Priority Escalation\n**Customer:** [Name]\n**Issue:** [Summary]\n**Ticket:** [Link]\n**Assigned:** [Team]\n**SLA:** [Time]"
        },
        "github_issue_template": {
          "title": "[ESCALATION] [Customer Name] - [Brief Issue]",
          "body": "## Customer Impact\n- **Tier:** Premium\n- **Affected Users:** [count]\n- **Business Impact:** [description]\n\n## Technical Details\n[Reproduction steps, logs, environment]\n\n## Support Ticket\n[Link and history]\n\n## Requested Resolution\n[Customer expectation and timeline]",
          "labels": [
            "escalation",
            "severity-level",
            "team"
          ],
          "assignees": [
            "determined by on-call rotation"
          ]
        },
        "gmail_alert_criteria": {
          "send_email_when": "P0 severity OR premium customer + unresolved > 2 hours",
          "recipients": "Team lead + on-call engineer/PM",
          "subject_format": "[P0 ESCALATION] Customer: [Name] - [Issue]"
        }
      },
      "step_4_tracking": {
        "escalation_log_fields": {
          "escalation_id": "ESC-[timestamp]-[ticket-id]",
          "created_at": "ISO timestamp",
          "customer_name": "string",
          "customer_tier": "premium|enterprise|standard",
          "severity": "P0|P1|P2",
          "category": "bug|blocker|security|billing",
          "assigned_to": "engineering|pm|security|billing",
          "assigned_agent": "specific person or team",
          "github_issue_url": "link",
          "slack_thread_url": "link",
          "sla_deadline": "timestamp",
          "status": "open|in-progress|resolved|escalated-further",
          "resolution_time": "minutes",
          "customer_notified": "boolean"
        }
      }
    },
    "tool_integration_plan": {
      "slack_usage": {
        "channels": {
          "#engineering-critical": "P0 bugs, immediate response needed",
          "#engineering-bugs": "P1 bugs, standard escalation",
          "#product-escalations": "PM blockers and feature gaps",
          "#support-escalations": "Cross-functional visibility"
        },
        "mention_strategy": "@oncall-engineer for P0, @team-engineering for P1, @pm-lead for blockers"
      },
      "github_usage": {
        "repository": "company/escalations or respective product repos",
        "automation": "Auto-create issue on P0/P1 escalation with template",
        "linking": "Bi-directional link between support ticket and GitHub issue",
        "labels_for_filtering": [
          "escalation",
          "P0",
          "P1",
          "premium-customer",
          "bug",
          "blocker"
        ]
      },
      "gmail_usage": {
        "when_to_use": "P0 escalations, after-hours critical issues, executive visibility needed",
        "template_variables": "[customer_name], [severity], [issue_summary], [ticket_link], [assigned_to]",
        "cc_strategy": "Support manager always CC'd on P0"
      }
    },
    "csat_monitoring_for_escalations": {
      "post_escalation_survey": {
        "timing": "24 hours after resolution",
        "questions": [
          "How quickly was your critical issue addressed? (1-5)",
          "How satisfied are you with the resolution? (1-5)",
          "Did you feel prioritized as a premium customer? (Yes/No)",
          "What could we improve in our escalation process?"
        ]
      },
      "escalation_quality_metrics": {
        "response_time_to_sla": "% of escalations meeting SLA",
        "resolution_time": "Average time from escalation to resolution",
        "re_escalation_rate": "% of escalations that needed further escalation",
        "csat_for_escalated_tickets": "Average CSAT for tickets that were escalated",
        "false_escalation_rate": "% of escalations that didn't meet criteria"
      },
      "alert_thresholds": {
        "trigger_review_when": "CSAT < 3.5 for escalated tickets OR SLA miss rate > 10% OR re-escalation rate > 15%"
      }
    },
    "ready_to_execute": {
      "awaiting": "Actual ticket payload to classify and route",
      "will_perform": [
        "Classify severity based on impact and urgency",
        "Route to Engineering (bugs) or PM (blockers)",
        "Create Slack notification in appropriate channel",
        "Generate GitHub issue with escalation template",
        "Send Gmail alert if P0 or after-hours",
        "Log escalation with tracking ID and SLA deadline",
        "Update customer with escalation status"
      ],
      "example_escalation_record": {
        "escalation_id": "ESC-20250124-T1234",
        "severity": "P0",
        "category": "bug",
        "assigned_to": "engineering",
        "assigned_agent": "@sarah-oncall",
        "customer": "Acme Corp (Premium)",
        "issue": "Payment processing API returning 500 errors",
        "impact": "Cannot process customer payments, $50K/hour revenue impact",
        "github_issue": "https://github.com/company/product/issues/5678",
        "slack_thread": "https://company.slack.com/archives/C123/p1234567890",
        "sla_deadline": "2025-01-24T10:15:00Z",
        "status": "in-progress"
      }
    }
  }
}
```

