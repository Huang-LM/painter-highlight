import { describe, it, expect, vi } from 'vitest';
import phl from './index';

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
