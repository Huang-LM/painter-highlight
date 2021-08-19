import hljs from 'highlight.js';
import { toPx, Pen } from 'painter-kernel';

const phl = function(CanvasNode, canvas, template, code, language) {
  let views = [];
  const stack = hljs.highlight(code, { language })._emitter.stack;
  let defaultStyle = {
    default: {
      color: "#55b5db"
    },
    property: {
      color: "#a074c4"
    },
    comment: {
      color: "#41535b"
    },
    literal: {
      color: "#ee3300ef"
    },
    doctag: {
      color: "#ff7b72"
    },
    built_in: {
      color: "#55b5db"
    },
    keyword: {
      color: "#e6cd69"
    },
    "template-tag": {
      color: "#ff7b72"
    },
    "template-variable": {
      color: "#9fca56"
    },
    type: {
      color: "#9fca56"
    },
    string: {
      color: "#55b5db"
    },
    attr: {
      color: "#ff7b72"
    },
    number: {
      color: "#cd3f45"
    },
    params: {
      color: "#55b5db"
    },
    "variable.language": {
      color: "#55b5db"
    },
    "variable.constant": {
      color: "#55b5db"
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
      color: "#a074c4"
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
      color: "#fff"
    },
    attribute: {
      color: "#9fca56"
    }
  };
  let stackChil = stack[0].children;
  const styleMap = new Map(Object.entries(defaultStyle));
  const reg = RegExp(/\n/g);
  const reg2 = RegExp(/([^\s])/g);
  const reg22 = RegExp(/([\s])/g);
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
    width = line.match(reg2)?.length + line.match(reg22)?.length + (line.match(reg3)?.length ? line.match(reg3)?.length : 0);
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
      if (stackChil[index].children.length && stackChil[index].children[0].match !== null && stackChil[index].children[0]?.match(/\/\*\*/g)) {
        commentWarp += stackChil[index].children[0].match(reg).length;
      }
      if (!col) {
        t.css.color = styleMap.get("default");
      } else {
        t.css.color = col.color;
      }
    } else if (typeof stackChil[index] === "string") {
      console.log(stackChil[index].match(reg22)?.length);
      t.text = stackChil[index];
      if (stackChil[index].match(RegExp(/^[a-zA-Z]/g))) {
        t.css.color = styleMap.get("string").color;
      } else if (stackChil[index].match(RegExp(/=/g))) {
        t.css.color = styleMap.get("attribute").color;
      } else {
        t.css.color = styleMap.get("sign").color;
      }
      t.css.left = "calc(hl0_" + (index - 1) + ".right + 2px)";
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      if (stackChil[index].match(reg22)?.length) {
        let k = stackChil[index].match(reg22)?.length;
        t.css.left = "calc(hl0_" + (index - 1) + ".right +" + k * 2 + " px)";
      }
      if (stackChil[index].match(reg) && !stackChil[index].match(/\`/g)) {
        lineWarp = stackChil[index].match(reg).length;
      } else if (stackChil[index] === " ") {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
      } else if (stackChil[index].match(/\(/) || stackChil[index].match(/\[/)) {
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
  views[0].css.top = "55px";
  views[1].css.left = "calc(hl0_0.right + 0px)";
  views[0].css.left = "0";
  let tips1 = {
    id: "hl1_0",
    type: "rect",
    css: {
      top: "18px",
      left: "18px",
      height: "12px",
      width: "12px",
      color: "#E0443E",
      borderRadius: "50%"
    }
  };
  let tips2 = {
    id: "hl1_1",
    type: "rect",
    css: {
      top: "18px",
      left: "38px",
      height: "12px",
      width: "12px",
      color: "#DEA123",
      borderRadius: "50%"
    }
  };
  let tips3 = {
    id: "hl1_3",
    type: "rect",
    css: {
      top: "18px",
      left: "58px",
      height: "12px",
      width: "12px",
      color: "#1AAB29",
      borderRadius: "50%"
    }
  };
  views.unshift(tips3);
  views.unshift(tips2);
  views.unshift(tips1);
  if (template.height == "auto") {
    template.height = height * 20 + 60 + "px";
  }
  if (template.width == "auto") {
    template.width = maxWidth * 10.5 + "px";
  }
  CanvasNode.width = toPx(template.width);
  CanvasNode.height = toPx(template.height);
  template.views = views;
  const pen = new Pen(canvas, template);
  pen.paint();
};

export default phl;
