# painter-highlight
A simple highlighting code generation plugin



下载依赖

```
npm install
```



引用

```js
import phj form 'painter-highlight'
```



使用

```tsx
phj(
    CanvasNode: CanvasRenderingContext2D,  // 绑定的一个canvas元素
    template: template,  // 生成图片的样式
    code: string, // 要转换的代码
    language: string // 转换代码的语言
)
```

template格式

```js
template = {
  background: string; // 整个模版的背景，支持网络图片的链接、纯色和渐变色
  width: string;
  height: string;
}
```

