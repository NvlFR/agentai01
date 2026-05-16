# Skill Creator

Status: guidance-only.
Source: `referensi/openclaw/skills/skill-creator`

## Use When

- Use when creating, editing, reviewing, or restructuring a skill under `skills/<name>/`.
- Use when deciding whether a skill should be guidance-only or executable.
- Use when aligning an executable skill with `skills/workshop.mjs` and `skills/README.md`.

## Requirements

- Read `skills/README.md` before authoring executable skills.
- Guidance-only skills require `SKILL.md`.
- Executable skills require `skill.json`, `index.mjs`, and colocated tests.
- Runtime boundaries must be JSON-safe and schema-validated.
- Use TypeScript/JavaScript patterns already present in this repo. No `any`, no `@ts-nocheck`, no secrets in examples.

## Workflow

1. Identify the skill type.
   - Guidance-only: external CLI/API workflow, operator playbook, non-deterministic third-party state, or unsafe to automate directly.
   - Executable: bounded deterministic or explicitly non-deterministic operation that fits `SkillRegistry`.
2. Choose a lowercase hyphenated folder name under `skills/`.
3. For guidance-only skills, write only `SKILL.md` unless supporting assets are truly needed.
4. For executable skills, scaffold with:

```bash
bun skills/workshop.mjs init my-skill --description "Describe the skill"
```

5. Edit `skill.json`.
   - Set `name`, `version`, `description`, `deterministic`, `implementation`.
   - Keep `implementation` inside the skill folder.
   - Define strict `inputSchema` and `outputSchema`.
6. Implement `index.mjs`.
   - Export `execute(input)`.
   - Return JSON-safe output.
   - Validate or narrow external data before returning it.
7. Add behavior tests in `index.test.ts`.
8. Keep `SKILL.md` concise and use this structure:
   - `# <Skill Name>`
   - `Status: guidance-only.` or `Status: executable.`
   - `## Use When`
   - `## Requirements`
   - `## Workflow`
   - `## Safety`
   - `## Validation`
9. Validate executable skills:

```bash
bun skills/workshop.mjs validate skills/my-skill
bun skills/workshop.mjs run my-skill --input '{"text":"hello"}'
bun test skills/my-skill
```

## Safety

- Do not edit the upstream reference tree or `node_modules/`.
- Do not add runtime dependencies for a guidance-only skill.
- Do not include real credentials, private URLs, account ids, or customer data in examples.
- External write actions must document explicit target selection and confirmation.
- Keep bundled resources minimal. Avoid extra README, changelog, or installation docs unless they are part of the requested output.

## Validation

For guidance-only skill docs:

```bash
test -f skills/my-skill/SKILL.md
rg -n "stale-source-product-name|old-state-dir|old-message-command" skills/my-skill || true
```

For executable skills:

```bash
bun skills/workshop.mjs validate skills/my-skill
bun test skills/my-skill
```

Run `npm run check` when TypeScript source, runtime contracts, or shared skill registry behavior changes.
