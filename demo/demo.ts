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
  try {
    console.log('[render] 开始渲染...');
    const base = currentOptionsBase();
    console.log('[render] 获取 canvas 元素...');
    const canvas = $('canvas');

    console.log('[render] 开始渲染...');
    const renderPromise = phl({ canvasNode: canvas, ctx: canvas.getContext('2d'), renderer: 'canvas', ...base });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('渲染超时（>10秒）')), 10000)
    );
    await Promise.race([renderPromise, timeout]);
    console.log('[render] 渲染完成');
  } catch (error) {
    console.error('渲染失败:', error);
    alert(`渲染失败: ${error instanceof Error ? error.message : String(error)}`);
  }
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
  const first = Object.keys(PRESETS)[0];
  $('code').value = PRESETS[first].code;
  $('lang').value = PRESETS[first].lang;
}

$('render').onclick = render;
['theme', 'lineNumber', 'title'].forEach((id) => ($(id).onchange = render));
try {
  console.log('[init] 开始初始化...');
  initPresets();
  console.log('[init] 预设初始化完成，开始首次渲染...');
  render();
  console.log('[init] 首次渲染完成');
} catch (error) {
  console.error('初始化失败:', error);
  alert(`初始化失败: ${error instanceof Error ? error.message : String(error)}`);
}
