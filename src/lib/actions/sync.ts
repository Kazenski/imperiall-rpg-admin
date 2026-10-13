'use server'

import { diffCounts, refreshStaging, promoteTables, diagnose } from '@/lib/sync';
import { revalidatePath } from 'next/cache';

export async function syncDiagnoseAction() {
  try {
    return { ok: true as const, data: await diagnose() };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

export async function syncDiffAction() {
  try {
    return { ok: true as const, data: await diffCounts() };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

export async function syncRefreshAction() {
  try {
    const data = await refreshStaging();
    revalidatePath('/sincronizar');
    return { ok: true as const, data };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

export async function syncPromoteAction(tables: string[]) {
  try {
    if (tables.length === 0) return { ok: false as const, error: 'Selecione ao menos uma tabela.' };
    const data = await promoteTables(tables);
    revalidatePath('/sincronizar');
    return { ok: true as const, data };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}
