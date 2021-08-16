import hljs from 'highlight.js';
import { toPx, Pen } from 'painter-kernel';

const phl = function(CanvasNode, canvas, template, code, language) {
  let views = [];
  const stack = hljs.highlight(code, { language })._emitter.stack;
  let defaultStyle = {
    default: {
      color: "#c9d1d9"
    },
    comment: {
      color: "#c9d1d9"
    },
    doctag: {
      color: "#ff7b72"
    },
    built_in: {
      color: "#ee3300ef"
    },
    keyword: {
      color: "#ff7b72"
    },
    "template-tag": {
      color: "#ff7b72"
    },
    "template-variable": {
      color: "#ff7b72"
    },
    type: {
      color: "#ff7b72"
    },
    string: {
      color: "#afa5b4"
    },
    attr: {
      color: "#ff7b72"
    },
    number: {
      color: "#afe5bb"
    },
    params: {
      color: "#aff5b4"
    },
    "variable.language": {
      color: "#ff7b72"
    },
    subst: {
      color: "Purple"
    },
    title: {
      color: "#d2a8ff"
    },
    "title.class": {
      color: "#df88df"
    },
    "title.class.inherited": {
      color: "#dda8ff"
    },
    "title.function": {
      color: "#d2a8ff"
    },
    deletion: {
      color: "#ffdcd7",
      backgroundColor: "#67060c"
    },
    addition: {
      color: "#aff5b4",
      backgroundColor: "#033a16"
    },
    strong: {
      color: "#c9d1d9",
      fontWeight: "bold"
    },
    emphasis: {
      color: "#c9d1d9",
      fontStyle: "italic"
    },
    sign: {
      color: "#2f2f2fee"
    }
  };
  let stackChil = stack[0].children;
  const styleMap = new Map(Object.entries(defaultStyle));
  const reg = RegExp(/\n/g);
  const reg2 = RegExp(/([^\s])/g);
  const reg3 = RegExp(/\t/g);
  let lineWarp = 0;
  let commentWarp = 0;
  let leftBracket = 0;
  let height = 0;
  let maxWidth = 0;
  let stackMap = [];
  let codeCopy = code;
  codeCopy.split("\n").filter((line, index) => {
    const CURRENT_LINE = index + 1;
    let width;
    width = line.match(reg2)?.length;
    if (maxWidth < width) {
      maxWidth = width ? width : 0;
    }
    height++;
    return CURRENT_LINE >= 0 && CURRENT_LINE <= 1e3;
  }).join("\n");
  for (let i = 0; i < stackChil.length; i++) {
    if (typeof stackChil[i] === "string") {
      if (stackChil[i].match(reg) && stackChil[i].match(reg2)) {
        let start = stackChil[i];
        let nCount = stackChil[i].match(reg);
        while (nCount.length) {
          let sNode = start.indexOf(nCount[0]);
          if (start.slice(0, sNode)) {
            stackMap.push(start.slice(0, sNode));
          }
          stackMap.push(start.slice(sNode, sNode + 1));
          start = start.slice(sNode + 1);
          nCount.shift();
        }
        stackMap.push(start);
      } else {
        stackMap.push(stackChil[i]);
      }
    } else {
      if (stackChil[i].kind === "comment") {
        stackMap.push(stackChil[i]);
      } else if (stackChil[i].kind === "property" && stackChil[i].children[0].children) {
        stackMap.push(stackChil[i].children[0].children[0]);
      } else if (stackChil[i].children.length > 1) {
        let stackCC = stackChil[i].children;
        for (let i2 of stackCC) {
          stackMap.push(i2);
        }
      } else {
        stackMap.push(stackChil[i]);
      }
    }
  }
  let ss = [];
  stackMap.forEach((data) => {
    if (data !== "")
      ss.push(data);
  });
  stackChil = ss;
  for (let index = 0; index < stackChil.length; index++) {
    let t = {
      id: "hl0_" + index,
      text: "",
      type: "text",
      css: {
        top: "calc(hl0_" + (index - 1) + ".top)",
        left: "calc(hl0_" + (index - 1) + ".right)",
        color: defaultStyle.default.color,
        fontSize: "16px"
      }
    };
    if (typeof stackChil[index] === "object") {
      let col;
      if (!stackChil[index].children.length) {
        t.text = stackChil[index].children;
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 5px)", col = styleMap.get(stackChil[index].kind);
      } else {
        t.text = stackChil[index].children.join("");
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 1px)", col = styleMap.get(stackChil[index].kind);
      }
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      if (stackChil[index].children.length && stackChil[index].children[0].match !== null && stackChil[index].children[0].match(/\/\*\*/g)) {
        commentWarp += stackChil[index].children[0].match(reg).length;
      }
      if (!col) {
        t.css.color = styleMap.get("default");
      } else {
        t.css.color = col.color;
      }
    } else if (typeof stackChil[index] === "string") {
      t.text = stackChil[index];
      t.css.color = styleMap.get("sign").color;
      t.css.left = "calc(hl0_" + (index - 1) + ".right + 2px)";
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      if (stackChil[index].match(reg) && !stackChil[index].match(/\`/g)) {
        lineWarp = stackChil[index].match(reg).length;
      } else if (stackChil[index] === " ") {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
      } else if (stackChil[index].match(/\(/)) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 4px)";
        leftBracket = 1;
      }
    }
    if (lineWarp) {
      t.css.top = "calc(hl0_" + (index - 1) + ".top +" + 20 * (lineWarp + commentWarp) + " px)";
      t.css.left = "0";
      if (stackChil[index].match(reg) && stackChil[index].slice(2)) {
        t.css.left = "calc(hl0_0.right)";
      }
      lineWarp = 0;
      commentWarp = 0;
    }
    if (typeof stackChil[index] === "string" && stackChil[index].match(reg3)) {
      t.css.left = "calc(hl0_" + index + ".right + " + 18 * stackChil[index].match(reg3).length + "px)";
    }
    views.push(t);
  }
  views[0].css.top = "5px";
  views[1].css.left = "calc(hl0_0.right*2)";
  views[0].css.left = "0";
  if (template.height == "auto") {
    template.height = height * 19.5 + "px";
  }
  if (template.width == "auto") {
    template.width = maxWidth * 14 + "px";
  }
  CanvasNode.width = toPx(template.width);
  CanvasNode.height = toPx(template.height);
  template.views = views;
  const pen = new Pen(canvas, template);
  pen.paint(() => {
    console.log("ok");
  });
};

export default phl;
