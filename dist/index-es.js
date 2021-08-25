import hljs from 'highlight.js';
import { toPx, Pen } from 'painter-kernel';

const phl = function(CanvasNode, canvas, template, code, language) {
  let views = [];
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
      color: "#eee"
    },
    attribute: {
      color: "#9fca56"
    }
  };
  const styleMap = new Map(Object.entries(defaultStyle));
  let stackMap = [];
  const reg = RegExp(/\n/g);
  const reg2 = RegExp(/([^\s])/g);
  const reg22 = RegExp(/([\s])/g);
  const reg3 = RegExp(/\t/g);
  let lineWarp = 0;
  let commentWarp = 0;
  let leftBracket = 0;
  let maxHeight = 0;
  let maxWidth = 0;
  let codeCopy = code.split("\n").map((line, index) => {
    let width;
    width = line.match(reg2)?.length + line.match(reg22)?.length + (line.match(reg3)?.length ? line.match(reg3)?.length : 0);
    if (maxWidth < width) {
      maxWidth = width ? width : 0;
    }
    if (line.match(reg22) && line.match(reg2)?.length) {
      let tap1 = line.indexOf(line.match(reg2)[0]);
      line = line.slice(0, tap1) + line.slice(0, tap1) + line.slice(tap1);
    }
    maxHeight++;
    return line;
  }).join("\n");
  let stack = hljs.highlight(codeCopy, { language })._emitter.root.children;
  for (let i = 0; i < stack.length; i++) {
    if (typeof stack[i] === "string") {
      if (stack[i].match(reg) && stack[i].match(reg2)) {
        let start = stack[i];
        let nCount = stack[i].match(reg);
        if (stack[i].match(/\)/)) {
          let rightBrackets = stack[i].indexOf(")");
          stackMap.push(stack[i].slice(0, rightBrackets));
          start = stack[i].slice(rightBrackets);
        }
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
      } else if (stack[i].match(/\]/)) {
        let rightMidBrackets = stack[i].indexOf("]");
        if (stack[i].match(/\)/)) {
          let rightBrackets = stack[i].indexOf(")");
          stackMap.push(stack[i].slice(0, rightMidBrackets));
          stackMap.push(stack[i].slice(rightMidBrackets, rightBrackets));
          stackMap.push(stack[i].slice(rightBrackets));
        } else {
          stackMap.push(stack[i].slice(0, rightMidBrackets));
          stackMap.push(stack[i].slice(rightMidBrackets));
        }
      } else if (stack[i].match(/\)/)) {
        let rightBrackets = stack[i].indexOf(")");
        stackMap.push(stack[i].slice(0, rightBrackets));
        stackMap.push(stack[i].slice(rightBrackets));
      } else {
        stackMap.push(stack[i]);
      }
    } else {
      if (stack[i].kind === "comment") {
        stackMap.push(stack[i]);
      } else if (stack[i].kind === "property" && stack[i].children[0].children) {
        stackMap.push(stack[i].children[0].children[0]);
      } else if (stack[i].children.length > 1) {
        let stackCC = stack[i].children;
        for (let i2 of stackCC) {
          if (typeof i2 === "string" && i2.match(/\)/)?.length) {
            let rightBrackets = i2.indexOf(")");
            stackMap.push(i2.slice(0, rightBrackets + 1));
            stackMap.push(i2.slice(rightBrackets + 1));
          } else {
            stackMap.push(i2);
          }
        }
      } else {
        stackMap.push(stack[i]);
      }
    }
  }
  let ss = [];
  stackMap.forEach((data) => {
    if (data !== "")
      ss.push(data);
  });
  stack = ss;
  for (let index = 0; index < stack.length; index++) {
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
    if (typeof stack[index] === "object") {
      let col;
      if (!stack[index].children.length) {
        t.text = stack[index].children;
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 5px)", col = styleMap.get(stack[index].kind);
      } else {
        t.text = stack[index].children.join("");
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 1px)", col = styleMap.get(stack[index].kind);
      }
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 5px)";
        leftBracket = 0;
      }
      if (stack[index].children.length && stack[index].children[0].match !== null && stack[index].children[0]?.match(/\/\*\*/g)) {
        commentWarp += stack[index].children[0].match(reg)?.length ? stack[index].children[0].match(reg)?.length : 0;
      }
      if (!col) {
        t.css.color = styleMap.get("default").color;
      } else {
        t.css.color = col.color;
      }
    } else if (typeof stack[index] === "string") {
      t.text = stack[index];
      if (stack[index].match(RegExp(/[a-zA-Z]/g))) {
        t.css.color = styleMap.get("string").color;
      } else if (stack[index].match(RegExp(/=/g))) {
        t.css.color = styleMap.get("attribute").color;
      } else {
        t.css.color = styleMap.get("sign").color;
      }
      t.css.left = "calc(hl0_" + (index - 1) + ".right + 2px)";
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      if (stack[index].match(reg) && !stack[index].match(/\`/g)) {
        lineWarp = stack[index].match(reg).length;
      } else if (stack[index] === " ") {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
      } else if (stack[index].match(/\(/) || stack[index].match(/\[/)) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 4px)";
        leftBracket = 1;
      }
    }
    if (lineWarp) {
      t.css.top = "calc(hl0_" + (index - 1) + ".top +" + 20 * (lineWarp + commentWarp) + " px)";
      t.css.left = "0";
      if (stack[index].match(reg) && stack[index].slice(2)) {
        t.css.left = "calc(hl0_0.right)";
      }
      lineWarp = 0;
      commentWarp = 0;
    }
    if (typeof stack[index] === "string" && stack[index].match(reg3)) {
      t.css.left = "calc(hl0_" + index + ".right + " + 18 * stack[index].match(reg3).length + "px)";
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
    template.height = maxHeight * 20 + 60 + "px";
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
