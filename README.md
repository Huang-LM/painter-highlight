# painter-highlight

一个基于 painter 和 highlight 实现的高亮代码图片生成工具

### 下载依赖

```
npm install painter-highligh
// yarn add painter-highligh
```

### 引用

```js
import phj form 'painter-highlight'
```

### 如何使用

需要传入的值

```tsx
phj(
    CanvasNode: object, // 绑定的一个canvas元素
    canvas: CanvasRenderingContext2D,  // 将canvas通过getContext后得到的东西
    template: template,  // 生成图片的样式，下方有可配置项
    code: string, // 要转换的代码(代码需用``包裹，同时确保第一行留有空格)
    language: string // 转换代码的语言
)
```

template 格式

```js
template = {
  background: string; // 整个模版的背景，支持网络图片的链接、纯色和渐变色
  width: string;
  height: string;
  borderRadius: string;
}
```

### 附一个 vue 使用的案例

```vue
<template>
  <div id="app">
    <button @click="paint">生成</button>
    <canvas id="canvas" />
  </div>
</template>

<script>
import { phl } from "painter-highlight";

export default {
  name: "App",
  mounted() {
    this.canvasNode = document.getElementById("canvas");
    this.canvas = this.canvasNode.getContext("2d");
  },
  data() {
    return {
      canvasNode: "",
      canvas: "",
      template: {
        background: "#eee",
        width: "600px",
        height: "400px",
        borderRadius: "25px",
      },
      code: `
        function isNumber(x: any): x is number {
            return typeof x === "number";
        }

        function isString(x: any): x is string {
            return typeof x === "string";
        }

        function padLeft(value: string, padding: string | number) {
            if (isNumber(padding)) {
                return Array(padding + 1).join(" ") + value;
            }
            if (isString(padding)) {
                return padding + value;
            }
            throw new Error(\`Expected string or number, got '\${padding}'.\`);
        }
      `,
      language: "ts",
    };
  },
  methods: {
    paint() {
      phl(
        this.canvasNode,
        this.canvas,
        this.template,
        this.code,
        this.language
      );
    },
  },
};
</script>
```
