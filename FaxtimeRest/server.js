'use strict';

var port = process.env.PORT || 8000; // first change
//var port = 8000;
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var swaggerize = require('swaggerize-express');
var swaggerUi = require('swaggerize-ui'); // second change
var path = require('path');

var multer = require('multer');
//var storage = multer.memoryStorage()
//var upload = multer({ storage: storage })
var upload = multer({ dest: 'uploads/' });
var repository = require('./lib/fileRepository');

var app = express();

var server = http.createServer(app);


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.post('/v1/others/file/upload', upload.single('file'), (req, res, next) => {
    repository.uploadFile(req, res, next);
});

app.use(swaggerize({
    api: path.resolve('./config/swagger.json'), // third change
    handlers: path.resolve('./handlers'),
    docspath: '/swagger' // fourth change
}));

// change four
app.use('/docs', swaggerUi({
    docs: '/swagger'
}));

server.listen(port, function () { // fifth and final change
    console.log("start server port : " + port);
    server.timeout = 6000000000;
});

app.get('/', (req, res) => {
    console.log("/start");
    res.send('api server\n');
});

app.post('/v1/sender/sms', (req, res) => {
    var userIP = getUserIP(req);

    var id = req.body.id;
    var pw = req.body.pw;
    var token = req.body.token;

    console.log("id : " + req.body.id);
    console.log("pw : " + req.body.pw);
    console.log("token : " + req.body.token);
    console.log("userIp : " + userIP);

    if (id != null && pw != null && token != null) {

        let result = {
            "code": "success",
            "data": null,
            "message": null
        }

        res.json(result);
    } else {

        let result = {
            "code": "fail",
            "data": null,
            "message": "invalid message"
        }

        res.json(result);
    }

});

app.get('/v1', function (req, res) {
    console.log(req.params.id);
    return res.send('test');
});


/*
var http = require('http');
var port = process.env.port || 1337;
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);
*/



function getUserIP(req) {
    var ipAddress;

    if (!!req.hasOwnProperty('sessionID')) {
        ipAddress = req.headers['x-forwarded-for'];
    } else {
        if (!ipAddress) {
            var forwardedIpsStr = req.header('x-forwarded-for');

            if (forwardedIpsStr) {
                var forwardedIps = forwardedIpsStr.split(',');
                ipAddress = forwardedIps[0];
            }
            if (!ipAddress) {
                ipAddress = req.connection.remoteAddress;
            }
        }
    }
    return ipAddress;
}
