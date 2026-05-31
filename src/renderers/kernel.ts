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

    views.push({
      type: 'inlineText',
      id: 'line_' + i,
      css: {
        top,
        left: m.gutter + m.padLeft + 'px',
        fontSize: fontSize + 'px',
        fontFamily: MONO_FONT,
        lineHeight: m.lineHeight + 'px',
      },
      textList: doc.lines[i].tokens.map((tok) => ({
        text: tok.text,
        css: { color: theme.scopes[tok.scope] || theme.defaultColor },
      })),
    });
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
  const m = metricsOf(doc, opt);
  const palette = buildPalette(doc, theme, opt, m);
  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;

  const pen = new Pen(opt.ctx, palette as any);
  await pen.paint();
}
