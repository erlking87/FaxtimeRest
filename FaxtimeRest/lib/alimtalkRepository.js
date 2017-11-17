'use strict';

var dbHelper = require('./dbHelper');
var async = require('async');

var result = "";

// 쿼리에 널처리 한다.
module.exports = {
    // 스웨거 스팩상 라우터에서 패스 파라미터는 단일항목만 지원함
    selectSendMsg: function (req, res, id) {
        var args = dbHelper.sqlSelectParameters(req);
        console.log("msg id -> " + args["msgid"]);
        var currentPage = 1;
        //msgid가 들어오면 단건조회 -> 페이지는 뭐가 들어와도 1
	    if(typeof args["msgid"] !== 'undefined' && null != args["msgid"]) {
			currentPage = 1;
		} else {
			currentPage = args["currentPage"];
		}

        // 쿼리
        var sqlText = 
			  " select tbz.* "
			+ " from  ( "
			+ "        select tby.* "
			+ "        from  ( "
			+ "               select row_number() over(order by tbx.reg_dt desc) as seq "
			+ "                    , count('1') over(partition by '1') as totcnt "
			+ "                    , ceiling(row_number() over(order by tbx.reg_dt desc) / convert(numeric, '" + args["pageSize"] + "' ) ) pageidx "
			+ "                    , tbx.* "
			+ "               from  ( "
			+ "                      select * "
			+ "                      from  ( "
			+ "                             select msgid "
			+ "                                  , (select nsid from tbl_altalk_template a "
			+ "                                     where  a.tepl_id = msg.tmpl_id and a.profile = msg.profile) as tmpl_nsid "
			+ "                                  , message_type "
			+ "                                  , code "
			+ "                                  , case when substring(phn,1,2) = '82' then '0' + substring(phn,3,len(phn)-1) else phn end as phn "
			+ "                                  , msg "
			+ "                                  , msg_sms "
			+ "                                  , sms_sender "
			+ "                                  , sms_kind "
			+ "                                  , tmpl_id "
			+ "                                  , profile "
			+ "                                  , convert(varchar(16), reg_dt, 120) as reg_dt "
			+ "                                  , result "
			+ "                                  , (select yellowid from tblyellowid a where a.profile = msg.profile) as yellowid "
			+ "                                  , (select tepl_name from tbl_altalk_template a where a.tepl_id = msg.tmpl_id and a.profile = msg.profile) as tepl_name "
			+ "                                  , datalength(msg_sms) as msg_smsdatalength "
			+ "                                  , datalength(msg) as msgdatalength "
			+ "                             from  ( "
			+ "                                    select msgid,message_type,phn,msg,msg_sms,sms_sender,sms_kind,tmpl_id,profile,reg_dt,'S' as result, 'C' as code "
			+ "                                    from   tbl_request "
			+ "                                    where  convert(varchar(10),reg_dt,120)  between '" + args["fdate"] + "' and '" + args["tdate"] + "' "
			+ "                                    and    profile in (select profile from tblyellowid where ntblusersid = " + args["ntblusersid"] + " and status='02') ";
	                                               if(typeof args["msgid"] !== 'undefined' && null != args["msgid"]) {
			sqlText = sqlText + "                      and    msgid = '" + args["msgid"] + "'";
			                                       }
			sqlText = sqlText + ""
			+ "                                    union all "
			+ "                                    select msgid,message_type,phn,msg,msg_sms,sms_sender,sms_kind,tmpl_id,profile,reg_dt,result,code "
			+ "                                    from   tbl_request_result "
			+ "                                    where  convert(varchar(10),reg_dt,120)  between '" + args["fdate"] + "' and '" + args["tdate"] + "' "
			+ "                                    and    profile in (select profile from tblyellowid where ntblusersid = " + args["ntblusersid"] + " and status='02') ";
	                                               if(typeof args["msgid"] !== 'undefined' && null != args["msgid"]) {
			sqlText = sqlText + "                      and    msgid = '" + args["msgid"] + "'";
			                                       }
			sqlText = sqlText + ""
			+ "                                   ) msg "
			+ "                            ) m "
			+ "                      where  1 = 1 "
			+ "                      and    message_type = '" + args["message_type"] + "' "
			+ "                     ) tbx "
			+ "              ) tby "
			+ "       ) tbz "
			+ " where   pageidx = " + currentPage
			+ " order   by seq asc ";
        console.log(sqlText);
        return dbHelper.sqlSelect(sqlText, res, id);
    },
    // 스웨거 스팩상 라우터에서 패스 파라미터는 단일항목만 지원함
    selectReserveSendMsg: function (req, res, id) {
        var args = dbHelper.sqlSelectParameters(req);
        console.log("user id -> " + args["user"]);
        console.log("msg id -> " + args["msgid"]);
        var currentPage = 1;
        //msgid가 들어오면 단건조회 -> 페이지는 뭐가 들어와도 1
	    if(typeof args["msgid"] !== 'undefined' && null != args["msgid"]) {
			currentPage = 1;
		} else {
			currentPage = args["currentPage"];
		}

        // 쿼리
        var sqlText = 
			  " select tbz.* "
			+ " from  ( "
			+ "        select tby.* "
			+ "        from  ( "
			+ "               select row_number() over(order by tbx.reg_dt desc) as seq "
			+ "                    , count('1') over(partition by '1') as totcnt "
			+ "                    , ceiling(row_number() over(order by tbx.reg_dt desc) / convert(numeric, '" + args["pageSize"] + "' ) ) pageidx "
			+ "                    , tbx.* "
			+ "               from  ( "
			+ "                      select * "
			+ "                      from  ( "
			+ "                             select msgid "
			+ "                                  , (select nsid from tbl_altalk_template a "
			+ "                                     where  a.tepl_id = msg.tmpl_id and a.profile = msg.profile) as tmpl_nsid "
			+ "                                  , message_type "
			+ "                                  , code "
			+ "                                  , case when substring(phn,1,2) = '82' then '0' + substring(phn,3,len(phn)-1) else phn end as phn "
			+ "                                  , msg "
			+ "                                  , msg_sms "
			+ "                                  , sms_sender "
			+ "                                  , sms_kind "
			+ "                                  , tmpl_id "
			+ "                                  , profile "
			+ "                                  , convert(varchar(16), reg_dt, 120) as reg_dt "
			+ "                                  , result "
			+ "                                  , (select yellowid from tblyellowid a where a.profile = msg.profile) as yellowid "
			+ "                                  , (select tepl_name from tbl_altalk_template a where a.tepl_id = msg.tmpl_id and a.profile = msg.profile) as tepl_name "
			+ "                                  , datalength(msg_sms) as msg_smsdatalength "
			+ "                                  , datalength(msg) as msgdatalength "
			+ "                             from  ( "
			+ "                                    select msgid,message_type,phn,msg,msg_sms,sms_sender,sms_kind,tmpl_id,profile,reg_dt,'s' as result, 'c' as code "
			+ "                                    from   tbl_request "
			+ "                                    where  convert(varchar(10),reserve_dt,120)  between '" + args["fdate"] + "' and '" + args["tdate"] + "' "
			+ "                                    and    profile in (select profile from tblyellowid where ntblusersid = " + args["ntblusersid"] + " and status='02') ";
	                                               if(typeof args["msgid"] !== 'undefined' && null != args["msgid"]) {
			sqlText = sqlText + "                      and    msgid = '" + args["msgid"] + "'";
			                                       }
			sqlText = sqlText + ""
			+ "                                   ) msg "
			+ "                            ) m "
			+ "                      where  1 = 1 "
			+ "                      and    message_type = '" + args["message_type"] + "' "
			+ "                     ) tbx "
			+ "              ) tby "
			+ "       ) tbz "
			+ " where   pageidx = " + currentPage
			+ " order   by seq asc ";
        console.log(sqlText);
        return dbHelper.sqlSelect(sqlText, res, id);
    },
    createSendMsg: function (req, res) {
      
		console.log("***************************************");
        var args = dbHelper.sqlSelectParameters(req);
        console.log("user id -> " + args["user"]);
        console.log("agent key -> " + args["agentKey"]);

        // id 즉 패스 파라미터 형식은 지원하지 않는다.
        // 전문본문에 데이터가 없다면 잘못된 요청이다.
        if(!req.body instanceof Array ) {
            return res.send({
                "status" : "400",
                "description" : "잘못된 요청"
            });
        }
        //추가시작
	    //return;
        var sqlText = [];
    	var seqNo = 0;
    	var retSeqNo = "";
        var idx = 0; while(idx < req.body.length) {

	    	var sqlSelText = "select next value for seqrequest as seq;";

			async.waterfall([

				//function(callback) {
				//	console.log("Message Send Start......");
				//    //var gggg = dbHelper.sqlNewSelect(sqlSelText, res);
				//    async.waterfall([
				//    	function(callback) {
				//	    	//var gggg = dbHelper.sqlNewSelect(sqlSelText, res, callback);
				//	    	var gggg = dbHelper.sqlNewSelect1(sqlSelText);
				//	    	//TODO 여기에서 시퀀스만 받음 되는데...
				//	        console.log("~~~~~~~~~~~~~~~~~ -> " + gggg);
				//	    	callback(null, "999999  888888");
				//    	},
				//    	],	function (err, result) {console.log("seqNo end -> " + JSON.stringify(result));}
				//    );
			    //    seqNo++;
			    //    callback(null, seqNo);
				//},
				function(callback) {
					console.log("Message Send Start......");
				    async.waterfall([
				    	function(callback) {
							const moment = require('moment');
							var mm = moment(); // moment를 초기화 한다
							var output = mm.format("YYYYMMDDHHmmssSSS"); // format으로 출력한다
							seqNo = parseInt(output);
					        console.log("~~~~~~~~~~~~~~~~~ -> " + seqNo);
					    	callback(null, seqNo);
				    	},
				    	],	function (err, result) {console.log("seqNo end");}
				    );
			        callback(null, seqNo);
				},
				function(seqNo, callback) {
				    console.log("● 쿼리 만들자 " + seqNo);
				    if(idx == 0) {
				    	retSeqNo = seqNo + "^" + req.body[idx]['orgMsgId'];
				    } else {
				    	retSeqNo = retSeqNo + "," + seqNo + "^" + req.body[idx]['orgMsgId'];
				    }
				    console.log("● 전송쿼리1");
            		sqlText.push(
            		    "  INSERT INTO TBL_REQUEST ( "
            		    + "  MSGID, MESSAGE_TYPE, PHN, "
            		    + "  MSG, MSG_SMS, SMS_SENDER, SMS_KIND, "
            		    + "  TMPL_ID, PROFILE, RESERVE_DT, REG_DT, REMARK1 "
            		    + ") VALUES ( "
            		    //+ "  next value for seqrequest "               // id
            		    + seqNo
            		    + "  , '" + req.body[idx]['message_type'] + "'"
            		    + "  , '" + req.body[idx]['phn'] + "'"
            		    + "  , '" + req.body[idx]['msg'] + "'"
            		    + "  , (case when '" + req.body[idx]['chkBudal'] + "'='T' then '" + req.body[idx]['msgCont01'] + "' else null end) "
            		    + "  , (case when '" + req.body[idx]['chkBudal'] + "'='T' then '" + req.body[idx]['selReplyNum01'] + "' else null end) "
            		    + "  , null "
            		    + "  , '" + req.body[idx]['tmpl_id'] + "'"
            		    + "  , (select profile from tblyellowid where yellowid = '" + req.body[idx]['selYellowId01'] + "' and status = '02') "
            		    + "  , (case when '" + req.body[idx]['chkReserve'] + "'='T' then '" + req.body[idx]['revDttm'] + "' else '00000000000000' end) "
            		    + "  , dbo.getLocalDate(DEFAULT)"
            		    + "  , '" + req.body[idx]['remark1'] + "'"
            		    + ") ;"
            		    );
            		//잔애차감 로직 추가 필요, 그러려면 사용자ID 추가 필요...
					console.log("● 전송쿼리2 -> 잔액차감");
                    sqlText.push(
                        "  UPDATE A SET \n"
                        + "       A.NBALANCE = (A.NBALANCE - (select isnull(( \n"
                        + "          select isnull(nrate,0) \n"
                        + "             from tblinternalrate tir, tbluser tu \n"
                        + "            where tir.vclass = tu.valtclass \n"
                        + "              and tir.ckind = CASE WHEN 'at' = '" + req.body[idx]['message_type'] + "' THEN 'A' ELSE 'C' END \n"
                        + "              and tu.nsid = A.NSID \n"
                        + "           ),0))) \n"
                        + "  FROM TBLUSER A \n"
                        + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                        + "    ON A.NSID=B.NSID \n"
                        + " WHERE B.AGENTID = '" + args["agentKey"] + "' \n"
                        //+ "   AND A.VUSERID='" + args["user"] +"';"
                        + "   AND A.NSID='" + args["user"] +"';"
                    );
			        callback(null);
				}
			],
			function (err, result) {
				console.log("end");
			});

        	++idx;
			console.log("***************************************");
        }
 		var id = "0";
       return dbHelper.sqlExecute(sqlText, retSeqNo, res);
    },

    updateSendMsg: function (req, res, id) {

 		var retSeqNo = "0";
       // 일괄업데이트 즉 id 가 없는것은 지원하지 않는다.
        // 즉 단건도 아니고, 본문(항목명세)도 없다.
        if((typeof id === 'undefined' || null == id)
            && (!req.body instanceof Array)) {
            return res.send({
                "status" : "403",
                "description" : "금지됨"
            });
        }

        var sqlText = [];
        // id가 있으면 본문은 단건에 대한 오브젝트이다.
        if(typeof id !== 'undefined' && null != id) {
            sqlText.push(
                "  UPDATE TBL_REQUEST SET "
                + "  REG_DT = dbo.getLocalDate(DEFAULT) "
                + "  , PHN = '" + req.body['phn'] + "'"
                + "  , MSG = '" + req.body['msg'] + "'"
                + "  , MSG_SMS = (case when '" + req.body['chkBudal'] + "'='T' then '" + req.body['msgCont01'] + "' else null end) "
                + "  , SMS_SENDER = (case when '" + req.body['chkBudal'] + "'='T' then '" + req.body['selReplyNum01'] + "' else null end) "
                + "  , TMPL_ID = '" + req.body['tmpl_id'] + "'"
                + "  , RESERVE_DT = (case when '" + req.body['chkReserve'] + "'='T' then '" + req.body['revDttm'] + "' else '00000000000000' end) "
                + "  , REMARK1 = '" + req.body['remark1'] + "'"
                + " WHERE MSGID = '" + id + "'"
            );
        // 단건이 아니면 여러건이다.
        } else {
            var idx = 0; while(idx < req.body.length) {
                sqlText.push(
                "  UPDATE TBL_REQUEST SET "
                + "  REG_DT = dbo.getLocalDate(DEFAULT) "
                + "  , PHN = '" + req.body[idx]['phn'] + "'"
                + "  , MSG = '" + req.body[idx]['msg'] + "'"
                + "  , MSG_SMS = (case when '" + req.body[idx]['chkBudal'] + "'='T' then '" + req.body[idx]['msgCont01'] + "' else null end) "
                + "  , SMS_SENDER = (case when '" + req.body[idx]['chkBudal'] + "'='T' then '" + req.body[idx]['selReplyNum01'] + "' else null end) "
                + "  , TMPL_ID = '" + req.body[idx]['tmpl_id'] + "'"
                + "  , RESERVE_DT = (case when '" + req.body[idx]['chkReserve'] + "'='T' then '" + req.body[idx]['revDttm'] + "' else '00000000000000' end) "
                + "  , REMARK1 = '" + req.body[idx]['remark1'] + "'"
                + " WHERE MSGID = '" + req.body[idx]["msgid"] + "';"
                );
                ++idx
            }
        }
		return dbHelper.sqlUpdate(sqlText, res);
    },
    deleteSendMsg: function (req, res, id) {
        
		var retSeqNo = "0";
        // 일괄업데이트 즉 id 가 없는것은 지원하지 않는다.
        // 즉 단건도 아니고, 본문(항목명세)도 없다.
        if((typeof id === 'undefined' || null == id)
            && (!req.body instanceof Array)) {
            return res.send({
                "status" : "403",
                "description" : "금지됨"
            });
        }
        
        var sqlText = []; // object or array
        // id가 있으면 본문은 단건에 대한 오브젝트이다.
        if(typeof id !== 'undefined' && null != id) {
           	console.log("단건삭제 " + id);
            sqlText.push(
                "  DELETE FROM TBL_REQUEST "
                + " WHERE MSGID = '" + id + "'"
            );
        } else {
            var idx = 0; while(idx < req.body.length) {
           		console.log("여러건 삭제 " + req.body[idx]["msgid"]);
                sqlText.push(
                "  DELETE FROM TBL_REQUEST "
                + " WHERE MSGID = '" + req.body[idx]["msgid"] + "';"
                );
                ++idx
            }
        }
        
 		return dbHelper.sqlUpdate(sqlText, res);
    }
    /*
    status : "200",
    description : "성공"
    
    2xx (성공)
    200(성공): 서버가 요청을 제대로 처리했다는 뜻이다. 이는 주로 서버가 요청한 페이지를 제공했다는 의미로 쓰인다.
    201(작성됨): 성공적으로 요청되었으며 서버가 새 리소스를 작성했다.
    202(허용됨): 서버가 요청을 접수했지만 아직 처리하지 않았다.
    203(신뢰할 수 없는 정보): 서버가 요청을 성공적으로 처리했지만 다른 소스에서 수신된 정보를 제공하고 있다.
    204(콘텐츠 없음): 서버가 요청을 성공적으로 처리했지만 콘텐츠를 제공하지 않는다.
    205(콘텐츠 재설정): 서버가 요청을 성공적으로 처리했지만 콘텐츠를 표시하지 않는다. 204 응답과 달리 이 응답은 요청자가 문서 보기를 재설정할 것을 요구한다(예: 새 입력을 위한 양식 비우기).
    206(일부 콘텐츠): 서버가 GET 요청의 일부만 성공적으로 처리했다.
    207(다중 상태, RFC 4918)
    208(이미 보고됨, RFC 5842)
    226 IM Used (RFC 3229)
    
    4xx (요청 오류)
    400(잘못된 요청): 서버가 요청의 구문을 인식하지 못했다.
    401(권한 없음): 이 요청은 인증이 필요하다. 서버는 로그인이 필요한 페이지에 대해 이 요청을 제공할 수 있다.
    402(결제 필요): 이 요청은 결제가 필요합니다.
    403(금지됨): 서버가 요청을 거부하고 있다.
    404(찾을 수 없음): 서버가 요청한 페이지를 찾을 수 없다. 예를 들어 서버에 존재하지 않는 페이지에 대한 요청이 있을 경우 서버는 이 코드를 제공한다.
    405(허용되지 않는 방법): 요청에 지정된 방법을 사용할 수 없다.
    406(허용되지 않음): 요청한 페이지가 요청한 콘텐츠 특성으로 응답할 수 없다.
    407(프록시 인증 필요): 이 상태 코드는 401(권한 없음)과 비슷하지만 요청자가 프록시를 사용하여 인증해야 한다. 서버가 이 응답을 표시하면 요청자가 사용할 프록시를 가리키는 것이기도 한다.
    408(요청 시간초과): 서버의 요청 대기가 시간을 초과하였다.
    409(충돌): 서버가 요청을 수행하는 중에 충돌이 발생했다. 서버는 응답할 때 충돌에 대한 정보를 포함해야 한다. 서버는 PUT 요청과 충돌하는 PUT 요청에 대한 응답으로 이 코드를 요청 간 차이점 목록과 함께 표시해야 한다.
    410(사라짐): 서버는 요청한 리소스가 영구적으로 삭제되었을 때 이 응답을 표시한다. 404(찾을 수 없음) 코드와 비슷하며 이전에 있었지만 더 이상 존재하지 않는 리소스에 대해 404 대신 사용하기도 한다. 리소스가 영구적으로 이동된 경우 301을 사용하여 리소스의 새 위치를 지정해야 한다.
    411(길이 필요): 서버는 유효한 콘텐츠 길이 헤더 입력란 없이는 요청을 수락하지 않는다.
    412(사전조건 실패): 서버가 요청자가 요청 시 부과한 사전조건을 만족하지 않는다.
    413(요청 속성이 너무 큼): 요청이 너무 커서 서버가 처리할 수 없다.
    414(요청 URI가 너무 긺): 요청 URI(일반적으로 URL)가 너무 길어 서버가 처리할 수 없다.
    415(지원되지 않는 미디어 유형): 요청이 요청한 페이지에서 지원하지 않는 형식으로 되어 있다.
    416(처리할 수 없는 요청범위): 요청이 페이지에서 처리할 수 없는 범위에 해당되는 경우 서버는 이 상태 코드를 표시한다.
    417(예상 실패): 서버는 Expect 요청 헤더 입력란의 요구사항을 만족할 수 없다.
    418(I'm a teapot, RFC 2324)
    420(Enhance Your Calm, 트위터)
    422(처리할 수 없는 엔티티, WebDAV; RFC 4918)
    423(잠김,WebDAV; RFC 4918)
    424(실패된 의존성, WebDAV; RFC 4918)
    424(메쏘드 실패, WebDAV)
    425(정렬되지 않은 컬렉션, 인터넷 초안)
    426(업그레이드 필요, RFC 2817)
    428(전제조건 필요, RFC 6585)
    429(너무 많은 요청, RFC 6585)
    431(요청 헤더 필드가 너무 큼, RFC 6585)
    444(응답 없음, Nginx)
    449(다시 시도, 마이크로소프트)
    450(윈도 자녀 보호에 의해 차단됨, 마이크로소프트)
    451(법적인 이유로 이용 불가, 인터넷 초안)
    451(리다이렉션, 마이크로소프트)
    494(요청 헤더가 너무 큼, Nginx)
    495(Cert 오류, Nginx)
    496(Cert 없음, Nginx)
    497(HTTP to HTTPS, Nginx)
    499(클라이언트가 요청을 닫음, Nginx)
    
    5xx (서버 오류)
    서버가 유효한 요청을 명백하게 수행하지 못했음을 나타낸다.[1]                                                                                    
                                                                                                                                                    
    500(내부 서버 오류): 서버에 오류가 발생하여 요청을 수행할 수 없다.                                                                              
    501(구현되지 않음): 서버에 요청을 수행할 수 있는 기능이 없다. 예를 들어 서버가 요청 메소드를 인식하지 못할 때 이 코드를 표시한다.               
    502(불량 게이트웨이): 서버가 게이트웨이나 프록시 역할을 하고 있거나 또는 업스트림 서버에서 잘못된 응답을 받았다.                                
    503(서비스를 사용할 수 없음): 서버가 오버로드되었거나 유지관리를 위해 다운되었기 때문에 현재 서버를 사용할 수 없다. 이는 대개 일시적인 상태이다.
    504(게이트웨이 시간초과): 서버가 게이트웨이나 프록시 역할을 하고 있거나 또는 업스트림 서버에서 제때 요청을 받지 못했다.                         
    505(HTTP 버전이 지원되지 않음): 서버가 요청에 사용된 HTTP 프로토콜 버전을 지원하지 않는다.                                                      
    506(Variant Also Negotiates, RFC 2295)                                                                                                          
    507(용량 부족, WebDAV; RFC 4918)                                                                                                                
    508(루프 감지됨, WebDAV; RFC 5842)                                                                                                              
    509(대역폭 제한 초과, Apache bw/limited extension)                                                                                              
    510(확장되지 않음, RFC 2774)                                                                                                                    
    511(네트워크 인증 필요, RFC 6585)                                                                                                               
    598(네트워크 읽기 시간초과 오류, 알 수 없음)                                                                                                    
    599(네트워크 연결 시간초과 오류, 알 수 없음)
    
    */
};