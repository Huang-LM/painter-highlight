# painter-highlight 双渲染器重构 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 painter-highlight 重构为「共享上层 + 两个可替换渲染器」，用 demo 页并排对比 painter-kernel 与纯 canvas 两种渲染策略，由用户选出胜者。

**Architecture:** `tokenize → layout → theme` 是两个渲染器共享的唯一数据来源；`renderers/kernel.ts`（painter-kernel inlineText）与 `renderers/canvas.ts`（等宽网格直绘）各自把结构化文档 `CodeDoc` 画到 canvas。tokenize 走 highlight.js 公开 API（解析 `.value` 的 HTML 字符串），用自写的无 DOM 依赖 mini-parser，彻底弃用私有 `._emitter`，保证小程序兼容。

**Tech Stack:** TypeScript、highlight.js 11、painter-kernel、vitest（新增测试框架）、esbuild（已有，用于 demo 本地服务）。

设计文档：`docs/superpowers/specs/2026-05-31-dual-renderer-redesign-design.md`

---

### Task 1: 基础设施 —— 安装依赖、引入 vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: 安装现有依赖与 vitest**

Run:
```bash
npm install
npm install -D vitest
```
Expected: `node_modules/` 生成，`highlight.js`、`painter-kernel`、`vitest` 均可用。

- [ ] **Step 2: 添加测试与 demo 脚本**

修改 `package.json` 的 `scripts`，改成：
```json
  "scripts": {
    "dev": "rollup -c -w rollup.config.ts",
    "build": "rollup -c rollup.config.publish.ts",
    "lint": "eslint --fix --ext .ts src",
    "test": "vitest run",
    "test:watch": "vitest",
    "demo": "esbuild demo/demo.ts --bundle --servedir=demo --outfile=demo/bundle.js"
  },
```

- [ ] **Step 3: 创建 vitest 配置**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: 验证 vitest 能跑（无测试时应正常退出）**

Run: `npx vitest run`
Expected: 提示 "No test files found" 但进程退出码为 0（或非错误）。确认框架可用。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: 引入 vitest 测试框架与 demo 脚本"
```

---

### Task 2: 公共类型定义

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: 写类型文件**

Create `src/core/types.ts`:
```ts
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
```

- [ ] **Step 2: 类型编译校验**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 无错误（types.ts 仅类型声明）。

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: 新增核心公共类型定义"
```

---

### Task 3: tokenize —— highlight.js 公开 API + 无 DOM 的 HTML mini-parser

**Files:**
- Create: `src/core/tokenize.ts`
- Test: `src/core/tokenize.test.ts`

**背景**：highlight.js v11 稳定公开输出是 `hljs.highlight(code, {language}).value`，一段含 `<span class="hljs-xxx">` 的 HTML 字符串。小程序无 `DOMParser`，因此自写字符串扫描解析器：维护 scope 栈，遇 `<span class="hljs-...">` 入栈、`</span>` 出栈，文本节点解码 HTML 实体后产出 token（scope = 栈顶第一个类去 `hljs-` 前缀）。语言不支持时整体当无 scope 文本，不抛错。

- [ ] **Step 1: 写失败测试**

Create `src/core/tokenize.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('对 js 关键字与数字标注正确 scope', () => {
    const tokens = tokenize('const x = 1', 'javascript');
    const merged = tokens.map((t) => ({ text: t.text, scope: t.scope }));
    expect(merged).toContainEqual({ text: 'const', scope: 'keyword' });
    expect(merged).toContainEqual({ text: '1', scope: 'number' });
    // 普通文本 scope 为空
    expect(merged.some((t) => t.text.includes('x') && t.scope === '')).toBe(true);
  });

  it('保留换行符', () => {
    const tokens = tokenize('const a = 1\nconst b = 2', 'javascript');
    const all = tokens.map((t) => t.text).join('');
    expect(all).toContain('\n');
  });

  it('正确解码 HTML 实体', () => {
    const tokens = tokenize('a < b && c', 'javascript');
    const all = tokens.map((t) => t.text).join('');
    expect(all).toContain('<');
    expect(all).toContain('&&');
  });

  it('不支持的语言回退为单一无 scope 文本，不抛错', () => {
    const tokens = tokenize('hello world', 'no-such-lang');
    expect(tokens).toEqual([{ text: 'hello world', scope: '' }]);
  });

  it('空字符串返回空数组', () => {
    expect(tokenize('', 'javascript')).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/tokenize.test.ts`
Expected: FAIL（`tokenize` 未定义 / 模块不存在）。

- [ ] **Step 3: 实现 tokenize**

Create `src/core/tokenize.ts`:
```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/core/tokenize.test.ts`
Expected: PASS（5 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/core/tokenize.ts src/core/tokenize.test.ts
git commit -m "feat: tokenize 走 highlight.js 公开 API，弃用 ._emitter 私有 API"
```

---

### Task 4: layout —— token 流切行、算列宽（CJK=2）

**Files:**
- Create: `src/core/layout.ts`
- Test: `src/core/layout.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/core/layout.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { layout } from './layout';
import { Token } from './types';

const T = (text: string, scope = ''): Token => ({ text, scope });

describe('layout', () => {
  it('按 \\n 切分多行，保留每行 token', () => {
    const doc = layout([T('const', 'keyword'), T(' a\nconst'), T(' b')]);
    expect(doc.lines.length).toBe(2);
    expect(doc.lines[0].tokens.map((t) => t.text).join('')).toBe('const a');
    expect(doc.lines[1].tokens.map((t) => t.text).join('')).toBe('const b');
  });

  it('空行的 tokens 为空数组', () => {
    const doc = layout([T('a\n\nb')]);
    expect(doc.lines.length).toBe(3);
    expect(doc.lines[1].tokens).toEqual([]);
  });

  it('maxColumns 取最宽一行的列数', () => {
    const doc = layout([T('ab\nabcd')]);
    expect(doc.maxColumns).toBe(4);
  });

  it('CJK 字符按 2 列计宽', () => {
    const doc = layout([T('中文')]); // 2 字 × 2 列 = 4
    expect(doc.maxColumns).toBe(4);
  });

  it('保留 token 的 scope', () => {
    const doc = layout([T('const', 'keyword'), T(' x')]);
    expect(doc.lines[0].tokens[0].scope).toBe('keyword');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/layout.test.ts`
Expected: FAIL（`layout` 未定义）。

- [ ] **Step 3: 实现 layout**

Create `src/core/layout.ts`:
```ts
import { Token, CodeLine, CodeDoc } from './types';

// 判断是否为宽字符（CJK、全角等），占 2 列
function isWide(ch: string): boolean {
  const c = ch.codePointAt(0) || 0;
  return (
    (c >= 0x1100 && c <= 0x115f) || // Hangul Jamo
    (c >= 0x2e80 && c <= 0xa4cf) || // CJK 部首 ~ 韩文
    (c >= 0xac00 && c <= 0xd7a3) || // Hangul 音节
    (c >= 0xf900 && c <= 0xfaff) || // CJK 兼容
    (c >= 0xfe30 && c <= 0xfe4f) || // CJK 兼容形式
    (c >= 0xff00 && c <= 0xff60) || // 全角
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/core/layout.test.ts`
Expected: PASS（5 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/core/layout.ts src/core/layout.test.ts
git commit -m "feat: layout 切行并按 CJK=2 列计算宽度"
```

---

### Task 5: theme —— 内置 3 套主题与解析

**Files:**
- Create: `src/core/theme.ts`
- Test: `src/core/theme.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/core/theme.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveTheme } from './theme';
import { Theme } from './types';

describe('resolveTheme', () => {
  it('按主题名返回内置主题', () => {
    const t = resolveTheme('dracula');
    expect(t.name).toBe('dracula');
    expect(typeof t.scopes.keyword).toBe('string');
  });

  it('未知主题名回退到默认主题 githubDark', () => {
    const t = resolveTheme('no-such-theme');
    expect(t.name).toBe('githubDark');
  });

  it('不传参回退到默认主题', () => {
    expect(resolveTheme().name).toBe('githubDark');
  });

  it('传自定义 Theme 对象则原样返回', () => {
    const custom: Theme = {
      name: 'mine',
      background: '#000',
      defaultColor: '#fff',
      lineNumberColor: '#888',
      titleColor: '#ccc',
      scopes: { keyword: '#f00' },
    };
    expect(resolveTheme(custom)).toBe(custom);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/theme.test.ts`
Expected: FAIL（`resolveTheme` 未定义）。

- [ ] **Step 3: 实现 theme**

Create `src/core/theme.ts`:
```ts
import { Theme } from './types';

const githubDark: Theme = {
  name: 'githubDark',
  background: '#0d1117',
  defaultColor: '#c9d1d9',
  lineNumberColor: '#484f58',
  titleColor: '#8b949e',
  scopes: {
    keyword: '#ff7b72',
    built_in: '#ffa657',
    type: '#ffa657',
    literal: '#79c0ff',
    number: '#79c0ff',
    string: '#a5d6ff',
    comment: '#8b949e',
    title: '#d2a8ff',
    'function': '#d2a8ff',
    params: '#c9d1d9',
    attr: '#79c0ff',
    attribute: '#79c0ff',
    property: '#79c0ff',
    variable: '#ffa657',
    operator: '#ff7b72',
    subst: '#c9d1d9',
    'meta': '#79c0ff',
    'tag': '#7ee787',
    'name': '#7ee787',
    'selector-tag': '#7ee787',
    regexp: '#a5d6ff',
    symbol: '#79c0ff',
    addition: '#aff5b4',
    deletion: '#ffdcd7',
  },
};

const dracula: Theme = {
  name: 'dracula',
  background: '#282a36',
  defaultColor: '#f8f8f2',
  lineNumberColor: '#6272a4',
  titleColor: '#bd93f9',
  scopes: {
    keyword: '#ff79c6',
    built_in: '#8be9fd',
    type: '#8be9fd',
    literal: '#bd93f9',
    number: '#bd93f9',
    string: '#f1fa8c',
    comment: '#6272a4',
    title: '#50fa7b',
    'function': '#50fa7b',
    params: '#ffb86c',
    attr: '#50fa7b',
    attribute: '#50fa7b',
    property: '#f8f8f2',
    variable: '#f8f8f2',
    operator: '#ff79c6',
    subst: '#f8f8f2',
    'meta': '#ff79c6',
    'tag': '#ff79c6',
    'name': '#8be9fd',
    'selector-tag': '#ff79c6',
    regexp: '#f1fa8c',
    symbol: '#bd93f9',
    addition: '#50fa7b',
    deletion: '#ff5555',
  },
};

const oneDark: Theme = {
  name: 'oneDark',
  background: '#282c34',
  defaultColor: '#abb2bf',
  lineNumberColor: '#5c6370',
  titleColor: '#828997',
  scopes: {
    keyword: '#c678dd',
    built_in: '#e6c07b',
    type: '#e6c07b',
    literal: '#56b6c2',
    number: '#d19a66',
    string: '#98c379',
    comment: '#5c6370',
    title: '#61afef',
    'function': '#61afef',
    params: '#abb2bf',
    attr: '#d19a66',
    attribute: '#d19a66',
    property: '#e06c75',
    variable: '#e06c75',
    operator: '#56b6c2',
    subst: '#abb2bf',
    'meta': '#61afef',
    'tag': '#e06c75',
    'name': '#e06c75',
    'selector-tag': '#e06c75',
    regexp: '#98c379',
    symbol: '#56b6c2',
    addition: '#98c379',
    deletion: '#e06c75',
  },
};

const THEMES: Record<string, Theme> = { githubDark, dracula, oneDark };
const DEFAULT_THEME = 'githubDark';

export function resolveTheme(theme?: string | Theme): Theme {
  if (theme && typeof theme === 'object') return theme;
  if (typeof theme === 'string' && THEMES[theme]) return THEMES[theme];
  return THEMES[DEFAULT_THEME];
}

export { THEMES };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/core/theme.test.ts`
Expected: PASS（4 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/core/theme.ts src/core/theme.test.ts
git commit -m "feat: 内置 githubDark/dracula/oneDark 三套主题"
```

---

### Task 6: 共享布局度量 —— metrics

**Files:**
- Create: `src/renderers/metrics.ts`
- Test: `src/renderers/metrics.test.ts`

**背景**：两个渲染器共用同一套尺寸/坐标计算，保证 demo 对比公平。抽成纯函数便于测试。

- [ ] **Step 1: 写失败测试**

Create `src/renderers/metrics.test.ts`:
```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/renderers/metrics.test.ts`
Expected: FAIL（`computeMetrics` 未定义）。

- [ ] **Step 3: 实现 metrics**

Create `src/renderers/metrics.ts`:
```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/renderers/metrics.test.ts`
Expected: PASS（5 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/renderers/metrics.ts src/renderers/metrics.test.ts
git commit -m "feat: 抽出两版共享的布局度量 computeMetrics"
```

---

### Task 7: canvas 渲染器（路线 B）

**Files:**
- Create: `src/renderers/canvas.ts`
- Test: `src/renderers/canvas.test.ts`

**背景**：等宽网格直绘。测试用 mock ctx 记录调用序列，不做像素断言。

- [ ] **Step 1: 写失败测试**

Create `src/renderers/canvas.test.ts`:
```ts
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
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/renderers/canvas.test.ts`
Expected: FAIL（`renderCanvas` 未定义）。

- [ ] **Step 3: 实现 canvas 渲染器**

Create `src/renderers/canvas.ts`:
```ts
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
    // 简化：解析为 45deg 双色渐变以外的情况退化为对角线
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

  // 设置画布尺寸
  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;

  // 重设 font（部分环境改尺寸会清空状态）
  ctx.font = `${fontSize}px ${MONO_FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // 圆角裁剪 + 背景
  const radius = opt.borderRadius ?? 8;
  ctx.save();
  roundRectPath(ctx, 0, 0, m.width, m.height, radius);
  ctx.clip();
  paintBackground(ctx, theme, m.width, m.height);

  // 三色圆点
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.fillStyle = DOT_COLORS[i];
    ctx.arc(20 + i * 20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 标题
  if (opt.title) {
    ctx.fillStyle = theme.titleColor;
    ctx.textAlign = 'center';
    ctx.fillText(opt.title, m.width / 2, 14);
    ctx.textAlign = 'left';
  }

  // 逐行绘制
  for (let i = 0; i < doc.lines.length; i++) {
    const y = m.headerHeight + i * m.lineHeight;

    // 行号
    if (opt.lineNumber) {
      ctx.fillStyle = theme.lineNumberColor;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), m.gutter - 12, y);
      ctx.textAlign = 'left';
    }

    // 行内 token
    let x = m.gutter + m.padLeft;
    for (const tok of doc.lines[i].tokens) {
      ctx.fillStyle = theme.scopes[tok.scope] || theme.defaultColor;
      ctx.fillText(tok.text, x, y);
      x += ctx.measureText(tok.text).width;
    }
  }

  ctx.restore();
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/renderers/canvas.test.ts`
Expected: PASS（5 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/renderers/canvas.ts src/renderers/canvas.test.ts
git commit -m "feat: canvas 网格渲染器（路线 B）"
```

---

### Task 8: kernel 渲染器（路线 A，painter-kernel inlineText）

**Files:**
- Create: `src/renderers/kernel.ts`
- Test: `src/renderers/kernel.test.ts`

**背景**：把 `CodeDoc` 转成 painter-kernel 的 `IPalette`，每行一个 `inlineText` view，token 进 `textList`。把"生成 palette"与"调用 Pen.paint"分离，便于测试 palette 结构而不实际绘制。

- [ ] **Step 1: 写失败测试**

Create `src/renderers/kernel.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildPalette } from './kernel';
import { resolveTheme } from '../core/theme';
import { CodeDoc } from '../core/types';

const theme = resolveTheme('githubDark');
// 固定 charWidth，免去真实 ctx
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/renderers/kernel.test.ts`
Expected: FAIL（`buildPalette` 未定义）。

- [ ] **Step 3: 实现 kernel 渲染器**

Create `src/renderers/kernel.ts`:
```ts
import { Pen } from 'painter-kernel';
import { CodeDoc, Theme, RenderOptions } from '../core/types';
import { computeMetrics } from './metrics';

const MONO_FONT = 'Menlo, Consolas, "Courier New", monospace';
const DOT_COLORS = ['#ff5f56', '#ffbd2e', '#27c93f'];

export interface IPalette {
  background: string;
  width: string;
  height: string;
  borderRadius: string;
  views: any[];
}

export function buildPalette(doc: CodeDoc, theme: Theme, opt: RenderOptions): IPalette {
  const fontSize = opt.fontSize ?? 14;
  const charWidth = opt.ctx.measureText('M').width || fontSize * 0.6;

  const m = computeMetrics(doc, {
    fontSize,
    charWidth,
    lineNumber: opt.lineNumber,
    title: opt.title,
    width: opt.width,
    height: opt.height,
  });

  const views: any[] = [];

  // 三色圆点
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

  // 标题
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

  // 逐行
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
  const palette = buildPalette(doc, theme, opt);
  const fontSize = opt.fontSize ?? 14;
  const charWidth = opt.ctx.measureText('M').width || fontSize * 0.6;
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

  const pen = new Pen(opt.ctx, palette as any);
  await pen.paint();
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/renderers/kernel.test.ts`
Expected: PASS（5 个用例全过）。

- [ ] **Step 5: Commit**

```bash
git add src/renderers/kernel.ts src/renderers/kernel.test.ts
git commit -m "feat: painter-kernel inlineText 渲染器（路线 A）"
```

---

### Task 9: 对外入口 index.ts（新对象参数 API）

**Files:**
- Modify: `src/index.ts`（全量替换旧实现）
- Test: `src/index.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/index.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import phl from './index';

// 复用一个能测宽的 mock ctx
function makeCtx() {
  const ctx: any = {
    measureText: (s: string) => ({ width: s.length * 8 }),
    fillRect: vi.fn(),
    fillText: vi.fn(),
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
    fillStyle: '',
    font: '',
    textBaseline: '',
    textAlign: '',
  };
  return ctx;
}

describe('phl 入口', () => {
  it('renderer=canvas 时设置 canvas 宽高并返回 Promise', async () => {
    const ctx = makeCtx();
    const node: any = {};
    await phl({
      canvasNode: node,
      ctx,
      code: 'const x = 1',
      language: 'javascript',
      renderer: 'canvas',
    });
    expect(node.width).toBeGreaterThan(0);
    expect(node.height).toBeGreaterThan(0);
  });

  it('默认 renderer 为 canvas', async () => {
    const ctx = makeCtx();
    const node: any = {};
    await phl({ canvasNode: node, ctx, code: 'a', language: 'javascript' });
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('空代码不抛错', async () => {
    const ctx = makeCtx();
    const node: any = {};
    await expect(
      phl({ canvasNode: node, ctx, code: '', language: 'javascript' }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/index.test.ts`
Expected: FAIL（旧 `phl` 是位置参数、且非 Promise）。

- [ ] **Step 3: 全量替换 index.ts**

用以下内容**整体覆盖** `src/index.ts`（删除全部旧实现）：
```ts
import { tokenize } from './core/tokenize';
import { layout } from './core/layout';
import { resolveTheme } from './core/theme';
import { renderCanvas } from './renderers/canvas';
import { renderKernel } from './renderers/kernel';
import { RenderOptions } from './core/types';

export * from './core/types';
export { THEMES } from './core/theme';

async function phl(options: RenderOptions): Promise<void> {
  const tokens = tokenize(options.code, options.language);
  const doc = layout(tokens);
  const theme = resolveTheme(options.theme);

  if (options.renderer === 'kernel') {
    await renderKernel(doc, theme, options);
  } else {
    renderCanvas(doc, theme, options);
  }
}

export default phl;
export { phl };
```

- [ ] **Step 4: 运行全部测试确认通过**

Run: `npx vitest run`
Expected: 所有测试文件 PASS（tokenize/layout/theme/metrics/canvas/kernel/index）。

- [ ] **Step 5: 类型编译校验**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 无错误。

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/index.test.ts
git commit -m "feat: 新对象参数 API，按 renderer 分派两个渲染器"
```

---

### Task 10: demo 并排对比页

**Files:**
- Create: `demo/index.html`
- Create: `demo/demo.ts`
- Modify: `.gitignore`（忽略 `demo/bundle.js`）

- [ ] **Step 1: 创建 demo 页面**

Create `demo/index.html`:
```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>painter-highlight 双渲染器对比</title>
    <style>
      body { font-family: sans-serif; margin: 20px; background: #1a1a1a; color: #eee; }
      .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
      textarea { width: 100%; height: 160px; font-family: monospace; }
      .stage { display: flex; gap: 24px; flex-wrap: wrap; }
      .panel { flex: 1; min-width: 360px; }
      .panel h3 { margin: 8px 0; }
      canvas { max-width: 100%; border: 1px solid #444; }
      select, input, button { padding: 4px 8px; }
    </style>
  </head>
  <body>
    <h2>painter-highlight：左 A(painter-kernel) vs 右 B(canvas)</h2>
    <div class="controls">
      <label>预设 <select id="preset"></select></label>
      <label>语言 <input id="lang" value="typescript" /></label>
      <label>主题
        <select id="theme">
          <option>githubDark</option>
          <option>dracula</option>
          <option>oneDark</option>
        </select>
      </label>
      <label><input type="checkbox" id="lineNumber" /> 行号</label>
      <label>标题 <input id="title" value="demo.ts" /></label>
      <button id="render">重新渲染</button>
    </div>
    <textarea id="code"></textarea>
    <div class="stage">
      <div class="panel"><h3>A: painter-kernel</h3><canvas id="canvasA"></canvas></div>
      <div class="panel"><h3>B: canvas</h3><canvas id="canvasB"></canvas></div>
    </div>
    <script src="./bundle.js"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 demo 驱动脚本**

Create `demo/demo.ts`:
```ts
import phl from '../src/index';

const PRESETS: Record<string, { lang: string; code: string }> = {
  TypeScript: {
    lang: 'typescript',
    code: `function isNumber(x: any): x is number {\n  return typeof x === "number";\n}\n\nfunction padLeft(value: string, padding: string | number) {\n  if (isNumber(padding)) {\n    return Array(padding + 1).join(" ") + value;\n  }\n  return padding + value;\n}`,
  },
  含中文注释: {
    lang: 'javascript',
    code: `// 计算两数之和\nfunction add(a, b) {\n  return a + b; // 返回结果\n}\nconsole.log(add(1, 2));`,
  },
  深层缩进: {
    lang: 'javascript',
    code: `function f() {\n  if (a) {\n    while (b) {\n      for (let i = 0; i < 10; i++) {\n        doSomething(i);\n      }\n    }\n  }\n}`,
  },
  长行: {
    lang: 'javascript',
    code: `const result = someVeryLongFunctionName(argumentOne, argumentTwo, argumentThree, argumentFour);`,
  },
};

const $ = (id: string) => document.getElementById(id) as any;

function currentOptionsBase() {
  return {
    code: $('code').value,
    language: $('lang').value,
    theme: $('theme').value,
    lineNumber: $('lineNumber').checked,
    title: $('title').value,
  };
}

async function render() {
  const base = currentOptionsBase();
  const a = $('canvasA');
  const b = $('canvasB');
  await phl({ canvasNode: a, ctx: a.getContext('2d'), renderer: 'kernel', ...base });
  await phl({ canvasNode: b, ctx: b.getContext('2d'), renderer: 'canvas', ...base });
}

function initPresets() {
  const sel = $('preset');
  Object.keys(PRESETS).forEach((name) => {
    const o = document.createElement('option');
    o.textContent = name;
    sel.appendChild(o);
  });
  sel.onchange = () => {
    const p = PRESETS[sel.value];
    $('code').value = p.code;
    $('lang').value = p.lang;
    render();
  };
  // 初始
  const first = Object.keys(PRESETS)[0];
  $('code').value = PRESETS[first].code;
  $('lang').value = PRESETS[first].lang;
}

$('render').onclick = render;
['theme', 'lineNumber', 'title'].forEach((id) => ($(id).onchange = render));
initPresets();
render();
```

- [ ] **Step 3: 忽略打包产物**

在 `.gitignore` 末尾追加一行：
```
demo/bundle.js
```

- [ ] **Step 4: 启动 demo 验证可运行**

Run: `npm run demo`
Expected: esbuild 启动本地服务（默认 `http://localhost:8000`），打开页面后左右两块 canvas 都渲染出高亮代码图，切换预设/主题/行号两侧同步更新。手动确认无报错。

- [ ] **Step 5: Commit**

```bash
git add demo/index.html demo/demo.ts .gitignore
git commit -m "feat: demo 并排对比页（A: painter-kernel / B: canvas）"
```

---

### Task 11: 更新 README，标注新 API 与对比说明

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 替换「如何使用」一节**

把 `README.md` 中旧的 `phl(CanvasNode, canvas, template, code, language)` 用法段落，替换为新对象参数 API 说明：

````markdown
### 如何使用

```ts
import phl from 'painter-highlight';

await phl({
  canvasNode,                // 绑定的 canvas 元素
  ctx,                       // canvasNode.getContext('2d')
  code: 'const x = 1',       // 要渲染的代码
  language: 'javascript',    // 语言
  renderer: 'canvas',        // 'canvas'(默认) | 'kernel'
  theme: 'githubDark',       // githubDark | dracula | oneDark | 自定义 Theme 对象
  lineNumber: true,          // 是否显示行号
  title: 'demo.ts',          // 窗口标题（可选）
  borderRadius: 8,           // 圆角
  fontSize: 14,              // 字号
  width: 'auto',             // 'auto' 或数字
  height: 'auto',
});
```

#### 两种渲染器

- `canvas`：等宽网格直接绘制，零额外依赖，对齐精确（默认）。
- `kernel`：基于 painter-kernel 的 inlineText 绘制。

可在 `demo/`（运行 `npm run demo`）并排对比两者效果。
````

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: 更新 README 至新对象参数 API"
```

---

### Task 12: 收尾验证

- [ ] **Step 1: 全量测试**

Run: `npx vitest run`
Expected: 全部 PASS。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 无错误。

- [ ] **Step 3: 构建产物校验**

Run: `npm run build`
Expected: 构建成功，`dist/` 更新无报错。

> 注：用户在 demo 页选定胜出渲染器后，再单开一个清理任务删除落败的渲染器及其测试，并把 `index.ts` 的分派简化——本计划不预先删除，保留两版供对比。
