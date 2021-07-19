/* eslint-disable prettier/prettier */
import hljs from "highlight.js";
import { Pen, toPx } from "painter-kernel";

type template = {
  background: string; // 整个模版的背景，支持网络图片的链接、纯色和渐变色
  width: string;
  height: string;
  borderRadius: string;
  views: any;
};

const phl = function (
  CanvasNode: object,
  canvas: CanvasRenderingContext2D,
  template: template,
  code: string,
  language: string
) {
  let views: any[] = [];

  const stack = hljs.highlight(code, { language: language })._emitter.stack;

  let defaultStyle = {
    default: {
      color: "#c9d1d9",
    },
    comment: {
      color: "#c9d1d9",
    },
    doctag: {
      color: "#ff7b72",
    },
    built_in: {
      color: "red",
    },
    keyword: {
      color: "#ff7b72",
    },
    "template-tag": {
      color: "#ff7b72",
    },
    "template-variable": {
      color: "#ff7b72",
    },
    type: {
      color: "#ff7b72",
    },
    string: {
      color: "#afa5b4",
    },
    attr: {
      color: "#ff7b72",
    },
    number: {
      color: "#aff5b4",
    },
    params: {
      color: "#aff5b4",
    },
    "variable.language": {
      color: "#ff7b72",
    },
    subst: {
      color: "Purple",
    },
    title: {
      color: "#d2a8ff",
    },
    "title.class": {
      color: "#d2a8ff",
    },
    "title.class.inherited": {
      color: "#d2a8ff",
    },
    "title.function": {
      color: "#d2a8ff",
    },
    deletion: {
      color: "#ffdcd7",
      backgroundColor: "#67060c",
    },
    addition: {
      color: "#aff5b4",
      backgroundColor: "#033a16",
    },
    strong: {
      color: "#c9d1d9",
      fontWeight: "bold",
    },
    emphasis: {
      color: "#c9d1d9",
      fontStyle: "italic",
    },
    sign: {
      color: "#777",
    },
  };
  let stackChil = stack[0].children;

  // 转换成map
  const styleMap = new Map(Object.entries(defaultStyle));

  // 匹配换行符
  const reg = RegExp(/\n/g);
  // 匹配空格
  const reg2 = RegExp(/([^\s])/g);

  let lineWarp = 0;
  let commentWarp = 0;
  let leftBracket = 0;

  let stackMap = [];

  // 分离符号与换行符
  for (let i = 0; i < stackChil.length; i++) {
    // console.log(typeof stackChil[i]);

    if (typeof stackChil[i] === "string") {
      // string
      // console.log(stackChil[i]);
      if (stackChil[i].match(reg) && stackChil[i].match(reg2)) {
        // console.log("gai");
        // 还没分离的部分
        let start = stackChil[i];
        // 测试出来还有的字符
        let test = stackChil[i].match(reg2);
        // console.log(test);

        while (test.length) {
          // 前
          if (start.slice(0, start.indexOf(test[0]))) {
            stackMap.push(start.slice(0, start.indexOf(test[0])));
          }
          // 中: 弹出第一个已经匹配过的
          stackMap.push(
            start.slice(start.indexOf(test[0]), start.indexOf(test[0]) + 1)
          );
          // 后
          start = start.slice(start.indexOf(test[0]) + 1);

          test.shift();
        }
        stackMap.push(start);
      } else {
        stackMap.push(stackChil[i]);
      }
    } else {
      // object
      if (stackChil[i].kind === "comment") {
        // 是注释时直接导入
        stackMap.push(stackChil[i]);
      } else if (stackChil[i].children.length > 1) {
        // 若存在多个children
        let stackCC = stackChil[i].children;
        for (let i of stackCC) {
          stackMap.push(i);
        }
      } else {
        stackMap.push(stackChil[i]);
      }
    }
  }

  stackChil = stackMap;

  // 主要循环判断
  for (let index = 0; index < stackChil.length; index++) {
    let t = {
      id: "hl0_" + index,
      text: "",
      type: "text",
      css: {
        top: "calc(hl0_" + (index - 1) + ".top)",
        left: "calc(hl0_" + (index - 1) + ".right)",
        color: defaultStyle.default.color,
        fontSize: "16px",
      },
    };

    // 匹配为object时
    if (typeof stackChil[index] === "object") {
      let col;

      // 有子项与没子项的区分
      if (!stackChil[index].children.length) {
        t.text = stackChil[index].children;
        (t.css.left = "calc(hl0_" + (index - 1) + ".right - 5px)"),
        (col = styleMap.get(stackChil[index].kind));
        // console.log("-------------------------");
      } else {
        t.text = stackChil[index].children.join("");
        (t.css.left = "calc(hl0_" + (index - 1) + ".right + 1px)"),
        (col = styleMap.get(stackChil[index].kind));
      }

      // 左括号美化
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }
      // console.log(stackChil[0].children);

      // 存在多行注释时
      if (
        stackChil[index].children.length &&
        stackChil[index].children[0].match(/\/\*\*/g)
      ) {
        // console.log("kandao1");
        // console.log(stackChil[index].children[0].match(/\*\//g));
        // 都在一行上
        if (stackChil[index].children[0].match(/\*\//g)) {
          // console.log(stackChil[index].children[0].match(/\*\//g));
          commentWarp++;
        } else {
          for (let j of stackChil[index].children) {
            // console.log(j.match(/\*\\/g));
            if (j.match(reg)) {
              commentWarp = commentWarp + j.match(reg).length;
              // console.log(lineWarp);
            }
          }
        }
        commentWarp--;
      }

      // 颜色匹配
      if (!col) {
        t.css.color = <any>styleMap.get("default");
      } else {
        t.css.color = col.color;
      }

      // 匹配为string时
    } else if (typeof stackChil[index] === "string") {
      t.text = stackChil[index];
      t.css.color = <any>styleMap.get("sign");
      t.css.left = "calc(hl0_" + (index - 1) + ".right + 2px)";

      // 左括号美化
      if (leftBracket) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 8px)";
        leftBracket = 0;
      }

      // 换行符存在时进行记录
      if (stackChil[index].match(reg) && !stackChil[index].match(/\`/g)) {
        lineWarp = stackChil[index].match(reg).length;
        // console.log(lineWarp + "----" +index);
      } else if (stackChil[index] === " ") {
        t.css.left = "calc(hl0_" + (index - 1) + ".right - 4px)";
        // console.log('1111');
      } else if (stackChil[index].match(/\(/)) {
        t.css.left = "calc(hl0_" + (index - 1) + ".right + 4px)";
        leftBracket = 1;
      }
    }

    // 换行
    if (lineWarp) {
      // console.log("换行"+lineWarp)

      t.css.top =
        "calc(hl0_" +
        (index - 1) +
        ".top +" +
        20 * (lineWarp + commentWarp) +
        " px)";
      // t.css.top = 'calc(hl0_'+ (index-1) +'.top + 20px)';
      t.css.left = "0";
      if (stackChil[index].match(reg) && stackChil[index].slice(2)) {
        t.css.left = "calc(hl0_0.right)";
      }
      lineWarp = 0;
      commentWarp = 0;
    }

    // 放入最后的数组
    views.push(<any>t);
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
