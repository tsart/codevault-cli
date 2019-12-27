const { spawnSync } = require('child_process');
const { readFileSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
const { ok, deepStrictEqual } = require('assert');

process.env.NODE_ENV = 'development';

const srcPath = `tests`;
const outPath = `tests/out`;
const context = `tests/config/meta.json`;
const globalMask = `*.tpl`;
const extension = `sql`;
const cmd = `node index.js ${globalMask} ${context} -p ${srcPath} -o ${outPath} -e ${extension}`;

spawnSync(cmd, { shell: true, stdio: 'inherit' });

const filesCompiled = readdirSync(outPath);
deepStrictEqual(filesCompiled, ['demo.sql'], 'Test templates not rendered correctly');

for (const file of filesCompiled) {
  const content = readFileSync(`${outPath}/${file}`, 'utf8');
  ok(content.startsWith('-- Demo template'), 'Layout not extended');

  if (file === 'demo.sql') {
    ok(content.includes('[srcSchema].[srcTable]'), 'Metadata not interpolated');
    ok(content.includes('development'), 'Env variable not passed');
  }

  // unlinkSync(`${outPath}/${file}`);
}

// rmdirSync(outPath);
