var express = require('express');
var auth_lib = require('../auth');
var router = express.Router();
var jarvisModel = require('../models/jarvisModel');
var jarvisController = require('../controller/jarvisController');
var utils = require('../utils');

var jarvis_session = auth_lib.auth_session;

router.get('/', function (req, res) {
    if (jarvis_session.userid) {
        let userid = jarvis_session.userid;
        jarvisModel.getJarvisMember(userid, (result) => {
            let shareChecked = {
                card_registered: result[0].card_registered,
                license_registered: result[0].license_registered
            }
            res.render('carshare', { session: jarvis_session, shareChecked: shareChecked});
        });
    }
    else {
        res.redirect('/window');
    }
});
router.post('/', function(req, res) {
    if(jarvis_session.userid) {
        let data = {
            start_time : new Date().getTime(),
            start_coordinate : req.body.start_coordinate,
            share_status: 'rent'
        }
        jarvisModel.insertShareHistoryList(jarvis_session.userid, data, result => {
            if(!result.msg) {
                jarvis_session.shareid = result.insertId;
                utils.tts('카 쉐어링 시작합니다.');
                res.redirect('/dashboard');
            } else {
                res.send(result.msg);
            }
        });
    } else {
        res.redirect('/window');
    }
})

router.get('/license', function (req, res) {
    if (jarvis_session.userid) {
        res.render('drivinglicense', {session: jarvis_session});
    } else {
        res.redirect('/window');
    }
    
});
router.post('/license', function (req, res) {
    if(jarvis_session.userid) {
        let userid = jarvis_session.userid;
        let data = {
            license_number: jarvisController.concatLicenseNumber(req.body),
            license_class: req.body.license_class
        };
        jarvisModel.insertDrivingLicenseInfo(userid, data, result => {
            if(!result[0].msg) {
                res.redirect('/share');
            } else {
                res.send(result.msg);
            }
        });
        
        
    } else {
        res.redirect('/window');
    }
});

router.get('/card', function (req, res) {
    if (jarvis_session.userid) {
        res.render('cardregistration', { session: jarvis_session });
    } else {
        res.redirect('/window');
    }
});
router.post('/card', function (req, res) {
    if(jarvis_session.userid) {
        let userid = jarvis_session.userid;
        let data = {
            card_num: jarvisController.concatCardNumber(req.body),
            expiration_date: jarvisController.concatExpirationDate(req.body),
            CVC: req.body.CVC,
            card_password: req.body.card_password
        }
        jarvisModel.insertCreditCardInfo(userid, data, result => {
            if(!result[0].msg) {
                res.redirect('/share');
            } else {
                res.send(result.msg);
            }
        });
    } else {
        res.redirect('/window');
    }
});

router.get('/end', function(req, res) {
    if(jarvis_session.shareid) {
        let coord = {
            "Ga":127.058622,
            "Ha":37.513036
        }
        let data = {
            end_time : new Date().getTime(),
            end_coordinate: JSON.stringify(coord),
            share_status: 'return'
        }
        jarvisModel.updateShareHistoryList(jarvis_session.shareid, data, result => {
            if(result.msg) {
                res.send(result.msg);
            } else {
                res.redirect('/share/payment');
            }
        });
    } else {
        res.redirect('/window');
    }
});

router.get('/payment', function(req, res) {
    if (jarvis_session.shareid) {
        jarvisModel.getShareHistory(jarvis_session.shareid, result => {
            if(result.msg) {
                res.send(result.msg);
            } else {
                let result_data = result[0];
                let distance = 27.2;
                let start_time = result_data.start_time;
                let end_time = result_data.end_time;
                let start_coordinate = result_data.start_coordinate.replace(/(\s*)/g, "");
                let end_coordinate = result_data.end_coordinate.replace(/(\s*)/g, "");


                var data = {
                    start_time: start_time,
                    end_time: end_time,
                    diff_time: jarvisController.getTimeStringSeconds((end_time - start_time) / 1000),
                    distance: distance,
                    Surcharge: (distance * 150)
                };

                var data2 = {
                    start_coordinate: start_coordinate,
                    end_coordinate: end_coordinate
                }
                
                jarvisModel.getJarvisMember(jarvis_session.userid, result => {
                    if(result.member_point) {
                        data.member_point = result.member_point
                    } else{
                        data.member_point = 0;
                    }
                    
                    res.render('sharepayment', {session : jarvis_session, data:data, data2:JSON.stringify(data2)});
                });

                
            }
            
        });
    } else {
        res.redirect('/window');
    }
});

router.get('/accident', (req, res) => {
    let data=[];
    for(let i=0; i<5; i++) {
        data[i] = {
            title   : '2020-10-0'+i,
            content : `Eu enim ullamco mollit consequat eiusmod duis ad.
            Ullamco deserunt incididunt ex ullamco laboris.
            Ipsum aliqua velit non tempor mollit in Lorem cillum pariatur consectetur qui dolore.
            Velit mollit ea duis ea veniam anim officia.
            Non aliquip incididunt ullamco commodo officia aliquip proident culpa fugiat mollit laborum quis minim exercitation.`            
        }
    }
    res.render('accidenthistory', {session:{userid:'scy', username:'미스터배'}, data:data});
});

router.get('/payment/success', (req, res) => {
    
    res.render('sharepaymentsuccess', {session:{userid:'scy', username:'미스터배'}});
});

router.get('/lend', function(req, res){
    if(jarvis_session.userid){
        res.render('lend', {session: jarvis_session});
    }
    else {
        res.redirect('/window');
    }
});

router.post('/lend', function(req, res){
    if(jarvis_session.userid && req.body.hour && req.body.minute){
        var hour = req.body.hour;
        var time = req.body.minute;
        var am_pm = req.body.am_pm;
        var ment;

        if(am_pm == "AM") ment = "오전" + hour + "시"+ time + "분 부터 내차를 공유합니다"
        if(am_pm == "PM") ment = "오후" + hour + "시"+ time + "분 부터 내차를 공유합니다"

        utils.tts(ment);
        res.redirect('/dashboard');
    } 
    else {
        res.redirect('lend');
    }
});

module.exports = router;
