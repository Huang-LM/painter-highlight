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
  (async () => {
    let port = 8000;
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        // 先进行一次初始构建以生成 bundle.js
        await esbuild.build(buildOptions);
        // 然后启动 serve 服务器来提供热更新
        const serveResult = await esbuild.serve({ servedir: 'demo', port }, buildOptions);
        console.log(`✓ Demo 运行于 http://localhost:${serveResult.port}/`);
        return;
      } catch (error) {
        if (error.message.includes('address already in use') || error.message.includes('bind')) {
          retries++;
          port++;
          console.log(`端口 ${port - 1} 被占用，尝试端口 ${port}...`);
          if (retries < maxRetries) continue;
        }
        console.error('✗ 启动失败:', error.message);
        process.exit(1);
      }
    }
  })();
} else {
  esbuild.build(buildOptions).then(() => {
    console.log('Build done -> demo/bundle.js');
  });
}
