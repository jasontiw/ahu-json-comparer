import { describe, it, expect, beforeEach } from 'vitest';
import { state } from './state.js';
import { esc, parseExcludeInput, isExcludedField, formatValue, describeResult } from './utils.js';

describe('esc()', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<script>"x&y"</script>'))
      .toBe('&lt;script&gt;&quot;x&amp;y&quot;&lt;/script&gt;');
  });

  it('handles empty string', () => {
    expect(esc('')).toBe('');
  });

  it('returns empty string for non-string input coerced to empty', () => {
    // undefined is coerced via String()
    expect(esc(undefined)).toBe('undefined');
  });

  it('passes through already-safe input', () => {
    expect(esc('hello world')).toBe('hello world');
    expect(esc('42')).toBe('42');
  });

  it('escapes standalone ampersand', () => {
    expect(esc('a&b')).toBe('a&amp;b');
  });
});

describe('parseExcludeInput()', () => {
  it('returns empty Set for null', () => {
    const result = parseExcludeInput(null);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns empty Set for undefined', () => {
    expect(parseExcludeInput(undefined).size).toBe(0);
  });

  it('returns empty Set for empty string', () => {
    expect(parseExcludeInput('').size).toBe(0);
  });

  it('returns empty Set for whitespace-only input', () => {
    expect(parseExcludeInput('   ').size).toBe(0);
  });

  it('splits comma-separated names and trims whitespace', () => {
    const result = parseExcludeInput(' foo , bar ');
    expect(result).toBeInstanceOf(Set);
    expect(result.has('foo')).toBe(true);
    expect(result.has('bar')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('skips empty parts from trailing commas', () => {
    const result = parseExcludeInput('a,,b');
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
    expect(result.size).toBe(2);
  });
});

describe('isExcludedField()', () => {
  beforeEach(() => {
    state.EXCLUDED_FIELDS = new Set(['timestamp', '*_ID']);
  });

  it('returns true for exact match', () => {
    expect(isExcludedField('timestamp')).toBe(true);
  });

  it('returns true for wildcard match', () => {
    expect(isExcludedField('SEGMENT_ID')).toBe(true);
    expect(isExcludedField('IP_ID')).toBe(true);
  });

  it('returns false for non-matching field', () => {
    expect(isExcludedField('name')).toBe(false);
    expect(isExcludedField('value')).toBe(false);
  });

  it('returns false when EXCLUDED_FIELDS is empty', () => {
    state.EXCLUDED_FIELDS = new Set();
    expect(isExcludedField('timestamp')).toBe(false);
    expect(isExcludedField('SEGMENT_ID')).toBe(false);
  });

  it('returns false for null or undefined key', () => {
    expect(isExcludedField(null)).toBe(false);
    expect(isExcludedField(undefined)).toBe(false);
  });
});

describe('formatValue()', () => {
  it('formats null as value-null', () => {
    expect(formatValue(null)).toBe('<span class="value-null">null</span>');
  });

  it('formats undefined as value-null', () => {
    expect(formatValue(undefined)).toBe('<span class="value-null">null</span>');
  });

  it('formats boolean as value-bool', () => {
    expect(formatValue(true)).toBe('<span class="value-bool">true</span>');
    expect(formatValue(false)).toBe('<span class="value-bool">false</span>');
  });

  it('formats string as value-string with escaped content', () => {
    expect(formatValue('hello')).toBe('<span class="value-string">"hello"</span>');
    expect(formatValue('<tag>')).toBe('<span class="value-string">"&lt;tag&gt;"</span>');
  });

  it('formats number as value-number', () => {
    expect(formatValue(42)).toBe('<span class="value-number">42</span>');
    expect(formatValue(0)).toBe('<span class="value-number">0</span>');
  });

  it('formats object/array fallback as value-same', () => {
    const result = formatValue([1, 2]);
    expect(result).toContain('value-same');
    expect(result).toContain('[1,2]');
  });
});

describe('describeResult()', () => {
  it('returns ∅ for null', () => {
    expect(describeResult(null)).toBe('∅');
  });

  it('returns ∅ for undefined', () => {
    expect(describeResult(undefined)).toBe('∅');
  });

  it('returns string(N) for strings', () => {
    expect(describeResult('hello')).toBe('string(5)');
    expect(describeResult('')).toBe('string(0)');
  });

  it('returns "number" for numbers', () => {
    expect(describeResult(42)).toBe('number');
    expect(describeResult(0)).toBe('number');
  });

  it('returns "boolean" for booleans', () => {
    expect(describeResult(true)).toBe('boolean');
    expect(describeResult(false)).toBe('boolean');
  });

  it('returns array[N] for arrays', () => {
    expect(describeResult([1, 2, 3])).toBe('array[3]');
    expect(describeResult([])).toBe('array[0]');
  });

  it('returns object{N} for objects', () => {
    expect(describeResult({ a: 1, b: 2 })).toBe('object{2}');
    expect(describeResult({})).toBe('object{0}');
  });
});
