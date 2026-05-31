import { describe, it, expect, vi } from 'vitest';
import { renderCanvas } from './canvas';
import { resolveTheme } from '../core/theme';
import { CodeDoc } from '../core/types';

// 最小 mock ctx：记录 fillText 调用与 fillStyle 变化
function makeCtx() {
  const calls: Array<{ type: string; args: any[]; fillStyle: any }> = [];
  let _fillStyle: any = '';
  const ctx: any = {
    measureText: (s: string) => ({ width: s.length * 8 }),
    fillRect: (...a: any[]) => calls.push({ type: 'fillRect', args: a, fillStyle: _fillStyle }),
    fillText: (...a: any[]) => calls.push({ type: 'fillText', args: a, fillStyle: _fillStyle }),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    set fillStyle(v: any) {
      _fillStyle = v;
    },
    get fillStyle() {
      return _fillStyle;
    },
    set font(_v: any) {},
    set textBaseline(_v: any) {},
    set textAlign(_v: any) {},
  };
  return { ctx, calls };
}

const theme = resolveTheme('githubDark');

describe('renderCanvas', () => {
  it('fillText 至少覆盖所有 token', () => {
    const { ctx, calls } = makeCtx();
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'const', scope: 'keyword' }, { text: ' x', scope: '' }] }],
      maxColumns: 7,
    };
    renderCanvas(doc, theme, { canvasNode: {}, ctx, code: '', language: 'javascript' });
    const texts = calls.filter((c) => c.type === 'fillText').map((c) => c.args[0]);
    expect(texts).toContain('const');
    expect(texts).toContain(' x');
  });

  it('keyword token 用主题中的 keyword 颜色绘制', () => {
    const { ctx, calls } = makeCtx();
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'const', scope: 'keyword' }] }],
      maxColumns: 5,
    };
    renderCanvas(doc, theme, { canvasNode: {}, ctx, code: '', language: 'javascript' });
    const kw = calls.find((c) => c.type === 'fillText' && c.args[0] === 'const');
    expect(kw!.fillStyle).toBe(theme.scopes.keyword);
  });

  it('换行后 y 增大、行内 x 从 gutter 起递增', () => {
    const { ctx, calls } = makeCtx();
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'a', scope: '' }] }, { tokens: [{ text: 'b', scope: '' }] }],
      maxColumns: 1,
    };
    renderCanvas(doc, theme, { canvasNode: {}, ctx, code: '', language: 'javascript' });
    const a = calls.find((c) => c.type === 'fillText' && c.args[0] === 'a')!;
    const b = calls.find((c) => c.type === 'fillText' && c.args[0] === 'b')!;
    expect(b.args[2]).toBeGreaterThan(a.args[2]); // y(b) > y(a)
  });

  it('开启行号时绘制行号文本', () => {
    const { ctx, calls } = makeCtx();
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'a', scope: '' }] }, { tokens: [{ text: 'b', scope: '' }] }],
      maxColumns: 1,
    };
    renderCanvas(doc, theme, {
      canvasNode: {},
      ctx,
      code: '',
      language: 'javascript',
      lineNumber: true,
    });
    const texts = calls.filter((c) => c.type === 'fillText').map((c) => c.args[0]);
    expect(texts).toContain('1');
    expect(texts).toContain('2');
  });

  it('设置 canvasNode 宽高', () => {
    const { ctx } = makeCtx();
    const node: any = {};
    const doc: CodeDoc = { lines: [{ tokens: [{ text: 'a', scope: '' }] }], maxColumns: 1 };
    renderCanvas(doc, theme, { canvasNode: node, ctx, code: '', language: 'javascript' });
    expect(node.width).toBeGreaterThan(0);
    expect(node.height).toBeGreaterThan(0);
  });

  it('传入 title 时绘制标题文本', () => {
    const { ctx, calls } = makeCtx();
    const doc: CodeDoc = { lines: [{ tokens: [{ text: 'a', scope: '' }] }], maxColumns: 1 };
    renderCanvas(doc, theme, {
      canvasNode: {},
      ctx,
      code: '',
      language: 'javascript',
      title: 'demo.ts',
    });
    const texts = calls.filter((c) => c.type === 'fillText').map((c) => c.args[0]);
    expect(texts).toContain('demo.ts');
  });

  it('绘制三个窗口圆点（arc 调用三次）', () => {
    const { ctx } = makeCtx();
    const doc: CodeDoc = { lines: [{ tokens: [{ text: 'a', scope: '' }] }], maxColumns: 1 };
    renderCanvas(doc, theme, { canvasNode: {}, ctx, code: '', language: 'javascript' });
    expect((ctx.arc as any).mock.calls.length).toBe(3);
  });
});
