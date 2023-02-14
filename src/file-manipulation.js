const fs = require('fs');
const path = require('path');
require("dotenv").config();
const rabbitMqQueue = process.env.RABBITMQ_QUEUE;

const createTempDir = () =>
    fs.mkdir(__dirname + path.sep + ".temp", { recursive: true }, () => { });

const removeTempDir = () =>
    fs.rm(__dirname + path.sep + ".temp", { recursive: true, force: true }, () => { });

const appendFile = (responseContent) =>
    fs.appendFileSync(`${__dirname}${path.sep}.temp${path.sep}${rabbitMqQueue}-messages.txt`, responseContent, { flags: 'a' });

module.exports = { 
    createTempDir,
    removeTempDir,
    appendFile
}