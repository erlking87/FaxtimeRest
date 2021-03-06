'use strict';

var repository = require('../../../../lib/faxtimeMmsRepository');

module.exports = {
    get: function FAXTIME_SDK_MMS_SEND_GET(req, res) {
        repository.selectSendMsg(req, res);
    },
    post: function FAXTIME_SDK_MMS_SEND_POST(req, res) {
        repository.createSendMsg(req, res);
    },
    put: function FAXTIME_SDK_MMS_SEND_PUT(req, res) {
        repository.updateSendMsg(req, res);
    },
    delete: function FAXTIME_SDK_MMS_SEND_DELETE(req, res) {
        repository.deleteSendMsg(req, res);
    }
};
