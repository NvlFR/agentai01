# Client Onboarding

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- A deal is won and the runtime needs to move from sales to discovery.
- Create a clean project context for client work.
- Collect access, communication preferences, and kickoff materials.

## Requirements

- Confirmed `won` lifecycle state or explicit Owner directive.
- Client name, project id, main contact, agreed scope reference, and communication channel.
- Secret boundary for credentials: never paste client API keys into chat or docs.
- Optional project storage path under `projects/<client>/<project>/`.

## Workflow

1. Verify the handoff from Sales Agent includes proposal reference, client objective, and acceptance signal.
2. Create or confirm project namespace and active agents.
3. Prepare onboarding checklist: contacts, channels, assets, credentials process, access owners, constraints, decision cadence.
4. Route product discovery tasks to Product Agent.
5. Record open questions and blocked access separately from confirmed facts.
6. Schedule the next Owner/client check-in through the appropriate channel skill.

## Safety

- Do not request secrets in plain chat. Ask the operator to place them in `.env.local`, a password manager, or provider auth profile.
- Do not imply onboarding is complete while access, scope, or approval is missing.
- Avoid copying private client documents outside the project namespace.
- Confirm external calendar, Slack, Notion, or WhatsApp writes before sending.

## Validation

```bash
test -f skills/client-onboarding/SKILL.md
rg -n "won|project namespace|\\.env\\.local" skills/client-onboarding/SKILL.md
```
