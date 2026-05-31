import { describe, it, expect } from 'vitest';
import { resolveTheme } from './theme';
import { Theme } from './types';

describe('resolveTheme', () => {
  it('按主题名返回内置主题', () => {
    const t = resolveTheme('dracula');
    expect(t.name).toBe('dracula');
    expect(typeof t.scopes.keyword).toBe('string');
  });

  it('未知主题名回退到默认主题 githubDark', () => {
    const t = resolveTheme('no-such-theme');
    expect(t.name).toBe('githubDark');
  });

  it('不传参回退到默认主题', () => {
    expect(resolveTheme().name).toBe('githubDark');
  });

  it('传自定义 Theme 对象则原样返回', () => {
    const custom: Theme = {
      name: 'mine',
      background: '#000',
      defaultColor: '#fff',
      lineNumberColor: '#888',
      titleColor: '#ccc',
      scopes: { keyword: '#f00' },
    };
    expect(resolveTheme(custom)).toBe(custom);
  });
});
