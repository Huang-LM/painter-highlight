import { Token, CodeLine, CodeDoc } from './types';

// 判断是否为宽字符（CJK、全角等），占 2 列。
// 采用粗粒度区间覆盖中/日/韩与全角常见场景；个别区间含少量非宽字符
// （如 IDC），但对代码高亮场景影响可忽略。emoji 不计入（按 1 列）。
function isWide(ch: string): boolean {
  const c = ch.codePointAt(0) || 0;
  return (
    (c >= 0x1100 && c <= 0x115f) || // Hangul Jamo
    (c >= 0x2e80 && c <= 0xa4cf) || // CJK 部首 ~ 韩文（粗粒度）
    (c >= 0xac00 && c <= 0xd7a3) || // Hangul 音节
    (c >= 0xf900 && c <= 0xfaff) || // CJK 兼容
    (c >= 0xfe30 && c <= 0xfe4f) || // CJK 兼容形式
    (c >= 0xff00 && c <= 0xff60) || // 全角 ASCII、符号、空格
    (c >= 0xffe0 && c <= 0xffe6)
  );
}

function columnsOf(text: string): number {
  let cols = 0;
  for (const ch of text) cols += isWide(ch) ? 2 : 1;
  return cols;
}

export function layout(tokens: Token[]): CodeDoc {
  const lines: CodeLine[] = [{ tokens: [] }];
  let maxColumns = 0;
  let curCols = 0;

  const endLine = () => {
    if (curCols > maxColumns) maxColumns = curCols;
    curCols = 0;
    lines.push({ tokens: [] });
  };

  for (const tok of tokens) {
    const parts = tok.text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) endLine();
      if (parts[i] !== '') {
        lines[lines.length - 1].tokens.push({ text: parts[i], scope: tok.scope });
        curCols += columnsOf(parts[i]);
      }
    }
  }
  if (curCols > maxColumns) maxColumns = curCols;

  return { lines, maxColumns };
}
