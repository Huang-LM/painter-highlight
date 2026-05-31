# painter-highlight

一个基于 highlight.js 的高亮代码图片生成工具，支持两种渲染引擎（canvas 原生绘制 / painter-kernel 视图系统），用于快速生成带语法高亮的代码截图。

**使用场景**：分享代码片段到不支持高亮的平台、VSCode 插件、社交媒体、文档等。

## 安装

```bash
npm install painter-highlight
# 或
yarn add painter-highlight
```

## 快速开始

```ts
import phl from 'painter-highlight';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

await phl({
  canvasNode: canvas,
  ctx,
  code: 'const x = 42;',
  language: 'javascript',
});
```

## API

### `phl(options: RenderOptions): Promise<void>`

生成高亮代码图片到指定 canvas。

#### 参数：`RenderOptions`

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `canvasNode` | `HTMLCanvasElement` | ✅ | 目标 canvas 元素 |
| `ctx` | `CanvasRenderingContext2D` | ✅ | canvas 上下文（通过 `getContext('2d')` 获取） |
| `code` | `string` | ✅ | 要高亮的代码 |
| `language` | `string` | ✅ | 代码语言（如 `'javascript'`, `'typescript'`, `'python'` 等） |
| `renderer` | `'canvas' \| 'kernel'` | ❌ | 渲染引擎，默认 `'canvas'` |
| `theme` | `'githubDark' \| 'dracula' \| 'oneDark'` | ❌ | 主题，默认 `'githubDark'` |
| `lineNumber` | `boolean` | ❌ | 是否显示行号，默认 `false` |
| `title` | `string` | ❌ | 窗口标题（显示在顶部），默认 `undefined` |
| `fontSize` | `number` | ❌ | 字体大小（像素），默认 `14` |
| `width` | `number` | ❌ | 自定义宽度（像素），默认自动计算 |
| `height` | `number` | ❌ | 自定义高度（像素），默认自动计算 |
| `borderRadius` | `number` | ❌ | 圆角半径（像素），默认 `8` |

## 使用示例

### 基础用法

```ts
import phl from 'painter-highlight';

const canvas = document.getElementById('code-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

await phl({
  canvasNode: canvas,
  ctx,
  code: `function hello() {
  console.log('Hello, World!');
}`,
  language: 'javascript',
  title: 'hello.js',
  lineNumber: true,
});
```

### 选择主题

```ts
await phl({
  canvasNode: canvas,
  ctx,
  code: 'const x = 42;',
  language: 'javascript',
  theme: 'dracula',  // 或 'oneDark'、'githubDark'
});
```

### 选择渲染引擎

**Canvas 渲染**（默认，性能好，兼容性强）：
```ts
await phl({
  canvasNode: canvas,
  ctx,
  code: 'const x = 42;',
  language: 'javascript',
  renderer: 'canvas',
});
```

**Painter-Kernel 渲染**（特殊小程序环境，需要支持 painter-kernel）：
```ts
await phl({
  canvasNode: canvas,
  ctx,
  code: 'const x = 42;',
  language: 'javascript',
  renderer: 'kernel',
});
```

### 完整示例（Vue 3）

```vue
<template>
  <div class="demo">
    <div class="controls">
      <input v-model="code" type="textarea" placeholder="输入代码..." />
      <select v-model="language">
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
      </select>
      <select v-model="theme">
        <option value="githubDark">GitHub Dark</option>
        <option value="dracula">Dracula</option>
        <option value="oneDark">One Dark</option>
      </select>
      <button @click="generate">生成</button>
    </div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import phl from 'painter-highlight';

const canvas = ref<HTMLCanvasElement>();
const code = ref('const x = 42;');
const language = ref('javascript');
const theme = ref('githubDark');

const generate = async () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d')!;
  await phl({
    canvasNode: canvas.value,
    ctx,
    code: code.value,
    language: language.value,
    theme: theme.value as any,
    lineNumber: true,
    title: 'code.js',
  });
};
</script>
```

## 主题

内置 3 个主题，覆盖常见配色：

- **githubDark** - GitHub 深色主题（默认）
- **dracula** - Dracula 经典主题
- **oneDark** - One Dark Pro 主题

可通过 `THEMES` 导出查看完整主题定义：

```ts
import { THEMES } from 'painter-highlight';
console.log(THEMES.githubDark);
```

## 渲染流程

```
代码 (string)
    ↓
tokenize (highlight.js 解析)
    ↓
Token 流
    ↓
layout (按行切割、计算列宽)
    ↓
CodeDoc
    ↓
theme (解析配色方案)
    ↓
Theme
    ↓
Renderer (canvas 或 kernel)
    ↓
Canvas 图片
```

## Demo

本地开发查看两个渲染引擎的并排对比：

```bash
npm run demo
```

然后打开 `http://localhost:8000`，可以：
- 选择代码预设（TypeScript、中文注释、深层缩进、长行）
- 实时调整语言、主题、行号、标题
- 并排比较两个渲染引擎的效果差异

## 特性

- ✅ 两种渲染引擎（Canvas 原生 / Painter-Kernel 视图系统）
- ✅ 3 个内置主题（GitHub Dark / Dracula / One Dark）
- ✅ CJK 宽字符处理（中文、日文、韩文等）
- ✅ 行号支持
- ✅ 自定义标题栏
- ✅ 自动或手动尺寸设定
- ✅ 圆角窗口风格
- ✅ highlight.js 全语言支持

## 贡献

欢迎提交 Issue 和 PR！

## 许可

ISC
