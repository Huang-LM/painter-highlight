// 带样式作用域的最小文本单元
export interface Token {
  text: string; // 纯文本，不含 \n
  scope: string; // highlight.js scope（去 hljs- 前缀），普通文本为 ''
}

// 一行代码
export interface CodeLine {
  tokens: Token[]; // 从左到右；空行为 []
}

// 结构化文档：layout 的产物、渲染器的输入
export interface CodeDoc {
  lines: CodeLine[];
  maxColumns: number; // 最宽一行的列数（CJK 记 2 列）
}

// 主题
export interface Theme {
  name: string;
  background: string; // 纯色 / 渐变 / 图片 url
  defaultColor: string; // 未命中 scope 的兜底色
  lineNumberColor: string;
  titleColor: string;
  scopes: Record<string, string>; // scope → color
}

// 对外配置
export interface RenderOptions {
  canvasNode: any;
  ctx: CanvasRenderingContext2D;
  code: string;
  language: string;
  renderer?: 'kernel' | 'canvas'; // 默认 'canvas'
  theme?: string | Theme; // 主题名或自定义对象
  lineNumber?: boolean;
  title?: string; // 空则不显示标题文字
  width?: number | 'auto';
  height?: number | 'auto';
  borderRadius?: number;
  fontSize?: number; // 默认 14
}
