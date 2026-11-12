import type { KataGoBackendPreference } from '../../types';

export type KataGoModelLoadStage = 'fetch' | 'parse' | 'warmup';

export const normalizeKataGoBackendPreference = (
  backend?: KataGoBackendPreference | null
): KataGoBackendPreference =>
  backend === 'wasm' || backend === 'cpu' || backend === 'webgl' || backend === 'webgpu'
    ? backend
    : 'webgpu';

export function getKataGoWarmupFallbackBackend(args: {
  requestedBackend: KataGoBackendPreference;
  activeBackend: string | null | undefined;
  stage: KataGoModelLoadStage;
}): KataGoBackendPreference | null {
  if (args.stage !== 'warmup') return null;

  const activeBackend = args.activeBackend?.trim().toLowerCase();
  // webgpu -> webgl -> wasm -> cpu. Both the setBackend failure chain and the
  // warmup failure chain must agree, otherwise a warmup failure skips webgl
  // and lands on single-threaded WASM (the regression we are avoiding).
  if (activeBackend === 'webgpu' && args.requestedBackend !== 'cpu') return 'webgl';
  if (activeBackend === 'webgl' && args.requestedBackend !== 'cpu') return 'wasm';
  if (activeBackend === 'wasm' && args.requestedBackend !== 'cpu') return 'cpu';
  return null;
}

export function shouldRetryKataGoModelLoadOnFallback(args: {
  requestedBackend: KataGoBackendPreference;
  activeBackend: string | null | undefined;
  stage: KataGoModelLoadStage;
}): boolean {
  return getKataGoWarmupFallbackBackend(args) !== null;
}

export function shouldCacheKataGoFallbackForRequest(args: {
  requestedBackend: KataGoBackendPreference;
  fallbackBackend: string | null | undefined;
}): boolean {
  const fallbackBackend = args.fallbackBackend?.trim().toLowerCase();
  return !!fallbackBackend && fallbackBackend !== args.requestedBackend;
}
