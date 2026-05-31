import { describe, it, expect } from 'vitest';
import { buildPalette } from './kernel';
import { resolveTheme } from '../core/theme';
import { CodeDoc } from '../core/types';

const theme = resolveTheme('githubDark');
const fakeCtx: any = { measureText: (s: string) => ({ width: s.length * 8 }) };

describe('buildPalette', () => {
  it('每行生成一个 inlineText view', () => {
    const doc: CodeDoc = {
      lines: [
        { tokens: [{ text: 'const', scope: 'keyword' }, { text: ' x', scope: '' }] },
        { tokens: [{ text: 'let y', scope: '' }] },
      ],
      maxColumns: 7,
    };
    const palette = buildPalette(doc, theme, {
      canvasNode: {},
      ctx: fakeCtx,
      code: '',
      language: 'javascript',
    });
    const inlineTexts = palette.views.filter((v) => v.type === 'inlineText');
    expect(inlineTexts.length).toBe(2);
  });

  it('inlineText 的 textList 长度等于该行 token 数，颜色来自主题', () => {
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'const', scope: 'keyword' }, { text: ' x', scope: '' }] }],
      maxColumns: 7,
    };
    const palette = buildPalette(doc, theme, {
      canvasNode: {},
      ctx: fakeCtx,
      code: '',
      language: 'javascript',
    });
    const line = palette.views.find((v) => v.type === 'inlineText') as any;
    expect(line.textList.length).toBe(2);
    expect(line.textList[0].css.color).toBe(theme.scopes.keyword);
    expect(line.textList[1].css.color).toBe(theme.defaultColor);
  });

  it('生成三个圆点 rect', () => {
    const doc: CodeDoc = { lines: [{ tokens: [{ text: 'a', scope: '' }] }], maxColumns: 1 };
    const palette = buildPalette(doc, theme, {
      canvasNode: {},
      ctx: fakeCtx,
      code: '',
      language: 'javascript',
    });
    const rects = palette.views.filter((v) => v.type === 'rect');
    expect(rects.length).toBe(3);
  });

  it('开启行号时为每行加一个行号 text view', () => {
    const doc: CodeDoc = {
      lines: [{ tokens: [{ text: 'a', scope: '' }] }, { tokens: [{ text: 'b', scope: '' }] }],
      maxColumns: 1,
    };
    const palette = buildPalette(doc, theme, {
      canvasNode: {},
      ctx: fakeCtx,
      code: '',
      language: 'javascript',
      lineNumber: true,
    });
    const lineNos = palette.views.filter(
      (v) => v.type === 'text' && (v.text === '1' || v.text === '2'),
    );
    expect(lineNos.length).toBe(2);
  });

  it('palette 带 background 与 borderRadius', () => {
    const doc: CodeDoc = { lines: [{ tokens: [] }], maxColumns: 0 };
    const palette = buildPalette(doc, theme, {
      canvasNode: {},
      ctx: fakeCtx,
      code: '',
      language: 'javascript',
      borderRadius: 12,
    });
    expect(palette.background).toBe(theme.background);
    expect(palette.borderRadius).toBe('12px');
  });
});
