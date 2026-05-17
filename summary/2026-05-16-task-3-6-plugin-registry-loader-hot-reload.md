# Summary: Task 3.6 — Implementasi Plugin Registry, Loader, dan Hot Reload

## Status
- [x] **Registry Implementation**: `src/plugin-sdk/registry.ts`
- [x] **Loader Implementation**: `src/plugin-sdk/loader.ts`
- [x] **Hot Reload Implementation**: `src/plugin-sdk/hot-reload.ts`
- [x] **Types Update**: `src/plugin-sdk/types.ts`
- [x] **Barrel Update**: `src/plugin-sdk/index.ts`
- [x] **Tests Passed**: `loader.test.ts`, `registry.test.ts`, `hot-reload.test.ts`
- [x] **Compliance Check**: `npm run check` green
- [x] **Smoke Test**: `npm run runtime:smoke` green

## Changes

### 1. Plugin Registry (`src/plugin-sdk/registry.ts`)
Implemented `createPluginRegistry` to manage the lifecycle of plugins.
- `load(pluginPath)`: Loads manifest and registers metadata.
- `enable(id)`: Dynamically imports the plugin module, initializes via factory, and collects capabilities.
- `disable(id)`: Clears plugin instance and capabilities.
- `list()` / `get(id)`: Provides access to registered plugins.

### 2. Plugin Loader (`src/plugin-sdk/loader.ts`)
Implemented `createPluginLoader` with strict Zod validation.
- Uses `PluginManifestSchema` to ensure all plugins have required fields (`id`, `name`, `version`, `description`).
- Safe reading of `manifest.json` via `readFileSafe`.
- Detailed error diagnostics when validation fails.

### 3. Hot Reload (`src/plugin-sdk/hot-reload.ts`)
Implemented `watchExtensions` using `chokidar`.
- Watches `extensionDir` for additions or changes in `manifest.json` or `index.js`.
- Automatically reloads plugins in the registry.
- Provides a `stop()` method for clean shutdown.

### 4. Support Changes
- **types.ts**: Added `PluginManifest` type.
- **plugin-entry.ts**: Extended `PluginRegistrationApi` with `registerProvider` and `registerTool`.
- **index.ts**: Exported new modules.

## Validation Results
- `npm run check`: Zero errors.
- `bun test`: All tests passed for the new modules.
- `npm run runtime:smoke`: Passed successfully.

## Security Compliance
- No hardcoded secrets.
- Path traversal protection via `resolveInside` (indirectly via `loader`).
- Runtime validation of plugin manifests.
