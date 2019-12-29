var nunjucks = require('nunjucks');
const { readFileSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
var _ = require('lodash');

const getConfig = require('../helpers/package').getConfig;
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

// Define environment with custom loader
const init = (inputDir, gitRepo, nunjucksOptions) => {
  var env = new nunjucks.Environment(
    [new nunjucks.FileSystemLoader(inputDir), new nunjucks.NodeResolveLoader()],
    nunjucksOptions
  );
  env.addExtension('ImportExtension', new ImportExtension());

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
  env.addFilter('render', function(template, ctx, cb) {
    // env.render(template, ctx);
    env.render(template, ctx, (err, result) => {
      // cb && cb(err, !err ? result : undefined);
      cb && cb(err, !err ? env.filters.safe(html) : undefined);
    });
  });

  return env;
};

exports.init = init;
