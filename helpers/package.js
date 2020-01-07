const { readFileSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
const { parse } = require('path');

const getConfig = (env, packageName, objectName, type) => {
  // console.log('packageName', packageName);
  let item;
  try {
    item = 'package.json';
    let package = JSON.parse(env.getTemplate(`${packageName}/${item}`).tmplStr);
    if (!package.main) throw `"main" attribute is not defined in ${item}`;

    let mainTemplate = objectName ? `${objectName}.${type}` : package.main;
    item = mainTemplate;
    // console.warn('item', item);
    main = env.getTemplate(`${packageName}/${mainTemplate}`);

    // let configFile = String(package.main).replace(parse(mainTemplate).ext, '.json');
    item = 'module.context.json';
    let config = JSON.parse(env.getTemplate(`${packageName}/${item}`).tmplStr);
    if (!config.namespace) throw `"namespace" attribute is not defined in [${item}]`;

    return {
      namespace: config.namespace,
      dbType: config.dbType || 'SQL',
      template: String(mainTemplate).replace(parse(mainTemplate).ext, '.' + type),
      settings: config.settings
    };
  } catch (error) {
    throw `Error loading [${packageName}]: [${item}] ${error}`;
  }
};

exports.getConfig = getConfig;
