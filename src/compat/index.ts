export type DeprecationNotice = {
  id: string
  deprecated: string
  replacement?: string
  message: string
}

export type DeprecationReporter = (notice: DeprecationNotice) => void

export type Migration<T> = {
  from: string
  to: string
  migrate: (value: unknown) => T
}

export function createDeprecationTracker(reporter: DeprecationReporter): {
  warnOnce: (notice: DeprecationNotice) => void
} {
  const emitted = new Set<string>()
  return {
    warnOnce(notice) {
      if (emitted.has(notice.id)) {
        return
      }

      emitted.add(notice.id)
      reporter(notice)
    },
  }
}

export function buildDeprecationMessage(notice: DeprecationNotice): string {
  const replacement = notice.replacement ? ` Use ${notice.replacement} instead.` : ''
  return `${notice.deprecated} is deprecated.${replacement} ${notice.message}`.trim()
}

export function migrateValue<T>(
  value: unknown,
  migrations: readonly Migration<T>[],
  currentVersion: string,
): { version: string; value: T; migrated: boolean } {
  const migration = migrations.find(candidate => candidate.from === currentVersion)
  if (!migration) {
    return {
      version: currentVersion,
      value: value as T,
      migrated: false,
    }
  }

  return {
    version: migration.to,
    value: migration.migrate(value),
    migrated: true,
  }
}

export type {
  LegacyConfigLike,
  LegacyHealthObject,
  LegacyServiceFactory,
  LegacyServiceStopper,
  LegacyShutdownFn,
} from './legacy-adapters.js'
export type {
  AdaptationClassification,
  LandingPath,
  RestoredSrcAdaptationEntry,
  RestoredSrcCapabilityId,
} from './restored-src-adaptation.js'

export {
  bridgeBootHealthToStatus,
  bridgeProcessHealthToStatus,
  legacyBootstrapAdapter,
  legacyConfigAdapter,
  legacyShutdownAdapter,
  legacyStatusAdapter,
} from './legacy-adapters.js'
export {
  collectLandingPaths,
  findRestoredSrcAdaptationEntry,
  listContextFabricSourcePatterns,
  listMandatoryCapabilityCoverage,
  REQUIRED_RESTORED_SRC_CAPABILITIES,
  RESTORED_SRC_ADAPTATION_BASELINE,
} from './restored-src-adaptation.js'
