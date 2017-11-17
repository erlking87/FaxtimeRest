'use strict';

var dbConfig = require('./dbConfig');
var sql = require('mssql');
var fs = require('fs');
var dateFormat = require('dateformat');

var LogWriter = function (sqlText) {
    if (!fs.existsSync("./log")) {
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

exports.sqlSelectParameters = function (req) {
    var
        result = {}
        , findObject = function (id, object, defaultValue) {
            if (typeof id === "undefined" || null == id
                || typeof object === "undefined" || null == object
            ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
            if (typeof object[id] === "undefined" || null == object[id]
            ) return (typeof defaultValue === "undefined") ? "" : defaultValue;
            return object[id];
        };

    result["agentKey"] = req.get("Agent-Key") || "";
    result["user"] = findObject("user", req.query, null);
    result["pageSize"] = 10;
    result["currentPage"] = findObject("page", req.query, 1);
    result["startIndex"] = (result["currentPage"] - 1) * result["pageSize"] + 1;
    result["endIndex"] = result["currentPage"] * result["pageSize"];
    return result;
}

exports.sqlSelect = function (sqlText, res, id) {

    LogWriter(sqlText);

    const pool = new sql.ConnectionPool(dbConfig, err => {
        pool.request()
            .query(sqlText, (err, result) => {
                // 에러인 경우 빈객체로 리턴한다.
                if (typeof err !== 'undefined' && null != err) {
                    return res.send({
                        "status": "500",
                        "description": "내부 서버 오류"
                    });
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
                return res.send(val);
            });
    });
    pool.on('error', err => {
        return res.send({
            "status": "500",
            "description": "내부 서버 오류"
        });
    });
};

exports.sqlExecute = function (sqlText, res) {
    var affected = 0;
    const pool = new sql.ConnectionPool(dbConfig, err => {
        const transaction = new sql.Transaction(pool);
        transaction.begin(err => {
            if (typeof err !== 'undefined' && null != err) {
                return res.send({
                    "status": "500",
                    "description": "내부 서버 오류"
                });
            }
            const request = new sql.Request(transaction);
            function done() {
                transaction.commit(err => {
                    if (typeof err !== 'undefined' && null != err) {
                        return res.send({
                            "status": "500",
                            "description": "내부 서버 오류"
                        });
                    }
                    return res.send({
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
                    LogWriter(sqlText[i]);
                    request.query(sqlText[i], (err, result) => {
                        if (typeof err !== 'undefined' && null != err) {
                            transaction.rollback(err => {
                                return res.send({
                                    "status": "500",
                                    "description": "내부 서버 오류"
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
            "status": "500",
            "description": "내부 서버 오류"
        });
    });
};