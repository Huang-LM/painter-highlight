import { CodeDoc } from '../core/types';

export interface MetricsInput {
  fontSize: number;
  charWidth: number; // 单个等宽 ASCII 字符宽度（由 ctx.measureText 提供）
  lineNumber?: boolean;
  title?: string;
  width?: number | 'auto';
  height?: number | 'auto';
}

export interface Metrics {
  fontSize: number;
  charWidth: number;
  lineHeight: number;
  gutter: number; // 行号区宽度
  padLeft: number; // 代码区左内边距
  padRight: number;
  headerHeight: number; // 顶部窗口栏高度（圆点 + 可选标题）
  width: number;
  height: number;
}

export function computeMetrics(doc: CodeDoc, input: MetricsInput): Metrics {
  const { fontSize, charWidth } = input;
  const lineHeight = Math.round(fontSize * 1.5);
  const padLeft = 16;
  const padRight = 24;
  const padBottom = 16;

  const lineCount = doc.lines.length;
  const digits = String(Math.max(lineCount, 1)).length;
  const gutter = input.lineNumber ? digits * charWidth + 24 : 0;

  // 顶部栏：圆点占一行；有标题不额外加高（标题与圆点同排右侧）
  const headerHeight = 44;

  const width =
    input.width && input.width !== 'auto'
      ? input.width
      : Math.ceil(gutter + padLeft + doc.maxColumns * charWidth + padRight);

  const height =
    input.height && input.height !== 'auto'
      ? input.height
      : Math.ceil(headerHeight + lineCount * lineHeight + padBottom);

  return {
    fontSize,
    charWidth,
    lineHeight,
    gutter,
    padLeft,
    padRight,
    headerHeight,
    width,
    height,
  };
}
