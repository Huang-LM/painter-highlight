import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import { terser } from "rollup-plugin-terser";
import esbuild from 'rollup-plugin-esbuild'
import babel from 'rollup-plugin-babel';
// import pkg from './package.json';
 
const prodPulugins = [
  resolve(), // 查找和打包node_modules中的第三方模块(因为rollup无法识别node_modules中的包)
  commonjs(), // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理（node_modules中的包大部分都是commonjs格式的，要在rollup中使用必须先转为ES6语法）
  typescript(), // 解析TypeScript
  terser({ compress: { drop_console: true } }),
  babel({
    exclude: 'node_modules/**' // 只编译我们的源代码
  }),
  esbuild({
    include: /\.ts?$/,
    exclude: /node_modules/,
    sourceMap: false,
    minify: true,
  }),
]

const devPulugins = [
  resolve(), 
  commonjs(),  
  typescript(), 
  // terser({ compress: { drop_console: true } }),
  babel({ exclude: 'node_modules/**' }),
  esbuild({
    include: /\.ts?$/,
    exclude: /node_modules/,
    sourceMap: false,
    minify: false,
  }),
]

export default [
    {
      input: 'src/index.ts', // 打包入口

      external: ['ms'],
      output: [ // 打包出口
        {
          file: 'dist/index.js', // 通用模块
          name: 'phl',
          format: 'umd',
        },
      ],
      plugins: prodPulugins
  },
  {
    input: 'src/index.ts', 

    external: ['ms'],
    output: [
      {
        file: 'dist/index-es.js', // es6模块
        name: 'phl-es',
        format: 'es',
      }
    ],
    plugins: devPulugins
  }
]