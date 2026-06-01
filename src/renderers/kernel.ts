import { Pen } from 'painter-kernel';
import { CodeDoc, Theme, RenderOptions } from '../core/types';
import { computeMetrics, Metrics } from './metrics';

const MONO_FONT = 'Menlo, Consolas, "Courier New", monospace';
const DOT_COLORS = ['#ff5f56', '#ffbd2e', '#27c93f'];

export interface IPalette {
  background: string;
  width: string;
  height: string;
  borderRadius: string;
  views: any[];
}

// 由 RenderOptions 计算度量（含 charWidth 测量），供 buildPalette / renderKernel 复用
function metricsOf(doc: CodeDoc, opt: RenderOptions): Metrics {
  const fontSize = opt.fontSize ?? 14;
  const charWidth = opt.ctx.measureText('M').width || fontSize * 0.6;
  return computeMetrics(doc, {
    fontSize,
    charWidth,
    lineNumber: opt.lineNumber,
    title: opt.title,
    width: opt.width,
    height: opt.height,
  });
}

export function buildPalette(
  doc: CodeDoc,
  theme: Theme,
  opt: RenderOptions,
  metrics?: Metrics,
): IPalette {
  const fontSize = opt.fontSize ?? 14;
  const m = metrics ?? metricsOf(doc, opt);

  const views: any[] = [];

  for (let i = 0; i < 3; i++) {
    views.push({
      type: 'rect',
      id: 'dot_' + i,
      css: {
        top: '16px',
        left: 14 + i * 20 + 'px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: DOT_COLORS[i],
      },
    });
  }

  if (opt.title) {
    views.push({
      type: 'text',
      id: 'title',
      text: opt.title,
      css: {
        top: '14px',
        left: m.width / 2 + 'px',
        align: 'center',
        fontSize: fontSize + 'px',
        color: theme.titleColor,
      },
    });
  }

  for (let i = 0; i < doc.lines.length; i++) {
    const top = m.headerHeight + i * m.lineHeight + 'px';

    if (opt.lineNumber) {
      views.push({
        type: 'text',
        id: 'ln_' + i,
        text: String(i + 1),
        css: {
          top,
          left: m.gutter - 12 + 'px',
          align: 'right',
          fontSize: fontSize + 'px',
          fontFamily: MONO_FONT,
          color: theme.lineNumberColor,
        },
      });
    }

    // 逐个 token 计算 x 坐标，一个 token 一个 text view
    let tokenLeft = m.gutter + m.padLeft;
    for (let j = 0; j < doc.lines[i].tokens.length; j++) {
      const tok = doc.lines[i].tokens[j];
      views.push({
        type: 'text',
        id: `line_${i}_tok_${j}`,
        text: tok.text,
        css: {
          top,
          left: tokenLeft + 'px',
          fontSize: fontSize + 'px',
          fontFamily: MONO_FONT,
          color: theme.scopes[tok.scope] || theme.defaultColor,
        },
      });
      // token 宽度：ASCII 字符按 charWidth，CJK 字符按 charWidth*2
      let tokenWidth = 0;
      for (let k = 0; k < tok.text.length; k++) {
        const code = tok.text.charCodeAt(k);
        // CJK Unified Ideographs (4E00-9FFF) + CJK Unified Ideographs Extension A (3400-4DBF)
        // + CJK Unified Ideographs Extension B 及以后 + CJK Compatibility Ideographs (F900-FAFF)
        const isCJK = (code >= 0x4e00 && code <= 0x9fff) ||
                      (code >= 0x3400 && code <= 0x4dbf) ||
                      (code >= 0x20000) ||
                      (code >= 0xf900 && code <= 0xfaff);
        tokenWidth += isCJK ? m.charWidth * 2 : m.charWidth;
      }
      tokenLeft += tokenWidth;
    }
  }

  return {
    background: theme.background,
    width: m.width + 'px',
    height: m.height + 'px',
    borderRadius: (opt.borderRadius ?? 8) + 'px',
    views,
  };
}

export async function renderKernel(
  doc: CodeDoc,
  theme: Theme,
  opt: RenderOptions,
): Promise<void> {
  console.log('[renderKernel] 计算指标...');
  const m = metricsOf(doc, opt);
  console.log('[renderKernel] 指标完成');

  console.log('[renderKernel] 构建 palette...');
  const palette = buildPalette(doc, theme, opt, m);
  console.log('[renderKernel] palette 完成，views 数量:', palette.views.length);

  console.log('[renderKernel] 设置 canvas 尺寸:',m.width, 'x', m.height);
  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;
  console.log('[renderKernel] 创建 Pen...');

  const pen = new Pen(opt.ctx, palette as any);
  console.log('[renderKernel] 开始 paint...');
  await pen.paint();
  console.log('[renderKernel] paint 完成');
}
