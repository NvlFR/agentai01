# Evaluation Loop

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Improve an agent, prompt, tool, workflow, or provider choice with evidence.
- Compare behavior before and after a change.
- Decide whether a runtime workflow is safe enough to automate.

## Requirements

- Clear behavior under test, expected outcome, and acceptance criteria.
- Representative examples that do not contain private user data or secrets.
- Test command, smoke test, or manual review rubric.
- Versioned notes for prompt/tool/provider changes.

## Workflow

1. Define the behavior and failure mode in one paragraph.
2. Select examples that cover happy path, edge case, refusal/safety, and regression risk.
3. Run the narrowest repeatable check first, then broader smoke if needed.
4. Compare outputs against acceptance criteria and record misses.
5. Apply the smallest prompt, tool, data, or code change needed.
6. Keep evaluation artifacts project-relative and update the relevant skill if the workflow changes.

## Safety

- Do not include raw secrets, private transcripts, or client documents in eval fixtures.
- Do not optimize for a single example if it weakens safety or lifecycle guarantees.
- Do not turn non-deterministic provider behavior into a false pass/fail without tolerance.
- Mark live external calls separately from mocked tests.

## Validation

```bash
test -f skills/evaluation-loop/SKILL.md
rg -n "acceptance criteria|regression|fixtures|smoke" skills/evaluation-loop/SKILL.md
```
