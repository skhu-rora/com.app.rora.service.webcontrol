/**
 * service      :   com.app.rora.service.webcontrol
 * type         :   JSService
 * date         :   2020.09.20
 * author       :   소찬영(RORA PM)
 * description  :   생체인증 정보를 통해 웹에서 로그인 처리를 하는 라이브러리 정의
 */

var luna = require('./luna');
var fs = require('fs');
var env = require('./env/env.json');
var dbconfig = require('./env/dbConfig');
var querystring = require('querystring');
var mysql = require('mysql');
var utils = require('./utils');
var auth_session = {};
var conn;

var dbOptions = {
    host: dbconfig.host,
    port: dbconfig.port,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database
};

// face 인증 후 커스텀 세션을 활용한 로그인 처리 함수
function jarvis_login(auth_data){
    var results;
    var socketio = utils.io;
    conn = mysql.createConnection(dbOptions);

    conn.connect();

    var userid = auth_data.userid;
    var login_sql = 'SELECT * FROM jarvis_member where jarvis_id=?';
    conn.query(login_sql, [userid], function(error, query_results) {
        if(error) throw error;

        else{
            results = query_results;
            auth_session.userid = results[0].jarvis_id;
            auth_session.username = results[0].member_name;
            auth_session.car_owned = results[0].car_owned;
            utils.set_auth(auth_session.username);
            utils.tts(auth_session.username + "님 인증되었습니다");
        }
    });
    conn.end();

    socketio.emit('login_signal', {});
}

// 커스텀세션을 활용한 로그아웃 로직
function jarvis_logout(){
    var socketio = utils.io;

    utils.tts("서비스 로그아웃");

    auth_session.userid = "";
    auth_session.username = "";
    auth_session.car_owned = "";
    if(auth_session.shareid) auth_session.shareid = "";

    utils.set_auth("");

    socketio.emit('logout_signal', {});
}

exports.dbOptions = dbOptions;
exports.conn = conn;
exports.jarvis_login = jarvis_login;
exports.jarvis_logout = jarvis_logout;
exports.auth_session = auth_session;