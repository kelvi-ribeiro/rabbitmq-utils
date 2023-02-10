var axios = require('axios');
let path = require('path');
const fs = require('fs');
require("dotenv").config();
var os = require("os");
const rabbitMqQueue = process.env.RABBITMQ_QUEUE;
const baseUrl = process.env.RABBITMQ_API_BASE_URL;
const authorizationToken = process.env.RABBITMQ_API_AUTHORIZATION_TOKEN;
const vhost = process.env.RABBITMQ_API_V_HOST;
const maxGetMessagesCount = 1000;
const main = async () => {
    await createTempDir();
    const { data: { backing_queue_status: { len: queueLength } } } = await getQueueMessagesCount();
    let loopTimes = 1

    if (queueLength > maxGetMessagesCount) {
        loopTimes = Math.ceil(queueLength / maxGetMessagesCount);
    }

    for (let index = 0; index < loopTimes; index++) {
        let { data: messages } = await getQueueMessages(maxGetMessagesCount);
        messages = messages.map(d => d.payload)
        const responseContent = messages.map(d => {
            if (isJson(d)) {
                return JSON.stringify(JSON.parse(d));
            }
            return d;
        }).join(os.EOL);
        appendFile(responseContent);
        await publishMessages(messages);
    }
    removeTempDir()
};

const createTempDir = () =>
    fs.mkdir(__dirname + path.sep + ".temp", { recursive: true }, () => { });

const removeTempDir = () =>
    fs.rm(__dirname + path.sep + ".temp", { recursive: true, force: true }, () => { });

const appendFile = (responseContent) =>
    fs.appendFileSync(`${__dirname}${path.sep}.temp${path.sep}${rabbitMqQueue}-messages.txt`, responseContent, { flags: 'a' });

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const getQueueMessages = (requestMessagesLength) => {
    const data = JSON.stringify({
        vhost,
        name: rabbitMqQueue,
        ackmode: 'ack_requeue_false',
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

const publishMessages = async (messages) => {
    for (const key in messages) {
        await publishMessage(messages[key]);
    }
}

const publishMessage = (message) => {
    const data = JSON.stringify({
        vhost: process.env.RABBITMQ_API_V_HOST,
        name: "amq.default",
        properties: { "delivery_mode": 1, "headers": {} },
        routing_key: process.env.RABBITMQ_QUEUE_TO,
        headers: {},
        payload_encoding: "string",
        delivery_mode: "1",
        props: {},
        payload: message
    })

    const config = {
        method: 'POST',
        url: `${baseUrl}/api/exchanges/${process.env.RABBITMQ_API_V_HOST}/amq.default/publish`,
        headers: {
            'authorization': 'Basic ' + authorizationToken,
            'x-vhost': ''
        },
        data
    };

    return axios(config);
};


main();