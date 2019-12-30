#! /usr/bin/env node

const { readFileSync, writeFileSync, existsSync } = require('fs');
const { resolve, basename, dirname } = require('path');
const nunjucks = require('nunjucks');
const chokidar = require('chokidar');
const glob = require('glob');
const mkdirp = require('mkdirp');
const chalk = require('chalk').default;
require('dotenv').config();

const projectEnv = 'production' === process.env.NODE_ENV ? 'prod' : 'dev';

const engineEnv = require('./helpers/engine');

const { argv } = require('yargs')
  .usage('Usage: codevault <file|glob> [context] [options]')
  .example('codevault foo.tpl', 'Compile foo.tpl using default context file')
  .example('codevault *.tpl -w -p src -o out', 'Watch .tpl files in ./src, compile them to ./out')
  .demandCommand(1, 'You must provide at least a file/glob path')
  .epilogue('For more information on template engine: https://mozilla.github.io/nunjucks/')
  .help()
  .alias('help', 'h')
  .locale('en')
  .version(false)
  .option('path', {
    alias: 'p',
    string: true,
    requiresArg: true,
    nargs: 1,
    default: '.',
    describe: 'Path where templates live'
  })
  .option('out', {
    alias: 'o',
    string: true,
    requiresArg: true,
    nargs: 1,
    default: 'out',
    describe: 'Output folder'
  })
  .option('watch', {
    alias: 'w',
    boolean: true,
    describe: 'Watch files change, except files starting by "_"'
  })
  .option('extension', {
    alias: 'e',
    string: true,
    requiresArg: true,
    default: 'sql',
    describe: 'Extension of the rendered files'
  })
  .option('options', {
    alias: 'O',
    string: true,
    requiresArg: true,
    nargs: 1,
    describe: 'Options file'
  });

const inputDir = resolve(process.cwd(), argv.path) || '';
const outputDir = argv.out || '';

let contextFile =
  argv._[1] || (projectEnv === 'dev' && 'local.context.json') || (projectEnv === 'prod' && 'context.json');
console.log(chalk.blue(`Environment: [${projectEnv}] ${contextFile || chalk.red.bold('context file not defined')}`));
context = existsSync(contextFile) ? JSON.parse(readFileSync(contextFile, 'utf8')) : {};
console.log('context', JSON.stringify(context).substr(0, 100), '...');

// Expose environment variables to render context
context.env = process.env;

/** @type {nunjucks.ConfigureOptions} */
const nunjucksOptions = argv.options
  ? JSON.parse(readFileSync(argv.options, 'utf8'))
  : { trimBlocks: true, lstripBlocks: true, noCache: true, autoescape: true };

const codeVaultEnv = engineEnv.init(inputDir, nunjucksOptions);

const render = (/** @type {string[]} */ files) => {
  console.time('Execution time');
  console.group('Rendering');
  for (const file of files) {
    console.log(chalk.blue('File: ' + file));

    try {
      const res = codeVaultEnv.render(file, context);
      let outputFile = file.replace(/\.\w+$/, `.${argv.extension}`);
      console.log(chalk.white('Output: ' + outputFile));

      if (outputDir) {
        outputFile = resolve(outputDir, outputFile);
        mkdirp.sync(dirname(outputFile));
      }

      writeFileSync(outputFile, res);
    } catch (err) {
      console.log(chalk.red(err.message));
    }
  }
  console.groupEnd();
  console.timeEnd('Execution time');
};

/** @type {glob.IOptions} */
const globOptions = { strict: true, cwd: inputDir, ignore: '**/_*.*', nonull: true };

// Render the files given a glob pattern (except the ones starting with "_")
glob(argv._[0], globOptions, (err, files) => {
  if (err) return console.error(chalk.red(err));
  render(files);
});

// Watcher
if (argv.watch) {
  const layouts = [];
  const templates = [];

  /** @type {chokidar.WatchOptions} */
  const watchOptions = { persistent: true, cwd: inputDir };
  const watcher = chokidar.watch(argv._[0], watchOptions);

  watcher.on('ready', () => console.log(chalk.gray('Watching templates...')));

  // Sort files to not render partials/layouts
  watcher.on('add', file => {
    if (basename(file).indexOf('_') === 0) layouts.push(file);
    else templates.push(file);
  });

  // if the file is a layout/partial, render all other files instead
  watcher.on('change', file => {
    if (layouts.indexOf(file) > -1) render(templates, context);
    else render([file], context);
  });
}
