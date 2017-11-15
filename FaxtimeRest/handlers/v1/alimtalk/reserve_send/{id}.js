'use strict';

 var repository = require('../../../../lib/alimtalkRepository');

 module.exports = {
     get: function ALIMTALK_TBL_REQUEST_GETBYID(req, res) {
         repository.selectSendMsg(req, res, req.params['id']);
     },
     put: function ALIMTALK_TBL_REQUEST_PUTBYID(req, res) {
         repository.updateSendMsg(req, res, req.params['id']);
     },
     delete: function ALIMTALK_TBL_REQUEST_DELETEBYID(req, res) {
         repository.deleteSendMsg(req, res, req.params['id']);
     }
 };
