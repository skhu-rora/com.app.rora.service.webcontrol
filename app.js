/**
 * service      :   com.app.rora.service.webcontrol
 * type         :   JSService
 * date         :   2020.09.02
 * author       :   소찬영(RORA PM)
 * description  :   공유 모빌리티 제어를 위한 사용자 웹컨트롤러 서비스
 */

var pkgInfo = require('./package.json');
var Service = require('webos-service');
var express = require('express');
var luna = require('./luna');
var app = express();
var utils = require('./utils');
var http = require('http').createServer(app);
var router = require('./routes/main')(app, utils);
var shareRouter = require('./routes/share');
var jarvisIoT = require('./routes/iot');
var env = require('./env/env.json');
var bodyparser = require('body-parser');
var session = require('express-session');

var msg = "null";

var service = new Service(pkgInfo.name);
var keepAlive;
service.activityManager.create("keepAlive", function(activity){
  keepAlive = activity;
});

// 사고 발생 시 구조요청 서비스
service.register("help_call", function(message){
  var type = message.payload.type;
  utils.help_request(type);

  message.respond({
    returnValue: true,
    helpType: type
  });
});

// 차량 인증 상태 확인하는 서비스
service.register("get_auth", function(message){
  var auth = utils.get_auth();

  if(!auth)
    auth = false;
  message.respond({
    returnValue: true,
    auth: auth
  });
});

// 카메라 서버에 얼굴인식을 요청
service.register("request_camera", function(message){
  var socketio = utils.socket;
  var socketio_client = utils.io_client;
  utils.request_camera(socketio, socketio_client);
  utils.toast_to_webOS("페이스 인증 시작");

  message.respond({
    returnValue: true
  });
});

// 차량 인증이 성공할 경우 인증완료 처리하는 서비스
service.register("set_auth", function(message){
  var value = message.payload.value;
  utils.set_auth(value);

  message.respond({
    returnValue: true,
  });
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

app.use('/share', shareRouter);
app.use('/iot', jarvisIoT);

var server = http.listen(env.port, function(){
  console.log("Express server has started on port [" + env.port + " ]");
  utils.init(service, http);
});