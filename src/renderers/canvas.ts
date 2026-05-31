import { CodeDoc, Theme, RenderOptions } from '../core/types';
import { computeMetrics } from './metrics';

const MONO_FONT = 'Menlo, Consolas, "Courier New", monospace';
const DOT_COLORS = ['#ff5f56', '#ffbd2e', '#27c93f'];

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  w: number,
  h: number,
) {
  const bg = theme.background;
  if (bg.startsWith('linear')) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    const colors = bg.match(/#[0-9a-fA-F]{3,8}/g) || ['#000', '#000'];
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[colors.length - 1]);
    ctx.fillStyle = g as any;
  } else {
    ctx.fillStyle = bg;
  }
  ctx.fillRect(0, 0, w, h);
}

export function renderCanvas(doc: CodeDoc, theme: Theme, opt: RenderOptions): void {
  const fontSize = opt.fontSize ?? 14;
  const ctx = opt.ctx;
  ctx.font = `${fontSize}px ${MONO_FONT}`;
  const charWidth = ctx.measureText('M').width || fontSize * 0.6;

  const m = computeMetrics(doc, {
    fontSize,
    charWidth,
    lineNumber: opt.lineNumber,
    title: opt.title,
    width: opt.width,
    height: opt.height,
  });

  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;

  ctx.font = `${fontSize}px ${MONO_FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const radius = opt.borderRadius ?? 8;
  ctx.save();
  roundRectPath(ctx, 0, 0, m.width, m.height, radius);
  ctx.clip();
  paintBackground(ctx, theme, m.width, m.height);

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.fillStyle = DOT_COLORS[i];
    ctx.arc(20 + i * 20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opt.title) {
    ctx.fillStyle = theme.titleColor;
    ctx.textAlign = 'center';
    ctx.fillText(opt.title, m.width / 2, 14);
    ctx.textAlign = 'left';
  }

  for (let i = 0; i < doc.lines.length; i++) {
    const y = m.headerHeight + i * m.lineHeight;

    if (opt.lineNumber) {
      ctx.fillStyle = theme.lineNumberColor;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), m.gutter - 12, y);
      ctx.textAlign = 'left';
    }

    let x = m.gutter + m.padLeft;
    for (const tok of doc.lines[i].tokens) {
      ctx.fillStyle = theme.scopes[tok.scope] || theme.defaultColor;
      ctx.fillText(tok.text, x, y);
      x += ctx.measureText(tok.text).width;
    }
  }

  ctx.restore();
}
