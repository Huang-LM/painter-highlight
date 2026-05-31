import { Theme } from './types';

const githubDark: Theme = {
  name: 'githubDark',
  background: '#0d1117',
  defaultColor: '#c9d1d9',
  lineNumberColor: '#484f58',
  titleColor: '#8b949e',
  scopes: {
    keyword: '#ff7b72',
    built_in: '#ffa657',
    type: '#ffa657',
    literal: '#79c0ff',
    number: '#79c0ff',
    string: '#a5d6ff',
    comment: '#8b949e',
    title: '#d2a8ff',
    'function': '#d2a8ff',
    params: '#c9d1d9',
    attr: '#79c0ff',
    attribute: '#79c0ff',
    property: '#79c0ff',
    variable: '#ffa657',
    operator: '#ff7b72',
    subst: '#c9d1d9',
    'meta': '#79c0ff',
    'tag': '#7ee787',
    'name': '#7ee787',
    'selector-tag': '#7ee787',
    regexp: '#a5d6ff',
    symbol: '#79c0ff',
    addition: '#aff5b4',
    deletion: '#ffdcd7',
  },
};

const dracula: Theme = {
  name: 'dracula',
  background: '#282a36',
  defaultColor: '#f8f8f2',
  lineNumberColor: '#6272a4',
  titleColor: '#bd93f9',
  scopes: {
    keyword: '#ff79c6',
    built_in: '#8be9fd',
    type: '#8be9fd',
    literal: '#bd93f9',
    number: '#bd93f9',
    string: '#f1fa8c',
    comment: '#6272a4',
    title: '#50fa7b',
    'function': '#50fa7b',
    params: '#ffb86c',
    attr: '#50fa7b',
    attribute: '#50fa7b',
    property: '#f8f8f2',
    variable: '#f8f8f2',
    operator: '#ff79c6',
    subst: '#f8f8f2',
    'meta': '#ff79c6',
    'tag': '#ff79c6',
    'name': '#8be9fd',
    'selector-tag': '#ff79c6',
    regexp: '#f1fa8c',
    symbol: '#bd93f9',
    addition: '#50fa7b',
    deletion: '#ff5555',
  },
};

const oneDark: Theme = {
  name: 'oneDark',
  background: '#282c34',
  defaultColor: '#abb2bf',
  lineNumberColor: '#5c6370',
  titleColor: '#828997',
  scopes: {
    keyword: '#c678dd',
    built_in: '#e6c07b',
    type: '#e6c07b',
    literal: '#56b6c2',
    number: '#d19a66',
    string: '#98c379',
    comment: '#5c6370',
    title: '#61afef',
    'function': '#61afef',
    params: '#abb2bf',
    attr: '#d19a66',
    attribute: '#d19a66',
    property: '#e06c75',
    variable: '#e06c75',
    operator: '#56b6c2',
    subst: '#abb2bf',
    'meta': '#61afef',
    'tag': '#e06c75',
    'name': '#e06c75',
    'selector-tag': '#e06c75',
    regexp: '#98c379',
    symbol: '#56b6c2',
    addition: '#98c379',
    deletion: '#e06c75',
  },
};

const THEMES: Record<string, Theme> = { githubDark, dracula, oneDark };
const DEFAULT_THEME = 'githubDark';

export function resolveTheme(theme?: string | Theme): Theme {
  if (theme && typeof theme === 'object') return theme;
  if (typeof theme === 'string' && THEMES[theme]) return THEMES[theme];
  return THEMES[DEFAULT_THEME];
}

export { THEMES };
