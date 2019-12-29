# codevault-cli

CodeVault CLI to generate static files

## Installation

```bash
npm i -D codevault-cli # local
npm i -g codevault-cli # global
```

## Usage

```bash
codevault <file|glob> [context] [options]
```

_For convenience, `process.env` object is added to the context as `env`._

#### Basic examples

```bash
codevault foo.tpl context.json
```

Compiles `foo.tpl` to `foo.sql` with context data from `context.json` (and variables from `process.env` as `env`).

```bash
codevault **/*.tpl
```

Compiles all `.tpl` files (including subdirectories), except the ones starting by `_` (so you can use them as layouts).

## Options

### `--path <directory>`

`-p <directory>`

Path where the templates live. Default to the current working directory.

### `--out <directory>`

`-o <directory>`

Output directory.

### `--watch`

`-w`

Allows to keep track of file changes and render accordingly (except files starting by `_`).

### `--extension <ext>`

`-e <ext>`

Extension for rendered files. Defaults to `sql`.

### `--options <file>`

`-O <file>`

Takes a json file as codevault render options. Defaults are:

```json
trimBlocks: true,
lstripBlocks: true,
noCache: true,
autoescape: true
```

#### Advanced examples

```bash
codevault foo.tpl -p src -o out -O render.json
```

Compiles `src/foo.tpl` to `out/foo.sql`, with `render.json` as codevault render options.

```bash
codevault *.tpl context.json -w -p src
```

Compiles all `.tpl` files (except ones starting with `_`) in the `src` folder to the current working directory, with `context.json` as context, and keeps running in the background for files changes.

## Configuration

### Environment settings

You can create `.env` file in the project root folder to define project specific environment settings.

### Default context file

If context file is not specified in command line then use the following:

If `NODE_ENV` environment attribute is set to `production` then take `context.json` file in the project root folder. Otherwise take `local.context.json` file.
