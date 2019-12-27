#! /usr/bin/env node

const { readFileSync, writeFileSync } = require('fs');
const { resolve, basename, dirname } = require('path');
const nunjucks = require('nunjucks');
const chokidar = require('chokidar');
const glob = require('glob');
const mkdirp = require('mkdirp');
const chalk = require('chalk').default;

const nunjucksEnv = require('./helpers/engine');

const { argv } = require('yargs')
  .usage('Usage: codevault <file|glob> [context] [options]')
  .example('codevault foo.tpl data.json', 'Compile foo.tpl to foo.sql')
  .example('codevault *.tpl -w -p src -o dist', 'Watch .tpl files in ./src, compile them to ./dist')
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
    describe: 'Path where templates live'
  })
  .option('repository', {
    alias: 'r',
    string: true,
    requiresArg: false,
    nargs: 1,
    default: 'trra/dw-templates',
    describe: 'Git repository with templates'
  })
  .option('out', {
    alias: 'o',
    string: true,
    requiresArg: true,
    nargs: 1,
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
const gitRepo = resolve(process.cwd(), argv.repository) || '';
const outputDir = argv.out || '';

const context = argv._[1] ? JSON.parse(readFileSync(argv._[1], 'utf8')) : {};
// Expose environment variables to render context
context.env = process.env;

/** @type {nunjucks.ConfigureOptions} */
const nunjucksOptions = argv.options
  ? JSON.parse(readFileSync(argv.options, 'utf8'))
  : { trimBlocks: true, lstripBlocks: true, noCache: true, autoescape: true };

const env = nunjucksEnv.init(inputDir, gitRepo, nunjucksOptions);

const render = (/** @type {string[]} */ files) => {
  for (const file of files) {
    console.log(chalk.blue('Rendering: ' + file));

    try {
      const res = env.render(file, context);
      let outputFile = file.replace(/\.\w+$/, `.${argv.extension}`);

      if (outputDir) {
        outputFile = resolve(outputDir, outputFile);
        mkdirp.sync(dirname(outputFile));
      }

      writeFileSync(outputFile, res);
    } catch (err) {
      console.log(chalk.red(err.message));
    }
  }
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
    if (layouts.indexOf(file) > -1) render(templates);
    else render([file]);
  });
}
