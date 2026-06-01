import { tokenize } from './core/tokenize';
import { layout } from './core/layout';
import { resolveTheme } from './core/theme';
import { renderCanvas } from './renderers/canvas';
import { RenderOptions } from './core/types';

export * from './core/types';
export { THEMES } from './core/theme';

// 0.2.x 的 template 格式（兼容旧 API）
interface LegacyTemplate {
  background: string;
  width: string;
  height: string;
  borderRadius: string;
}

// 判断是否为旧 API 调用（位置参数）
function isLegacyCall(arg1: any): boolean {
  // 检查第一个参数是否为 canvas node（HTMLCanvasElement 或类似对象）
  return arg1 && typeof arg1 === 'object' && ('getContext' in arg1 || arg1.nodeType === 1);
}

async function phl(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
  arg5?: any,
): Promise<void> {
  let options: RenderOptions;

  // 兼容 0.2.x API: phl(canvasNode, ctx, template, code, language)
  if (isLegacyCall(arg1)) {
    const canvasNode = arg1;
    const ctx = arg2;
    const template: LegacyTemplate = arg3;
    const code = arg4;
    const language = arg5;

    options = {
      canvasNode,
      ctx,
      code,
      language,
      renderer: 'canvas', // 0.2.x 只支持 canvas
      theme: { background: template.background } as any,
      width: template.width === 'auto' ? 'auto' : parseInt(template.width),
      height: template.height === 'auto' ? 'auto' : parseInt(template.height),
      borderRadius: parseInt(template.borderRadius),
    };
  } else {
    // 新 API: phl({ canvasNode, ctx, code, language, ... })
    options = arg1 as RenderOptions;
  }

  const startTime = performance.now();

  console.log('[phl] 开始 tokenize...');
  const tokens = tokenize(options.code, options.language);
  console.log('[phl] tokenize 完成，耗时:', performance.now() - startTime, 'ms');

  console.log('[phl] 开始 layout...');
  const doc = layout(tokens);
  console.log('[phl] layout 完成，耗时:', performance.now() - startTime, 'ms');

  console.log('[phl] 开始 resolveTheme...');
  const theme = resolveTheme(options.theme);
  console.log('[phl] resolveTheme 完成，耗时:', performance.now() - startTime, 'ms');

  // painter-kernel 在浏览器环境不稳定，暂时只支持 canvas 渲染
  console.log('[phl] 开始 renderCanvas...');
  renderCanvas(doc, theme, options);
  console.log('[phl] renderCanvas 完成，耗时:', performance.now() - startTime, 'ms');

  console.log('[phl] 总耗时:', performance.now() - startTime, 'ms');
}

export default phl;
export { phl };
