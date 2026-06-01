import hljs from 'highlight.js';
import { Pen } from 'painter-kernel';

function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}
function classToScope(cls) {
  const first = cls.trim().split(/\s+/)[0] || "";
  return first.startsWith("hljs-") ? first.slice(5) : "";
}
function parseHtml(html) {
  const tokens = [];
  const scopeStack = [];
  const tagRe = /<span class="([^"]*)">|<\/span>/g;
  let last = 0;
  let m;
  const pushText = (raw) => {
    if (!raw)
      return;
    const text = decodeEntities(raw);
    if (text === "")
      return;
    tokens.push({ text, scope: scopeStack[scopeStack.length - 1] || "" });
  };
  while ((m = tagRe.exec(html)) !== null) {
    pushText(html.slice(last, m.index));
    if (m[0].startsWith("</")) {
      scopeStack.pop();
    } else {
      scopeStack.push(classToScope(m[1]));
    }
    last = tagRe.lastIndex;
  }
  pushText(html.slice(last));
  return tokens;
}
function tokenize(code, language) {
  if (code === "")
    return [];
  if (!hljs.getLanguage(language)) {
    return [{ text: code, scope: "" }];
  }
  const html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
  return parseHtml(html);
}

function isWide(ch) {
  const c = ch.codePointAt(0) || 0;
  return c >= 4352 && c <= 4447 || c >= 11904 && c <= 42191 || c >= 44032 && c <= 55203 || c >= 63744 && c <= 64255 || c >= 65072 && c <= 65103 || c >= 65280 && c <= 65376 || c >= 65504 && c <= 65510;
}
function columnsOf(text) {
  let cols = 0;
  for (const ch of text)
    cols += isWide(ch) ? 2 : 1;
  return cols;
}
function layout(tokens) {
  const lines = [{ tokens: [] }];
  let maxColumns = 0;
  let curCols = 0;
  const endLine = () => {
    if (curCols > maxColumns)
      maxColumns = curCols;
    curCols = 0;
    lines.push({ tokens: [] });
  };
  for (const tok of tokens) {
    const parts = tok.text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0)
        endLine();
      if (parts[i] !== "") {
        lines[lines.length - 1].tokens.push({ text: parts[i], scope: tok.scope });
        curCols += columnsOf(parts[i]);
      }
    }
  }
  if (curCols > maxColumns)
    maxColumns = curCols;
  return { lines, maxColumns };
}

const githubDark = {
  name: "githubDark",
  background: "#0d1117",
  defaultColor: "#c9d1d9",
  lineNumberColor: "#484f58",
  titleColor: "#8b949e",
  scopes: {
    keyword: "#ff7b72",
    built_in: "#ffa657",
    type: "#ffa657",
    literal: "#79c0ff",
    number: "#79c0ff",
    string: "#a5d6ff",
    comment: "#8b949e",
    title: "#d2a8ff",
    "function": "#d2a8ff",
    params: "#c9d1d9",
    attr: "#79c0ff",
    attribute: "#79c0ff",
    property: "#79c0ff",
    variable: "#ffa657",
    operator: "#ff7b72",
    subst: "#c9d1d9",
    "meta": "#79c0ff",
    "tag": "#7ee787",
    "name": "#7ee787",
    "selector-tag": "#7ee787",
    regexp: "#a5d6ff",
    symbol: "#79c0ff",
    addition: "#aff5b4",
    deletion: "#ffdcd7"
  }
};
const dracula = {
  name: "dracula",
  background: "#282a36",
  defaultColor: "#f8f8f2",
  lineNumberColor: "#6272a4",
  titleColor: "#bd93f9",
  scopes: {
    keyword: "#ff79c6",
    built_in: "#8be9fd",
    type: "#8be9fd",
    literal: "#bd93f9",
    number: "#bd93f9",
    string: "#f1fa8c",
    comment: "#6272a4",
    title: "#50fa7b",
    "function": "#50fa7b",
    params: "#ffb86c",
    attr: "#50fa7b",
    attribute: "#50fa7b",
    property: "#f8f8f2",
    variable: "#f8f8f2",
    operator: "#ff79c6",
    subst: "#f8f8f2",
    "meta": "#ff79c6",
    "tag": "#ff79c6",
    "name": "#8be9fd",
    "selector-tag": "#ff79c6",
    regexp: "#f1fa8c",
    symbol: "#bd93f9",
    addition: "#50fa7b",
    deletion: "#ff5555"
  }
};
const oneDark = {
  name: "oneDark",
  background: "#282c34",
  defaultColor: "#abb2bf",
  lineNumberColor: "#5c6370",
  titleColor: "#828997",
  scopes: {
    keyword: "#c678dd",
    built_in: "#e6c07b",
    type: "#e6c07b",
    literal: "#56b6c2",
    number: "#d19a66",
    string: "#98c379",
    comment: "#5c6370",
    title: "#61afef",
    "function": "#61afef",
    params: "#abb2bf",
    attr: "#d19a66",
    attribute: "#d19a66",
    property: "#e06c75",
    variable: "#e06c75",
    operator: "#56b6c2",
    subst: "#abb2bf",
    "meta": "#61afef",
    "tag": "#e06c75",
    "name": "#e06c75",
    "selector-tag": "#e06c75",
    regexp: "#98c379",
    symbol: "#56b6c2",
    addition: "#98c379",
    deletion: "#e06c75"
  }
};
const THEMES = { githubDark, dracula, oneDark };
const DEFAULT_THEME = "githubDark";
function resolveTheme(theme) {
  if (theme && typeof theme === "object")
    return theme;
  if (typeof theme === "string" && THEMES[theme])
    return THEMES[theme];
  return THEMES[DEFAULT_THEME];
}

function computeMetrics(doc, input) {
  const { fontSize, charWidth } = input;
  const lineHeight = Math.round(fontSize * 1.5);
  const padLeft = 16;
  const padRight = 24;
  const padBottom = 16;
  const lineCount = doc.lines.length;
  const digits = String(Math.max(lineCount, 1)).length;
  const gutter = input.lineNumber ? digits * charWidth + 24 : 0;
  const headerHeight = 44;
  const width = input.width && input.width !== "auto" ? input.width : Math.ceil(gutter + padLeft + doc.maxColumns * charWidth + padRight);
  const height = input.height && input.height !== "auto" ? input.height : Math.ceil(headerHeight + lineCount * lineHeight + padBottom);
  return {
    fontSize,
    charWidth,
    lineHeight,
    gutter,
    padLeft,
    padRight,
    headerHeight,
    width,
    height
  };
}

const MONO_FONT$1 = 'Menlo, Consolas, "Courier New", monospace';
const DOT_COLORS$1 = ["#ff5f56", "#ffbd2e", "#27c93f"];
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function paintBackground(ctx, theme, w, h) {
  const bg = theme.background;
  if (bg.startsWith("linear")) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    const colors = bg.match(/#[0-9a-fA-F]{3,8}/g) || ["#000", "#000"];
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[colors.length - 1]);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = bg;
  }
  ctx.fillRect(0, 0, w, h);
}
function renderCanvas(doc, theme, opt) {
  const fontSize = opt.fontSize ?? 14;
  const ctx = opt.ctx;
  ctx.font = `${fontSize}px ${MONO_FONT$1}`;
  const charWidth = ctx.measureText("M").width || fontSize * 0.6;
  const m = computeMetrics(doc, {
    fontSize,
    charWidth,
    lineNumber: opt.lineNumber,
    title: opt.title,
    width: opt.width,
    height: opt.height
  });
  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;
  ctx.font = `${fontSize}px ${MONO_FONT$1}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const radius = opt.borderRadius ?? 8;
  ctx.save();
  roundRectPath(ctx, 0, 0, m.width, m.height, radius);
  ctx.clip();
  paintBackground(ctx, theme, m.width, m.height);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.fillStyle = DOT_COLORS$1[i];
    ctx.arc(20 + i * 20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (opt.title) {
    ctx.fillStyle = theme.titleColor;
    ctx.textAlign = "center";
    ctx.fillText(opt.title, m.width / 2, 14);
    ctx.textAlign = "left";
  }
  for (let i = 0; i < doc.lines.length; i++) {
    const y = m.headerHeight + i * m.lineHeight;
    if (opt.lineNumber) {
      ctx.fillStyle = theme.lineNumberColor;
      ctx.textAlign = "right";
      ctx.fillText(String(i + 1), m.gutter - 12, y);
      ctx.textAlign = "left";
    }
    let x = m.gutter + m.padLeft;
    for (const tok of doc.lines[i].tokens) {
      ctx.fillStyle = theme.scopes[tok.scope] || theme.defaultColor;
      ctx.fillText(tok.text, x, y);
      x += ctx.measureText(tok.text).width;
    }
  }
  ctx.restore();
}

const MONO_FONT = 'Menlo, Consolas, "Courier New", monospace';
const DOT_COLORS = ["#ff5f56", "#ffbd2e", "#27c93f"];
function metricsOf(doc, opt) {
  const fontSize = opt.fontSize ?? 14;
  const charWidth = opt.ctx.measureText("M").width || fontSize * 0.6;
  return computeMetrics(doc, {
    fontSize,
    charWidth,
    lineNumber: opt.lineNumber,
    title: opt.title,
    width: opt.width,
    height: opt.height
  });
}
function buildPalette(doc, theme, opt, metrics) {
  const fontSize = opt.fontSize ?? 14;
  const m = metrics ?? metricsOf(doc, opt);
  const views = [];
  for (let i = 0; i < 3; i++) {
    views.push({
      type: "rect",
      id: "dot_" + i,
      css: {
        top: "16px",
        left: 14 + i * 20 + "px",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: DOT_COLORS[i]
      }
    });
  }
  if (opt.title) {
    views.push({
      type: "text",
      id: "title",
      text: opt.title,
      css: {
        top: "14px",
        left: m.width / 2 + "px",
        align: "center",
        fontSize: fontSize + "px",
        color: theme.titleColor
      }
    });
  }
  for (let i = 0; i < doc.lines.length; i++) {
    const top = m.headerHeight + i * m.lineHeight + "px";
    if (opt.lineNumber) {
      views.push({
        type: "text",
        id: "ln_" + i,
        text: String(i + 1),
        css: {
          top,
          left: m.gutter - 12 + "px",
          align: "right",
          fontSize: fontSize + "px",
          fontFamily: MONO_FONT,
          color: theme.lineNumberColor
        }
      });
    }
    views.push({
      type: "inlineText",
      id: "line_" + i,
      css: {
        top,
        left: m.gutter + m.padLeft + "px",
        fontSize: fontSize + "px",
        fontFamily: MONO_FONT,
        lineHeight: m.lineHeight + "px"
      },
      textList: doc.lines[i].tokens.map((tok) => ({
        text: tok.text,
        css: { color: theme.scopes[tok.scope] || theme.defaultColor }
      }))
    });
  }
  return {
    background: theme.background,
    width: m.width + "px",
    height: m.height + "px",
    borderRadius: (opt.borderRadius ?? 8) + "px",
    views
  };
}
async function renderKernel(doc, theme, opt) {
  const m = metricsOf(doc, opt);
  const palette = buildPalette(doc, theme, opt, m);
  opt.canvasNode.width = m.width;
  opt.canvasNode.height = m.height;
  const pen = new Pen(opt.ctx, palette);
  await pen.paint();
}

async function phl(options) {
  const tokens = tokenize(options.code, options.language);
  const doc = layout(tokens);
  const theme = resolveTheme(options.theme);
  if (options.renderer === "kernel") {
    await renderKernel(doc, theme, options);
  } else {
    renderCanvas(doc, theme, options);
  }
}

export { THEMES, phl as default, phl };
