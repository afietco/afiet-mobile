/**
 * @afiet/core; platformdan bağımsız çekirdek: tipler, sabitler, saf mantık
 * ve repository arayüzleri. React/DOM/RN importu YASAK (tsconfig bekçidir);
 * platform adaptörleri (Dexie, expo-sqlite) uygulama tarafında yaşar.
 */
/*
 * The seed food catalogue and the macro helpers that read it are deliberately
 * NOT re-exported here. `export *` is eager: re-exporting a module means the
 * barrel enumerates its keys, so every import of this package (including the
 * root layout's) evaluated 1.1 MB of catalogue literals before the app could
 * paint its first frame. They live behind their own entry points instead:
 *
 *   import { SEED_FOODS, findSeedFood } from '@afiet/core/foods'
 *   import { dayMacros } from '@afiet/core/macros'
 *
 * so only the nutrition screens that actually need the catalogue pay for it.
 */
export * from './types'
export * from './repositories'
export * from './dates'
export * from './numbers'
export * from './turkish'
export * from './bodyMetrics'
export * from './goals'
export * from './insights'
export * from './meal-amounts'
export * from './progress'
export * from './league'
export * from './kese'
export * from './appUpdate'
