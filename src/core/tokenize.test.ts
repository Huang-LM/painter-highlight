import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('对 js 关键字与数字标注正确 scope', () => {
    const tokens = tokenize('const x = 1', 'javascript');
    const merged = tokens.map((t) => ({ text: t.text, scope: t.scope }));
    expect(merged).toContainEqual({ text: 'const', scope: 'keyword' });
    expect(merged).toContainEqual({ text: '1', scope: 'number' });
    expect(merged.some((t) => t.text.includes('x') && t.scope === '')).toBe(true);
  });

  it('保留换行符', () => {
    const tokens = tokenize('const a = 1\nconst b = 2', 'javascript');
    const all = tokens.map((t) => t.text).join('');
    expect(all).toContain('\n');
  });

  it('正确解码 HTML 实体', () => {
    const tokens = tokenize('a < b && c', 'javascript');
    const all = tokens.map((t) => t.text).join('');
    expect(all).toContain('<');
    expect(all).toContain('&&');
  });

  it('不支持的语言回退为单一无 scope 文本，不抛错', () => {
    const tokens = tokenize('hello world', 'no-such-lang');
    expect(tokens).toEqual([{ text: 'hello world', scope: '' }]);
  });

  it('空字符串返回空数组', () => {
    expect(tokenize('', 'javascript')).toEqual([]);
  });
});
