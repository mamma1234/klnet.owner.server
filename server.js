'use strict';
const createError = require('http-errors');
const express = require("express");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
//const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
//const auth = require('basic-auth');
require('dotenv').config();
//const cookieSession = require('cookie-session');
const localUser = require('./models/localUser');
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const imageRouter = require('./routes/image');
// const { sequelize } = require('./models');
const passportConfig = require('./passport');
const bodyParser = require("body-parser");
const dao = require('./database/');

const apiService = require('./apiService/openApi');
const uniPassApiService = require('./apiService/uniPassOpenApi');
// const naverApiService = require('./apiService/NaverApi');
const jusoroApiService = require('./apiService/JusoroApi');

const downloadExcel = require('./downLoadFile/downloadService');
// const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn, isVerifyToken, isLoggedPass } = require('./routes/middlewares');

const app = express();
// sequelize.sync();
passportConfig(passport);
const swaggerRouter = require('./swagger/swaggerDoc'); //swagger 설정 정의
// const sUser = require('./models/sessionUser');
const useragent = require('express-useragent');
//console.log("sUser:",sUser);
const request = require('request');

const java = require('java');

const jarFile = __dirname + path.sep +'lib'+path.sep+'OkCert3-java1.5-2.2.3.jar';
java.classpath.push(jarFile);
app.set('trust proxy',true);
app.use(useragent.express());
app.set('views', path.join(__dirname, 'views')); //템플리트 엔진을 사용 1
app.set('view engine', 'pug'); //템플리트 엔진을 사용 2
app.use(swaggerRouter);//swagger API
app.use(morgan('dev')); //morgan: 요청에 대한 정보를 콘솔에 기록
app.use(express.static(path.join(__dirname, 'public'))); //static: 정적인 파일을 제공, public 폴더에 정적 폴더를 넣는다.
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({ limit:"50mb",extended: false }));

app.use(cookieParser('nodebirdsecret')); //cookie-parser: 요청에 동봉된 쿠키를 해석
//express-session: 세션 관리용 미들웨어, 로그인 드의 이유로 세션을 구현할 때 유용하다. 
/*app.use(cookieSession({   
    key:'plismplus.sid', 
    secret: 'nodebirdsecret', 
    cookie: { 
        domain: '.plismplus.com', 
        maxAge: 1000 * 60 * 60 * 24, // 유효기간 1시간 
    }, 
}));*/

/*app.use(cookieSession({   //express-session: 세션 관리용 미들웨어, 로그인 드의 이유로 세션을 구현할 때 유용하다.
    resave: false,
    saveUninitialized: false,
    secret: 'nodebirdsecret',
    cookie: {
        httpOnly: true,
        secure: false,
        rolling:true,
        //store:sessionStore,
        //saveUninitialized:true,
        maxAge: 1000 * 60 * 60, // 유효기간 1시간
    },
}));*/

	 
// app.use(cookieSession({
//     keys: ['node_yun'],
//     cookie: {
//       maxAge: 1000 * 60 * 60 // 유효기간 1시간
//     }
// }));
app.use(flash()); //connect-flash: 일회성 메시지들을 웹 브라우저에 나타낼 때 사용한다. cookie-parser와 express-session 뒤에 위치해야한다.
app.use(passport.initialize());
app.use(cors({
	origin:true,credentials:true
}));
//app.use(passport.session());

/*
2020.01.21 pdk ship 개발 혹은 테스트 기간중 아래 세션 체크 로직 편의상 막아도 됨

app.route(/^((?!\/auth\/|\/login).)*$/s).all(function(req, res, next) {    
	var path = req.params[0];
	console.log("(server.js) path:",path);
    // if (req.isAuthenticated !== undefined && req.isAuthenticated()){
    if (req.isAuthenticated()){
      console.log('로그인 정보 남아 있음.', req.session.sUser);
      next();
    } else {
      var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
      console.log( fullUrl );
      console.log('로그인 정보 없음 예외 처리');
      // console.log(req.headers.host);
      // return res.redirect('http://' + req.headers.host + '/login/?redirect=' + fullUrl);
      //return res.redirect('http://' + req.headers.host + '/login');

      // return;
      // const err = new Error('Not Found');
      // err.status = 404;
      // next(err);

      // req.logout();
      // req.session.destroy();
      // res.redirect('/');   
      // return res.redirect('http://' + req.headers.host + '/auth/');
      // return res.redirect('/auth/logout');
      // next('/auth/logout');
      next('not login');
    }

	// if ( req.session.user ) { 
	// 	console.dir( req.session.user );
	// 	console.log('로그인 정보 남아 있음.');
	// 	next();
	// } else {
	// 	var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
	// 	console.log( fullUrl );
  //       console.log('로그인 정보 없음 예외 처리');
  //       console.log(req.headers.host);
  //       // return res.redirect('http://' + req.headers.host + '/login/?redirect=' + fullUrl);
  //       //return res.redirect('http://' + req.headers.host + '/login');

  //       return;
  // }
})
*/


const DEV_REPORT_URL = "https://devpaper.plism.com";
const REAL_REPORT_URL = "https://paper.plism.com";












app.use('/', pageRouter); // 2020.04.17 pdk ship Login 필요 없는 페이지 정의 혹은 Login 전 접근해야 하는 페이지 정의




app.route(/^((?!\/auth\/|\/api\/|\/oauth\/).)*$/s).all(isVerifyToken,function(req, res, next) {    
  //console.log("(server.js) path:",path);

//  if ( req.session.sUser.userno ) { 
//     console.dir( req.session.sUser );
//     console.log('로그인 정보 남아 있음.');
//     console.log(req.originalUrl);
     next();
  //} else {
    
//     var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
//    // console.log( fullUrl );
//     console.log('로그인 정보 없음 예외 처리');
//     //console.log(req.headers.host);
//     req.logout();
//     //res.clearCookie('connect.sid');

	  //     return res.status(401).json({ errorcode: 401, error: 'unauthorized' });
//  }
	  
});

app.use('/auth', authRouter);


app.use(bodyParser.json()); //요청의 본문을 해석해주는 미들웨어 1
app.use(bodyParser.urlencoded({ extended: true })); //요청의 본문을 해석해주는 미들웨어 2


// const oracleConfig = require('./config_oracle.js');
// const pgsqlConfig = require('./config_postgresql.js');


//데이터베이스 사용 방법 아래 API 참조
//ORACLE API https://oracle.github.io/node-oracledb/doc/api.html
//POSTGRES API https://node-postgres.com/api
//DB별 서비스별 klnet.owner.web\database\oracle\, klnet.owner.web\database\postgresql\ 위치에 파일 만들고 쿼리별 함수 선언
//위 함수를 해당 파일의 module에 module.exports 를 등록하여 사용
//get, post, put, delete 등 method 별로 exports한 함수를 맵핑하여 사용
//하위 예시 참조
//klnet.owner.web\database\oracle\template.js
//klnet.owner.web\database\postgresql\template.js 

//ORACLE API https://oracle.github.io/node-oracledb/doc/api.html
//POSTGRES API https://node-postgres.com/api



app.get('/image/*',downloadExcel.ImageFileCreater)
app.get("/auth/getTestQuerySample", dao.postgresql.getTestQuerySample);
//위치
app.post("/loc/downloadSample",downloadExcel.ExcelDownload);
app.get("/loc/downloadExcel",downloadExcel.blExcelDownload);
app.get("/loc/downloadHBLExcel",downloadExcel.hblExcelDownload);
app.post("/loc/downloadCfsExcel", downloadExcel.downloadCfsExcel);
app.get("/loc/getTestSimple", dao.postgresql.getTestSimple);
//app.post("/loc/getPortLocation",dao.postgresql.getPortLocation);
app.post("/loc/getPort",dao.postgresql.getPort);
app.post("/loc/getCustomLineCode", dao.pgcodes.getCustomLineCode);
app.post("/loc/getForwarderCode", dao.pgcodes.getForwarderCode);


app.get("/loc/getTestQuerySample", dao.postgresql.getTestQuerySample);
app.get("/loc/getTestQueryParamSample", dao.postgresql.getTestQueryParamSample);
app.post("/loc/getTestQueryAttibuteSample", dao.postgresql.getTestQueryAttibuteSample);
app.post("/loc/getTrackingTerminal", dao.pgtracking.getTrackingTerminal);
//app.post("/loc/getCustomLineCode", dao.tracking.getCustomLineCode);
app.post("/loc/getTrackingList", dao.pgtracking.getTrackingList);
app.post("/loc/getMyBlList", dao.pgtracking.getMyBlList);
app.post("/loc/setUserBLUpdate", dao.pgtracking.setUserBLUpdate);
app.post("/loc/getPkMyBlList", dao.pgtracking.getPkMyBlList);
app.post("/loc/getPkMyUpdateBlList", dao.pgtracking.getPkMyUpdateBlList);
app.post("/loc/deleteMyBlNo", dao.pgtracking.deleteMyBlNo);
app.post("/loc/getBookMark", dao.pgtracking.getBookMark);
app.post("/loc/getCntrList", dao.pgtracking.getCntrList);
app.post("/loc/getCntrDetailList", dao.pgtracking.getCntrDetailList);
app.post("/loc/saveBlList", dao.pgtracking.saveBlList);
app.post("/loc/saveHBlList",dao.pgtracking.saveHBlList);
app.post("/loc/insertBlRequest",dao.pgtracking.insertBlRequest);
app.post("/loc/inserthblrequest",dao.pgtracking.insertHBlRequest);
app.post("/loc/checkpkhbl",dao.pgtracking.checkHBLpk);
app.post("/loc/getMyHblList",dao.pgtracking.getMyhblList);
app.post("/loc/deleteMyHBlNo",dao.pgtracking.deleteMyHBlNo)
app.post("/loc/getDemdetDtlCurrent",dao.pgtracking.getDemdetDtlCurrent);
app.post("/loc/getdemdetCurrent", dao.pgtracking.getdemdetCurrent);
app.post("/loc/getDemdetCntrList", dao.pgtracking.getDemdetCntrList);
app.post("/loc/getHotInfo", dao.tracking.getHotInfo);
app.post("/loc/getImportDemDetList", dao.pgdemdet.getImportDemDetList);
app.post("/loc/getExportDemDetList", dao.pgdemdet.getExportDemDetList);
app.post("/loc/getTarrifList", dao.pgdemdet.getTarrifList);
app.post("/loc/getScrapManageList", dao.pgtracking.getScrapManageList);
app.post("/loc/getScrapLineCodeList", dao.pgtracking.getScrapLineCodeList);
app.post("/loc/getLineScrapingResultData", dao.pgtracking.getLineScrapingResultData);
app.post("/loc/getHeaderForLine", dao.pgtracking.getHeaderForLine);
app.post("/loc/getImportTerminalActivity", dao.pgtracking.getImportTerminalActivity);
app.post("/loc/getExportTerminalActivity", dao.pgtracking.getExportTerminalActivity);
app.post("/loc/getDemDetPort", dao.pgdemdet.getDemDetPort);
app.post("/loc/getDemDetInTerminal",dao.pgdemdet.getDemDetInTerminal);
app.post("/loc/getDemDetOutTerminal",dao.pgdemdet.getDemDetOutTerminal);
app.post("/loc/getTsTracking", dao.pgtracking.getTsTracking);
app.post("/loc/checkCntrNumber", dao.pgtracking.getTrackingDate);
app.post("/loc/getContainerMovement", dao.pgtracking.getContainerMovement);
app.post("/loc/getLinePort", dao.pgtracking.getLinePort);
app.post("/loc/updateLinePort", dao.pgtracking.updateLinePort);
app.post("/loc/selectLineCodeTrans", dao.pgtracking.selectLineCodeTrans);
app.post("/loc/getInlandDriveList", dao.tracking.getInlandDriveList);
app.post("/loc/getInlandDriveDetail", dao.tracking.getInlandDriveDetail);

//공통
app.post("/com/getUserInfo", dao.orausers.getUserInfo);//오라클 유저정보 IN: userId
app.post("/com/setUserInfo", dao.orausers.setUserInfo);//오라클 유저정보 변경
app.post("/api/myAccoutFind", dao.orausers.getMyIdList);//오라클 유저ID 찾기 
app.post("/api/selectId", dao.orausers.selectId);
app.post("/com/getMasterEventCode", dao.pgcodes.getMasterEventCode);
app.post("/com/getEventCodeCarrier", dao.pgcodes.getEventCodeCarrier);
app.post("/com/getEventCarrierList", dao.pgcodes.getEventCarrierList);
app.post("/com/getEventMasterCode", dao.pgcodes.getEventMasterCode);
app.post("/com/setCarrierCodeAdd", dao.pgcodes.setCarrierCodeAdd);
app.post("/com/getCarrierAddList", dao.pgcodes.getCarrierAddList);
app.post("/com/getEventCodeList", dao.pgcodes.getEventCodeList);
app.post("/com/setEventCodeRows", dao.pgcodes.setEventCodeRows);
app.post("/com/setEventCode", dao.pgcodes.setEventCode);
app.post("/com/setEventDeleteCode", dao.pgcodes.setEventDeleteCode);
app.post("/com/setMasterUpdate", dao.pgcodes.setMasterUpdate);
app.post("/com/setMasterDelete", dao.pgcodes.setMasterDelete);
app.post("/api/menuAccessLog", dao.pgusers.menuAccessLog)

// app.post("/api/selectId", dao.pgusers.selectId);

app.post("/com/getDemDetOsc", dao.postgresql.getDemDetOsc);
app.post("/com/getThreadSearch", dao.postgresql.getThreadSearch);
app.post("/com/getImportingList", dao.pgstat.getImportingList);
app.post("/com/getExportingList", dao.pgstat.getExportingList);
app.post("/com/getCarrierStatList", dao.pgstat.getCarrierStatList);
app.post("/com/getCarrierStatInfo", dao.pgstat.getCarrierStatInfo);
app.post("/com/getExportStatInfo", dao.pgstat.getExportStatInfo);
app.post("/com/getImportStatInfo", dao.pgstat.getImportStatInfo);
app.post("/com/getDemdetStatInfo", dao.pgstat.getDemdetStatInfo);
app.post("/com/getStatInfo", dao.pgstat.getStatInfo);
app.post("/com/getUserSetting", dao.pgtracking.getUserSetting);
app.post("/com/getCarrierInfo", dao.pgtracking.getCarrierInfo);
app.post("/com/setUserSetting", dao.pgtracking.setUserSetting);

app.get("/com/getPortCodeInfo", dao.pgcodes.getPortCodeInfo);
app.post("/com/getPortCode", dao.pgcodes.getPortCode);
app.post("/com/getTrackingPortCode", dao.pgcodes.getPortTrackingCode);
app.post("/com/getUserInfoSample", dao.postgresql.getUserInfoSample);
app.post("/com/getImpFlowSample", dao.oracle.getImpFlowSample);
app.post("/com/getExpFlowSample", dao.oracle.getExpFlowSample);
app.post("FlowSample", dao.oracle.getExpFlowSample);
app.post("/api/notice", dao.pgboard.notice);

app.post("/api/updateBoardHits", dao.pgboard.updateBoardHits);
app.post("/com/getBoardDetail", dao.pgboard.getBoardDetail);
app.post("/com/saveBoard", dao.pgboard.saveBoard);
app.post("/com/deleteBoard", dao.pgboard.deleteBoard);
app.post("/com/getBoardDataList", dao.pgboard.getBoardDataList);
app.post("/com/saveAttach", dao.pgboard.saveAttach);
app.post("/com/getBoardAttach", dao.pgboard.getBoardAttach);
app.post("/com/boardAttachDown", function (req, res) {
  if(req.body.fileName == undefined || req.body.filePath == undefined){
    res.status(400).send("");
  } else {
    res.download("/OWNER" + "/" + req.body.filePath + "/" + req.body.fileName, req.body.fileName);
  }
});
//코드

app.post("/com/setExcelData", dao.postgresql.saveExcelData);
app.post("/com/getExcelSchLogList", dao.postgresql.getExcelSchLogList);
app.post("/com/getErrorLogList", dao.pgcodes.getErrorLogList);

app.post("/com/getUserRequest", dao.pgcodes.getUserRequest);
app.post("/com/getTerminalInfo", dao.pgcodes.getTerminalInfo);
app.post("/com/getCodecuship", dao.pgcodes.getCodecuship);
app.post("/com/getUserSettingSample", dao.pgusers.getUserSettingSample);
app.post("/com/getPortLocation",dao.pgcodes.getPortLocation);
app.post("/com/getVslTypeList", dao.pgcodes.getVslTypeList);
app.post("/com/getVslInfoList", dao.pgcodes.getVslInfoList);
app.post("/com/getNationName", dao.pgcodes.getNationInfo);
app.post("/com/getForwardInfo", dao.pgcodes.getForwardInfo);
app.post("/com/getWorkCode",dao.pgcodes.getWorkCodeList);
app.post("/com/checkLineCode",dao.pgcodes.checkLineCode);
app.post("/com/insertLineCode",dao.pgcodes.insertLineCode)
//스케줄
app.post("/sch/getScheduleSample", dao.schedule.getScheduleSample);
app.post("/sch/getTestQueryAttibuteSample", dao.oracle.getTestQueryAttibuteSample);
app.post("/sch/snkMasterList", dao.postgresql.getSnkMasterList );
app.post("/sch/kmdMasterList", dao.postgresql.getKmdMasterList );
app.post("/sch/ymlMasterList", dao.postgresql.getYmlMasterList );
app.post("/sch/getCarrierInfo", dao.schedule.getCarrierInfo);
app.post("/sch/getScheduleList", dao.schedule.getScheduleList);
app.post("/sch/selectScheduleBookingPop", dao.schedule.selectScheduleBookingPop);
app.post("/sch/getScheduleCarrierList", dao.schedule.getScheduleCarrierList);
app.post("/sch/getPortCodeInfo", dao.schedule.getPortCodeInfo);
app.post("/sch/getLinePicInfo", dao.schedule.getLinePicInfo);
app.post("/sch/getScheduleDetailList", dao.schedule.getScheduleDetailList);
app.post("/sch/getSchedulePortCodeList", dao.schedule.getSchedulePortCodeList);
app.post("/sch/insertSchPortCode", dao.schedule.insertSchPortCode);
app.post("/sch/updateSchPortCode", dao.schedule.updateSchPortCode);
app.post("/sch/deleteSchPortCode", dao.schedule.deleteSchPortCode);
app.post("/sch/getServiceCarrierList", dao.schedule.getServiceCarrierList);
// app.post("/sch/getTerminalScheduleList", dao.schedule.getTerminalScheduleList);
app.post("/sch/getTerminalScheduleList", dao.oraschedule.getTerminalScheduleList);
// app.post("/sch/getTerminalCodeList", dao.schedule.getTerminalCodeList);
app.post("/sch/getTerminalCodeList", dao.oraschedule.getTerminalCodeList);
app.post("/sch/getTSCodeList", dao.schedule.getTSCodeList);
app.post("/sch/insertTSCode", dao.schedule.insertTSCode);
app.post("/sch/updateTSCode", dao.schedule.updateTSCode);
app.post("/sch/deleteTSCode", dao.schedule.deleteTSCode);
app.post("/sch/getPicCodeList", dao.schedule.getPicCodeList);
app.post("/sch/insertPicCode", dao.schedule.insertPicCode);
app.post("/sch/updatePicCode", dao.schedule.updatePicCode);
app.post("/sch/deletePicCode", dao.schedule.deletePicCode);
app.post("/sch/shipChargeList", dao.schedule.shipChargeList);
app.post("/sch/getProgressInfo", dao.oracle.getProgressInfo);
app.post("/sch/selectLineServiceRoute", dao.schedule.selectLineServiceRoute);
app.post("/sch/selectLineServiceRouteManagePortList", dao.schedule.selectLineServiceRouteManagePortList);
app.post("/sch/selectCheckScheduleBookmarkPort", dao.schedule.selectCheckScheduleBookmarkPort);


//사용자 알림
app.post("/com/getUserMessage", dao.pgusers.getUserMessage);
app.post("/com/getUserNotice", dao.pgusers.getUserNotice);
app.post("/com/getUserMoreNotice", dao.pgusers.getUserMoreNotice);
app.post("/api/createApikey", dao.orausers.createUserApiKey);

//기업 관리 
app.post("/com/getCompanyInfo",dao.oracomp.getCompInfo);
app.post("/com/addCompany",dao.oracomp.addCompany)
app.post("/com/writeAuthority", dao.oracomp.writeAuthority);
app.post("/com/searchIdentify", dao.company.searchIdentify);
app.post("/com/checkWDFCLineCompany", dao.company.checkLineWDFCCompany);
app.post("/com/getLineCompany",dao.company.getLineCompany)
app.post("/com/updateLineCompany",dao.company.updateLineCompany);
app.post("/com/deleteLineCompany",dao.company.deleteLineCompany);
app.post("/com/selectLineCodeById",dao.company.selectLineCodeById);
//ssssong history admin//
app.post("/com/searchBKList",dao.history.selectBKList);
app.post("/com/selectBkgCargo",dao.history.selectBkgCargo);
app.post("/com/selectBkgCargoGoods",dao.history.selectBkgCargoGoods);
app.post("/com/selectBkgCntr",dao.history.selectBkgCntr);
app.post("/com/selectBkgCntrSpecial",dao.history.selectBkgCntrSpecial);
app.post("/com/selectBkgCntrSpecialAttach",dao.history.selectBkgCntrSpecialAttach);

app.post("/com/selectSr",dao.history.selectSr);
app.post("/com/selectSrBkg",dao.history.selectSrBkg);
app.post("/com/selectSrCargo",dao.history.selectSrCargo);
app.post("/com/selectSrCargoGoods",dao.history.selectSrCargoGoods);
app.post("/com/selectSrCargoMark",dao.history.selectSrCargoMark);
app.post("/com/selectSrCntr",dao.history.selectSrCntr);
app.post("/com/selectSrCntrSpecial",dao.history.selectSrCntrSpecial);
app.post("/com/selectSrDeclare",dao.history.selectSrDeclare);

//외부 api
app.get("/api/apiSchedule", apiService.apiScheduleInfo);
app.post("/com/balticApi", apiService.apiBaltic);
app.post("/com/scfiapi", apiService.apiscfi);
app.post("/com/teuApi", apiService.apiteuRank);
app.post("/com/searchship",apiService.seaventageShipSearch);
app.post("/com/searchTrack",apiService.seaventageTrackSearch);
// UNI PASS API 호출용 
app.post("/com/uniPassApiExportAPI001", uniPassApiService.API001);
app.post("/com/uniPassApiExportAPI002", uniPassApiService.API002);
app.post("/com/uniPassXtrnUserReqApreBrkd",uniPassApiService.API003);
app.post("/com/uniPassShedInfo", uniPassApiService.API005);
app.post("/com/uniPassApiFrwrLst", uniPassApiService.API006);
app.post("/com/uniPassApiFrwrBrkd", uniPassApiService.API007);
app.post("/com/uniPassApiFlcoLst", uniPassApiService.API008);
app.post("/com/uniPassApiFlcoBrkd", uniPassApiService.API009);
//app.post("/com/uniPassApiretrieveFlcoBrkd", uniPassApiService.API009);
app.post("/com/uniPassApiecmQry", uniPassApiService.API010);
app.post("/com/uniPassOvrsSplrSgn", uniPassApiService.API011);
app.post("/com/uniPassApiTrifFxrtInfo", uniPassApiService.API012);
app.post("/com/uniPassRetrieveLca",uniPassApiService.API013);
app.post("/com/uniPassRetrieveLcaDt",uniPassApiService.API014);
app.post("/com/uniPassApiSimlXamrttQry", uniPassApiService.API015);
app.post("/com/uniPassApiSimlFxamtQry", uniPassApiService.API016);
app.post("/com/uniPassExpFfmnPridShrtTrgtPrlst",uniPassApiService.API017);
app.post("/com/uniPassApiHsSgn",uniPassApiService.API018);
app.post("/com/uniPassApiStatsSgnBrkd", uniPassApiService.API019);
app.post("/com/uniPassCntrQry", uniPassApiService.API020);
app.post("/com/uniPassEtprRprtLst", uniPassApiService.API021);
app.post("/com/uniPassDclrCrfnVrfc", uniPassApiService.API022);
app.post("/com/uniPassApiBtcoVhclQry", uniPassApiService.API023);
app.post("/com/uniPassIoprRprtLst", uniPassApiService.API024);
app.post("/com/uniPassApiapfmPrcsStusQry", uniPassApiService.API025);
app.post("/com/uniPassApiShipCoLst", uniPassApiService.API026);
app.post("/com/uniPassApiShipCoBrkdQry", uniPassApiService.API027);
app.post("/com/uniPassPersEcms", uniPassApiService.API028);
app.post("/com/uniPassApiCcctLworCd", uniPassApiService.API029);
app.post("/com/uniPassApiSelectPassInfo", uniPassApiService.selectPassInfo);
app.post("/com/uniPassApiSelectShedInfo", uniPassApiService.selectShedInfo);
app.post("/com/uniPassApiSelectLcaInfo", uniPassApiService.selectLcaInfo);
app.post("/com/uniPassApiSelectCntrInfo", uniPassApiService.selectCntrInfo);
app.post("/com/uniPassApiSelectExpDclrInfo", uniPassApiService.selectExpDclrInfo);
// app.post("/com/uniPassApiRetrieveTrrt", uniPassApiService.API030);
// app.post("/com/uniPassApiPostNoPrCstmSgnQry", uniPassApiService.API031);
// app.post("/com/uniPassApiAlspEntsCdQry", uniPassApiService.API033);

app.post("/api/localAddress", jusoroApiService.localAddress);
app.post("/com/localAddress", jusoroApiService.localAddress);


//PUSH Service 
app.post("/com/pushUserInsert",dao.push.createPushUser);
app.post("/com/pushUserDelete",dao.push.deletePushUser);
app.post("/com/checkPushUser",dao.push.checkPushUser);
app.post("/com/updatePushToken",dao.push.updatePushToken);
app.post("/com/pushreciveTime",dao.push.pushUserSettingUpdate);
app.post("/com/pushreciveGubun",dao.push.pushServiceGubun);
app.post("/com/pushUserSearch", dao.push.pushUserSearch);
app.post("/com/pushMessageSearch", dao.push.searchPushMessage)
app.post("/com/pushSend", dao.push.pushSend);
app.post("/com/readPush",dao.push.readPush);
// 공지 게시판
app.post("/api/getBoardList", dao.pgboard.getBoardMainList);
app.post("/api/getBoardDetail", dao.pgboard.getBoardDetail);
app.post("/api/getBoardAttach", dao.pgboard.getBoardAttach);
app.post("/com/saveNotice", dao.pgboard.saveNotice);
app.post("/com/saveNoticeFiles",dao.pgboard.saveNoticeFiles);
app.post("/com/boardFileDelete",dao.pgboard.boardFileDelete);
app.post("/com/deleteBoardWithFile",dao.pgboard.deleteBoardWithFile);
app.post("/api/boardFIleDownLoad",downloadExcel.fileDownload);
//부산항체인포털
app.post("/api/getChainportal", dao.pgstat.getChainportal);
app.post("/api/getChainportalDetail", dao.pgstat.getChainportalDetail);

//위동해운

app.post("/shipper/deleteSrList", dao.weidongsql.deleteSrList);
app.post("/shipper/setUserSrBkgInit", dao.weidongsql.setUserSrBkgInit);
app.post("/shipper/setUserSrParkBl", dao.weidongsql.setUserSrParkBl);
app.post("/shipper/DeclareFileDelete", dao.weidongsql.DeclareFileDelete);
app.post("/shipper/DeclareFileView", dao.weidongsql.DeclareFileView);

app.post("/shipper/setUserReadMeassage", dao.weidongsql.setUserReadMeassage);
app.post("/shipper/getUserMessage", dao.weidongsql.getUserMessage);
app.post("/shipper/getUserMessageCheck", dao.weidongsql.getUserMessageCheck);
app.post("/shipper/getCompanyInfo", dao.weidongsql.getCompanyInfo);
app.post("/shipper/declareSavefile", dao.weidongsql.declareSaveFile);
app.post("/shipper/getUserBookmark", dao.weidongsql.getUserBookmark);
app.post("/shipper/getUserNewSrDupCheck", dao.weidongsql.getUserNewSrDupCheck);
app.post("/api/selectDashboard", dao.weidongsql.selectDashboard);
app.post("/api/selectGroupbkg", dao.weidongsql.selectGroupBkg);
app.post("/shipper/getLinePortCode", dao.weidongsql.getLinePortCode);
app.post("/shipper/getWdSchCal", dao.weidongsql.getScheduleCal);
app.post("/shipper/getWdSchList", dao.weidongsql.getWdSchList);
app.post("/api/weidongShipSearch", dao.weidongsql.getShipSearch);
app.post("/shipper/getHsCodeGroupInfo", dao.weidongsql.getHsCodeGroupInfo);
app.post("/shipper/getHsCodeItemInfo", dao.weidongsql.getHsCodeItemInfo);
app.post("/shipper/getLineRoute", dao.weidongsql.getLineRoute);
// SR list select
app.post("/shipper/getUserBookingInfo", dao.weidongsql.getUserBookingInfo);
app.post("/shipper/selectSrList",dao.weidongsql.selectSrList);
// SR NEW
app.post("/shipper/getUserSrDataList", dao.weidongsql.getUserSrDataList);
app.post("/shipper/setUserSRDataList", dao.weidongsql.setUserSRDataList);

// SR LINE BOOKMARK
app.post("/shipper/getUserLineBookmark", dao.weidongsql.getUserLineBookmark);
app.post("/shipper/setUserLineBookmark", dao.weidongsql.setUserLineBookmark);
app.post("/shipper/setUserLineBookmarkDel", dao.weidongsql.setUserLineBookmarkDel);

//  SR SHIPPER BOOKMARK
app.post("/shipper/setUserShpBookmark", dao.weidongsql.setUserShpBookmark);
app.post("/shipper/getUserShpBookmark", dao.weidongsql.getUserShpBookmark);
app.post("/shipper/setUserShpBookmarkDel", dao.weidongsql.setUserShpBookmarkDel);


// SR CONSIGNEE BOOKMARK
app.post("/shipper/setUserConsBookmark", dao.weidongsql.setUserConsBookmark);
app.post("/shipper/getUserConsBookmark", dao.weidongsql.getUserConsBookmark);
app.post("/shipper/setUserConsBookmarkDel", dao.weidongsql.setUserConsBookmarkDel);

// SR NOTIFY BOOKMARK
app.post("/shipper/setUserNotiBookmark", dao.weidongsql.setUserNotiBookmark);
app.post("/shipper/getUserNotiBookmark", dao.weidongsql.getUserNotiBookmark);
app.post("/shipper/setUserNotiBookmarkDel", dao.weidongsql.setUserNotiBookmarkDel);

// SR MARK BOOKMARK
app.post("/shipper/getUserMarkBookmark", dao.weidongsql.getUserMarkBookmark);
app.post("/shipper/setUserMarkBookmark", dao.weidongsql.setUserMarkBookmark);
app.post("/shipper/setUserMarkBookmarkDel", dao.weidongsql.setUserMarkBookmarkDel);
// SR DESCRIPTION BOOKMARK
app.post("/shipper/getUserGoodsBookmark", dao.weidongsql.getUserDesBookmark);
app.post("/shipper/setUserGoodsBookmark", dao.weidongsql.setUserGoodsBookmark);
app.post("/shipper/setUserGoodsBookmarkDel", dao.weidongsql.setUserGoodsBookmarkDel);
// SR CARGO BOOKMARK
app.post("/shipper/getUserCargoBookmark", dao.weidongsql.getUserCargoBookmark);
app.post("/shipper/setUserCargoBookmark", dao.weidongsql.setUserCargoBookmark);
app.post("/shipper/setUserCargoBookmarkDel", dao.weidongsql.setUserCargoBookmarkDel);
app.post("/shipper/setUserCargoData", dao.weidongsql.setUserCargoData);
// SR OTHERS BOOKMARK
app.post("/shipper/setUserOthersBookmark", dao.weidongsql.setUserOthersBookmark);
app.post("/shipper/setUserOtherBookmarkDel", dao.weidongsql.setUserOtherBookmarkDel);
app.post("/shipper/getUserOtherBookmark", dao.weidongsql.getUserOtherBookmark);
// SR MARK RELATION
app.post("/shipper/getUserCargoRelation", dao.weidongsql.getUserCargoRelation);
app.post("/shipper/getUserSrDocInit", dao.weidongsql.getUserSrDocInit);
// SR SEND
app.post("/shipper/setSendDocSr", dao.weidongsql.setSendDocSr);
// SR SCHEDULE
app.post("/shipper/setUserSchBookmark", dao.weidongsql.setUserSchBookmark);
app.post("/shipper/getUserSchBookmark", dao.weidongsql.getUserSchBookmark);
app.post("/shipper/setUserSchBookmarkDel", dao.weidongsql.setUserSchBookmarkDel);
//SR OTHERS BOOKMARK
app.post("/shipper/setUserDeclareBookmark", dao.weidongsql.setUserDeclareBookmark);
app.post("/shipper/setUserDeclareBookmarkDel", dao.weidongsql.setUserDeclareBookmarkDel);
app.post("/shipper/getUserDeclareBookmark", dao.weidongsql.getUserDeclareBookmark);

// SR 컨테이너 
app.post("/shipper/setUserCntrData", dao.weidongsql.setUserCntrData);
app.post("/shipper/getUserCntrData", dao.weidongsql.getUserCntrData);
app.post("/shipper/getUserCntrCount", dao.weidongsql.getUserCntrCount);
app.post("/shipper/getUserCntrBookmark", dao.weidongsql.getUserCntrBookmark);
app.post("/shipper/setUserCntrBookmark", dao.weidongsql.setUserCntrBookmark);
app.post("/shipper/setUserCntrBookmarkDel", dao.weidongsql.setUserCntrBookmarkDel);
app.post("/shipper/getUserCntrWeightInfo", dao.weidongsql.getUserCntrWeightInfo);
//SR total bookmark
app.post("/shipper/getUserTitleBookmark", dao.weidongsql.getUserTitleBookmark);
app.post("/shipper/setUserTitleBookmark", dao.weidongsql.setUserTitleBookmark);
app.post("/shipper/setUserTitleBookmarkDel", dao.weidongsql.setUserTitleBookmarkDel);
app.post("/shipper/getSRbookmarkRelation", dao.weidongsql.getSRbookmarkRelation);
app.post("/shipper/setUserSrBookmarkDataList", dao.weidongsql.setUserSrBookmarkDataList);


// Booking
// Document
app.post("/shipper/selectBookingDocumentBookmark", dao.weidongsql.selectBookingDocumentBookmark);
app.post("/shipper/insertBookingDocumentBookmark", dao.weidongsql.insertBookingDocumentBookmark);
app.post("/shipper/updateBookingDocumentBookmark", dao.weidongsql.updateBookingDocumentBookmark);
app.post("/shipper/deleteBookingDocumentBookmark", dao.weidongsql.deleteBookingDocumentBookmark);
app.post("/shipper/selectDocumentOfBooking", dao.weidongsql.selectDocumentOfBooking);
app.post("/shipper/updateDocumentOfBooking", dao.weidongsql.updateDocumentOfBooking);
// SC Number
app.post("/shipper/selectBookingOtherBookmark", dao.weidongsql.selectBookingOtherBookmark);
app.post("/shipper/insertBookingOtherBookmark", dao.weidongsql.insertBookingOtherBookmark);
app.post("/shipper/updateBookingOtherBookmark", dao.weidongsql.updateBookingOtherBookmark);
app.post("/shipper/deleteBookingOtherBookmark", dao.weidongsql.deleteBookingOtherBookmark);
app.post("/shipper/updateOtherofBooking", dao.weidongsql.updateOtherofBooking);
// Booking
app.post("/shipper/selectLineCodeIncoterms", dao.weidongsql.selectLineCodeIncoterms);
app.post("/shipper/selectBooking", dao.weidongsql.selectBooking);
app.post("/shipper/selectBookingList", dao.weidongsql.selectBookingList);


app.post("/shipper/selectBookingBookmarkOfBooking", dao.weidongsql.selectBookingBookmarkOfBooking);
app.post("/shipper/insertBooking", dao.weidongsql.insertBooking);
app.post("/shipper/updateBooking", dao.weidongsql.updateBooking);
app.post("/shipper/deleteBooking", dao.weidongsql.deleteBooking);
app.post("/shipper/updateAllBooking", dao.weidongsql.updateAllBooking);
// Schedule
app.post("/shipper/selectBookingScheduleBookmark", dao.weidongsql.selectBookingScheduleBookmark);
app.post("/shipper/insertBookingScheduleBookmark", dao.weidongsql.insertBookingScheduleBookmark);
app.post("/shipper/updateBookingScheduleBookmark", dao.weidongsql.updateBookingScheduleBookmark);
app.post("/shipper/deleteBookingScheduleBookmark", dao.weidongsql.deleteBookingScheduleBookmark);
app.post("/shipper/selectScheduleOfBooking", dao.weidongsql.selectScheduleOfBooking);
app.post("/shipper/updateScheduleBookmarkOfBooking", dao.weidongsql.updateScheduleBookmarkOfBooking);
app.post("/shipper/updateScheduleOfBooking", dao.weidongsql.updateScheduleOfBooking);
// Shipper
app.post("/shipper/selectBookingShipperBookmark", dao.weidongsql.selectBookingShipperBookmark);
app.post("/shipper/insertBookingShipperBookmark", dao.weidongsql.insertBookingShipperBookmark);
app.post("/shipper/updateBookingShipperBookmark", dao.weidongsql.updateBookingShipperBookmark);
app.post("/shipper/deleteBookingShipperBookmark", dao.weidongsql.deleteBookingShipperBookmark);
app.post("/shipper/getShipperOfBooking", dao.weidongsql.getShipperOfBooking);
app.post("/shipper/updateShipperOfBooking", dao.weidongsql.updateShipperOfBooking);
// Forwarder
app.post("/shipper/selectBookingForwarderBookmark", dao.weidongsql.selectBookingForwarderBookmark);
app.post("/shipper/insertBookingForwarderBookmark", dao.weidongsql.insertBookingForwarderBookmark);
app.post("/shipper/updateBookingForwarderBookmark", dao.weidongsql.updateBookingForwarderBookmark);
app.post("/shipper/deleteBookingForwarderBookmark", dao.weidongsql.deleteBookingForwarderBookmark);
app.post("/shipper/selectForwarderOfBooking", dao.weidongsql.selectForwarderOfBooking);
app.post("/shipper/updateForwarderOfBooking", dao.weidongsql.updateForwarderOfBooking);
// Consignee
app.post("/shipper/selectBookingConsigneeBookmark", dao.weidongsql.selectBookingConsigneeBookmark);
app.post("/shipper/insertBookingConsigneeBookmark", dao.weidongsql.insertBookingConsigneeBookmark);
app.post("/shipper/updateBookingConsigneeBookmark", dao.weidongsql.updateBookingConsigneeBookmark);
app.post("/shipper/deleteBookingConsigneeBookmark", dao.weidongsql.deleteBookingConsigneeBookmark);
app.post("/shipper/selectConsigneeOfBooking", dao.weidongsql.selectConsigneeOfBooking);
app.post("/shipper/updateConsigneeOfBooking", dao.weidongsql.updateConsigneeOfBooking);
// Carrier(LINE)
app.post("/shipper/selectBookingLineBookmark", dao.weidongsql.selectBookingLineBookmark);
app.post("/shipper/insertBookingLineBookmark", dao.weidongsql.insertBookingLineBookmark);
app.post("/shipper/updateBookingLineBookmark", dao.weidongsql.updateBookingLineBookmark);
app.post("/shipper/deleteBookingLineBookmark", dao.weidongsql.deleteBookingLineBookmark);
app.post("/shipper/selectLineOfBooking", dao.weidongsql.selectLineOfBooking);
app.post("/shipper/updateLineOfBooking", dao.weidongsql.updateLineOfBooking);
// Transport
app.post("/shipper/selectBookingTransportBookmark", dao.weidongsql.selectBookingTransportBookmark);
app.post("/shipper/insertBookingTransportBookmark", dao.weidongsql.insertBookingTransportBookmark);
app.post("/shipper/updateBookingTransportBookmark", dao.weidongsql.updateBookingTransportBookmark);
app.post("/shipper/deleteBookingTransportBookmark", dao.weidongsql.deleteBookingTransportBookmark);
app.post("/shipper/selectTransportOfBooking", dao.weidongsql.selectTransportOfBooking);
app.post("/shipper/updateTransportOfBooking", dao.weidongsql.updateTransportOfBooking);
// Cargo
app.post("/shipper/selectBookingCargoBookmark", dao.weidongsql.selectBookingCargoBookmark);
app.post("/shipper/insertBookingCargoBookmark", dao.weidongsql.insertBookingCargoBookmark);
app.post("/shipper/updateBookingCargoBookmark", dao.weidongsql.updateBookingCargoBookmark);
app.post("/shipper/deleteBookingCargoBookmark", dao.weidongsql.deleteBookingCargoBookmark);
app.post("/shipper/selectCargoOfBooking", dao.weidongsql.selectCargoOfBooking);
app.post("/shipper/updateCargoOfBooking", dao.weidongsql.updateCargoOfBooking);
app.post("/shipper/insertCargoOfBooking", dao.weidongsql.insertCargoOfBooking);
app.post("/shipper/selectLineCodeCargoType", dao.weidongsql.selectLineCodeCargoType);
app.post("/shipper/selectLineCodeCargoPackType", dao.weidongsql.selectLineCodeCargoPackType);
app.post("/shipper/selectCargoGoodsOfBooking", dao.weidongsql.selectCargoGoodsOfBooking);
// app.post("/api/insertCargoGoods", dao.weidongsql.insertCargoGoods);
app.post("/shipper/selectBookingCargoGoodsBookmark", dao.weidongsql.selectBookingCargoGoodsBookmark);
app.post("/shipper/insertBookingCargoGoodsBookmark", dao.weidongsql.insertBookingCargoGoodsBookmark);
app.post("/shipper/updateBoookingCargoGoodsBookmark", dao.weidongsql.updateBoookingCargoGoodsBookmark);
app.post("/shipper/deleteBoookingCargoGoodsBookmark", dao.weidongsql.deleteBoookingCargoGoodsBookmark);
app.post("/shipper/selectBookingCargoBookmarkRelation", dao.weidongsql.selectBookingCargoBookmarkRelation);

// Container
app.post("/shipper/selectBookingContainerBookmark", dao.weidongsql.selectBookingContainerBookmark);
app.post("/shipper/insertBoookingContainerBookmark", dao.weidongsql.insertBoookingContainerBookmark);
app.post("/shipper/updateBoookingContainerBookmark", dao.weidongsql.updateBoookingContainerBookmark);
app.post("/shipper/deleteBookingContainerBookmark", dao.weidongsql.deleteBookingContainerBookmark);
app.post("/shipper/selectBookingSpecialBookmark", dao.weidongsql.selectBookingSpecialBookmark);
app.post("/shipper/insertBookingSpecialBookmark", dao.weidongsql.insertBookingSpecialBookmark);
app.post("/shipper/updateBookingSpecialBookmark", dao.weidongsql.updateBookingSpecialBookmark);
app.post("/shipper/deleteBookingSpecialBookmark", dao.weidongsql.deleteBookingSpecialBookmark);
app.post("/shipper/selectContainerOfBooking", dao.weidongsql.selectContainerOfBooking);
app.post("/shipper/selectBookingContainerSpecialBookmarkRelation", dao.weidongsql.selectBookingContainerSpecialBookmarkRelation);
app.post("/shipper/selectContainerSpecialOfBooking", dao.weidongsql.selectContainerSpecialOfBooking);
app.post("/shipper/saveContainerOfBooking", dao.weidongsql.saveContainerOfBooking);
app.post("/shipper/sendBooking", dao.weidongsql.sendBooking);

// Total Booking Bookmark
app.post("/shipper/selectBookingBkgBookmark", dao.weidongsql.selectBookingBkgBookmark);
app.post("/shipper/saveBookingBkgBookmark", dao.weidongsql.saveBookingBkgBookmark);
app.post("/shipper/deleteBookmark", dao.weidongsql.deleteBookmark);
app.post("/shipper/insertBookingBkgBookmark", dao.weidongsql.insertBookingBkgBookmark);
app.post("/shipper/updateBookingBkgBookmark", dao.weidongsql.updateBookingBkgBookmark);
app.post("/shipper/deleteBookingBkgBookmark", dao.weidongsql.deleteBookingBkgBookmark);
app.post("/shipper/selectBookingBkgBookmarkRelation", dao.weidongsql.selectBookingBkgBookmarkRelation);
app.post("/shipper/insertBookingBkgBookmarkRelation", dao.weidongsql.insertBookingBkgBookmarkRelation);
app.post("/shipper/updateBookingBkgBookmarkRelation", dao.weidongsql.updateBookingBkgBookmarkRelation);
app.post("/shipper/deleteBookingBkgBookmarkRelation", dao.weidongsql.deleteBookingBkgBookmarkRelation);

// 공통
app.post("/shipper/selectLinePort", dao.weidongsql.selectLinePort);
app.post("/shipper/selectFdpCodePortList", dao.weidongsql.selectFdpCodePortList);
app.post("/shipper/selectLineCodePort", dao.weidongsql.selectLineCodePort);
app.post("/shipper/selectLineCodeVesselName", dao.weidongsql.selectLineCodeVesselName);
app.post("/shipper/selectLineCodeVesselPickup", dao.weidongsql.selectLineCodeVesselPickup);
app.post("/shipper/selectLineCodeSztpPickup", dao.weidongsql.selectLineCodeSztpPickup);
app.post("/shipper/selectLineCodeCntrSztp", dao.weidongsql.selectLineCodeCntrSztp);
app.post("/shipper/selectLineCodeServiceType", dao.weidongsql.selectLineCodeServiceType);
app.post("/shipper/selectDupCheckBkgNo", dao.weidongsql.selectDupCheckBkgNo);
app.post("/shipper/selectWeidongDangerCheck", dao.weidongsql.selectWeidongDangerCheck);
app.post("/shipper/selectShipperCompanyListByUser", dao.weidongsql.selectShipperCompanyListByUser);
app.post("/shipper/selectForwarderCompanyListByUser", dao.weidongsql.selectForwarderCompanyListByUser);
app.post("/shipper/selectLineWorkOriginator", dao.weidongsql.selectLineWorkOriginator);
app.post("/shipper/selectLineCodeVesselPortCfs", dao.weidongsql.selectLineCodeVesselPortCfs);

// Confirm
app.post("/shipper/selectShpConfirm", dao.weidongsql.selectShpConfirm);
app.post("/shipper/selectShpConfirmList", dao.weidongsql.selectShpConfirmList);
app.post("/shipper/selectShpConfirmCargo", dao.weidongsql.selectShpConfirmCargo);
app.post("/shipper/selectShpConfirmCargoGoods", dao.weidongsql.selectShpConfirmCargoGoods);
app.post("/shipper/selectShpConfirmCntr", dao.weidongsql.selectShpConfirmCntr);
app.post("/shipper/selectShpConfirmCntrSpecial", dao.weidongsql.selectShpConfirmCntrSpecial);

// BL

app.post("/shipper/confitmShpBl", dao.weidongsql.confitmShpBl);
app.post("/shipper/selectShpBl", dao.weidongsql.selectShpBl);
app.post("/shipper/selectBlList",dao.weidongsql.selectBlList);
app.post("/shipper/selectShpBlCargo", dao.weidongsql.selectShpBlCargo);
app.post("/shipper/selectShpBlCntr", dao.weidongsql.selectShpBlCntr);
app.post("/shipper/insertServiceTermsHistory", dao.weidongsql.insertServiceTermsHistory);
//mapin mapout
app.post("/com/mapout",dao.docs.mapout);
app.post("/com/oraMapin",dao.oradocs.oraMapIn);
app.post("/com/originator",dao.docs.originatorList);
//imo search
app.post("/api/imoSearch", dao.pgcodes.imoSearch)

app.post("/api/boardAttachDown", function (req, res) {
  if(req.body.fileName == undefined || req.body.filePath == undefined){
    res.status(400).send("");
  } else {
    res.download("/OWNER" + "/" + req.body.filePath + "/" + req.body.fileName, req.body.fileName);
  }
});

app.post("/api/elasticHsSearch",async (req,res,next)=> {
	console.log("CONSLOE:",req.body.hs);
	var elasticsearch = require('elasticsearch');
	var client = new elasticsearch.Client({
		host:'http://172.25.1.143:9200/hs_navi',
	});
	try {
	const response = await client.search({
		body:{
		"size":1,
		"query":{
		"match":{
		"satmntPrdlstNm":{
		"query":req.body.hs
		}
		}
		}
		}});
	if(response.hits.total > 0) {
		return res.json(response.hits.hits[0]._source);
	} else {
		return res.send();
	}
	} catch(err) {
		next(err);
	}
});
app.post("/api/elasticImoSearch",async (req,res,next)=> {
	console.log("CONSLOE:",req.body.imo);
	var elasticsearch = require('elasticsearch');
	var client = new elasticsearch.Client({
		host:'http://elastic7.0:9200/imo',
	});
	try {
	const response = await client.search({
		body:{
		"size":1,
		"query":{
		"match":{
		"name":req.body.imo
		}
		}
		}
		});
		if(response.hits.total.value > 0) {
			return res.json(response.hits.hits[0]._source);
		} else {
			return res.send();
		}
	} catch(err) {
		next(err);
	}
});

app.post("/auth/sertify", function (req,res) {
	
	const list = java.newInstanceSync("java.util.ArrayList"); 
	//console.log(list.getClassSync().getNameSync());
	java.newInstance("java.util.ArrayList", function(err, list) {
	  list.addSync("item1");
	  list.addSync("item2");
	  console.log("Inside the callback");
	  // console.log(list);
	  // console.log(list[0]);
	  console.log(list.toArraySync());
	  console.log(list.getSync(0));
	  console.log("Outside the callback");
	});
	list.addSync("product1");
	list.addSync("product2");
	console.log(list.getSync(0));
		
	
	const aTarget = "PROD" //테스트="TEST", 운영="PROD"
	const aCP_CD = "P21730000000";	// 회원사코드
	
	// const aLicense = "C:\\okcert3_license\\" + aCP_CD + "_IDS_01_" + aTarget + "_AES_license.dat";
	const aLicense = __dirname + path.sep +"lib"+path.sep+ aCP_CD + "_IDS_01_" + aTarget + "_AES_license.dat";
	//const aReqStr ='{"RETURN_URL":"http://localhost:3000/authpage/phonepopup", "SITE_NAME":"plismplus", "SITE_URL":"www.plismplus.com", "RQST_CAUS_CD":"00"}';


	/*const okcert = java.newInstanceSync("kcb.module.v3.OkCert"); 
	const case1 = okcert.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	console.log(okcert.getClassSync().getNameSync());
	console.log('case1=', case1);*/


	const javaInstance = java.import('kcb.module.v3.OkCert')();
	let aSvcName = "";
	let case2;
	let aReqStr;

	if(req.body.mdltkn) {
		aSvcName = "IDS_HS_POPUP_RESULT"; //서비스명 (고정값)
		aReqStr ='{"MDL_TKN":'+req.body.mdltkn+'}';
		case2 = javaInstance.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	} else {
		aSvcName = "IDS_HS_POPUP_START"; //서비스명 (고정값)

		const host = req.headers.host;
		console.log('>>>>>>>>>',host)
		if( host.indexOf('localhost') >= 0 ){
			aReqStr ='{"RETURN_URL":"http://localhost:3000/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"localhost", "RQST_CAUS_CD":"00"}';
		}else if( host.indexOf('dev') >= 0 ) {
			aReqStr ='{"RETURN_URL":"https://devbooking.plism.com/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"booking.plism.com", "RQST_CAUS_CD":"00"}';
		} else {
			aReqStr ='{"RETURN_URL":"https://booking.plism.com/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"booking.plism.com", "RQST_CAUS_CD":"00"}';
		}
		
		
		case2 = javaInstance.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	}
	console.log('case2=', case2);

	return res.send(case2);	
});

app.post("/auth/sertify_weidong", function (req,res) {
	
	const list = java.newInstanceSync("java.util.ArrayList"); 
	//console.log(list.getClassSync().getNameSync());
	java.newInstance("java.util.ArrayList", function(err, list) {
	  list.addSync("item1");
	  list.addSync("item2");
	  console.log("Inside the callback");
	  // console.log(list);
	  // console.log(list[0]);
	  console.log(list.toArraySync());
	  console.log(list.getSync(0));
	  console.log("Outside the callback");
	});
	list.addSync("product1");
	list.addSync("product2");
	console.log(list.getSync(0));
		
	
	const aTarget = "PROD" //테스트="TEST", 운영="PROD"
	const aCP_CD = "P21730000000";	// 회원사코드
	
	// const aLicense = "C:\\okcert3_license\\" + aCP_CD + "_IDS_01_" + aTarget + "_AES_license.dat";
	const aLicense = __dirname + path.sep +"lib"+path.sep+ aCP_CD + "_IDS_01_" + aTarget + "_AES_license.dat";
	//const aReqStr ='{"RETURN_URL":"http://localhost:3000/authpage/phonepopup", "SITE_NAME":"plismplus", "SITE_URL":"www.plismplus.com", "RQST_CAUS_CD":"00"}';


	/*const okcert = java.newInstanceSync("kcb.module.v3.OkCert"); 
	const case1 = okcert.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	console.log(okcert.getClassSync().getNameSync());
	console.log('case1=', case1);*/


	const javaInstance = java.import('kcb.module.v3.OkCert')();
	let aSvcName = "";
	let case2;
	let aReqStr;

	if(req.body.mdltkn) {
		aSvcName = "IDS_HS_POPUP_RESULT"; //서비스명 (고정값)
		aReqStr ='{"MDL_TKN":'+req.body.mdltkn+'}';
		case2 = javaInstance.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	} else {
		aSvcName = "IDS_HS_POPUP_START"; //서비스명 (고정값)
		const host = req.headers.host;
		console.log('>>>>>>>>>',host)
		if( host.indexOf('localhost') >= 0 ){
			aReqStr ='{"RETURN_URL":"http://localhost:3000/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"weidong.plism.com", "RQST_CAUS_CD":"00"}';
		}else if( host.indexOf('dev') >= 0 ) {
			aReqStr ='{"RETURN_URL":"https://devweidong.plism.com/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"weidong.plism.com", "RQST_CAUS_CD":"00"}';
		} else {
		aReqStr ='{"RETURN_URL":"https://weidong.plism.com/return_certify", "SITE_NAME":"plismplus", "SITE_URL":"weidong.plism.com", "RQST_CAUS_CD":"00"}';
		}
		
		case2 = javaInstance.callOkCertSync(aTarget, aCP_CD, aSvcName, aLicense, aReqStr);
	}
	//console.log('case2=', case2);

	return res.send(case2);	
});

app.get("/api/reportViewer", function (req, res) {
	
	console.log( "==============================");
	// console.log( req.query);
	console.log("REPORT Call ",req.query.file_id, req.headers.host);
	console.log( "==============================");
	// query = JSON.parse(req.query);
	const url = req.headers.host;
	let reportUrl = '';
	if( url.indexOf('localhost') >= 0 || url.indexOf('dev') >= 0 ) {
		reportUrl = DEV_REPORT_URL;
		// reportUrl = 'http://localhost:5007';
	} else {
		reportUrl = REAL_REPORT_URL;
	}
	// console.log(reportUrl)
	res.redirect(reportUrl+'/report/reportViewer?file_id='+req.query.file_id
	+'&system_id='+req.query.system_id
	+'&user_id='+req.query.user_id
	+'&file_type='+req.query.file_type
	+'&file_path='+req.query.file_path
	+'&name='+req.query.name
	+'&connection='+req.query.connection
	+'&parameters='+req.query.parameters);
});



app.get("/shipper/reportViewer", function (req, res) {
	
	// console.log( "==============================");
	// console.log("REPORT Call ",req.query.file_id, req.headers.host);
	// console.log( "==============================");
	// query = JSON.parse(req.query);
	const url = req.headers.host;
	let reportUrl = '';
	if( url.indexOf('localhost') >= 0 || url.indexOf('dev') >= 0 ) {
		reportUrl = DEV_REPORT_URL;
		// reportUrl = 'http://localhost:5007';
	} else {
		reportUrl = REAL_REPORT_URL;
	}
	// console.log(reportUrl)
	res.redirect(reportUrl+'/report/reportViewer?file_id='+req.query.file_id
	+'&system_id='+req.query.system_id
	+'&user_id='+req.query.user_id
	+'&file_type='+req.query.file_type
	+'&file_path='+req.query.file_path
	+'&name='+req.query.name
	+'&connection='+req.query.connection
	+'&parameters='+req.query.parameters);
});

app.post("/shipper/reportViewer", function (req, res) {
	
	// console.log( "==============================");
	// console.log( req.body);
	// console.log("REPORT Call ",req.body.file_id, req.headers.host);
	// console.log( "==============================");
	// query = JSON.parse(req.query);
	const url = req.headers.host;
	let reportUrl = '';
	if( url.indexOf('localhost') >= 0 || url.indexOf('dev') >= 0 ) {
		reportUrl = DEV_REPORT_URL;
		// reportUrl = 'http://localhost:5007';
	} else {
		reportUrl = REAL_REPORT_URL;
	}
	// console.log(reportUrl)
	res.redirect(reportUrl+'/report/reportViewer?file_id='+req.body.file_id
	+'&system_id='+req.body.system_id
	+'&user_id='+req.body.user_id
	+'&file_type='+req.body.file_type
	+'&file_path='+req.body.file_path
	+'&name='+req.body.name
	+'&connection='+req.body.connection
	+'&parameters='+req.body.parameters);
});

// 개발중
app.post("/api/reportViewer", function (req, res) {
	
	console.log( "==============================");
	console.log( req.body);
	// console.log(req.query.file_id, JSON.parse(req.query.parameters));
	// console.log( "==============================");
	// // query = JSON.parse(req.query);
	// res.redirect('http://localhost:5007/report/reportViewer?file_id='+req.query.file_id
	// +'&system_id='+req.query.system_id
	// +'&user_id='+req.query.user_id
	// +'&file_type='+req.query.file_type
	// +'&file_path='+req.query.file_path
	// +'&name='+req.query.name
	// +'&connection='+req.query.connection
	// +'&parameters='+req.query.parameters);
});


// app.post("/auth/kakaoRevoke", function (req, res) {
	
// 	console.log( "kakaoRevoke==============================");
// 	console.log( req.body);
// 	const headers ={
// 		'Content-Type':'application/x-www-form-urlencoded',
// 		'Authorization':'KakaoAK{ADMIN_KEY}'
// 	}
// 	const dataString = 'target_id_type=user_id&target_id=123456';
// 	const options = {
// 		url='https://kapi.kakao.com/v1/user/unlink',
// 		method:'POST',
// 		headers:headers,
// 		body:dataString
// 	}
// 	function callback(error,response,body){
// 		if(!error&&response.statusCode==200){
// 			console.log(body)
// 		}
		
// 	}
// 	request(options,callback)
// });
//에러 처리 미들웨어: error라는 템플릿 파일을 렌더링한다. 404에러가 발생하면 404처리 미들웨어에서 넣어준 값을 사용한다.
// app.use((req, res, next) => {
//     const err = new Error('Not Found');
//     err.status = 404;
// 	// next(err);
// 	res.status(err.status || 404);
// 	res.render('error');
// });

app.use((req,res,next)=>{
	next(createError(404));
});

app.use((err, req, res, next) => {
	// console.log('error:', err);
	console.log('server.js)',err)
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

app.get("/jusoro", function(req, res){

	console.log("tttttttttttttttttssss")
	// console.log(list);
	// res.sendFile(path.join(__dirname,'views','jquery-1.10.2.js'));
	res.render('jusoro'); 
	
});


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));

