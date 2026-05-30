# painter-highlight 双渲染器重构设计

日期：2026-05-31
状态：已确认，待实现

## 背景与动机

`painter-highlight` 是把代码片段渲染成高亮截图的工具：用 highlight.js 分词，用
painter-kernel 把 token 画到 canvas（兼容小程序）。

当前 `src/index.ts`（449 行）的根本问题是**用经验像素偏移逐 token 摆位置**，而非按字符网格排版：

- 依赖 highlight.js 私有 API `._emitter.root.children`，升级即可能崩溃（定时炸弹）。
- 手写正则切分 token + 海量括号/换行特判，魔法数字（`+2px / -8px / -10px / 23 / 19 / 0.6 / *12`）满天飞。
- 大量被注释掉的死代码（中文宽度、tab 处理），是反复试错的产物。
- 根因：没有用文本测量做排版，而是用偏移去凑，永远凑不准 CJK / tab / 不同字号。

**关键发现**：painter-kernel 其实提供了 `inlineText` + `textList` 类型——「一行文字内多段不同
样式片段」，内部自带 measureText 与行内续排。这正是代码高亮该用的结构。当前代码完全绕过它，把
每个 token 当独立 `text` view 手动拼接，是"用错了 painter-kernel"。

## 目标

硬约束：**必须兼容小程序 canvas**（只能用标准 `CanvasRenderingContext2D`，不能用浏览器 DOM/CSS 排版）。

本次同时实现两条渲染路线，最终由用户在 demo 页并排对比后选择保留哪条：

- **路线 A（kernel）**：正确使用 painter-kernel 的 `inlineText`，贴合"基于 painter-kernel 开发"的初衷。
- **路线 B（canvas）**：直连 canvas 的等宽网格渲染，零依赖、零私有 API、对齐天然正确。

功能范围：核心质量对齐现状（高亮上色 + Mac 三色圆点 + 圆角背景），并新增**行号、多主题、标题栏文字**。
两个版本共享同一套输入与外壳，保证对比公平。

对外 API：改为单对象参数（项目尚在 0.x，可接受破坏性变更）。

## 架构

```
src/
├── core/                      # 两版共享上层（与"怎么画"无关，唯一真相来源）
│   ├── tokenize.ts            # highlight.js 公开 API → 扁平 token 流（弃用 ._emitter）
│   ├── layout.ts              # token 流 → 结构化文档 CodeDoc
│   ├── theme.ts               # 主题配色表，内置 3 套主题
│   └── types.ts               # 公共类型
├── renderers/
│   ├── kernel.ts              # 路线 A：CodeDoc → painter-kernel IPalette(inlineText)
│   └── canvas.ts              # 路线 B：CodeDoc → 直接在 ctx 网格绘制
└── index.ts                   # 对外入口 phl(options)，按 options.renderer 选 A/B
demo/
├── index.html                 # 左右并排两块 canvas
└── demo.ts                    # 同一份输入喂给 A 和 B
```

`tokenize → layout → theme` 是两版唯一的数据来源，渲染器只负责把结构化文档画出来。这样对比
绝对公平（差异只在渲染器）；胜出后另一条可直接删除，上层不动；数据层可脱离 canvas 纯数据测试。

## 核心数据结构与接口

```ts
// core/types.ts
interface Token {
  text: string;        // 纯文本，不含 \n
  scope: string;       // highlight.js scope，如 'keyword' 'string' 'comment'；普通文本为 ''
}
interface CodeLine {
  tokens: Token[];     // 该行从左到右的 token；空行为 []
}
interface CodeDoc {
  lines: CodeLine[];
  maxColumns: number;  // 最宽一行的列数（CJK 记 2 列），用于算 width:auto
}
interface Theme {
  name: string;
  background: string;        // 纯色 / 渐变 / 图片 url
  defaultColor: string;      // 未命中 scope 的兜底色
  lineNumberColor: string;
  titleColor: string;
  scopes: Record<string, string>;  // scope → color
}
interface RenderOptions {
  canvasNode: any;
  ctx: CanvasRenderingContext2D;
  code: string;
  language: string;
  renderer?: 'kernel' | 'canvas';  // 默认 'canvas'
  theme?: string | Theme;          // 主题名或自定义；内置 githubDark/dracula/oneDark
  lineNumber?: boolean;
  title?: string;                  // 空则不显示标题栏文字
  width?: number | 'auto';
  height?: number | 'auto';
  borderRadius?: number;
  fontSize?: number;               // 默认 14
}
```

模块接口：

```ts
function tokenize(code: string, language: string): Token[]  // 走公开 API，含 \n
function layout(tokens: Token[]): CodeDoc                    // 纯数据，按 \n 切行，CJK=2 列
function resolveTheme(theme?: string | Theme): Theme
function renderKernel(doc: CodeDoc, theme: Theme, opt: RenderOptions): void
function renderCanvas(doc: CodeDoc, theme: Theme, opt: RenderOptions): void
```

**tokenize 必须用公开 API**：highlight.js 11 的稳定契约是 `hljs.highlight(code, {language}).value`
（带 `<span class="hljs-xxx">` 的 HTML）。解析这段 HTML 拿 scope + 文本，不再触碰 `._emitter`。

## 渲染算法

共享布局常量（两版一致，保证公平）：

```
fontSize = opt.fontSize ?? 14
fontFamily = 等宽字体
lineHeight = fontSize * 1.5
charWidth = ctx.measureText('M').width   // 等宽下 ASCII 等宽，CJK = 2×
gutterWidth = lineNumber ? 行号区宽度 : 0
顶部栏高度 = 圆点 + 可选标题
```

### 路线 B：canvas 网格渲染（基准答案）

```
1. 算尺寸：width = gutter + maxColumns*charWidth + 左右 padding；
          height = lines*lineHeight + 顶部栏
2. 外壳：圆角裁剪 → 填背景(纯色 / createLinearGradient) → 三色圆点 → 标题文字
3. 逐行 y = 顶部栏 + i*lineHeight：
     - 行号右对齐画在 gutter 区
     - 行内 token：x 从 gutter 起，逐 token：
         ctx.fillStyle = theme.scopes[scope] ?? defaultColor
         ctx.fillText(text, x, y)
         x += 测量宽度(text)    // CJK 字符按 2 列宽累加
```

对齐天然正确，x 是真实累加而非猜测偏移。

### 路线 A：painter-kernel inlineText

```
1. 复用 B 的尺寸计算，保证两版画布一致
2. 外壳：background→IPalette.background，borderRadius→圆角，
        圆点→3 个 type:'rect' 圆，标题→type:'text'
3. 逐行一个 view：
     { type:'inlineText', id:'line_i',
       css:{ top:(顶部栏+i*lineHeight)+'px', left:gutter+'px', fontSize, fontFamily },
       textList: line.tokens.map(t => ({ text:t.text, css:{ color: 主题色 } })) }
   行内排版交给 painter-kernel 的 measureText，不写任何偏移
4. 行号：每行额外加一个 type:'text' view 放 gutter 区
5. new Pen(ctx, palette).paint()
```

**CJK 宽度处理是对比的关键差异点**：B 自己控制（measureText 或按 2 列）；A 依赖 painter-kernel
内部测量。若 painter-kernel 对中文/对齐处理得好则 A 够用，否则 B 的优势直接可见。

## 错误处理

- `language` 不被支持 → 回退 `plaintext`，不抛错。
- `code` 为空 → 画空壳（只有窗口栏），不崩。
- 路线 A 的 `Pen.paint()` 异步 → 入口统一返回 `Promise<void>`，两版都 await。

## 测试策略

数据层（核心，TDD 主战场，无需 canvas）：

- `tokenize.test.ts`：基础 js 分词 scope 正确；多行保留换行；不支持语言回退 plaintext；空串返回 []。
- `layout.test.ts`：多行行数/每行 token 正确；空行 tokens 为 []；CJK 按 2 列计 maxColumns；tab 展开规则。
- `theme.test.ts`：主题名 → 配色；自定义 Theme 原样返回；未知名回退默认。

渲染层（轻量，mock ctx / mock Pen，不做像素级断言）：

- `canvas.test.ts`：fillText 次数 = token 数；fillStyle 与主题色对应；换行 y 递增 lineHeight、x 重置到 gutter。
- `kernel.test.ts`：IPalette 的 inlineText 行数正确；textList 长度 = token 数；颜色正确。

像素级"好不好看"不写断言，交给 demo 页肉眼对比。

## demo 页（用户做选择处）

```
demo/index.html
  - 顶部：代码输入框 + 语言选择 + 主题选择 + 行号开关 + 标题输入
  - 中部：左右两块 canvas，标题 "A: painter-kernel" / "B: canvas"
  - 同一份 options 同时喂两个渲染器，改任意输入两边同步重绘
  - 底部：预设样例（含中文、含 tab、深层缩进、长行）一键切换，专挑暴露对齐问题的用例
demo/demo.ts
  - import phl，分别用 renderer:'kernel' 与 renderer:'canvas' 调两次
  - 用 esbuild（项目已有依赖）起本地服务，npm run demo 打开
```

用户本地打开页面，切换预设样例，左右对照对齐 / 中文 / 缩进表现，选出胜出方案。胜出后删除另一条渲染器。

## 非目标（YAGNI）

- 不做导出 PNG/SVG、不做下载按钮（小程序场景由调用方处理）。
- 不做浏览器 DOM/CSS 排版路线（违反小程序兼容硬约束）。
- 不做 Node 服务端批量生成。
- 不做像素级视觉回归测试。
