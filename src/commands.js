const rabbitmqApi = require('./rabbitmq-api');
require("dotenv").config();
require("./string-extensions");

const moveMessages = async () => {
    const { data: { backing_queue_status: { len: queueLength } } } = await rabbitmqApi.getQueueMessagesCount();

    let loopTimes = 1;

    if (queueLength > process.env.RABBITMQ_MAX_MESSAGES_FETCH) {
        loopTimes = Math.ceil(queueLength / process.env.RABBITMQ_MAX_MESSAGES_FETCH);
    }

    for (let index = 0; index < loopTimes; index++) {
        let { data: messages } = await rabbitmqApi.getQueueMessages(process.env.RABBITMQ_MAX_MESSAGES_FETCH, true);
        messages = messages.map(d => d.payload);
        await rabbitmqApi.publishMessages(messages);
        await rabbitmqApi.getQueueMessages(process.env.RABBITMQ_MAX_MESSAGES_FETCH, false);
    }
}

module.exports = {
    moveMessages
}
