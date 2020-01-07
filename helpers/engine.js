var nunjucks = require('nunjucks');
const { readFileSync, existsSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
const path = require('path');
var _ = require('lodash');

const getConfig = require('../helpers/package').getConfig;
const getMeta = require('./meta').getMeta;
let meta = {};

/**
 * Define custom tag "fetch" to load Node package data by name
 * @param {string} packageName NPM package name
 * @param {string} objectName (optional) object to load from NPM package
 * @param {string} contentType (optional) output format (if available)
 * @returns {string}
 */
// Example 1:
// {# get core object from NPM package in default format #}
// {{ fetch core = 'core.json', packageName = '@codevault/sql-logging' }}
// Example 2:
// {# get [version] from package.json file in current folder #}
// {% fetch package = "package.json", objectName = "version" %}
function FetchExtension(packageName, cb) {
  this.tags = ['fetch'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  this.run = function(context, args, cb) {
    let refFileName = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    let fileName = args[refFileName];
    packageName = packageName || args.packageName || '';
    let fullName = `${packageName}/${fileName}`;

    if ((args.contentType || 'json') === 'template') {
      let template = context.env.getTemplate(require.resolve(fullName));
      let content = template.error ? undefined : template.tmplStr;

      context.ctx[refFileName] = context.env.filters.safe(context.env.renderString(content, context.ctx));
    } else {
      let data = JSON.parse(readFileSync(existsSync(fullName) ? fullName : require.resolve(fullName)));
      context.ctx[refFileName] = args.objectName ? data[args.objectName] : data;
    }

    cb && cb();
  };
}

function ConnectExtension(cb) {
  this.tags = ['connect'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  // {{ connect log = '@codevault/sql-logging', detail = true }}
  // {{ connect log = '@codevault/sql-logging', objectType = 'current' }}
  this.run = function(context, args, cb) {
    let refPackageName = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    let packageName = args[refPackageName];

    let fullName = (packageName ? `${packageName}/` : '') + 'module.context.json';

    let data = JSON.parse(readFileSync(require.resolve(fullName)));

    let def = data[data.namespace];
    let current = context.ctx[data.namespace];
    context.ctx[refPackageName] = (args.objectType || 'current') === 'current' ? _.merge(def, current) : { ...def };

    if (args.extended) {
      data.files.push('package.json');
      data.files.map(file => {
        let fileFullName = (packageName ? `${packageName}/` : '') + file;
        let name = path.basename(file, path.extname(file));
        context.ctx[refPackageName][name] = JSON.parse(readFileSync(require.resolve(fileFullName)));
      });
    }

    cb && cb();
  };
}

// Define environment with custom loader
const init = (inputDir, nunjucksOptions, packageName) => {
  var env = new nunjucks.Environment(
    [
      new nunjucks.FileSystemLoader(inputDir),
      new nunjucks.NodeResolveLoader()
      //    new nunjucks.FileSystemLoader(require.resolve('@codevault\/sql-logging')),
    ],
    nunjucksOptions
  );

  env.addExtension('FetchExtension', new FetchExtension(packageName));
  env.addExtension('ConnectExtension', new ConnectExtension());

  // Usage: {{ datetimeValue | time }}
  env.addFilter('time', function(datetime) {
    return new Date(+datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  env.addFilter('renderString', function(text, context) {
    return env.renderString(text, context);
  });

  env.addFilter('render', function(template, ctx) {
    try {
      return env.filters.safe(env.render(template, ctx));
    } catch (err) {
      return err.message;
    }
  });

  env.addFilter('pickBy', function(object, filter, code) {
    if (object instanceof Array && filter instanceof Array) {
      let res = object.filter(item => {
        return filter.includes(item[code || 'code']);
      });
      // order as in filter
      return _.chain(res)
        .orderBy(
          o => {
            return new Number(filter.indexOf(o[code]));
          },
          ['asc']
        )
        .value();
    } else if (object instanceof Array && typeof filter === 'string') {
      return object.find(item => {
        return item[code || 'code'] === filter;
      });
    } else if (object instanceof Array && filter instanceof Object) {
      return _.pickBy(object, function(value, key) {
        return filter.includes(item.code);
      });
    } else return {};
  });

  env.addFilter('keyBy', function(object, code) {
    return _.reduce(
      object,
      (hash, value) => {
        let key = value[code || 'code'];
        hash[key] = value;
        return hash;
      },
      {}
    );
  });

  env.addFilter('merge', function(object1, object2) {
    return [...object1, ...object2];
    // return _.merge(object1, object2);
  });

  return env;
};

exports.init = init;
