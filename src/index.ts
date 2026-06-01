import { tokenize } from './core/tokenize';
import { layout } from './core/layout';
import { resolveTheme } from './core/theme';
import { renderCanvas } from './renderers/canvas';
import { renderKernel } from './renderers/kernel';
import { RenderOptions } from './core/types';

export * from './core/types';
export { THEMES } from './core/theme';

async function phl(options: RenderOptions): Promise<void> {
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

  if (options.renderer === 'kernel') {
    console.log('[phl] 开始 renderKernel...');
    await renderKernel(doc, theme, options);
    console.log('[phl] renderKernel 完成，耗时:', performance.now() - startTime, 'ms');
  } else {
    console.log('[phl] 开始 renderCanvas...');
    renderCanvas(doc, theme, options);
    console.log('[phl] renderCanvas 完成，耗时:', performance.now() - startTime, 'ms');
  }

  console.log('[phl] 总耗时:', performance.now() - startTime, 'ms');
}

export default phl;
export { phl };
