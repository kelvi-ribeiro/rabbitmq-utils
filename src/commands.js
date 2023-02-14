const rabbitmqApi = require('./rabbitmq-api');
const fm = require('./file-manipulation');
const path = require('path');
const os = require("os");
require("dotenv").config();
require("./string-extensions");
const currentDate = new Date();
const rabbitMqQueue = process.env.RABBITMQ_QUEUE;

const moveMessages = async () => {
    const { data: { backing_queue_status: { len: queueLength } } } = await rabbitmqApi.getQueueMessagesCount();

    let loopTimes = 1;

    if (queueLength > process.env.RABBITMQ_MAX_MESSAGES_FETCH) {
        loopTimes = Math.ceil(queueLength / process.env.RABBITMQ_MAX_MESSAGES_FETCH);
    }

    for (let index = 0; index < loopTimes; index++) {
        let { data: messages } = await rabbitmqApi.getQueueMessages(process.env.RABBITMQ_MAX_MESSAGES_FETCH);
        messages = messages.map(d => d.payload);
        if (process.env.SAVE_MOVED_MESSAGES_ON_DISK) {
            await saveMessagesOnDisk(messages)
        }
        await rabbitmqApi.publishMessages(messages);
        await rabbitmqApi.clearQueueMessages(process.env.RABBITMQ_MAX_MESSAGES_FETCH);
    }
}

const saveMessagesOnDisk = async (messages) => {
    const workplacePath = os.homedir() + path.sep + "rabbit-utils" + path.sep + "saved-messages";
    fm.createDir(workplacePath)
    const responseContent = messages.map(d => {
        if (d.isJson()) {
            return JSON.stringify(JSON.parse(d));
        }
        return d;
    }).join(os.EOL);
    fm.appendFile(`${workplacePath}${path.sep}${rabbitMqQueue}-${currentDate.getTime()}`, responseContent);
}

module.exports = {
    moveMessages
}
