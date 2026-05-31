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
  const first = Object.keys(PRESETS)[0];
  $('code').value = PRESETS[first].code;
  $('lang').value = PRESETS[first].lang;
}

$('render').onclick = render;
['theme', 'lineNumber', 'title'].forEach((id) => ($(id).onchange = render));
initPresets();
render();
