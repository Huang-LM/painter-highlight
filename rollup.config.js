import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import { terser } from "rollup-plugin-terser";
import babel from 'rollup-plugin-babel';
// import pkg from './package.json';
 
export default {
  input: 'src/index.ts', // 打包入口

  external: ['ms',' rollup-plugin-eslint'],
  output: [ // 打包出口
    {
      file: 'dist/index.js', // 通用模块
      name: 'phl',
      format: 'umd',
    },
    {
      file: 'dist/index-es.js', // es6模块
      name: 'phl-es',
      format: 'es',
    }
  ],
  plugins: [ // 打包插件
    resolve(), // 查找和打包node_modules中的第三方模块(因为rollup无法识别node_modules中的包)
    commonjs(), // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理（node_modules中的包大部分都是commonjs格式的，要在rollup中使用必须先转为ES6语法）
    typescript(), // 解析TypeScript
    terser({ compress: { drop_console: true } }),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    })

  ]
};