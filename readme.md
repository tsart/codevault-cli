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
codevault foo.tpl meta.json
```

Compiles `foo.tpl` to `foo.sql` with metadata from `meta.json` (and variables from `process.env` as `env`).

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

Takes a json file as codevault options. Defaults are :

```json
trimBlocks: true,
lstripBlocks: true,
noCache: true,
autoescape: true
```

#### Advanced examples

```bash
codevault foo.tpl -p src -o out -O meta.json
```

Compiles `src/foo.tpl` to `out/foo.sql`, with `meta.json` as codevault environnement options.

```bash
codevault *.tpl meta.json -w -p src
```

Compiles all `.tpl` files (except ones starting with `_`) in the `src` folder to the current working directory, with `meta.json` as metadata, and keeps running in the background for files changes.
