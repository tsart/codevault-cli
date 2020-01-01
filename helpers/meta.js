const { readFileSync, readdirSync, unlinkSync, rmdirSync } = require('fs');
const { parse } = require('path');

const getMeta = (env, metaFileName, objectName, type) => {
  // console.log('metaFileName', metaFileName);
  let item;
  try {
    let meta = JSON.parse(env.getTemplate(metaFileName).tmplStr);
    return meta;
  } catch (error) {
    throw `Error loading [${metaFileName}]: ${error}`;
  }
};

exports.getMeta = getMeta;
