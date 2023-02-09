var axios = require('axios');
let path = require('path');
const fs = require('fs');
require("dotenv").config();
var os = require("os");
const rabbitMqQueue = process.env.RABBITMQ_QUEUE;
const baseUrl = process.env.RABBITMQ_API_BASE_URL;
const authorizationToken = process.env.RABBITMQ_API_AUTHORIZATION_TOKEN;
const vhost = process.env.RABBITMQ_API_V_HOST;

const main = async () => {
    await createTempDir();
    const { data: { backing_queue_status: { len: queueLength } } } = await getQueueMessagesCount();
    const { data: messages } = await getQueueMessages(queueLength);
    const responseContent = messages.map(d => JSON.stringify(JSON.parse(d.payload))).join(os.EOL);
    appendFile(responseContent);
    await removeTempDir();
};

const createTempDir = () =>
    fs.mkdir(__dirname + path.sep + ".temp", { recursive: true }, () => { });

const removeTempDir = () =>
    fs.rm(__dirname + path.sep + ".temp", { recursive: true, force: true }, () => { });

const appendFile = (responseContent) =>
    fs.appendFileSync(`${__dirname}${path.sep}.temp${path.sep}${rabbitMqQueue}-messages.txt`, responseContent, { flags: 'a' });

const getQueueMessages = (requestMessagesLength) => {
    const data = JSON.stringify({
        vhost,
        name: rabbitMqQueue,
        truncate: 50000,
        ackmode: 'ack_requeue_true',
        encoding: 'auto',
        count: requestMessagesLength,
    });

    const config = {
        method: 'post',
        url: `${baseUrl}/api/queues/${process.env.RABBITMQ_API_V_HOST}/${rabbitMqQueue}/get`,
        headers: {
            'authorization': 'Basic ' + authorizationToken,
            'x-vhost': ''
        },
        data: data
    };

    return axios(config);
};

const getQueueMessagesCount = () => {
    const config = {
        method: 'GET',
        url: `${baseUrl}/api/queues/${process.env.RABBITMQ_API_V_HOST}/${rabbitMqQueue}`,
        headers: {
            'authorization': 'Basic ' + authorizationToken,
            'x-vhost': ''
        },
    };

    return axios(config);
};

main();