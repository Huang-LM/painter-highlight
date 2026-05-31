import { describe, it, expect } from 'vitest';
import { layout } from './layout';
import { Token } from './types';

const T = (text: string, scope = ''): Token => ({ text, scope });

describe('layout', () => {
  it('按 \\n 切分多行，保留每行 token', () => {
    const doc = layout([T('const', 'keyword'), T(' a\nconst'), T(' b')]);
    expect(doc.lines.length).toBe(2);
    expect(doc.lines[0].tokens.map((t) => t.text).join('')).toBe('const a');
    expect(doc.lines[1].tokens.map((t) => t.text).join('')).toBe('const b');
  });

  it('空行的 tokens 为空数组', () => {
    const doc = layout([T('a\n\nb')]);
    expect(doc.lines.length).toBe(3);
    expect(doc.lines[1].tokens).toEqual([]);
  });

  it('maxColumns 取最宽一行的列数', () => {
    const doc = layout([T('ab\nabcd')]);
    expect(doc.maxColumns).toBe(4);
  });

  it('CJK 字符按 2 列计宽', () => {
    const doc = layout([T('中文')]); // 2 字 × 2 列 = 4
    expect(doc.maxColumns).toBe(4);
  });

  it('保留 token 的 scope', () => {
    const doc = layout([T('const', 'keyword'), T(' x')]);
    expect(doc.lines[0].tokens[0].scope).toBe('keyword');
  });

  // === 边界场景测试 ===

  it('token 末尾带 \\n 时正确切行', () => {
    const doc = layout([T('a\n')]);
    expect(doc.lines.length).toBe(2);
    expect(doc.lines[0].tokens.map((t) => t.text).join('')).toBe('a');
    expect(doc.lines[1].tokens).toEqual([]);
  });

  it('连续 \\n 产生多个空行', () => {
    const doc = layout([T('a\n\n\nb')]);
    expect(doc.lines.length).toBe(4);
    expect(doc.lines[0].tokens.map((t) => t.text).join('')).toBe('a');
    expect(doc.lines[1].tokens).toEqual([]);
    expect(doc.lines[2].tokens).toEqual([]);
    expect(doc.lines[3].tokens.map((t) => t.text).join('')).toBe('b');
  });

  it('单 token 含多个 \\n 时保留 scope', () => {
    const doc = layout([T('line1\nline2\nline3', 'kw')]);
    expect(doc.lines.length).toBe(3);
    expect(doc.lines[0].tokens[0].text).toBe('line1');
    expect(doc.lines[0].tokens[0].scope).toBe('kw');
    expect(doc.lines[1].tokens[0].text).toBe('line2');
    expect(doc.lines[1].tokens[0].scope).toBe('kw');
    expect(doc.lines[2].tokens[0].text).toBe('line3');
    expect(doc.lines[2].tokens[0].scope).toBe('kw');
  });

  it('仅含 \\n 的 token', () => {
    const doc = layout([T('a'), T('\n\n'), T('b')]);
    expect(doc.lines.length).toBe(3);
    expect(doc.lines[0].tokens.map((t) => t.text).join('')).toBe('a');
    expect(doc.lines[1].tokens).toEqual([]);
    expect(doc.lines[2].tokens.map((t) => t.text).join('')).toBe('b');
  });

  it('混合 CJK 和 ASCII 的宽度计算', () => {
    const doc = layout([T('a中b')]); // 1 + 2 + 1 = 4
    expect(doc.maxColumns).toBe(4);
  });

  it('全角符号按 2 列计宽', () => {
    const doc = layout([T('！')]); // 全角感叹号 U+FF01
    expect(doc.maxColumns).toBe(2);
  });

  it('空 token 流产生单空行', () => {
    const doc = layout([]);
    expect(doc.lines.length).toBe(1);
    expect(doc.lines[0].tokens).toEqual([]);
    expect(doc.maxColumns).toBe(0);
  });

  it('多行最宽列数取最大值', () => {
    const doc = layout([T('a\nab\nabc\nab')]);
    expect(doc.maxColumns).toBe(3); // 'abc' 最宽
  });
});
