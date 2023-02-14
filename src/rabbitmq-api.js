require("dotenv").config();
const axios = require('axios');

const rabbitMqQueue = process.env.RABBITMQ_QUEUE;
const baseUrl = process.env.RABBITMQ_API_BASE_URL;
const authorizationToken = process.env.RABBITMQ_API_AUTHORIZATION_TOKEN;
const vhost = process.env.RABBITMQ_API_V_HOST;

const getQueueMessages = (requestMessagesLength, requeueMessages) => {
    const data = JSON.stringify({
        vhost,
        name: rabbitMqQueue,
        ackmode: 'ack_requeue_' + requeueMessages,
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
        data
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
    funcs = messages.map(m => {
        return () => publishMessage(m)
    })
    while (funcs.length) {
        await Promise.all(funcs.splice(0, process.env.RABBTMQ_MAXIMUM_PUBLICATION_REQUESTS).map(f => f()))
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

module.exports = {
    getQueueMessages,
    getQueueMessagesCount,
    publishMessages,
    publishMessage
}
