import hljs from 'highlight.js';
import { Token } from './types';

// 解码 highlight.js 输出中用到的 HTML 实体
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&'); // & 必须最后解码
}

// class="hljs-keyword" / "hljs-title function_" → 'keyword' / 'title'
function classToScope(cls: string): string {
  const first = cls.trim().split(/\s+/)[0] || '';
  return first.startsWith('hljs-') ? first.slice(5) : '';
}

// 无 DOM 依赖：扫描 highlight.js 的 HTML 字符串，按 span 栈产出 token
function parseHtml(html: string): Token[] {
  const tokens: Token[] = [];
  const scopeStack: string[] = [];
  const tagRe = /<span class="([^"]*)">|<\/span>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  const pushText = (raw: string) => {
    if (!raw) return;
    const text = decodeEntities(raw);
    if (text === '') return;
    tokens.push({ text, scope: scopeStack[scopeStack.length - 1] || '' });
  };

  while ((m = tagRe.exec(html)) !== null) {
    pushText(html.slice(last, m.index));
    if (m[0].startsWith('</')) {
      scopeStack.pop();
    } else {
      scopeStack.push(classToScope(m[1]));
    }
    last = tagRe.lastIndex;
  }
  pushText(html.slice(last));
  return tokens;
}

export function tokenize(code: string, language: string): Token[] {
  if (code === '') return [];
  // 语言不支持：整体当无 scope 文本
  if (!hljs.getLanguage(language)) {
    return [{ text: code, scope: '' }];
  }
  const html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
  return parseHtml(html);
}
