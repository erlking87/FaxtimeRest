'use strict';

 var repository = require('../../../lib/alimtalkRepository');

 module.exports = {
     get: function ALIMTALK_RESERVE_TBL_REQUEST_GET(req, res) {
     	 console.log("GGGGGG");
         repository.selectReserveSendMsg(req, res);
     }
 };
