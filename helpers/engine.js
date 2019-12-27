var nunjucks = require('nunjucks');
// var rp = require('request-promise-native');
const axios = require('axios');
var env;

const instance = axios.create({
  baseURL: 'https://raw.githubusercontent.com/trra/dw-templates/master/',
  timeout: 1000,
  headers: { 'content-type': 'application/octet-stream', pragma: 'no-cache', 'cache-control': 'no-cache' }
});

// Define custom async loader
var UrlLoader = nunjucks.Loader.extend({
  async: false,
  getSource: function(path, cb) {
    instance
      .get(path)
      // fetch('https://raw.githubusercontent.com/trra/dw-templates/master/' + path)
      // rp({
      //   method: 'GET',
      //   uri: 'https://raw.githubusercontent.com/trra/dw-templates/master/' + path,
      //   headers: { 'content-type': 'application/octet-stream' }
      // })
      // .then(res => res.text())
      .then(src => cb(null, { src, path, noCache: false }))
      .catch(cb);
  }
});

// Define custom tag "get" to load remote data by url to var
// Example:
// {% get book = '/api/books/10' %}
// {{ book.id }} {{ book.name }}
function GetExtension(cb) {
  this.tags = ['get'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  this.run = function(context, args, cb) {
    let ref = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    var url = args[ref];
    // var headers = { pragma: 'no-cache', 'cache-control': 'no-cache' };

    // rp({
    //   method: 'GET',
    //   uri: 'https://raw.githubusercontent.com/trra/dw-templates/master/' + url,
    //   headers: { headers }
    // })
    instance
      .get(url)
      // .then(res => res.json())
      .then(function(res) {
        if (res.error) console.error(url, res.error);

        context.ctx[ref] = res.error ? undefined : res;
        cb && cb();
      })
      .catch(cb);
  };
}

// Define custom tag "get" to load remote data by url to var
// Example:
// {% get book = '/api/books/10' %}
// {{ book.id }} {{ book.name }}
function ImportExtension(cb) {
  this.tags = ['require'];

  this.parse = function(parser, nodes, lexer) {
    var tok = parser.nextToken();
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args, cb);
  };

  this.run = function(context, args, cb) {
    let ref = args instanceof Object && Object.keys(args).filter(e => e != '__keywords')[0];
    var url = args[ref];

    var tmpl = context.env.getTemplate(url);
    const res = tmpl.tmplStr;
    context.ctx[ref] = res.error ? undefined : res;
    cb && cb();

    // instance
    //   .get(url)
    //   // .then(res => res.json())
    //   .then(function(res) {
    //     if (res.error) console.error(url, res.error);

    //     context.ctx[ref] = res.error ? undefined : res;
    //     cb && cb();
    //   })
    //   .catch(cb);
  };
}

// Define environment with custom loader
const init = (inputDir, nunjucksOptions) => {
  env = new nunjucks.Environment(
    [new nunjucks.FileSystemLoader(inputDir), new nunjucks.NodeResolveLoader()],
    nunjucksOptions
  );
  env.addExtension('GetExtension', new GetExtension());
  env.addExtension('ImportExtension', new ImportExtension());
  // Example of async filter (similar to `include`-tag)
  // Usage: {{ 'template-name.njk' | render({a: 10, text: 'OK'}) }}
  env.addFilter(
    'render',
    function(template, ctx, cb) {
      env.render(template, ctx, (err, html) => cb && cb(err, !err ? env.filters.safe(html) : undefined));
    },
    true
  );

  // Example of sync filter
  env.addFilter('time', function(datetime) {
    return new Date(+datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  env.addFilter('fetch', function(text, context) {
    return env.renderString(text, context);
  });

  return env;
};

// var env = new nunjucks.Environment([new nunjucks.FileSystemLoader(inputDir), new nunjucks.NodeResolveLoader()], nunjucksOptions);
// var env = new nunjucks.Environment(new UrlLoader(), { autoescape: true });

exports.init = init;
// exports.config = config;
