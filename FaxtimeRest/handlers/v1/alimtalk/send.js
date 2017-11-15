'use strict';

 var repository = require('../../../lib/alimtalkRepository');

 module.exports = {
     get: function ALIMTALK_TBL_REQUEST_GET(req, res) {
         repository.selectSendMsg(req, res);
     },
     post: function ALIMTALK_TBL_REQUEST_POST(req, res) {
		 //console.log(">>>>>>>[send.js] " + JSON.stringify(req.body));
         repository.createSendMsg(req, res);
     },
     put: function ALIMTALK_TBL_REQUEST_PUT(req, res) {
         repository.updateSendMsg(req, res);
     },
     delete: function ALIMTALK_TBL_REQUEST_DELETE(req, res) {
         repository.deleteSendMsg(req, res);
     }
 };
