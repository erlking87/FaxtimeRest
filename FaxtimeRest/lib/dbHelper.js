'use strict';

var dbConfig = require('./dbConfig');
var sql = require('mssql');
var fs = require('fs');
var dateFormat = require('dateformat');
var objAsync = require('async');

var LogWriter = function(sqlText) {
    if (!fs.existsSync("./log")){
        fs.mkdirSync("./log");
    } else {
        var stats = fs.lstatSync("./log");
        if (!stats.isDirectory())
            fs.mkdirSync("./log");
    }
    fs.appendFile("./log/" + dateFormat(new Date(), "yyyy-mm-dd") + ".log", "\n\n" + sqlText, function (err) {
        //if (err) throw err;
        //console.log('Saved!');
    });
};

exports.sqlLogWriter = LogWriter;
/*exports.sqlOptions = {
    "pageSize" : 10
};

exports.sqlDecode = function (id, object, defaultValue) {
    if(typeof id === "undefined" || null == id
        || typeof object === "undefined" || null == object
    ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
    if(typeof object[id] === "undefined" || null == object[id]
    ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
    return object[id];
}*/

exports.sqlSelectParameters = function(req) {
    var
        result = {}
        , findObject = function (id, object, defaultValue) {
            if(typeof id === "undefined" || null == id
                || typeof object === "undefined" || null == object
            ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
            if(typeof object[id] === "undefined" || null == object[id]
            ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
            return object[id];
        };

    result["agentKey"] = req.get("Agent-Key") || "";
    result["user"] = findObject("user", req.query, null);
    result["pageSize"] = 10;
    result["currentPage"] = findObject("page", req.query, 1);
    //////////////////////////////////////////////////////////
    result["fdate"] = findObject("fdate", req.query, null);
    result["tdate"] = findObject("tdate", req.query, null);
    result["ntblusersid"] = findObject("ntblusersid", req.query, null);
    result["message_type"] = findObject("message_type", req.query, null);
    result["msgid"] = findObject("msgid", req.query, null);
    //////////////////////////////////////////////////////////
    result["startIndex"] = (result["currentPage"] - 1) * result["pageSize"] + 1;
    result["endIndex"] = result["currentPage"] * result["pageSize"];
    return result;
}

exports.sqlNewSelect = function (sqlText, res, id, callback) {

    LogWriter(sqlText);
    console.log("QUERY -> " + sqlText);

    objAsync.waterfall([
        function (callback) {
            console.log("DB Connection Start ....");
            //var gggg = dbHelper.sqlNewSelect(sqlSelText, res);
            //TODO 여기에서 시퀀스만 받음 되는데...
            const pool = new sql.ConnectionPool(dbConfig, err => {
                pool.request().query(sqlText, (err, result) => {
                    // 에러인 경우 빈객체로 리턴한다.
                    if (typeof err !== 'undefined' && null != err) {
                        console.log("ERROR@@@ -> " + err);
                        return;
                    }
                    var val = {};
                    val["status"] = (0 == result.rowsAffected[0]) ? "204" : "200";
                    val["description"] = (0 == result.rowsAffected[0]) ? "콘텐츠 없음" : "성공";
                    val["affected"] = result.rowsAffected[0];
                    if (typeof id !== 'undefined' && null != id) {
                        // 결과가 없을때 에러난다.
                        val["datas"] = (0 < result.rowsAffected[0]) ? result.recordset[0] : null;

                    } else {
                        val["datas"] = (0 < result.rowsAffected[0]) ? result.recordsets[0] : [];
                    }
                    console.log("Sequence Cpmplete !!!!!" + JSON.stringify(result.recordset[0]));
                    return 123456789;
                });
                console.log("DB Connection OK !!!");
            });
            pool.on('error', err => {
                console.log("DB Connect ERROR");
                return;
            });
            //pool.request().query(sqlText, (err, result) => {
            //    // 에러인 경우 빈객체로 리턴한다.
            //    if(typeof err !== 'undefined' && null != err) {
            //        return res.send({
            //                "status" : "500",
            //                "description" : "내부 서버 오류"
            //        });
            //    }
            //    var val = {};
            //    val["status"] = (0 == result.rowsAffected[0]) ? "204" : "200";
            //    val["description"] = (0 == result.rowsAffected[0]) ? "콘텐츠 없음" : "성공";
            //    val["affected"] = result.rowsAffected[0];
            //    if(typeof id !== 'undefined' && null != id) {
            //        // 결과가 없을때 에러난다.
            //        val["datas"] = (0 < result.rowsAffected[0]) ? result.recordset[0] : null;
            //        
            //    } else {
            //        val["datas"] = (0 < result.rowsAffected[0]) ? result.recordsets[0] : [];
            //    }
            //    console.log("Sequence Cpmplete !!!!!");
            //    return 123456789;
            //    //callback(123456789);
            //});
            console.log("DB Connect Complete");


            callback(null, callback);
        }
    ], function (err, result) { console.log("seq end ===> " + err); }
    );
};

exports.sqlSelect = function (sqlText, res, id) {

    LogWriter(sqlText);

    const pool = new sql.ConnectionPool(dbConfig, err => {
        pool.request()
            .query(sqlText, (err, result) => {
                // 에러인 경우 빈객체로 리턴한다.
                if(typeof err !== 'undefined' && null != err) {
                    console.log(err);
                    return res.send({
                        "status" : "500",
                        "description" : "내부 서버 오류"
                    });
                }
                var val = {};
                val["status"] = (0 == result.rowsAffected[0]) ? "204" : "200";
                val["description"] = (0 == result.rowsAffected[0]) ? "콘텐츠 없음" : "성공";
                val["affected"] = result.rowsAffected[0];
                if(typeof id !== 'undefined' && null != id) {
                    // 결과가 없을때 에러난다.
                    val["datas"] = (0 < result.rowsAffected[0]) ? result.recordset[0] : null;

                } else {
                    val["datas"] = (0 < result.rowsAffected[0]) ? result.recordsets[0] : [];
                }
                return res.send(val);
            });
    });
    pool.on('error', err => {
        console.log(err);
        return res.send({
            "status": "500",
            "description": "내부 서버 오류"
        });
    });
};

exports.sqlExecute = function (sqlText, seqNo, res) {
    var affected = 0;
    const pool = new sql.ConnectionPool(dbConfig, err => {
        const transaction = new sql.Transaction(pool);
        transaction.begin(err => {
            if (typeof err !== 'undefined' && null != err) {
                return res.send({
                    "status": "500",
                    "description": "내부 서버 오류0000"
                });
            }
            const request = new sql.Request(transaction);
            function done() {
                transaction.commit(err => {
                    if (typeof err !== 'undefined' && null != err) {
                        return res.send({
                            "status": "500",
                            "description": "내부 서버 오류1111"
                        });
                    }
                    return res.send({
                        "msgIds": ((0 == affected) ? "0" : seqNo),
                        "status": ((0 == affected) ? "204" : "200"),
                        "description": ((0 == affected) ? "콘텐츠 없음" : "성공"),
                        "affected": affected
                    });
                });
            }
            var nextItem = function (i) {
                if (i >= sqlText.length) {
                    // All done
                    done();
                    return;
                } else {
                    //console.log("Insert Query -> " + sqlText[i]);
                    LogWriter(sqlText[i]);
                    request.query(sqlText[i], (err, result) => {
                        if (typeof err !== 'undefined' && null != err) {
                            //console.log("Insert Query err -> " + err);
                            transaction.rollback(err => {
                                return res.send({
                                    "status": "500",
                                    "description": "내부 서버 오류2222"
                                });
                            });
                            return;
                        }
                        affected = affected + result.rowsAffected[0];
                        nextItem(i + 1);
                    });
                }
            }
            nextItem(0);
        });
    });

    pool.on('error', err => {
        return res.send({
            "status" : "500",
            "description": "내부 서버 오류3333"
        });
    });
};


exports.sqlUpdate = function (sqlText, res) {
    var affected = 0;
    const pool = new sql.ConnectionPool(dbConfig, err => {
        const transaction = new sql.Transaction(pool);
        transaction.begin(err => {
            if(typeof err !== 'undefined' && null != err) {
                return res.send({
                    "status" : "500",
                    "description": "내부 서버 오류0000"
                });
            }
            const request = new sql.Request(transaction);
            function done() {
                transaction.commit(err => {
                    if(typeof err !== 'undefined' && null != err) {
                        return res.send({
                            "status" : "500",
                            "description" : "내부 서버 오류1111"
                        });
                    }
                    return res.send({
                        "status" : ((0 == affected) ? "204" : "200"),
                        "description" : ((0 == affected) ? "콘텐츠 없음" : "성공"),
                        "affected" : affected
                    });
                });
            }
            var nextItem = function(i) {
                if (i >= sqlText.length) {
                    // All done
                    done();
                    return;
                } else {
                    //console.log("Insert Query -> " + sqlText[i]);
                    LogWriter(sqlText[i]);
                    request.query(sqlText[i], (err, result) => {
                        if(typeof err !== 'undefined' && null != err) {
                            //console.log("Insert Query err -> " + err);
                            transaction.rollback(err => {
                                return res.send({
                                    "status" : "500",
                                    "description" : "내부 서버 오류2222"
                                });
                            });
                            return;
                        }
                        affected = affected + result.rowsAffected[0];
                        nextItem(i + 1);
                    });
                }
            }
            nextItem(0);
        });
    });

    pool.on('error', err => {
        return res.send({
            "status" : "500",
            "description" : "내부 서버 오류3333"
        });
    });
};

exports.sqlNewSelect1 = function (sqlText) {

    LogWriter(sqlText);
    console.log("QUERY -> " + sqlText);
    var val = {};
    val["status111"] = "200";

    const pool = new sql.ConnectionPool(dbConfig, err => {
        pool.request().query(sqlText, (err, result) => {
            // 에러인 경우 빈객체로 리턴한다.
            if (typeof err !== 'undefined' && null != err) {
                return "188 ERROR";
            }
            //var val = {};
            val["status"] = (0 == result.rowsAffected[0]) ? "204" : "200";
            val["description"] = (0 == result.rowsAffected[0]) ? "콘텐츠 없음" : "성공";
            val["affected"] = result.rowsAffected[0];
            if (typeof id !== 'undefined' && null != id) {
                // 결과가 없을때 에러난다.
                val["datas"] = (0 < result.rowsAffected[0]) ? result.recordset[0] : null;

            } else {
                val["datas"] = (0 < result.rowsAffected[0]) ? result.recordsets[0] : [];
            }
            //return val;
            if (err) {
                val["status111"] = "ERROR";
                //return "ERROR";
                return JSON.stringify(val);
                // 결과가 없을때 에러난다.

            } else {
                val["status111"] = "OK";
                //return "ERROR";
                return JSON.stringify(val);
            }
            return JSON.stringify(val);
        });
    });
    pool.on('err', err => {
        val["status111"] = "ERROR####";
        //return "ERROR";
        return JSON.stringify(val);
    });

    return JSON.stringify(val);
};

