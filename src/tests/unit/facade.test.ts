/**
 * 门面契约测试：weiqi-bot 依赖的导出必须存在且行为不变。
 * 引擎实现换到 src/upstream/ 后，这里是防止契约漂移的第一道闸。
 */
import { describe, it, expect } from 'vitest';
import * as facade from '../../index';
import {
  getKataGoEngineClient,
  setWorkerUrl,
  KataGoCanceledError,
  isKataGoCanceledError,
  getOpponent,
} from '../../index';

describe('facade exports', () => {
  it('exposes a stable singleton client', () => {
    const a = getKataGoEngineClient();
    const b = getKataGoEngineClient();
    expect(a).toBe(b);
    expect(typeof a.init).toBe('function');
    expect(typeof a.analyze).toBe('function');
    expect(typeof a.evaluate).toBe('function');
    expect(typeof a.evaluateBatch).toBe('function');
    expect(typeof a.getEngineInfo).toBe('function');
  });

  it('setWorkerUrl remains callable (weiqi-bot subpath deploy)', () => {
    expect(() => setWorkerUrl('assets/worker.js')).not.toThrow();
  });

  it('KataGoCanceledError contract', () => {
    const e = new KataGoCanceledError();
    expect(e.name).toBe('KataGoCanceledError');
    expect(e.canceled).toBe(true);
    expect(isKataGoCanceledError(e)).toBe(true);
    expect(isKataGoCanceledError(new Error('x'))).toBe(false);
    expect(isKataGoCanceledError(null)).toBe(false);
  });

  it('getOpponent', () => {
    expect(getOpponent('black')).toBe('white');
    expect(getOpponent('white')).toBe('black');
  });

  it('KataGo debug API is gone (no setDebugEnabled export)', () => {
    expect('setDebugEnabled' in facade).toBe(false);
  });
});
