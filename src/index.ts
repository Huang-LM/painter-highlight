/* eslint-disable prettier/prettier */
import hljs from 'highlight.js';
import { Pen, toPx } from 'painter-kernel';

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
  language: string,
) {
  let views: any[] = [];

  const stack = hljs.highlight(code, { language: language })._emitter.stack;

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
      color: '#fff',
    },
    attribute: {
      color: '#9fca56',
    },
  };
  let stackChil = stack[0].children;

  // 转换成map
  const styleMap = new Map(Object.entries(defaultStyle));

  // 匹配换行符
  const reg = RegExp(/\n/g);
  // 匹配字符
  const reg2 = RegExp(/([^\s])/g);
  // 匹配空格
  const reg22 = RegExp(/([\s])/g);
  // 匹配tab符
  const reg3 = RegExp(/\t/g);

  let lineWarp = 0;
  let commentWarp = 0;
  let leftBracket = 0;

  // 高度
  let height = 0;
  // 宽度
  let maxWidth = 0;

  let stackMap = [];

  // 最大宽度
  let codeCopy = code;
  codeCopy
    .split('\n')
    .filter((line, index) => {
      const CURRENT_LINE = index + 1;
      let width: number;
      width =
        line.match(reg2)?.length +
        line.match(reg22)?.length +
        (line.match(reg3)?.length ? line.match(reg3)?.length : 0);
      if (maxWidth < width) {
        maxWidth = width ? width : 0;
      }
      height++;
      return CURRENT_LINE >= 0 && CURRENT_LINE <= 1000;
    })
    .join('\n');

  // 分离符号与换行符
  for (let i = 0; i < stackChil.length; i++) {
    // console.log(typeof stackChil[i]);

    if (typeof stackChil[i] === 'string') {
      // string
      // 有换行符和字符的时候
      if (stackChil[i].match(reg) && stackChil[i].match(reg2)) {
        // console.log("gai");
        // 还没分离的部分
        let start = stackChil[i];
        // 内部有多少\n
        let nCount = stackChil[i].match(reg);

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
        stackMap.push(start);
      } else {
        stackMap.push(stackChil[i]);
      }
    } else {
      // object
      if (stackChil[i].kind === 'comment') {
        // 是注释时直接导入
        stackMap.push(stackChil[i]);
      } else if (stackChil[i].kind === 'property' && stackChil[i].children[0].children) {
        stackMap.push(stackChil[i].children[0].children[0]);
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

  // 去除""
  let ss = [];
  stackMap.forEach((data) => {
    if (data !== '') ss.push(data);
  });
  stackChil = ss;

  // 主要循环判断
  for (let index = 0; index < stackChil.length; index++) {
    // console.log(stackChil[index]);
    // console.log(typeof stackChil[index]);
    let t = {
      id: 'hl0_' + index,
      text: '',
      type: 'text',
      css: {
        top: 'calc(hl0_' + (index - 1) + '.top)',
        left: 'calc(hl0_' + (index - 1) + '.right)',
        color: defaultStyle.default.color,
        fontSize: '16px',
      },
    };

    // 匹配为object时
    if (typeof stackChil[index] === 'object') {
      let col;

      // 有子项与没子项的区分
      if (!stackChil[index].children.length) {
        t.text = stackChil[index].children;
        (t.css.left = 'calc(hl0_' + (index - 1) + '.right - 5px)'), (col = styleMap.get(stackChil[index].kind));
        // console.log("-------------------------");
      } else {
        t.text = stackChil[index].children.join('');
        (t.css.left = 'calc(hl0_' + (index - 1) + '.right + 1px)'), (col = styleMap.get(stackChil[index].kind));
      }

      // 左括号美化
      if (leftBracket) {
        t.css.left = 'calc(hl0_' + (index - 1) + '.right - 8px)';
        leftBracket = 0;
      }

      // 多行注释时
      if (
        stackChil[index].children.length &&
        stackChil[index].children[0].match !== null &&
        stackChil[index].children[0]?.match(/\/\*\*/g)
      ) {
        commentWarp += stackChil[index].children[0].match(reg).length;
      }

      // 颜色匹配
      if (!col) {
        t.css.color = styleMap.get('default');
      } else {
        t.css.color = col.color;
      }

      // 匹配为string时
    } else if (typeof stackChil[index] === 'string') {
      console.log(stackChil[index].match(reg22)?.length);

      t.text = stackChil[index];
      // 区分符号和字母
      if (stackChil[index].match(RegExp(/^[a-zA-Z]/g))) {
        // console.log(stackChil[index]);
        t.css.color = styleMap.get('string').color;
      } else if (stackChil[index].match(RegExp(/=/g))) {
        t.css.color = styleMap.get('attribute').color;
      } else {
        t.css.color = styleMap.get('sign').color;
      }
      t.css.left = 'calc(hl0_' + (index - 1) + '.right + 2px)';

      // console.log(styleMap.get("sign").color);
      // 左括号美化
      if (leftBracket) {
        t.css.left = 'calc(hl0_' + (index - 1) + '.right - 8px)';
        leftBracket = 0;
      }

      //调整空格位置
      if (stackChil[index].match(reg22)?.length) {
        let k = stackChil[index].match(reg22)?.length;
        t.css.left = 'calc(hl0_' + (index - 1) + '.right +' + k * 2 + ' px)';
      }

      // 换行符存在时进行记录
      if (stackChil[index].match(reg) && !stackChil[index].match(/\`/g)) {
        lineWarp = stackChil[index].match(reg).length;
      } else if (stackChil[index] === ' ') {
        t.css.left = 'calc(hl0_' + (index - 1) + '.right - 8px)';
        // console.log('1111');
      } else if (stackChil[index].match(/\(/) || stackChil[index].match(/\[/)) {
        t.css.left = 'calc(hl0_' + (index - 1) + '.right + 4px)';
        leftBracket = 1;
      }
    }

    // 换行
    if (lineWarp) {
      t.css.top = 'calc(hl0_' + (index - 1) + '.top +' + 20 * (lineWarp + commentWarp) + ' px)';
      // t.css.top = 'calc(hl0_'+ (index-1) +'.top + 20px)';
      t.css.left = '0';
      // 缩进问题
      if (stackChil[index].match(reg) && stackChil[index].slice(2)) {
        t.css.left = 'calc(hl0_0.right)';
      }
      lineWarp = 0;
      commentWarp = 0;
    }
    // tab符号
    if (typeof stackChil[index] === 'string' && stackChil[index].match(reg3)) {
      // console.log(stackChil[index].match(reg3));
      t.css.left = 'calc(hl0_' + index + '.right + ' + 18 * stackChil[index].match(reg3).length + 'px)';
    }

    // 放入最后的数组
    views.push(t);
  }
  views[0].css.top = '35px';
  views[1].css.left = 'calc(hl0_0.right + 0px)';
  views[0].css.left = '0';

  if (template.height == 'auto') {
    template.height = height * 20 + 30 + 'px';
  }
  if (template.width == 'auto') {
    template.width = maxWidth * 10.5 + 'px';
  }

  CanvasNode.width = toPx(template.width);
  CanvasNode.height = toPx(template.height);
  template.views = views;

  const pen = new Pen(canvas, template);

  pen.paint();
};

export default phl;
