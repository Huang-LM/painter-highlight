/* eslint-disable prettier/prettier */
import hljs from 'highlight.js';
import { Pen, toPx } from 'painter-kernel';

type template = {
  background: string;
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
  language: string,
) {
  let views: any[] = [];

  let defaultStyle = {
    default: {
      color: '#55b5db',
    },
    property: {
      color: '#a074c4',
    },
    comment: {
      color: '#41535b',
    },
    literal: {
      color: '#ee3300ef',
    },
    doctag: {
      color: '#ff7b72',
    },
    built_in: {
      color: '#55b5db',
    },
    keyword: {
      color: '#e6cd69',
    },
    'template-tag': {
      color: '#ff7b72',
    },
    'template-variable': {
      color: '#9fca56',
    },
    type: {
      color: '#9fca56',
    },
    string: {
      color: '#55b5db',
    },
    attr: {
      color: '#ff7b72',
    },
    number: {
      color: '#cd3f45',
    },
    params: {
      color: '#55b5db',
    },
    'variable.language': {
      color: '#55b5db',
    },
    'variable.constant': {
      color: '#55b5db',
    },
    subst: {
      color: 'Purple',
    },
    title: {
      color: '#d2a8ff',
    },
    'title.class': {
      color: '#df88df',
    },
    'title.class.inherited': {
      color: '#dda8ff',
    },
    'title.function': {
      color: '#a074c4',
    },
    deletion: {
      color: '#ffdcd7',
      backgroundColor: '#67060c',
    },
    addition: {
      color: '#aff5b4',
      backgroundColor: '#033a16',
    },
    strong: {
      color: '#c9d1d9',
      fontWeight: 'bold',
    },
    emphasis: {
      color: '#c9d1d9',
      fontStyle: 'italic',
    },
    sign: {
      color: '#eee',
    },
    attribute: {
      color: '#9fca56',
    },
  };

  // 转换成颜色的map
  const styleMap = new Map(Object.entries(defaultStyle));

  let stackMap = [];

  // 匹配换行符
  const reg = RegExp(/\n/g);
  // 匹配字符
  const reg2 = RegExp(/([^\s])/g);
  // 匹配空格
  const reg22 = RegExp(/([\s])/g);
  // 匹配tab符
  const reg3 = RegExp(/\t/g);

  // 换行记录数
  let lineWarp = 0;
  // 多行注释记录数
  let commentWarp = 0;
  // 括号记录数
  let leftBracket = 0;
  let rightBracket = 0;

  // 小圆点颜色
  let dotsColor = ['#E0443E', '#DEA123', '#1AAB29'];
  // 高度
  let maxHeight = 0;
  // 宽度
  let maxWidth = 0;

  let codeCopy = code
    .split('\n')
    .map((line, index) => {
      let width: number;
      let spaceLength: any = line.match(reg22)?.length;
      if (spaceLength === undefined) spaceLength = 0;
      width = line.match(reg2)?.length + spaceLength + (line.match(reg3)?.length ? line.match(reg3)?.length : 0);

      if (line.match(reg22) && line.match(reg2)?.length) {
        let tap1 = line.indexOf(line.match(reg2)[0]);
        line = line.slice(0, tap1) + line.slice(0, tap1) + line.slice(tap1);
      }
      // if (line.match('，') || line.match('。')) {
      //   // 中文时
      //   width =
      //     1.5 * line.match(reg2)?.length + 0.5*spaceLength + (line.match(reg3)?.length ? line.match(reg3)?.length : 0);
      // }
      if (typeof line === 'string' && line.match(reg3)) {
        line = line.replace(reg3, '  ');
      }
      if (maxWidth < width) {
        maxWidth = width ? width : 0;
      }
      maxHeight++;
      return line;
    })
    .join('\n');

  codeCopy = '\n' + codeCopy;
  let stack = hljs.highlight(codeCopy, { language: language })._emitter.root.children;

  // 分离\n的方法
  const stringSeparate = (stackI: string) => {
    // 还没分离的部分
    let start = stackI;

    // 内部有多少\n
    let nCount = stackI.match(reg);

    if (stackI.match(/\)/)) {
      let rightBrackets = stackI.indexOf(')');
      stackMap.push(stackI.slice(0, rightBrackets));
      start = stackI.slice(rightBrackets);
    }

    if (nCount !== null) {
      while (nCount.length) {
        let sNode = start.indexOf(nCount[0]);

        // 前
        if (start.slice(0, sNode)) {
          stackMap.push(start.slice(0, sNode));
        }
        // 中: 弹出第一个已经匹配过的
        stackMap.push(start.slice(sNode, sNode + 1));
        // 后
        start = start.slice(sNode + 1);

        nCount.shift();
      }
    }
    stackMap.push(start);
  };

  // 将符号和换行符分离
  for (let i = 0; i < stack.length; i++) {
    if (typeof stack[i] === 'string') {
      // string
      // 有换行符和字符的时候
      if (stack[i].match(reg) && stack[i].match(reg2)) {
        stringSeparate(stack[i]);
      } else if (stack[i].match(/\]/)) {
        // 右括号粘住的问题
        let rightMidBrackets = stack[i].indexOf(']');

        if (stack[i].match(/\)/)) {
          let rightBrackets = stack[i].indexOf(')');
          stackMap.push(
            stack[i].slice(0, rightMidBrackets),
            stack[i].slice(rightMidBrackets, rightBrackets),
            stack[i].slice(rightBrackets),
          );
        } else {
          stackMap.push(stack[i].slice(0, rightMidBrackets), stack[i].slice(rightMidBrackets));
        }
      } else if (stack[i].match(/\)/)) {
        let rightBrackets = stack[i].indexOf(')');
        stackMap.push(stack[i].slice(0, rightBrackets), stack[i].slice(rightBrackets));
      } else {
        stackMap.push(stack[i]);
      }
    } else {
      // object
      if (stack[i].kind === 'comment') {
        // 是注释时直接导入
        stackMap.push(stack[i]);
      } else if (stack[i].kind === 'property' && stack[i].children[0].children) {
        stackMap.push(stack[i].children[0].children[0]);
      } else if (stack[i].children.length > 1) {
        // 若存在多个children
        let stackCC = stack[i].children;
        for (let i of stackCC) {
          if (typeof i === 'string' && i.match(/\)/)?.length) {
            let rightBrackets = i.indexOf(')');
            stackMap.push(i.slice(0, rightBrackets + 1));
            stackMap.push(i.slice(rightBrackets + 1));
          } else {
            stackMap.push(i);
          }
        }
      } else if (
        stack[i].kind === 'params' &&
        typeof stack[i].children[0] === 'object' &&
        stack[i].children[0].kind !== 'regexp'
      ) {
        // console.log(stack[i]);
        stringSeparate(stack[i].children[0]);
      } else {
        stackMap.push(stack[i]);
      }
    }
  }

  // 去除''
  let ss = [];
  stackMap.forEach((data) => {
    if (data !== '') ss.push(data);
  });
  stack = ss;

  // 主要循环判断
  for (let index = 0; index < stack.length; index++) {
    let t = {
      id: 'hl0_' + index,
      text: '',
      type: 'text',
      css: {
        top: 'calc(hl0_' + (index - 1) + '.top)',
        left: 'calc(hl0_' + (index - 1) + '.right)',
        color: defaultStyle.default.color,
        fontSize: '19px',
      },
    };

    // 匹配为object时
    if (typeof stack[index] === 'object') {
      let col: { color: string };

      // 有子项与没子项的区分
      if (!stack[index].children.length) {
        t.text = stack[index].children;
        (t.css.left = 'calc(hl0_' + (index - 1) + '.right - 5px)'), (col = styleMap.get(stack[index].kind));
      } else {
        t.text = stack[index].children.join('');
        (t.css.left = 'calc(hl0_' + (index - 1) + '.right + 1px)'), (col = styleMap.get(stack[index].kind));
      }

      // 括号美化
      if (leftBracket || rightBracket) {
        if (stack[index] !== ';') {
          t.css.left = 'calc(hl0_' + (index - 1) + '.right - 8px)';
        }
        leftBracket = 0;
        rightBracket = 0;
      }

      // 多行注释时
      if (
        stack[index].children.length &&
        stack[index].children[0].kind !== 'regexp' &&
        stack[index].children[0].match !== null &&
        stack[index].children[0]?.match(/\/\*\*/g)
      ) {
        commentWarp += stack[index].children[0].match(reg)?.length ? stack[index].children[0].match(reg)?.length : 0;
      }

      // 颜色匹配
      if (!col) {
        t.css.color = styleMap.get('default').color;
      } else {
        t.css.color = col.color;
      }

      // 匹配为string时
    } else if (typeof stack[index] === 'string') {
      t.text = stack[index];
      // 区分符号和字母
      if (stack[index].match(RegExp(/^[a-zA-Z]/g))) {
        t.css.color = styleMap.get('string').color;
      } else if (stack[index].match(RegExp(/=/g))) {
        t.css.color = styleMap.get('attribute').color;
      } else {
        if (stack[index].match(reg2) !== null) {
          if (stack[index].match(reg2).length !== 1) maxWidth = maxWidth + 0.6 * stack[index].match(reg2).length;
        }
        t.css.color = styleMap.get('sign').color;
      }
      t.css.left = 'calc(hl0_' + (index - 1) + '.right + 2px)';

      // 括号美化
      if (leftBracket || rightBracket) {
        if (stack[index] !== ';') {
          t.css.left = 'calc(hl0_' + (index - 1) + '.right - 10px)';
        }
        leftBracket = 0;
        rightBracket = 0;
      }

      //调整空格位置
      // if (stack[index].match(reg22)?.length) {
      //   let k = stack[index].match(reg22)?.length;
      //   t.css.left = 'calc(hl0_' + (index - 1) + '.right +' + k * 2 + ' px)';
      // }

      // 换行符存在时进行记录
      if (stack[index].match(reg) && !stack[index].match(/\`/g)) {
        lineWarp = stack[index].match(reg).length;
      } else if (stack[index] === ' ') {
        t.css.left = 'calc(hl0_' + (index - 1) + '.right - 8px)';
      } else if (stack[index].match(/\(/) || stack[index].match(/\[/) || stack[index].match(/\{/)) {
        switch (stack[index - 1]) {
          case '(':
          case '[':
          case '{':
            t.css.left = 'calc(hl0_' + (index - 1) + '.right - 10px)';
            break;
          case ' ':
            t.css.left = 'calc(hl0_' + (index - 1) + '.right - 5px)';
            break;
          default:
            t.css.left = 'calc(hl0_' + (index - 1) + '.right + 3px)';
            break;
        }
        leftBracket = 1;
      } else if (stack[index] == ')' || stack[index] == ']' || stack[index] == '}') {
        if (stack[index - 1] == '}') {
          t.css.left = 'calc(hl0_' + (index - 1) + '.right - 9px)';
        }
        rightBracket = 1;
      }
    }

    // 换行
    if (lineWarp) {
      t.css.top = 'calc(hl0_' + (index - 1) + '.top +' + 23 * (lineWarp + commentWarp) + ' px)';
      t.css.left = '0';
      // 缩进问题
      if (stack[index].match(reg) && stack[index].slice(2)) {
        t.css.left = 'calc(hl0_0.right)';
      }
      lineWarp = 0;
      commentWarp = 0;
    }
    // tab符号
    // if (typeof stack[index] === 'string' && stack[index].match(reg3)) {
    //   t.css.left = 'calc(hl0_' + index + '.right + ' + 9 * stack[index].match(reg3).length + 'px)';
    // }

    // 放入最后的数组
    views.push(t);
  }
  views[0].css.top = '55px';
  views[1].css.left = 'calc(hl0_0.right + 0px)';
  views[0].css.left = '0';

  // 窗口小圆点
  for (let t = 0; t < 3; t++) {
    let dots = {
      id: 'hl1_' + t,
      type: 'rect',
      css: {
        top: '18px',
        left: 18 + 20 * t + 'px',
        height: '12px',
        width: '12px',
        color: dotsColor[t],
        borderRadius: '50%',
      },
    };
    views.unshift(dots);
  }
  // vscode插件使用
  // views.unshift({
  //   id: 'hl1_' + 4,
  //   text: 'VSCode插件  前端每日一题',
  //   type: 'text',
  //   css: {
  //     top: '14px',
  //     left: 18 + 20 * 4 + 'px',
  //     fontSize: '17px',
  //     color: '#41535b',
  //   },
  // });

  if (template.height == 'auto') {
    template.height = maxHeight * 23 + 55 + 'px';
  }
  if (template.width == 'auto') {
    template.width = maxWidth * 12 + 'px';
  }

  CanvasNode.width = toPx(template.width);
  CanvasNode.height = toPx(template.height);
  template.views = views;

  const pen = new Pen(canvas, template);

  pen.paint();
};

export default phl;
