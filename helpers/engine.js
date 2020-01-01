var nunjucks = require('nunjucks');
const { readFileSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
var _ = require('lodash');

const getConfig = require('../helpers/package').getConfig;
const getMeta = require('./meta').getMeta;
let meta = {};

/**
 * Define custom tag "require" to load Node package data by name
 * @param {string} package NPM package name
 * @param {string} objectName (optional) object to load from NPM package
 * @param {string} contentType (optional) output format (if available)
 * @returns {string}
 */
// Example 1:
// {# get all objects from NPM package in default format #}
// {% require package = "@codevault/sql-poc" %}
// Example 2:
// {# get [info] object from NPM package in markdown format #}
// {% require package = "@codevault/sql-poc", objectName = "info", contentType = "md" %}
function ImportExtension(cb) {
  this.tags = ['require'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  this.run = function(context, args, cb) {
    let refPackageName = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    var packageName = args[refPackageName];

    let config = getConfig(context.env, packageName, args.objectName, args.contentType || 'sql');

    // add package settings as namespace object key (overwrite with user settings if any)
    meta[config.namespace] = _.merge(config.settings, meta[config.namespace]);

    var template = context.env.getTemplate(`${packageName}/${config.template}`);
    context.ctx[refPackageName] = template.error ? undefined : template.tmplStr;

    meta = _.merge(meta, context.ctx);
    cb && cb();
  };
}

function MetaExtension(cb) {
  this.tags = ['meta'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  this.run = function(context, args, cb) {
    let refMetaFileName = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    var metaFileName = args[refMetaFileName];

    var template = context.env.getTemplate(metaFileName);
    context.ctx[refMetaFileName] = template.error
      ? undefined
      : args.objectName
      ? JSON.parse(template.tmplStr)[args.objectName]
      : JSON.parse(template.tmplStr);

    meta = _.merge(meta, context.ctx);
    cb && cb();
  };
}

// Define environment with custom loader
const init = (inputDir, gitRepo, nunjucksOptions) => {
  var env = new nunjucks.Environment(
    [new nunjucks.FileSystemLoader(inputDir), new nunjucks.NodeResolveLoader()],
    nunjucksOptions
  );
  env.addExtension('ImportExtension', new ImportExtension());
  env.addExtension('MetaExtension', new MetaExtension());

  // Usage: {{ datetimeValue | time }}
  env.addFilter('time', function(datetime) {
    return new Date(+datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  // Example 1: Render [code] value
  // {{ code | renderString | safe }}
  // Example 2: Render [code] value with defined context
  // {{ code | renderString ({schemaName: source.schemaName, tableName: source.tableName}) | safe }}
  env.addFilter('renderString', function(text, context) {
    return env.renderString(text, _.merge(meta, context));
  });

  // Example of async filter (similar to `include`-tag)
  // Usage: {{ 'template-name.njk' | render({a: 10, text: 'OK'}) }}
  // env.addFilter('render', function(template, ctx, cb) {
  //   // env.render(template, ctx);
  //   env.render(template, ctx, (err, result) => {
  //     // cb && cb(err, !err ? result : undefined);
  //     cb && cb(err, !err ? env.filters.safe(html) : undefined);
  //   });
  // });

  // {{ 'test2.html' | render({b: 200}) }}
  env.addFilter('render', function(template, ctx) {
    try {
      return env.filters.safe(env.render(template, ctx));
    } catch (err) {
      return err.message;
    }
  });

  env.addFilter('pickBy', function(object, filter, code) {
    // console.log('typeof object', typeof object, '; object instanceof Array', object instanceof Array);
    // console.log('typeof filter', typeof filter, '; filter instanceof Array', filter instanceof Array);
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

      // return res;
      // return object.filter(item => {
      //   return filter.includes(item[code || 'code']);
      // });
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
    // console.log('typeof object', typeof object, '; object instanceof Array', object instanceof Array);
    // console.log('typeof filter', typeof filter, '; filter instanceof Array', filter instanceof Array);
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
