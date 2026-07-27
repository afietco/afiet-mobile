import { requireApi } from '@/data/api/apiHolder'
import type { ApiLeague, ApiProgress } from '@/data/api/client'
import { useLive, type LiveQueryResult } from '@/data/useLive'

/**
 * Seviye ve lig verisi (Tur 2 oyunlaştırma).
 *
 * Tecrübe öğün/su/ölçüm kayıtlarından doğduğu için ilerleme, o tabloların
 * canlı sorgu anahtarlarına bağlanır: kullanıcı bir öğün ekleyince seviye
 * halkası ek bir istek beklemeden tazelenir.
 */

const PROGRESS_TABLES = ['meals', 'water', 'measurements', 'profiles', 'groups'] as const

export function useProgressResult(): LiveQueryResult<ApiProgress> {
  return useLive([...PROGRESS_TABLES], () => requireApi().getProgress(), [])
}

/** Lig sıralaması da aynı davranışlardan beslenir (puan = o ayın tecrübesi). */
export function useLeagueResult(): LiveQueryResult<ApiLeague> {
  return useLive([...PROGRESS_TABLES], () => requireApi().getLeague(), [])
}
