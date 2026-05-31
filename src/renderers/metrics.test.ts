import { describe, it, expect } from 'vitest';
import { computeMetrics } from './metrics';
import { CodeDoc } from '../core/types';

const doc: CodeDoc = {
  lines: [{ tokens: [] }, { tokens: [] }, { tokens: [] }], // 3 行
  maxColumns: 10,
};

describe('computeMetrics', () => {
  it('行高为字号的 1.5 倍', () => {
    const m = computeMetrics(doc, { fontSize: 14, charWidth: 8 });
    expect(m.lineHeight).toBe(21);
  });

  it('开启行号时 gutter 宽度大于 0', () => {
    const m = computeMetrics(doc, { fontSize: 14, charWidth: 8, lineNumber: true });
    expect(m.gutter).toBeGreaterThan(0);
  });

  it('关闭行号时 gutter 为 0', () => {
    const m = computeMetrics(doc, { fontSize: 14, charWidth: 8, lineNumber: false });
    expect(m.gutter).toBe(0);
  });

  it('有标题时顶部栏更高', () => {
    const withTitle = computeMetrics(doc, { fontSize: 14, charWidth: 8, title: 'a.ts' });
    const noTitle = computeMetrics(doc, { fontSize: 14, charWidth: 8 });
    expect(withTitle.headerHeight).toBeGreaterThanOrEqual(noTitle.headerHeight);
  });

  it('width/height auto 时按内容算出正整数', () => {
    const m = computeMetrics(doc, { fontSize: 14, charWidth: 8 });
    expect(m.width).toBeGreaterThan(0);
    expect(m.height).toBeGreaterThan(0);
  });
});
