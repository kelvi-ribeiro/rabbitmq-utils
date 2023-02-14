const fs = require('fs');
require("dotenv").config();

const createDir = (path) =>
    fs.mkdirSync(path, { recursive: true }, () => { });

const removeDir = (path) =>
    fs.rm(path, { recursive: true, force: true }, () => { });

const appendFile = (path, responseContent) =>
    fs.appendFileSync(path, responseContent, { flags: 'a' });

module.exports = { 
    createDir,
    removeDir,
    appendFile
}