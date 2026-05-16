# Maintainer Note: src/registry/

**Area:** `src/registry/` — AgentRegistry (central state untuk agent registration).

## Overview

`AgentRegistry` adalah single source of truth untuk registered agents.
Core tetap agent-agnostic — tidak ada hardcoded agent ID atau policy di registry.

## Prinsip

- Agent hanya register via registry contracts — tidak ada direct coupling ke runtime internals.
- Registry tidak boleh import dari agent internals.
- Extension dan capability registration dilakukan melalui registry/capability contracts.

## Gotchas

- Jangan hardcode agent ID/defaults/policy di registry.
- Registry adalah state — pastikan cleanup proper saat test (clear mocks/state).

## Changelog

- 2026-05-16: Initial maintainer note dibuat.
