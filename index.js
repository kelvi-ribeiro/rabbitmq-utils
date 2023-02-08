var axios = require('axios');
let path = require('path');
const fs = require('fs');
require("dotenv").config();
var os = require("os");
const rabbitMqQueue = process.env.RABBITMQ_QUEUE
const baseUrl = process.env.RABBITMQ_API_BASE_URL
const authorizationToken = process.env.RABBITMQ_API_AUTHORIZATION_TOKEN

function main() {
    getQueueMessages()
        .then(function (response) {
            responseContent = response.data.map(d => JSON.stringify(JSON.parse(d.payload))).join(os.EOL)
            appendFile(responseContent)
        })
}

function appendFile(responseContent) {
    fs.appendFileSync(`${__dirname}${path.sep}${rabbitMqQueue}-messages.txt`, responseContent, { flags: 'w' })
}

function getQueueMessages() {
    var data = `{"vhost":"/","name":"${rabbitMqQueue}","truncate":"50000","ackmode":"ack_requeue_true","encoding":"auto","count":"10"}`
    var config = {
        method: 'post',
        url: `${baseUrl}/api/queues/%2F/${rabbitMqQueue}/get`,
        headers: {
            'authorization': 'Basic ' + authorizationToken,
            'x-vhost': ''
        },
        data: data
    };

    return axios(config)
}


main()
