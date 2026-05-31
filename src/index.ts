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
