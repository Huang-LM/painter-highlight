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
  let lineWarp = 0;
  let commentWarp = 0;
  let leftBracket = 0;
  let stackMap = [];
  for (let i = 0; i < stackChil.length; i++) {
    if (typeof stackChil[i] === "string") {
      if (stackChil[i].match(reg) && stackChil[i].match(reg2)) {
        let start = stackChil[i];
        let test = stackChil[i].match(reg2);
        while (test.length) {
          if (start.slice(0, start.indexOf(test[0]))) {
            stackMap.push(start.slice(0, start.indexOf(test[0])));
          }
          stackMap.push(start.slice(start.indexOf(test[0]), start.indexOf(test[0]) + 1));
          start = start.slice(start.indexOf(test[0]) + 1);
          test.shift();
        }
        stackMap.push(start);
      } else {
        stackMap.push(stackChil[i]);
      }
    } else {
      if (stackChil[i].kind === "comment") {
        stackMap.push(stackChil[i]);
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
  stackChil = stackMap;
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
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 5px)";
        col = styleMap.get(stackChil[index].kind);
      } else {
        t.text = stackChil[index].children.join("");
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 1px)";
        col = styleMap.get(stackChil[index].kind);
      }
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      if (stackChil[index].children.length && stackChil[index].children[0].match(/\/\*\*/g)) {
        if (stackChil[index].children[0].match(/\*\//g)) {
          commentWarp++;
        } else {
          for (let j of stackChil[index].children) {
            if (j.match(reg)) {
              commentWarp = commentWarp + j.match(reg).length;
            }
          }
        }
        commentWarp--;
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
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 4px)";
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
    views.push(t);
  }
  views[0].css.top = "5px";
  views[1].css.left = "calc(hl0_0.right*2)";
  views[0].css.left = "0";
  CanvasNode.width = toPx(template.width);
  CanvasNode.height = toPx(template.height);
  template.views = views;
  const pen = new Pen(canvas, template);
  pen.paint(() => {
    console.log("ok");
  });
};

export default phl;
