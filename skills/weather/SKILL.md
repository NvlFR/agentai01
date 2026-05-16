# Weather

Status: executable, non-deterministic.
Source: `referensi/openclaw/skills/weather`

Executable skill for current weather and forecasts through the no-secret `wttr.in` service.

## Use When

- The user asks for current weather, rain chance, temperature, wind, humidity, or a short forecast.
- Travel planning needs a quick weather check for a city, region, or airport code.
- A runtime agent needs a JSON-safe weather response without storing credentials.

## Requirements

- Runtime executable: `skill.json`, `index.mjs`, `index.test.ts`.
- Network access to `https://wttr.in`.
- No API key or secret is required.
- Optional CLI validation uses `curl`.

## Workflow

1. Require an explicit location such as `Jakarta`, `New York`, `ORD`, or `London,UK`.
2. Use `brief` for a compact one-line answer, `current` for current conditions, `forecast` for the standard wttr.in forecast, or `json` for parsed machine-readable data.
3. Keep requests rate-conscious. Do not poll repeatedly.
4. For severe weather, aviation, marine, legal, or safety-critical decisions, verify with official local services.

```bash
bun skills/workshop.mjs run weather --input '{"location":"Jakarta","format":"brief"}'
bun skills/workshop.mjs run weather --input '{"location":"ORD","format":"json","unitSystem":"us"}'
curl -s "https://wttr.in/Jakarta?format=3"
```

## Safety

- Do not send private addresses unless the operator explicitly provides them for the weather check.
- The service is external and non-deterministic; results can change by time, location resolution, and upstream availability.
- Do not use this skill for historical weather, climate analysis, microclimate sensor data, emergency alerts, aviation, or marine operations.
- Output is JSON-safe and contains the source URL used for verification.

## Validation

```bash
bun skills/workshop.mjs validate skills/weather
bun test skills/weather
```
