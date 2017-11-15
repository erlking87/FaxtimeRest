/*
    실서버
*/
var dbConfig = {
    user: 'faxtime',
    password: 'test2016!',
    server: 'faxtimedb.database.windows.net',
    //database: 'faxtimeApiTest',
    database: 'faxtime01',
    connectionTimeout: 300000000,
    requestTimeout: 300000000,
    options: {
        encrypt: true
    }
};

/*
    테스트서버
*/
/*
var dbConfig = {
    user: 'taiho',
    password: 'xkdlgh123!',
    server: '150.1.4.61',
    database: 'ufws01',
    options: {
        encrypt: true
    }
};
*/

module.exports = dbConfig;
