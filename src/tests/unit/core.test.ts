/**
 * 核心类型测试
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BOARD_SIZE,
  DEFAULT_KOMI,
  ENGINE_LIMITS,
  getBoardArea,
  isValidBoardSize,
  isValidCoordinate,
  isValidKomi,
  isValidVisits,
  isValidTimeMs,
} from '../../core/constants';
import {
  KataGoError,
  KataGoCanceledError,
  isKataGoCanceledError,
  categorizeError,
  ErrorCategory,
} from '../../core/errors';

describe('Constants', () => {
  describe('DEFAULT_BOARD_SIZE', () => {
    it('should be 19', () => {
      expect(DEFAULT_BOARD_SIZE).toBe(19);
    });
  });

  describe('DEFAULT_KOMI', () => {
    it('should be 7.5', () => {
      expect(DEFAULT_KOMI).toBe(7.5);
    });
  });

  describe('ENGINE_LIMITS', () => {
    it('should have MAX_VISITS defined', () => {
      expect(ENGINE_LIMITS.MAX_VISITS).toBe(10000);
    });

    it('should have MAX_TIME_MS defined', () => {
      expect(ENGINE_LIMITS.MAX_TIME_MS).toBe(60000);
    });
  });

  describe('getBoardArea', () => {
    it('should return correct area for 9x9 board', () => {
      expect(getBoardArea(9)).toBe(81);
    });

    it('should return correct area for 19x19 board', () => {
      expect(getBoardArea(19)).toBe(361);
    });
  });

  describe('isValidBoardSize', () => {
    it('should return true for valid sizes', () => {
      expect(isValidBoardSize(9)).toBe(true);
      expect(isValidBoardSize(13)).toBe(true);
      expect(isValidBoardSize(19)).toBe(true);
    });

    it('should return false for invalid sizes', () => {
      expect(isValidBoardSize(8)).toBe(false);
      expect(isValidBoardSize(20)).toBe(false);
      expect(isValidBoardSize(15.5)).toBe(false);
    });
  });

  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinate(0, 0, 19)).toBe(true);
      expect(isValidCoordinate(18, 18, 19)).toBe(true);
      expect(isValidCoordinate(9, 9, 19)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(isValidCoordinate(-1, 0, 19)).toBe(false);
      expect(isValidCoordinate(0, -1, 19)).toBe(false);
      expect(isValidCoordinate(19, 0, 19)).toBe(false);
      expect(isValidCoordinate(0, 19, 19)).toBe(false);
    });
  });

  describe('isValidKomi', () => {
    it('should return true for valid komi values', () => {
      expect(isValidKomi(7.5)).toBe(true);
      expect(isValidKomi(0)).toBe(true);
      expect(isValidKomi(-5.5)).toBe(true);
    });

    it('should return false for invalid komi values', () => {
      expect(isValidKomi(NaN)).toBe(false);
      expect(isValidKomi(Infinity)).toBe(false);
    });
  });

  describe('isValidVisits', () => {
    it('should return true for valid visits', () => {
      expect(isValidVisits(1)).toBe(true);
      expect(isValidVisits(100)).toBe(true);
      expect(isValidVisits(10000)).toBe(true);
    });

    it('should return false for invalid visits', () => {
      expect(isValidVisits(0)).toBe(false);
      expect(isValidVisits(10001)).toBe(false);
      expect(isValidVisits(1.5)).toBe(false);
    });
  });

  describe('isValidTimeMs', () => {
    it('should return true for valid time values', () => {
      expect(isValidTimeMs(100)).toBe(true);
      expect(isValidTimeMs(1000)).toBe(true);
      expect(isValidTimeMs(60000)).toBe(true);
    });

    it('should return false for invalid time values', () => {
      expect(isValidTimeMs(99)).toBe(false);
      expect(isValidTimeMs(60001)).toBe(false);
      expect(isValidTimeMs(NaN)).toBe(false);
    });
  });
});

describe('Errors', () => {
  describe('KataGoError', () => {
    it('should create error with message', () => {
      const error = new KataGoError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('KataGoError');
    });
  });

  describe('KataGoCanceledError', () => {
    it('should create canceled error', () => {
      const error = new KataGoCanceledError();
      expect(error.message).toBe('Analysis canceled');
      expect(error.name).toBe('KataGoCanceledError');
      expect(error.canceled).toBe(true);
    });

    it('should create canceled error with custom message', () => {
      const error = new KataGoCanceledError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('isKataGoCanceledError', () => {
    it('should return true for KataGoCanceledError', () => {
      const error = new KataGoCanceledError();
      expect(isKataGoCanceledError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Test');
      expect(isKataGoCanceledError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isKataGoCanceledError(null)).toBe(false);
      expect(isKataGoCanceledError(undefined)).toBe(false);
      expect(isKataGoCanceledError('error')).toBe(false);
    });
  });

  describe('categorizeError', () => {
    it('should categorize KataGoCanceledError', () => {
      const error = new KataGoCanceledError();
      expect(categorizeError(error)).toBe(ErrorCategory.ANALYSIS);
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Unknown');
      expect(categorizeError(error)).toBe(ErrorCategory.UNKNOWN);
    });
  });
});
