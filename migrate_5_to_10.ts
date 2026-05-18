import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { Glob } from "bun";

const ROOT = process.cwd();
const RESTORED_SRC = join(ROOT, "restored-src/src");
const TARGET_SRC = join(ROOT, "src");

interface MigrationMap {
  sourceGlob: string;
  targetDir: string;
}

const map: MigrationMap[] = [
  // Task 5
  { sourceGlob: "utils/telemetry/**/*.ts", targetDir: "logging/telemetry" },
  { sourceGlob: "utils/git/**/*.ts", targetDir: "runtime-app/integrations/git" },
  { sourceGlob: "utils/github/**/*.ts", targetDir: "runtime-app/integrations/github" },
  { sourceGlob: "utils/filePersistence/**/*.ts", targetDir: "memory/persistence" },
  { sourceGlob: "utils/teleport/**/*.ts", targetDir: "runtime-app/extensions/teleport" },
  { sourceGlob: "utils/teleport/**/*.tsx", targetDir: "runtime-app/extensions/teleport" },
  { sourceGlob: "utils/ultraplan/**/*.ts", targetDir: "tools/ultraplan" },
  
  // Task 6
  { sourceGlob: "utils/computerUse/**/*.ts", targetDir: "runtime-app/tools/computer-use" },

  // Task 7
  { sourceGlob: "services/api/**/*.ts", targetDir: "runtime-app/providers/api" },
  { sourceGlob: "services/mcp/**/*.ts", targetDir: "mcp/services" },

  // Task 8
  { sourceGlob: "services/analytics/**/*.ts", targetDir: "logging/analytics" },
  { sourceGlob: "services/compact/**/*.ts", targetDir: "memory/compact" },
  { sourceGlob: "services/lsp/**/*.ts", targetDir: "runtime-app/services/lsp" },

  // Task 9
  { sourceGlob: "services/plugins/**/*.ts", targetDir: "plugins/services" },
  { sourceGlob: "services/settingsSync/**/*.ts", targetDir: "runtime-app/services/settings-sync" },
  { sourceGlob: "services/remoteManagedSettings/**/*.ts", targetDir: "runtime-app/services/managed-settings" },

  // Task 10
  { sourceGlob: "services/SessionMemory/**/*.ts", targetDir: "memory/session" },
  { sourceGlob: "services/teamMemorySync/**/*.ts", targetDir: "memory/team-sync" },
  { sourceGlob: "services/PromptSuggestion/**/*.ts", targetDir: "runtime-app/prompt/suggestions" },
  { sourceGlob: "services/MagicDocs/**/*.ts", targetDir: "runtime-app/services/magic-docs" },
  { sourceGlob: "services/toolUseSummary/**/*.ts", targetDir: "tools/summary" },
];

async function migrate() {
  for (const m of map) {
    const glob = new Glob(m.sourceGlob);
    for await (const file of glob.scan({ cwd: RESTORED_SRC })) {
      const sourcePath = join(RESTORED_SRC, file);
      
      const targetPath = join(TARGET_SRC, m.targetDir, basename(file)); 
      
      await mkdir(dirname(targetPath), { recursive: true });
      
      let content = await readFile(sourcePath, "utf-8");
      
      content = content.replace(/import .* from ['"]react['"];?/g, "// import removed (react)");
      content = content.replace(/import .* from ['"]ink['"];?/g, "// import removed (ink)");
      
      await writeFile(targetPath, content, "utf-8");
      console.log(`Migrated: ${file} -> ${join(m.targetDir, basename(file))}`);
    }
  }
}

migrate().catch(console.error);
