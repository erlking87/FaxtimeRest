'use strict';

 var repository = require('../../../../../lib/faxtimeSmsRepository');

 module.exports = {
     get: function FAXTIME_SDK_SMS_SEND_GETBYID(req, res) {
         repository.selectSendMsg(req, res, req.params['id']);
     },
     put: function FAXTIME_SDK_SMS_SEND_PUTBYID(req, res) {
         repository.updateSendMsg(req, res, req.params['id']);
     },
     delete: function FAXTIME_SDK_SMS_SEND_DELETEBYID(req, res) {
         repository.deleteSendMsg(req, res, req.params['id']);
     }
 };
