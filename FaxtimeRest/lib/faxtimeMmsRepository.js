'use strict';

var dbHelper = require('./dbHelper');
var dbConfig = require('./dbConfig');
var sql = require('mssql');

// 쿼리에 널처리 한다.
module.exports = {
    // 스웨거 스팩상 라우터에서 패스 파라미터는 단일항목만 지원함
    selectSendMsg: function (req, res, id) {
        var args = dbHelper.sqlSelectParameters(req);
        var sqlText = 
            "  WITH ORDERD_DATA AS ( \n"
            + "    SELECT RANK() OVER(ORDER BY MSG_ID DESC) ROWID \n"
            + "           , MSG_ID id \n"
            + "           , USER_ID ntblusersid \n"
            + "           , CASE SCHEDULE_TYPE WHEN 1 THEN 'T' ELSE 'F' END chkReserve \n"
            + "           , SUBJECT sTitle \n"
            + "           , MMS_MSG vmessage \n"
            + "           , SEND_DATE revDttm \n"
            + "           , CALLBACK vsourcetel \n"
            + "           , SUBSTRING(CONVERT(VARCHAR(80),DEST_INFO), 0, CHARINDEX('^', DEST_INFO)) vreceiver \n"
            + "           , SUBSTRING(CONVERT(VARCHAR(80),DEST_INFO), CHARINDEX('^', DEST_INFO) + 1, LEN(CONVERT(VARCHAR(80),DEST_INFO)) - CHARINDEX('^', DEST_INFO)) vdestinationtel \n"
            + "           , CONTENT_COUNT file_cnt \n"
            + "           , CONTENT_DATA file_path \n"
            + "           , RESERVED8 msgRate \n"
            + "           , " + args["currentPage"] + " CURRENT_PAGE \n"
            + "           , COUNT(*) OVER() TOTAL_COUNT \n"            
            + "  FROM SDK_MMS_SEND \n"
            + " WHERE USER_ID in ( \n"
            + "     SELECT CAST(NSID AS VARCHAR)  \n"
            + "	      FROM TBL_RESTAPI_USER \n"
            + "	     WHERE AGENTID = '" + args["agentKey"] + "' \n";
        if(null != args["user"]) {
            sqlText = sqlText
            + "        AND VUSERID='" + args["user"] +"' \n";
        }
            sqlText = sqlText
            + "   ) \n";
        if(typeof id !== 'undefined' && null != id) {
            sqlText = sqlText
            + "   AND MSG_ID='" + id +"' \n";
        }
            sqlText = sqlText
            + ")  \n"
            + "SELECT A.id \n"
            + "       ,A.ntblusersid \n"
            + "       ,(SELECT VUSERID FROM TBL_RESTAPI_USER WHERE NSID=A.ntblusersid) \"user\" \n"
            + "       ,A.chkReserve \n"
            + "       ,A.sTitle \n"
            + "       ,A.vmessage \n"
            + "       ,A.revDttm \n"
            + "       ,A.vsourcetel \n"
            + "       ,A.vreceiver \n"
            + "       ,A.vdestinationtel \n"
            + "       ,A.file_cnt \n"
            + "       ,A.file_path \n"
            + "       ,A.msgRate \n"
            + "       ,A.CURRENT_PAGE currentPage \n"
            + "       ,A.TOTAL_COUNT totalCount \n"
            + "       , ((TOTAL_COUNT / " + args["pageSize"] + ") + \n"
            + "           (CASE WHEN 0 < (TOTAL_COUNT % " + args["pageSize"] + ") THEN \n"
            + "                  1 \n"
            + "              ELSE 0 END)) AS totalPage \n"
            + "  FROM ORDERD_DATA A  \n"
            + " WHERE ROWID BETWEEN " + args["startIndex"] + " AND " + args["endIndex"] + "\n";
        return dbHelper.sqlSelect(sqlText, res, id);
    },
    createSendMsg: function (req, res) {
        
        // id 즉 패스 파라미터 형식은 지원하지 않는다.
        // 전문본문에 데이터가 없다면 잘못된 요청이다.
        if(!req.body instanceof Array ) {
            return res.send({
                "status" : "400",
                "description" : "잘못된 요청"
            });
        }
        
        var sqlBalance = "WITH AMT AS (";
        var sqlText = [];
        var agentKey = req.get("Agent-Key") || "";
        var user = req.query["user"];
        console.log("req.body.length -> " + req.body.length);
        var idx = 0; while(idx < req.body.length) {
            //if(0 != idx) sqlBalance = sqlBalance + "UNION ALL ";
            //sqlBalance = sqlBalance
            sqlBalance = "WITH AMT AS ("
                + "SELECT (select isnull(( \n"
                + "           select isnull(nrate,0) \n"
                + "             from tblinternalrate tir, tbluser tu \n"
                + "            where tir.vclass = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN tu.vmmsclass ELSE tu.vlmsclass END \n"
                + "              and tir.ckind = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN 'M' ELSE 'L' END \n"
                + "              and tu.nsid = A.NSID \n"
                + "           ),0)) AMTp \n"
                + "  FROM TBL_RESTAPI_USER A \n"
                + " WHERE A.AGENTID = '" + agentKey + "' \n"
                + "   AND A.VUSERID = '" + user +"' \n";
            sqlText.push(
                "  INSERT INTO SDK_MMS_SEND ( \n"
                + "  MSG_ID, USER_ID, SCHEDULE_TYPE, \n"
                + "  SUBJECT, NOW_DATE, SEND_DATE, CALLBACK, \n"
                + "  DEST_COUNT, DEST_INFO, MSG_TYPE, MMS_MSG, \n"
                + "  CONTENT_COUNT, CONTENT_DATA, \n"
                + "  RESERVED7, RESERVED8, RESERVED9 \n"
                + ") \n"
                + "SELECT next value for dbo.mms_msg_seq \n"               // id
                + "  , A.NSID \n"
                + "  , case when '" + req.body[idx]['chkReserve'] + "'='T' then '1' else '0' end \n"
                + "  , '" + req.body[idx]['sTitle'] + "' \n"
                + "  , CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') \n"
                + "  , (case when '" + req.body[idx]['chkReserve'] + "'='T' then REPLACE(REPLACE(REPLACE('" + req.body[idx]['revDttm'] + "','-',''), ' ',''),':','') else CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') end ) \n"
                + "  , '" + req.body[idx]['vsourcetel'] + "' \n"
                + "  , 1 \n"
                + "  , '" + req.body[idx]['vreceiver'] + "^" + req.body[idx]['vdestinationtel'] + "' \n"
                + "  , 0 \n"
                + "  , '" + req.body[idx]['vmessage'] + "' \n"
                + "  , " + req.body[idx]['file_cnt'] + " \n"
                + "  , '" + req.body[idx]['file_path'] + "' \n"
                + "  , next value for dbo.seqmmsheader \n"
                + "  , (select isnull(( \n"
                + "     select isnull(nrate,0) \n"
                + "        from tblinternalrate tir, tbluser tu \n"
                + "       where tir.vclass = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN tu.vmmsclass ELSE tu.vlmsclass END \n"
                + "         and tir.ckind = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN 'M' ELSE 'L' END \n"
                + "         and tu.nsid = A.NSID \n"
                + "      ),0)) \n"
                + "  , 'F' \n"
                + "  FROM TBL_RESTAPI_USER A \n"
                + " WHERE A.AGENTID = '" + agentKey + "' \n"
                + "   AND A.VUSERID='" + user +"';"
            );
            sqlText.push(
                "  UPDATE A SET \n"
                + "       A.NBALANCE = (A.NBALANCE - (select isnull(( \n"
                + "          select isnull(nrate,0) \n"
                + "             from tblinternalrate tir, tbluser tu \n"
                + "            where tir.vclass = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN tu.vmmsclass ELSE tu.vlmsclass END \n"
                + "              and tir.ckind = CASE WHEN 0 < " + req.body[idx]['file_cnt'] + " THEN 'M' ELSE 'L' END \n"
                + "              and tu.nsid = A.NSID \n"
                + "           ),0))) \n"
                + "  FROM TBLUSER A \n"
                + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                + "    ON A.NSID=B.NSID \n"
                + " WHERE B.AGENTID = '" + agentKey + "' \n"
                + "   AND A.VUSERID='" + user +"';"
            );
            ++idx
        }
        
        sqlBalance = sqlBalance 
                + ") \n"
                + "SELECT CASE WHEN 0 > (B.NBALANCE - (SELECT SUM(AMTp) FROM AMT)) THEN 'F' ELSE 'T' END CAN\n"
                + "  FROM TBL_RESTAPI_USER A \n"
                + "       ,TBLUSER B \n"
                + " WHERE A.AGENTID = '" + agentKey + "' \n"
                + "   AND A.VUSERID='" + user +"' \n"
                + "   AND A.NSID=B.NSID \n"
                + "   AND B.CPREPAID='T' \n";
                
        const pool = new sql.ConnectionPool(dbConfig, err => {
            const request = pool.request();
            dbHelper.sqlLogWriter(sqlBalance);
       	    console.log("sqlBalance -> " + sqlBalance);
            request.query(sqlBalance, (err, result) => {
                if(typeof err !== 'undefined' && null != err) {
               	    console.log("내부 서버 오류111 -> " + err);
                    return res.send({
                        "status" : "500",
                        "description" : "내부 서버 오류111"
                    });
                }
                try {
                    var target = (typeof result === "undefined" || null == result
                        || typeof result.recordsets == 'undefined' || null == result.recordsets
                        || 1 > result.recordsets.length) ? null : result.recordset[0];
                    if(typeof target !== "undefined" && (null != target) && ("F" == target["CAN"])) {
                        return res.send({
                            "status" : "402",
                            "description" : "결제 필요"
                        });
                    }
                    return dbHelper.sqlExecute(sqlText, res);
                }
                catch (exception) {
                	  console.log(exception);
                }
            });
        });
        pool.on('error', err => {
            console.log("내부 서버 오류222 -> " + err);
            return res.send({
                "status" : "500",
                "description" : "내부 서버 오류222"
            });
        });
    },
    updateSendMsg: function (req, res, id) {
        
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
        var agentKey = req.get("Agent-Key") || "";
        if(typeof id !== 'undefined' && null != id) {
            sqlText.push(
                "  UPDATE A SET \n"
                + "       NOW_DATE = CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') \n"
                + "       , SEND_DATE = (case when '" + req.body['chkReserve'] + "'='T' then REPLACE(REPLACE(REPLACE('" + req.body['chkReserve'] + "','-',''), ' ',''),':','') else CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') end ) \n"
                + "       , SCHEDULE_TYPE = case when '" + req.body['revDttm'] + "'='T' then '1' else '0' end \n"
                + "       , SUBJECT = '" + req.body['sTitle'] + "' \n"
                + "       , MMS_MSG = '" + req.body['vmessage'] + "' \n"
                + "       , CONTENT_COUNT = '" + req.body['file_cnt'] + "' \n"
                + "       , CONTENT_DATA = '" + req.body['file_path'] + "' \n"
                + "       , CALLBACK = '" + req.body['vsourcetel'] + "' \n"
                + "       , DEST_INFO = '" + req.body['vreceiver'] + "^" + req.body['vdestinationtel'] + "' \n"
                + "  FROM SDK_MMS_SEND AS A \n"
                + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                + "    ON A.USER_ID = B.NSID \n"
                + " WHERE A.MSG_ID = '" + id + "' \n"
                + "   AND B.AGENTID = '" + agentKey + "' \n"
                + ((null == req.body["user"]) ? "" : ("   AND B.VUSERID='" + req.body["user"] +"' \n"))
            );
        // 단건이 아니면 여러건이다.
        } else {
            var idx = 0; while(idx < req.body.length) {
                sqlText.push(
                "  UPDATE A SET \n"
                + "       NOW_DATE = CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') \n"
                + "       , SEND_DATE = (case when '" + req.body[idx]['chkReserve'] + "'='T' then REPLACE(REPLACE(REPLACE('" + req.body[idx]['revDttm'] + "','-',''), ' ',''),':','') else CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 112) + REPLACE(CONVERT(CHAR(8), dbo.getLocalDate(DEFAULT), 108), ':', '') end ) \n"
                + "       , SCHEDULE_TYPE = case when '" + req.body[idx]['chkReserve'] + "'='T' then '1' else '0' end \n"
                + "       , SUBJECT = '" + req.body[idx]['sTitle'] + "' \n"
                + "       , MMS_MSG = '" + req.body[idx]['vmessage'] + "' \n"
                + "       , CONTENT_COUNT = '" + req.body[idx]['file_cnt'] + "' \n"
                + "       , CONTENT_DATA = '" + req.body[idx]['file_path'] + "' \n"
                + "       , CALLBACK = '" + req.body[idx]['vsourcetel'] + "' \n"
                + "       , DEST_INFO = '" + req.body[idx]['vreceiver'] + "^" + req.body[idx]['vdestinationtel'] + "' \n"
                + "  FROM SDK_MMS_SEND AS A \n"
                + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                + "    ON A.USER_ID = B.NSID \n"
                + " WHERE A.MSG_ID = '" + req.body[idx]["id"] + "' \n"
                + "   AND B.AGENTID = '" + agentKey + "' \n"
                + ((null == req.body[idx]["user"]) ? "" : ("   AND B.VUSERID='" + req.body[idx]["user"] +"' \n"))
                );
                ++idx
            }
        }
        return dbHelper.sqlExecute(sqlText, res, id);
    },
    deleteSendMsg: function (req, res, id) {
        
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
        var agentKey = req.get("Agent-Key") || "";
        // id가 있으면 본문은 단건에 대한 오브젝트이다.
        if(typeof id !== 'undefined' && null != id) {
            sqlText.push(
                "  UPDATE A SET \n"
                + "       A.NBALANCE=(A.NBALANCE + B.RESERVED8) \n"
                + "  FROM TBLUSER A \n"
                + " INNER JOIN SDK_MMS_SEND B \n"
                + "    ON A.NSID=B.USER_ID \n"
                + " WHERE B.MSG_ID=" + id
                );
            sqlText.push(
                "  DELETE A \n"
                + "  FROM SDK_MMS_SEND AS A \n"
                + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                + "    ON A.USER_ID = B.NSID \n"
                + " WHERE A.MSG_ID = '" + id + "' \n"
                + "   AND B.AGENTID = '" + agentKey + "' \n"
                + ((null == req.body["user"]) ? "" : ("   AND B.VUSERID='" + req.body["user"] +"' \n"))
            );
        } else {
            var idx = 0; while(idx < req.body.length) {
                sqlText.push(
                "  UPDATE A SET \n"
                + "       A.NBALANCE=(A.NBALANCE + B.RESERVED8) \n"
                + "  FROM TBLUSER A \n"
                + " INNER JOIN SDK_MMS_SEND B \n"
                + "    ON A.NSID=B.USER_ID \n"
                + " WHERE B.MSG_ID=" + req.body[idx]["id"]
                );
                sqlText.push(
                "  DELETE A \n"
                + "  FROM SDK_MMS_SEND A \n"
                + " INNER JOIN TBL_RESTAPI_USER AS B \n"
                + "    ON A.USER_ID = B.NSID \n"
                + " WHERE A.MSG_ID = '" + req.body[idx]["id"] + "' \n"
                + "   AND B.AGENTID = '" + agentKey + "' \n"
                + ((null == req.body[idx]["user"]) ? "" : ("   AND B.VUSERID='" + req.body[idx]["user"] +"' \n"))
                );
                ++idx
            }
        }
        return dbHelper.sqlExecute(sqlText, res, id);
    },
    selectSendResult: function (req, res) {
        var args = dbHelper.sqlSelectParameters(req);
        var id = (typeof req.query !== "undefined") ? req.query["id"] : null;
        var sqlText = 
            "  WITH ORDERD_DATA AS ( \n"
            + "    SELECT RANK() OVER(ORDER BY MSG_ID DESC) ROWID \n"
            + "           , MSG_ID id \n"
            + "           , USER_ID ntblusersid \n"
            + "           , JOB_ID \n"
            + "           , CASE SCHEDULE_TYPE WHEN 1 THEN 'T' ELSE 'F' END chkReserve \n"
            + "           , SUBJECT sTitle \n"
            + "           , MMS_MSG vmessage \n"
            + "           , SEND_DATE revDttm \n"
            + "           , CALLBACK vsourcetel \n"
            + "           , SUBSTRING(CONVERT(VARCHAR(80),DEST_INFO), 0, CHARINDEX('^', DEST_INFO)) vreceiver \n"
            + "           , SUBSTRING(CONVERT(VARCHAR(80),DEST_INFO), CHARINDEX('^', DEST_INFO) + 1, LEN(CONVERT(VARCHAR(80),DEST_INFO)) - CHARINDEX('^', DEST_INFO)) vdestinationtel \n"
            + "           , CONTENT_COUNT file_cnt \n"
            + "           , CONTENT_DATA file_path \n"
            + "           , RESERVED8 msgRate \n"
            + "           , SUCC_COUNT \n"
            + "           , FAIL_COUNT \n"
            + "           , " + args["currentPage"] + " CURRENT_PAGE \n"
            + "           , COUNT(*) OVER() TOTAL_COUNT \n"     
            + "      FROM SDK_MMS_REPORT \n"
            + "     WHERE USER_ID in ( \n"
            + "         SELECT CAST(NSID AS VARCHAR)  \n"
            + "	          FROM TBL_RESTAPI_USER \n"
            + "	         WHERE AGENTID = '" + args["agentKey"] + "' \n";
        if(null != args["user"]) {
            sqlText = sqlText
            + "            AND VUSERID='" + args["user"] +"' \n";
        }
            sqlText = sqlText
            + "       ) \n";
        if(typeof id !== 'undefined' && null != id) {
            sqlText = sqlText
            + "   AND MSG_ID='" + id +"' \n";
        }
            sqlText = sqlText
            + ")  \n"
            + "SELECT A.id \n"
            + "       ,A.ntblusersid \n"
            + "       ,(SELECT VUSERID FROM TBL_RESTAPI_USER WHERE NSID=A.ntblusersid) \"user\" \n"
            + "       ,A.chkReserve \n"
            + "       ,A.sTitle \n"
            + "       ,A.vmessage \n"
            + "       ,A.revDttm \n"
            + "       ,A.vreceiver \n"
            + "       ,A.vdestinationtel \n"
            + "	      ,A.vsourcetel \n"
            + "	      ,A.msgRate "
            + "	      ,A.SUCC_COUNT succCount "
            + "	      ,A.FAIL_COUNT FailCount "
            + "       ,A.file_cnt \n"
            + "       ,A.file_path \n"
            + "       ,A.CURRENT_PAGE currentPage \n"
            + "       ,A.TOTAL_COUNT totalCount \n"
            + "       , ((TOTAL_COUNT / " + args["pageSize"] + ") + \n"
            + "           (CASE WHEN 0 < (TOTAL_COUNT % " + args["pageSize"] + ") THEN \n"
            + "                  1 \n"
            + "              ELSE 0 END)) AS totalPage \n"
            + "  FROM ORDERD_DATA A  \n"
            + " WHERE ROWID BETWEEN " + args["startIndex"] + " AND " + args["endIndex"] + "\n";
        
        const pool = new sql.ConnectionPool(dbConfig, err => {
            const request = pool.request();
            var datas = null;
            function done() {
                return res.send({
                    "status" : "200",
                    "description" : "성공",
                    "affected" : (!datas instanceof Array ? 1 : datas.length),
                    "datas" : datas
                });
            }
            function clone(o) {
                var ret = {};
                Object.keys(o).forEach(function (val) {
                    ret[val] = o[val];
                });
                return ret;
            }
            var nextItem = function(i) {
                // 예외처리
                if(null == datas) {
                    return res.send({
                        "status" : "500",
                        "description" : "내부 서버 오류"
                    });
                }
                // 처리완료
                if((0 < i && !datas instanceof Array)
                    || (i >= datas.length)) {
                    // All done
                    done();
                    return;
                } else {
                    var row = null;
                    try {
                        row = (datas instanceof Array) ? datas[i] : datas;
                    }catch (exception) {
                        nextItem(i + 1);
                        return;
                    }
                    var sqlQuery = 
                        "  SELECT SEND_DATE revDttm \n"
                        + "       , DEST_NAME \n"
                        + "       , PHONE_NUMBER \n"
                        + "       , RESULT \n"
                        + "       , TCS_RESULT \n"
                        + "       , FEE \n"
                        + "       , DELIVER_DATE \n"
                        + "       , MOBILE_INFO \n"
                        + "       , STATUS_TEXT \n"
                        + "       , READ_TIME \n"
                        + "  FROM SDK_MMS_REPORT_DETAIL "
                        + " WHERE MSG_ID=" + row.id
                    ;
                    request.query(sqlQuery, (err, result) => {
                        if(typeof err !== 'undefined' && null != err) {
                            return res.send({
                                "status" : "500",
                                "description" : "내부 서버 오류"
                            });
                        }
    
                        try {
                            row.target = (typeof result === "undefined" || null == result
                                || typeof result.recordsets == 'undefined' || null == result.recordsets
                                || 1 > result.recordsets.length) ? [] : result.recordsets[0].slice();
                        }
                        catch (exception) {
                        	  console.log(exception);
                        }
                        
                        nextItem(i + 1);
                    });
                }
            }
            dbHelper.sqlLogWriter(sqlText);
            request.query(sqlText, (err, result) => {
                // 에러인 경우 빈객체로 리턴한다.
                if(typeof err !== 'undefined' && null != err) {
                    return res.send({
                            "status" : "500",
                            "description" : "내부 서버 오류"
                    });
                }
                
                if(0 == result.rowsAffected[0]) {
                  return res.send({
                      "status" : "204",
                      "description" : "콘텐츠 없음"
                  });
                }
                
                if(typeof id !== 'undefined' && null != id) {
                    datas = (0 < result.rowsAffected[0]) ? clone(result.recordset[0]) : null;
                } else {
                    datas = (0 < result.rowsAffected[0]) ? result.recordsets[0].slice() : [];
                }
                nextItem(0);
            });
        });
        pool.on('error', err => {
            return res.send({
                "status" : "500",
                "description" : "내부 서버 오류"
            });
        });
    }
};