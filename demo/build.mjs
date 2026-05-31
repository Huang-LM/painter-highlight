import esbuild from 'esbuild';
import fs from 'fs';

// painter-kernel@1.0.7 的 dist 是 webpack 产物，含非法导出 `export { o as __esModule }`，
// esbuild 拒绝把保留名 __esModule 作为导出。打包时剥掉该导出项即可（其余命名导出保留）。
const fixPainterKernel = {
  name: 'fix-painter-kernel',
  setup(build) {
    build.onLoad({ filter: /painter-kernel[\\/]dist[\\/]painter\.js$/ }, (args) => {
      let code = fs.readFileSync(args.path, 'utf8');
      code = code.replace(/,?\s*[A-Za-z0-9_$]+ as __esModule\b/g, '');
      return { contents: code, loader: 'js' };
    });
  },
};

const buildOptions = {
  entryPoints: ['demo/demo.ts'],
  bundle: true,
  outfile: 'demo/bundle.js',
  plugins: [fixPainterKernel],
};

const serve = process.argv.includes('--serve');

if (serve) {
  // esbuild 0.12 旧 API：serve(serveOptions, buildOptions)
  esbuild
    .serve({ servedir: 'demo', port: 8000 }, buildOptions)
    .then((server) => {
      console.log(`Demo running at http://localhost:${server.port}/`);
    });
} else {
  esbuild.build(buildOptions).then(() => {
    console.log('Build done -> demo/bundle.js');
  });
}
