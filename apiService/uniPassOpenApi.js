'use strict';

const request = require('request');
const convert = require('xml-js');
const config = require('./uniPassConfig');

// 서비스ID : API001
// 서비스명 : 화물통관 진행 정보
// 서비스명 : retriveCargCsclPrgsInfo
// 서비스설명 : 수입화물의 일반정보와 진행상태별 정보 제공
const API001 = (req, res) => {

    if( !req.body.blYy ) {
        res.status(401).send('NO_BLYY');
    }
    if( !req.body.mblNo) {
        res.status(401).send('NO_MBLNO');
    }

    // let authorization = req.headers['authorization'];
    // if (!authorization) {
    //     res.status(401).send('Unauthorization');
    // } else {
    // CORS 처리를 위한 response HEADER 처리
    const OPTIONS = { 
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.IMPORT_URL+'?&crkyCn='+config.UNI_API_KEY_IMPORT+'&blYy='+req.body.blYy+'&mblNo='+req.body.mblNo;
    // console.log(uni_url);
    request({
        // url:'https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?&crkyCn=x240d195q172y239h040w070v0&blYy=2020&mblNo=NSSLASHA20D00262',
        // url:'https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?&crkyCn=x240d195q172y239h040w070v0&blYy=2020&mblNo=COAU7223267940',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API001 Error:', error);
            res.status('401').send('UNI-PASS API001 Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.cargCsclPrgsInfoQryRtnVo;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                // ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( !checkVo.ntceInfo.hasOwnProperty('_text') ) {
                    // console.log( "단건", checkVo.ntceInfo );
                    // 오류가 아니면서(ntceInfo._text) tCnt가 0 인 경우 데이터가 없음.
                    if( 0 == checkVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        let returnValue = {
                            "message":'NO_DATA',
                            "mbl_no":'',
                            "hbl_no":'',
                            "clearance":'',
                            "clearance_date":'',
                            "mt_trgt_carg_yn_nm":'',
                        }
                        returnList.push( returnValue );
                        res.status(200).send(returnList);
                    } else {
                        // console.log( checkVo.tCnt );
                        // 조회 정보가 존재 하는 경우
                        if( 0 < checkVo.tCnt._text ) {
                            const returnValue = {
                                "message":'',
                                "mbl_no":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mblNo._text,
                                "hbl_no":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.hblNo._text,
                                "clearance":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoDtlQryVo[0].cargTrcnRelaBsopTpcd._text,
                                "clearance_date":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoDtlQryVo[0].prcsDttm._text,
                                "mt_trgt_carg_yn_nm":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mtTrgtCargYnNm._text,
                            }
                            returnList.push( returnValue );
                        } else {
                            const returnValue = {
                                "message":'',
                                "mbl_no":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mblNo._text,
                                "hbl_no":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.hblNo._text,
                                "clearance":'',
                                "clearance_date":'',
                                "mt_trgt_carg_yn_nm":jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mtTrgtCargYnNm._text,
                            }
                            returnList.push( returnValue );
                        }
                        res.status(200).send( returnList );
                    }
                } else {
                    // console.log( "다건", checkVo.ntceInfo );
                    // 다건의 경우 URL 재 호출
                    // cargMtNo 항목을 추출하여 다건의 갯수만큼 loop
                    const loop = jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo;
                    
                    let returnList = [];
                    let count = 0;
                    if( undefined != loop ) {
                        loop.forEach( element =>{
                            let cargMtNo = element.cargMtNo._text;
                            // API URL 조합한다.
                            let uni_url2 = config.UNI_PASS_URL+config.IMPORT_URL+'?&crkyCn='+config.UNI_API_KEY_IMPORT+'&cargMtNo='+cargMtNo;
                            // console.log(uni_url2);
                            getExportApiList(uni_url2).then(function( returnValue ){
                                count++;
                                returnList.push(returnValue);
                                if( loop.length == count ) {
                                    res.status(200).send( returnList );
                                }
                            }).catch(function( err ){
                                res.status(401).send( err );
                            });
                        });
                    }
                }
            }
        }
    });
}

// 다건의 경우 단건을 조회 하는 Request 결과 값으로 취합
// Promise 처리함.
function getExportApiList( uni_url2 ) {
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    let returnValue = {};
    return new Promise( function( resolve, reject ) {
        request({
            url:uni_url2,
            method:'GET'
        }, (error2, apiRes2, xml2 ) => {
            if(error2) {
                console.log('UNI-PASS API001 Error:', error2);
                reject(error2);
            } else {
                apiRes2.headers = OPTIONS;
                let json2 = convert.xml2json(xml2, {compact:true,spaces:4});
                let jsonParse2 = JSON.parse( json2 );
                let checkVo2 = jsonParse2.cargCsclPrgsInfoQryRtnVo;
                if( !checkVo2.ntceInfo.hasOwnProperty('_text') ) {
                    // console.log( "단건", checkVo2.ntceInfo );
                    if( 0 == checkVo2.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        returnValue = {
                            "message":'NO_DATA',
                            "mbl_no":'',
                            "hbl_no":'',
                            "clearance":'',
                            "clearance_date":'',
                            "mt_trgt_carg_yn_nm":'',
                        }
                        // returnList.push( returnValue );
                        // res.status(200).send(returnList);
                    } else {
                        // console.log( checkVo2.tCnt );
                        // 조회 정보가 존재 하는 경우
                        if( 0 < checkVo2.tCnt._text ) {
                            returnValue = {
                                "message":'',
                                "mbl_no":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mblNo._text,
                                "hbl_no":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.hblNo._text,
                                "clearance":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoDtlQryVo[0].cargTrcnRelaBsopTpcd._text,
                                "clearance_date":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoDtlQryVo[0].prcsDttm._text,
                                "mt_trgt_carg_yn_nm":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mtTrgtCargYnNm._text,
                            }
                            // console.log(returnValue);
                            // returnList.push( returnValue );
                            // console.log( returnList );
                        } else {
                            returnValue = {
                                "message":'',
                                "mbl_no":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mblNo._text,
                                "hbl_no":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.hblNo._text,
                                "clearance":'',
                                "clearance_date":'',
                                "mt_trgt_carg_yn_nm":jsonParse2.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo.mtTrgtCargYnNm._text,
                            }
                            // returnList.push( returnValue );
                        }
                    }
                } else {
                    returnValue = {
                        "message":'NOT_EXISTS_CASE',
                        "mbl_no":'',
                        "hbl_no":'',
                        "clearance":'',
                        "clearance_date":'',
                        "mt_trgt_carg_yn_nm":'',
                    }
                    // returnList.push( returnValue );
                }
            }
            resolve(returnValue);
        });
    });
}


// 서비스ID : API002
// 서비스명 : 수출신고번호별 수출이행 내역
// 서비스명 : retrieveExpDclrNoPrExpFfmnBrkd
// 서비스설명 : 수출신고번호별 수출이행내역 및 잔량 정보 제공
const API002 = (req, res) => {
    if( !req.body.mblNo) {
        res.status(401).send('NO_MBLNO');
    }
    
    // CORS 처리를 위한 response HEADER 처리
    let OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.EXPORT_URL+'?&crkyCn='+config.UNI_API_KEY_EXPORT+'&blNo='+req.body.mblNo;
    // console.log(uni_url);
    request({
        // url : 'https://unipass.customs.go.kr:38010/ext/rest/expDclrNoPrExpFfmnBrkdQry/retrieveExpDclrNoPrExpFfmnBrkd?crkyCn=c250r165v102q229m080h090a0&blNo=MIQOSEL001873',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API002 Error:', error);
            res.status('401').send('API002');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo;

                let returnList = [];
                // console.log( checkVo );
                // 정상 적인 경우
                if ( 1 == checkVo.tCnt._text ) {
                    // 단건 조회 한 경우
                    let returnValue = {
                        'message' : '',
                        'exp_dclr_no':jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo.expDclrNo._text,
                        'tkof_dt':jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo.tkofDt._text,
                        'shpm_cmpl_yn':jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo.shpmCmplYn._text,
                    }
                    returnList.push( returnValue );
                    // console.log(returnList  );
                    res.status(200).send(returnList);
                } else if ( 1 < checkVo.tCnt._text ) {
                    // 다건 조회 한 경우
                    jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo.forEach( element =>{
                        let returnValue = {
                            'message' : '',
                            'exp_dclr_no':element.expDclrNo._text,
                            'tkof_dt':element.tkofDt._text,
                            'shpm_cmpl_yn':element.shpmCmplYn._text,
                        }
                        returnList.push( returnValue );
                    });
                    // console.log(returnList  );
                    res.status(200).send(returnList);
                } else if ( 0 == checkVo.tCnt._text ) {
                    // 오류 난 경우
                    let returnValue = {
                        'message' : 'NO_DATA',
                        'exp_dclr_no':'',
                        'tkof_dt':'',
                        'shpm_cmpl_yn':'',
                    }
                    returnList.push( returnValue );
                    // console.log(returnList  );
                    res.status(200).send(returnList);
                } else if ( 0 > checkVo.tCnt._text ) {
                    // 오류 난 경우
                    let returnValue = {
                        'message' : checkVo.ntceInfo._text,
                        'exp_dclr_no':'',
                        'tkof_dt':'',
                        'shpm_cmpl_yn':'',
                    }
                    returnList.push( returnValue );
                    // console.log(returnList  );
                    res.status(200).send(returnList);
                }
            }
        }
    });

}


// 서비스ID : API001
// 서비스명 : 화물통관 진행 정보
// 서비스명 : retriveCargCsclPrgsInfo
// 서비스설명 : 수입화물의 일반정보와 진행상태별 정보 제공
const selectPassInfo = (req, res) => {
    
    /*if( req.body.cargMtNo || (req.body.blYy && (req.body.mblNo || req.body.hblNo)) ) {
        res.status(401).send('NO_CARGMTNO');
    }*/
    let param = "";

    if(req.body.cargMtNo != undefined){
        param += '&cargMtNo='+req.body.cargMtNo;
    }else if(req.body.blYy != undefined && (req.body.mblNo != undefined || req.body.hblNo != undefined)) {
        param += '&mblNo='+req.body.mblNo+'&hblNo='+req.body.hblNo+'&blYy='+req.body.blYy;
    } else {
        res.status(401).send('NO_CARGMTNO');
    }

    // CORS 처리를 위한 response HEADER 처리
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.IMPORT_URL+'?&crkyCn='+config.UNI_API_KEY_IMPORT + param;
     //console.log(uni_url);
    request({
        // url:'https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?&crkyCn=x240d195q172y239h040w070v0&blYy=2020&mblNo=NSSLASHA20D00262',
        // url:'https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?&crkyCn=x240d195q172y239h040w070v0&blYy=2020&mblNo=COAU7223267940',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API001 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS API001 Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.cargCsclPrgsInfoQryRtnVo;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                // ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.ntceInfo.hasOwnProperty('_text')) {
                    if(checkVo.ntceInfo._text.match('N00')){
                        // 다건의 경우 URL 재 호출
                        // cargMtNo 항목을 추출하여 다건의 갯수만큼 loop
                        const loop = jsonParse.cargCsclPrgsInfoQryRtnVo.cargCsclPrgsInfoQryVo;

                        //let returnList = [];
                        let infoDataList = [];
                        let i = 1;
                        if( undefined != loop ) {
                            loop.forEach( element =>{
                                //let cargMtNo = element.cargMtNo._text;
                                const returnValue = {
                                    no:i++, //순번
                                    cargMtNo: element.cargMtNo._text,   //화물관리번호
                                    hblNo: element.hblNo._text, //H-B/L
                                    etprDt: element.etprDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"),   //입항일시
                                    dsprNm: element.dsprNm._text,    //양륙항
                                    shcoFlco: element.shcoFlco._text,    //운송사명
                                }
                                infoDataList.push(returnValue);
                            });
                        //returnList.push()
                            if(infoDataList[0].cargMtNo != undefined){
                                let uni_url2 = config.UNI_PASS_URL+config.IMPORT_URL+'?&crkyCn='+config.UNI_API_KEY_IMPORT + "&cargMtNo=" + infoDataList[0].cargMtNo;
                                //console.log(uni_url2);
                                request({
                                    // url:'https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo?&crkyCn=x240d195q172y239h040w070v0&cargMtNo=20MAEU0488I10450002',
                                    url : uni_url2,
                                    method:'GET'
                                }, (error2, apiRes2, xml2 ) => {
                                    if(error2) {
                                        console.log('UNI-PASS API001 Error2:', error2);
                                        res.status(error2.statusCode).send(error2.statusCode);
                                    } else {
                                        apiRes2.headers = OPTIONS;
                                        if( apiRes2.statusCode == 200 ) {
                                            let json2 = convert.xml2json(xml2, {compact:true,spaces:4});
                                            let jsonParse2 = JSON.parse( json2 );
                                            let checkVo2 = jsonParse2.cargCsclPrgsInfoQryRtnVo;

                                            if( checkVo2.ntceInfo.hasOwnProperty('_text')) {
                                                //error
                                                res.status(200).send( {"infoDataList" : infoDataList, "message":"LIST" } );
                                                //res.status(200).send({"message":"ERROR", "errMsg":checkVo2.ntceInfo._text});
                                            }else{
                                                // 단건
                                                // 오류가 아니면서(ntceInfo._text) tCnt가 0 인 경우 데이터가 없음.
                                                if( 0 == checkVo2.tCnt._text ) {
                                                    // 조회 정보가 없는 경우
                                                    res.status(200).send( {"infoDataList" : infoDataList, "message":"LIST" } );
                                                } else {
                                                    //console.log( checkVo2.tCnt._text );
                                                    // 조회 정보가 존재 하는 경우
                                                    const infoData = setPassInfoData(checkVo2.cargCsclPrgsInfoQryVo);
                                                    let detailDataList = [];
                                                    
                                                    if( 1 == checkVo.tCnt._text ) {
                                                        const detailData = setPassInfoDetailData(checkVo2.cargCsclPrgsInfoDtlQryVo, 1);
                                                        detailDataList.push(detailData);
                                                    } else if( 1 < checkVo2.tCnt._text ) {
                                                        //Detail이 있는 경우
                                                        const loop = checkVo2.cargCsclPrgsInfoDtlQryVo;
                                                        let j = checkVo2.tCnt._text;
                                                        loop.forEach( element =>{
                                                            const detailData = setPassInfoDetailData(element, j--);
                                                            detailDataList.push(detailData);
                                                        });
                                                    }
                                                    res.status(200).send( {"infoDataList" : infoDataList, "infoData" : infoData, "detailDataList" : detailDataList, "message":"LIST" } );
                                                }
                                            }

                                        }
                                    }
                                }
                                );
                            }
                        }
                    } else {
                        //error
                        res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                    }
                } else {
                    // 단건
                    // 오류가 아니면서(ntceInfo._text) tCnt가 0 인 경우 데이터가 없음.
                    
                    if( 0 > checkVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        //console.log( checkVo.tCnt._text );
                        // 조회 정보가 존재 하는 경우
                        //returnList.push( setPassInfoData(checkVo.cargCsclPrgsInfoQryVo) );
                        const infoData = setPassInfoData(checkVo.cargCsclPrgsInfoQryVo);
                        let detailDataList = [];
                        if( 1 == checkVo.tCnt._text ) {
                            const detailData = setPassInfoDetailData(checkVo.cargCsclPrgsInfoDtlQryVo, 1);
                            detailDataList.push(detailData);
                        }
                        else if( 1 < checkVo.tCnt._text ) {
                            //Detail이 있는 경우
                            const loop = checkVo.cargCsclPrgsInfoDtlQryVo;
                            let i = checkVo.tCnt._text;
                            if( undefined != loop ) {
                                loop.forEach( element =>{
                                    const detailData = setPassInfoDetailData(element, i--);
                                    detailDataList.push(detailData);
                                });
                            }
                        }
                        //console.log(returnList);
                        res.status(200).send( {"infoData" : infoData, "detailDataList" : detailDataList, "message":"INFO"} );
                    }

                }
            }
        }
    });
}

const setPassInfoData = (vo) => {
    const returnValue = {
        "message":'',
        "cargMtNo":vo.cargMtNo._text, //화물관리번호
        "mblNo":vo.mblNo._text,      //M-B/L
        "hblNo":vo.hblNo._text,      //H-B/L
        "shcoFlco":vo.shcoFlco._text, //선사
        "vydf":vo.vydf._text, //항차
        "agnc":vo.agnc._text, //선사(대리점)
        "shipNat":vo.shipNat._text, //선박국적코드
        "shipNatNm":vo.shipNatNm._text, //선박국적
        "shipNat_text":vo.shipNat._text + vo.shipNatNm._text, //선박국적코드선박국적명
        "shipNm":vo.shipNm._text, //선박명
        "cargTp":vo.cargTp._text, //화물구분
        "blPtNm":vo.blPtNm._text, //B/L타입
        "ttwg":vo.ttwg._text, //총중량(KG)
        "msrm":vo.msrm._text, //총용적
        "prnm":vo.prnm._text, //품명
        "pckGcnt":vo.pckGcnt._text, //포장개수
        "pckUt":vo.pckUt._text, //포장단위
        "pck_text":vo.pckGcnt._text + " " + vo.pckUt._text, //포장개수포장단위
        "spcnCargCd":vo.spcnCargCd._text, //특수화물코드(KG)
        "cntrGcnt":vo.cntrGcnt._text, //컨개수
        "cntrNo":vo.cntrNo._text, //컨번호
        "cntr_text":vo.cntrGcnt._text + "/" + vo.cntrNo._text, //컨개수/컨번호
        "ldprCd":vo.ldprCd._text, //적재항코드
        "ldprNm":vo.ldprNm._text, //적재항
        "lodCntyCd":vo.lodCntyCd._text,   //적출국가코드
        "ldpr_text":vo.ldprCd._text + ":" + vo.ldprNm._text + "," + vo.lodCntyCd._text, //적재항코드:적재항명,적출국가코드
        "dsprCd":vo.dsprCd._text,    //양하항코드
        "dsprNm":vo.dsprNm._text, //양하항
        "dspr_text":vo.dsprCd._text + " - " + vo.dsprNm._text, //양하항코드 - 양하항명
        "etprCstm":vo.etprCstm._text, //입항세관
        "etprDt":vo.etprDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //입항일시(YYYY-MM-DD)
        "prgsStts":vo.prgsStts._text, //화물상태
        "csclPrgsStts":vo.csclPrgsStts._text, //통관진행
        "prcsDttm":vo.prcsDttm._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, "$1-$2-$3 $4:$5:$6"), //최종처리일시(YYYY-MM-DD HH:mm:ss)
        "mtTrgtCargYnNm":vo.mtTrgtCargYnNm._text, //관리대상
        "rlseDtyPridPassTpcd":vo.rlseDtyPridPassTpcd._text, //반출의무과태료
        "dclrDelyAdtxYn":vo.dclrDelyAdtxYn._text //신고지연가산세
    }

    return returnValue;
}

const setPassInfoDetailData = (vo, i) => {
    const returnValue = {
        no:i, //
        cargTrcnRelaBsopTpcd:vo.cargTrcnRelaBsopTpcd._text,   //처리구분
        prcsDttm:vo.prcsDttm._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, "$1-$2-$3 $4:$5:$6"),   //처리일시(YYYY-MM-DD HH:mm:ss)
        shedSgn:vo.shedSgn._text, //장치장 장치위치
        shedNm:vo.shedNm._text,   //장치장명
        pck_text:(vo.pckGcnt._text!=undefined?vo.pckGcnt._text:"") + " " + (vo.pckUt._text!=undefined?vo.pckUt._text:""), //포장개수(단위)
        wght_text:(vo.wght._text!=undefined?vo.wght._text:"") + " " + (vo.wghtUt._text!=undefined?vo.wghtUt._text:""),   //중량(kg)
        rlbrDttm:vo.rlbrDttm._text,   //반출입(처리)일시
        rlbrCn:vo.rlbrCn._text,   //반출입(처리)내용
        dclrNo:vo.dclrNo._text,   //신고번호
        rlbrBssNo:vo.rlbrBssNo._text,   //반출입근거번호
        bfhnGdncCn:vo.bfhnGdncCn!=undefined?vo.bfhnGdncCn._text:""   //사전안내내용
    };
    return returnValue;
}

// 서비스ID : API005
// 서비스명 : 장치장 정보
// 서비스명 : retrieveShedInfo
// 서비스설명 : 보세구역 부호 및 주소 정보 제공
const selectShedInfo = (req, res) => {
    
    if( req.body.snarSgn == undefined ) {
        res.status(401).send('NO_SNARSGN');
    }
    

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.SHED_URL+'?&crkyCn='+config.UNI_API_KEY_SHED + "&snarSgn=" + req.body.snarSgn;
     //console.log(uni_url);
    request({
        // url:'https://unipass.customs.go.kr:38010/ext/rest/shedInfoQry/retrieveShedInfo?crkyCn=z290a250z015h280a090h000n2&snarSgn=03077006',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API005 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS API005 Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.shedInfoQryRtnVo;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                //let returnList = [];
                // ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "snarNm":checkVo.shedInfoQryRsltVo.snarNm._text, //장치장명
                            "snarAddr":checkVo.shedInfoQryRsltVo.snarAddr._text, //장치장주소
                            "snartelno":checkVo.shedInfoQryRsltVo.snartelno._text, //장치장전화번호
                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}

// 서비스ID : API014
// 서비스명 : 관세사 내역
// 서비스명 : retrieveLcaBrkd
// 서비스설명 : 관세사 부호 및 전화번호등 상세정보 제공
const selectLcaInfo = (req, res) => {

    if( req.body.lcaSgn == undefined ) {
        res.status(401).send('NO_LCASGN');
    }
    

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.LCA_URL+'?&crkyCn='+config.UNI_API_KEY_LCA + "&lcaSgn=" + req.body.lcaSgn;
     //console.log(uni_url);
    request({
        // url:'https://unipass.customs.go.kr:38010/ext/rest/lcaBrkdQry/retrieveLcaBrkd?crkyCn=q220k230l035l210a090v050e2&lcaSgn=41637',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API014 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS selectLcaInfo Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.lcaBrkdQryRtnVo;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                //let returnList = [];
                // ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                } else {
                    if( 0 > checkVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    }
                    else if( 0 == checkVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "lcaConm":checkVo.lcaBrkdQryRsltVo.lcaConm._text, //관세사명
                            "jrsdCstmNm":checkVo.lcaBrkdQryRsltVo.jrsdCstmNm._text, //관할세관
                            "addr":checkVo.lcaBrkdQryRsltVo.addr._text, //관세사주소
                            "telno":checkVo.lcaBrkdQryRsltVo.telno._text, //전화번호
                        }
                        res.status(200).send( {"infoData" : infoData ,"message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}

// 서비스ID : API014
// 서비스명 : 관세사 내역
// 서비스명 : retrieveLcaBrkd
// 서비스설명 : 관세사 부호 및 전화번호등 상세정보 제공
const selectCntrInfo = (req, res) => {

    if( req.body.cargMtNo == undefined ) {
        res.status(401).send('NO_CARGMTNO');
    }
    

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.CNTR_URL+'?&crkyCn='+config.UNI_API_KEY_CNTR + "&cargMtNo=" + req.body.cargMtNo;
     //console.log(uni_url);
    request({
        // url:'https://unipass.customs.go.kr:38010/ext/rest/cntrQryBrkdQry/retrieveCntrQryBrkd?&crkyCn=t280x280a075b260y000w060o0&cargMtNo=20MAEU0488I10450002',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API014 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS selectCntrInfo Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.cntrQryBrkdQryRtnVo;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                //let returnList = [];
                // ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                } else {
                    
                    if ( 0 > checkVo.tCnt._text){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else if( 1 == checkVo.tCnt._text ) { // 검색결과가 1건인 경우
                        let returnList = [];
                        const infoData = [
                            "1", //순번
                            checkVo.cntrQryBrkdQryVo.cntrNo._text, //컨테이너번호
                            checkVo.cntrQryBrkdQryVo.cntrStszCd._text, //컨테이너규격코드
                            checkVo.cntrQryBrkdQryVo.cntrSelgNo1._text, //컨테이너봉인번호1
                            checkVo.cntrQryBrkdQryVo.cntrSelgNo2._text, //컨테이너봉인번호2
                            checkVo.cntrQryBrkdQryVo.cntrSelgNo3._text, //컨테이너봉인번호3
                        ];
                        returnList[0] = infoData;
                        res.status(200).send( {"infoDataList" : returnList, "message":"SUCCESS"} );
                    }else {
                        // 조회 정보가 존재 하는 경우
                        let returnList = [];
                        let loop = checkVo.cntrQryBrkdQryVo;
                        let i = 1;
                        if( undefined != loop ) {
                            loop.forEach( element =>{
                                const infoData = [
                                    i++, //순번
                                    element.cntrNo._text, //컨테이너번호
                                    element.cntrStszCd._text, //컨테이너규격코드
                                    element.cntrSelgNo1._text, //컨테이너봉인번호1
                                    element.cntrSelgNo2._text, //컨테이너봉인번호2
                                    element.cntrSelgNo3._text, //컨테이너봉인번호3
                                ];
                                returnList[i-2] = infoData;
                            });
                        }
                        res.status(200).send( {"infoDataList" : returnList, "message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}


// 서비스ID : API002
// 서비스명 : 수출신고번호별 수출이행 내역
// 서비스명 : retrieveExpDclrNoPrExpFfmnBrkd
// 서비스설명 : 수출신고번호별 수출이행내역 및 잔량 정보 제공
const selectExpDclrInfo = (req, res) => {
    if( req.body.blNo == undefined && req.body.expDclrNo == undefined ) {
        res.status(401).send('NO_MBLNO');
    }
    let param = "";
    if(req.body.blNo != undefined){
        param += "&blNo=" + req.body.blNo;
    }
    if(req.body.expDclrNo != undefined){
        param += "&expDclrNo=" + req.body.expDclrNo.replace(/-/g, "");
    }
    
    // CORS 처리를 위한 response HEADER 처리
    let OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.EXPORT_URL+'?&crkyCn='+config.UNI_API_KEY_EXPORT+param;
    //console.log(uni_url);
    request({
        // url : 'https://unipass.customs.go.kr:38010/ext/rest/expDclrNoPrExpFfmnBrkdQry/retrieveExpDclrNoPrExpFfmnBrkd?crkyCn=c250r165v102q229m080h090a0&blNo=MIQOSEL001873',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API002 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS selectExpDclrInfo Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse.expDclrNoPrExpFfmnBrkdQryRtnVo;
                
                if(checkVo.ntceInfo.hasOwnProperty("_text")){
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                } else if(req.body.blNo != undefined){ //bl번호로 조회
                    let infoDataList = [];
                    // 정상 적인 경우
                    if ( 1 == checkVo.tCnt._text ) {
                        // 단건 조회 한 경우
                        infoDataList.push( setExpBlInfoData(checkVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo) );
                        res.status(200).send({"infoDataList":infoDataList, "message":"BL"});
                    } else if ( 1 < checkVo.tCnt._text ) {
                        // 다건 조회 한 경우
                        checkVo.expDclrNoPrExpFfmnBrkdBlNoQryRsltVo.forEach( element =>{
                            infoDataList.push( setExpBlInfoData(element) );
                        });
                        // console.log(returnList  );
                        res.status(200).send( {"infoDataList":infoDataList, "message":"BL"} );
                    } else if (0 == checkVo.tCnt._text) {
                        // 조회결과가 없는 경우
                        res.status(200).send({"message":"NO_DATA"});
                    } else{
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    }
                } else{ //수출신고번호로 조회
                    if(checkVo.ntceInfo.hasOwnProperty("_text")){ //에러
                        res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                    }
                    else if(!checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.expDclrNo.hasOwnProperty("_text")){ //수출신고번호(필수값)이 없는 경우, 조회결과가 없음
                        res.status(200).send({"message":"NO_DATA"});
                    }else {
                        // 정상 적인 경우
                        const infoData = {
                            exppnConm:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.exppnConm._text, //수출자
                            mnurConm:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.mnurConm._text, //제조자
                            acptDt:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.acptDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //수리일자 (YYYY-MM-DD)
                            shpmCmplYn:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.shpmCmplYn._text, //선적완료여부
                            csclPck:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.csclPckGcnt._text + " " + checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.csclPckUt._text, //통관포장개수 + 통관포장단위
                            shpmPck:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.shpmPckGcnt._text + " " + checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.shpmPckUt._text, //선적포장개수 + 선적포장단위
                            loadDtyTmlm:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.loadDtyTmlm._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //적재의무기한 (YYYY-MM-DD)
                            csclWght:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.csclWght._text, //통관중량(KG)
                            shpmWght:checkVo.expDclrNoPrExpFfmnBrkdQryRsltVo.shpmWght._text, //선적중량(KG)
                        }
                        let detailDataList = [];
                        if( checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo != undefined && checkVo.tCnt._text > 0 ){
                            if ( 1 == checkVo.tCnt._text ) {
                                const blData = [
                                    checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo.blNo._text, //B/L번호
                                    checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo.tkofDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //출항일자 (YYYY-MM-DD)
                                    checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo.shpmPckGcnt._text + " " + checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo.shpmPckUt._text, //선적포장개수 선적포장단위
                                ];
                                detailDataList.push( blData );
                            } else if ( 1 < checkVo.tCnt._text ) {
                                // 다건 조회 한 경우
                                checkVo.expDclrNoPrExpFfmnBrkdDtlQryRsltVo.forEach( element =>{
                                    const blData = [
                                        element.blNo._text, //B/L번호
                                        element.tkofDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //출항일자 (YYYY-MM-DD)
                                        element.shpmPckGcnt._text + " " + element.shpmPckUt._text //선적포장개수 선적포장단위
                                    ];
                                    detailDataList.push( blData );
                                });
                            } /*else{
                                // Detail 조회결과가 없는 경우
                                res.status(200).send({"message":"NO_DATA"});
                            }*/
                        }
                        res.status(200).send({"infoData":infoData, "detailDataList":detailDataList, "message":"DCLRNO"});
                    }
                }
            }
        }
    });

}


const setExpBlInfoData = (vo) => {
    let expDclrNo = "";
    if (vo.expDclrNo._text != undefined && vo.expDclrNo._text.length > 7){
        expDclrNo = vo.expDclrNo._text.substring(0,5) + "-" + vo.expDclrNo._text.substring(5, 7) + "-" + vo.expDclrNo._text.substring(7);
    }
    const returnValue = {
        'exppnConm':vo.exppnConm._text, //수출자
        'acptDt':vo.acptDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //수리일자 (YYYY-MM-DD)
        'csclPck_text':vo.csclPckGcnt._text + " " + vo.csclPckUt._text, //통관포장개수
        'expDclrNo':expDclrNo, //수출신고번호
        'loadDtyTmlm':vo.loadDtyTmlm._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //적재의무기간 (YYYY-MM-DD)
        'csclWght':vo.csclWght._text, //통관중량(KG)
        'mrn':vo.mrn._text, //적하목록관리번호
        'shpmAirptPortNm':vo.shpmAirptPortNm._text, //선기적지
        'shpmPck_text':vo.shpmPckGcnt._text + " " + vo.shpmPckUt._text, //선기적포장개수
        'dvdeWdrw':vo.dvdeWdrw._text, //분할회수
        'tkofDt':vo.tkofDt._text.replace(/([0-9]{4})([0-9]{2})([0-9]{2})/, "$1-$2-$3"), //출항일자 (YYYY-MM-DD)
        'shpmWght':vo.shpmWght._text, //선기적중량(KG)
        'shpmCmplYn':vo.shpmCmplYn._text //선기적완료여부
    }
    return returnValue;
}


// 서비스ID : API019
// 서비스명 : 통계부호내역조회
// 서비스명 : retrieveStatsSgnBrkd

const API019 = (req, res) => {
    if( req.body.param == undefined ) {
        res.status(401).send('NO_SNARSGN');
        return;
    }
    

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.SGN_URL+'?&crkyCn='+config.URL_API_KEY_SGN + "&statsSgnTp=" + encodeURIComponent(req.body.param);
    if(req.body.param2) {
    	uni_url += "&cdValtValNm=" + encodeURIComponent(req.body.param2);
    } 
    if(req.body.param3) {
    	uni_url += "&cdValtVal=" + encodeURIComponent(req.body.param3);
    } 
    console.log(uni_url);
    request({
        //url:'https://unipass.customs.go.kr:38010/ext/rest/statsSgnQry/retrieveStatsSgnBrkd?crkyCn=b200r200q055k200w090r070s0&statsSgnTp=A01',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API019 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS API019 Error');
        } else {

             apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.statsSgnQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.statsSgnQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.statsSgnQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.statsSgnQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.statsSgnQryRtnVo.othStatsSgnQryVo, //DATA
                            "cnt" :checkVo.statsSgnQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                        //console.log(checkVo.statsSgnQryRtnVo.othStatsSgnQryVo)
                    }

                }
            }
        }
    });
}

// 서비스ID : API010
// 서비스명 : 통관고유부호조회
// 서비스명 : retrieveEcm

const API010 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }

    

    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.ECM_URL+'?&crkyCn='+config.URL_API_KEY_ECM + "&ecm=" + encodeURIComponent(req.body._text) + "&brno=" + encodeURIComponent(req.body._number)
     //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            res.status('401').send('UNI-PASS API010 Error');
        } else {

            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                //console.log(checkVo)
                if( checkVo.ecmQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ecmQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.ecmQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.ecmQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.ecmQryRtnVo.ecmQryRsltVo, //DATA
                            "cnt" :checkVo.ecmQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                        //console.log(checkVo.statsSgnQryRtnVo.othStatsSgnQryVo)
                    }

                }
            }
        }
    });
}

// 서비스ID : API025
// 서비스명 : 통관단일창구 처리이력조회
// 서비스명 : retrieveEcm

const API025 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }

    

    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.APFMPRCSSTUS_URL+'?&crkyCn='+config.URL_API_KEY_APFMPRCSSTUS + "&reqRqstNo=" + encodeURIComponent(req.body._text);
    //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            // res.status(error.statusCode).send(error);
            res.status('401').send('UNI-PASS API025 Error');
        } else {

            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                //console.log(checkVo)
                if( checkVo.apfmPrcsStusQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.apfmPrcsStusQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.apfmPrcsStusQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.apfmPrcsStusQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.apfmPrcsStusQryRtnVo.apfmPrcsStusQryVo, //DATA
                            "cnt" :checkVo.apfmPrcsStusQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                        //console.log(checkVo.statsSgnQryRtnVo.othStatsSgnQryVo)
                    }

                }
            }
        }
    });
}
// 서비스ID : API009
// 서비스명 : 항공사 내역
// 서비스명 : retrieveFlcoBrkd

const API009 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }

    

    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.FLCOBRKD_URL+'?&crkyCn='+config.URL_API_KEY_FLCOBRKD + "&flcoSgn=" + encodeURIComponent(req.body._text);
    //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            // res.status(error.statusCode).send(error);
            res.status('401').send('UNI-PASS API009 Error');
        } else {

            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                //console.log(checkVo)
                if( checkVo.flcoBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.flcoBrkdQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.flcoBrkdQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.flcoBrkdQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.flcoBrkdQryRtnVo.flcoBrkdQryRsltVo, //DATA
                            "cnt" :checkVo.flcoBrkdQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}

// 서비스ID : API023
// 서비스명 : 보세운송차량등록 내역 조회
// 서비스명 : retrieveImpDclrCrfnVrfc

const API023 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }

    

    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.API023_URL+'?&crkyCn='+config.URL_API_KEY_API023 + "&btcoSgn=" + encodeURIComponent(req.body.btcoSgn)+ "&vhclNoSanm=" + encodeURIComponent(req.body.vhclNoSanm);
    //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            // res.status(error.statusCode).send(error);
            res.status('401').send('UNI-PASS API023 Error');
        } else {

            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.hasOwnProperty('btcoVhclQryCondVo') ) {
                    res.status(200).send({"message":"error", "errMsg":checkVo.btcoVhclQryCondVo.ntceInfo._text});
                    return false;
                }
                if( !checkVo.hasOwnProperty('btcoVhclQryRtnVo')) {
                    //error
                    res.status(200).send({"message":"error", "errMsg": "에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                } else {
                    
                    if( 0 > checkVo.btcoVhclQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"error", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.btcoVhclQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.btcoVhclQryRtnVo.btcoVhclQryRsltVo, //DATA
                            "cnt" :checkVo.btcoVhclQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                        //console.log(checkVo.statsSgnQryRtnVo.othStatsSgnQryVo)
                    }

                }
            }
        }
    });
}

// 서비스ID : API026
// 서비스명 : 선박회사 목록
// 서비스명 : retrieveShipCoLst

const API026 = (req, res) => {
    if( req.body.shipCoNm == undefined ) {
        res.status(401).send('NO_SNARSGN');
        return;
    }
    

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.API026_URL+'?&crkyCn='+config.URL_API_KEY_API026 + "&shipCoNm=" + encodeURIComponent(req.body.shipCoNm);
     //console.log(uni_url);
    request({
        //url:'https://unipass.customs.go.kr:38010/ext/rest/statsSgnQry/retrieveStatsSgnBrkd?crkyCn=b200r200q055k200w090r070s0&statsSgnTp=A01',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API026 Error:', error);
            res.status('401').send('UNI-PASS API026 Error');
        } else {

             apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.shipCoLstQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.shipCoLstQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.shipCoLstQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.shipCoLstQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.shipCoLstQryRtnVo.shipCoLstQryRsltVo, //DATA
                            "cnt" :checkVo.shipCoLstQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}

// 서비스ID : API027
// 서비스명 : 선박회사내역(선박회사 부호, 상호, 주소 등 상세 정보 제공)
// 서비스명 : retrieveImpDclrCrfnVrfc

const API027 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }

    

    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.API027_URL+'?&crkyCn='+config.URL_API_KEY_API027 + "&shipCoSgn=" + encodeURIComponent(req.body.shipCoSgn);
    //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            res.status('401').send('UNI-PASS API027 Error');
        } else {

            if( apiRes.statusCode == 200 ) {
                try {
                    let json = convert.xml2json(xml, {compact:true,spaces:4});
                    let jsonParse = JSON.parse( json );
                    let checkVo = jsonParse;
                    
                    // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                    let returnList = [];
                    //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                    //console.log(checkVo)
                    if( checkVo.shipCoBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                        //error
                        res.status(200).send({"message":"ERROR", "errMsg":checkVo.shipCoBrkdQryRtnVo.ntceInfo._text});
                    } else {
                        
                        if( 0 > checkVo.shipCoBrkdQryRtnVo.tCnt._text ){
                            //tCnt가 0보다 작은 경우 에러
                            res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                        } else if( 0 == checkVo.shipCoBrkdQryRtnVo.tCnt._text ) {
                            // 조회 정보가 없는 경우
                            res.status(200).send( {"message" : "NO_DATA"} );
                        } else {
                            // // 조회 정보가 존재 하는 경우
                            const infoData = {
                                "data":checkVo.shipCoBrkdQryRtnVo.shipCoBrkdQryRsltVo, //DATA
                                "cnt" :checkVo.shipCoBrkdQryRtnVo.tCnt._text //total
    
                            }
                            res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                            //console.log(checkVo.statsSgnQryRtnVo.othStatsSgnQryVo)
                        }
    
                    }
                    
                } catch (error) {
                    res.status(200).json([]);
                }
            }
        }
    });
}

// 서비스ID : API029
// 서비스명 : 세관장확인대상 법령코드 조회
// 서비스명 : retrieveCcctLworCd

const API029 = (req, res) => {   

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.API029_URL+'?&crkyCn='+config.URL_API_KEY_API029 + "&hsSgn=" + encodeURIComponent(req.body.hsSgn)+ "&imexTp=" + encodeURIComponent(req.body.imexTp);
     //console.log(uni_url);
    request({
        //url:'https://unipass.customs.go.kr:38010/ext/rest/statsSgnQry/retrieveStatsSgnBrkd?crkyCn=b200r200q055k200w090r070s0&statsSgnTp=A01',
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API029 Error:', error);
            res.status('401').send('UNI-PASS API029 Error');
        } else {

             apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.ccctLworCdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ccctLworCdQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.ccctLworCdQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.ccctLworCdQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send( {"message" : "NO_DATA"} );
                    } else {
                        // // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.ccctLworCdQryRtnVo.ccctLworCdQryRsltVo, //DATA
                            "cnt" :checkVo.ccctLworCdQryRtnVo.tCnt._text //total

                        }
                        res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                    }

                }
            }
        }
    });
}

// 서비스ID : API012
// 서비스명 : 관세환율 정보조회
// 서비스명 : retrieveTrifFxrtInfo

const API012 = (req, res) => {   

    const OPTIONS = {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.API012_URL+'?&crkyCn='+config.URL_API_KEY_API012 + "&qryYymmDd=" + encodeURIComponent(req.body.qryYymmDd)+ "&imexTp=" + encodeURIComponent(req.body.imexTp);
    //console.log(uni_url);
    request({
        url : uni_url,
        method:'GET'
    }, (error, apiRes, xml ) => {
        if(error) {
            console.log('UNI-PASS API012 Error:', error);
            // res.status(error.statusCode).send(error.statusCode);
            res.status('401').send('UNI-PASS API012 Error');
        } else {
            apiRes.headers = OPTIONS;
            if( apiRes.statusCode == 200 ) {
                let json = convert.xml2json(xml, {compact:true,spaces:4});
                let jsonParse = JSON.parse( json );
                let checkVo = jsonParse;
                
                // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
                let returnList = [];
                //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
                if( checkVo.trifFxrtInfoQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                    //error
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.trifFxrtInfoQryRtnVo.ntceInfo._text});
                } else {
                    
                    if( 0 > checkVo.trifFxrtInfoQryRtnVo.tCnt._text ){
                        //tCnt가 0보다 작은 경우 에러
                        res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                    } else if( 0 == checkVo.trifFxrtInfoQryRtnVo.tCnt._text ) {
                        // 조회 정보가 없는 경우
                        res.status(200).send({"message":"NO_DATA"});
                    } else {
                        // 조회 정보가 존재 하는 경우
                        const infoData = {
                            "data":checkVo.trifFxrtInfoQryRtnVo.trifFxrtInfoQryRsltVo, //DATA
                            "cnt" :checkVo.trifFxrtInfoQryRtnVo.tCnt._text //total
                        }
                        res.status(200).send( {"infoData":infoData, "message":"SUCCESS"} );
                    }
                }
            }
        }
    });
}

//서비스ID : API008
//서비스명 : 항공사목록조회
//서비스명 : retrieveFlcoLst

const API008 = (req, res) => {
 if( req.body.param == undefined ) {
     res.status(401).send('NO_SNARSGN');
     return;
 }
 

 const OPTIONS = {
     "Access-Control-Allow-Origin":"*",
     "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
     "Access-Control-Allow-Max-Age":"3600",
     "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
 }
 // API URL 조합한다.
 let uni_url = config.UNI_PASS_URL+config.FLCOLST_URL+'?&crkyCn='+config.URL_API_KEY_FLCOLST + "&flcoNm=" + encodeURIComponent(req.body.param);
  //console.log(uni_url);
 request({
     //url:'https://unipass.customs.go.kr:38010/ext/rest/flcoLstQry/retrieveFlcoLst?crkyCn=h250s270b085y260t070b090q0&flcoNm=대한항공',
     url : uni_url,
     method:'GET'
 }, (error, apiRes, xml ) => {
     if(error) {
         console.log('UNI-PASS API008 Error:', error);
        //  res.status(error.statusCode).send(error.statusCode);
        res.status('401').send('UNI-PASS API008 Error');
     } else {

          apiRes.headers = OPTIONS;
         if( apiRes.statusCode == 200 ) {
             let json = convert.xml2json(xml, {compact:true,spaces:4});
             let jsonParse = JSON.parse( json );
             let checkVo = jsonParse;
             
             // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
             let returnList = [];
             //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
             if( checkVo.flcoLstQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                 //error
                 res.status(200).send({"message":"ERROR", "errMsg":checkVo.flcoLstQryRtnVo.ntceInfo._text});
             } else {
                 
                 if( 0 > checkVo.flcoLstQryRtnVo.tCnt._text ){
                     //tCnt가 0보다 작은 경우 에러
                     res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                 } else if( 0 == checkVo.flcoLstQryRtnVo.tCnt._text ) {
                     // 조회 정보가 없는 경우
                     res.status(200).send( {"message" : "NO_DATA"} );
                 } else if( 1 == checkVo.flcoLstQryRtnVo.tCnt._text ) { // 검색결과가 1건인 경우
                     // // 조회 정보가 존재 하는 경우
                     const infoData = {
                         "data":[checkVo.flcoLstQryRtnVo.flcoLstQryRsltVo], //DATA
                         "cnt" :checkVo.flcoLstQryRtnVo.tCnt._text //total
                     }
                     res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                     //console.log(checkVo.flcoLstQryRtnVo.flcoLstQryRsltVo)
                 
                 } else {
                     // // 조회 정보가 존재 하는 경우
                     const infoData = {
                         "data":checkVo.flcoLstQryRtnVo.flcoLstQryRsltVo, //DATA
                         "cnt" :checkVo.flcoLstQryRtnVo.tCnt._text //total

                     }
                     res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                     //console.log(checkVo.flcoLstQryRtnVo.flcoLstQryRsltVo)
                 }

             }
         }
     }
 });
}

//서비스ID : API006
//서비스명 : 화물운송주선업자 목록
//서비스명 : retrieveFrwrLst

const API006 = (req, res) => {
if( req.body.frwrName == undefined && req.body.gubunCode == undefined ) {
   res.status(401).send('NO_SNARSGN');
   return;
}


const OPTIONS = {
   "Access-Control-Allow-Origin":"*",
   "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
   "Access-Control-Allow-Max-Age":"3600",
   "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}
// API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.FRWRLST_URL+'?&crkyCn='+config.URL_API_KEY_FRWRLST + "&frwrNm=" + encodeURIComponent(req.body.frwrName) + "&intpTp=" + encodeURIComponent(req.body.gubunCode);
//console.log(uni_url);
request({
   //url:'https://unipass.customs.go.kr:38010/ext/rest/frwrLstQry/retrieveFrwrLst?crkyCn=l270g270i015g290o020z040x1&frwrNm=한국&intpTp=3
   url : uni_url,
   method:'GET'
}, (error, apiRes, xml ) => {
   if(error) {
       console.log('UNI-PASS API006 Error:', error);
    //    res.status(error.statusCode).send(error.statusCode);
    res.status('401').send('UNI-PASS API006 Error');
   } else {

        apiRes.headers = OPTIONS;
       if( apiRes.statusCode == 200 ) {
           let json = convert.xml2json(xml, {compact:true,spaces:4});
           let jsonParse = JSON.parse( json );
           let checkVo = jsonParse;
           //console.log(checkVo.frwrLstQryRtnVo)
           // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
           let returnList = [];
           //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
           if( checkVo.frwrLstQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
               //error
               res.status(200).send({"message":"ERROR", "errMsg":checkVo.frwrLstQryRtnVo.ntceInfo._text});
           } else {
               
               if( 0 > checkVo.frwrLstQryRtnVo.tCnt._text ){
                   //tCnt가 0보다 작은 경우 에러
                   res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
               } else if( 0 == checkVo.frwrLstQryRtnVo.tCnt._text ) {
                   // 조회 정보가 없는 경우
                   res.status(200).send( {"message" : "NO_DATA"} );
               } else if( 1 == checkVo.frwrLstQryRtnVo.tCnt._text ) { // 검색결과가 1건인 경우
                   // // 조회 정보가 존재 하는 경우
                   const infoData = {
                       "data":[checkVo.frwrLstQryRtnVo.frwrLstQryRsltVo], //DATA
                       "cnt" :checkVo.frwrLstQryRtnVo.tCnt._text //total
                   }
                   res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                   //console.log(checkVo.frwrLstQryRtnVo.flcoLstQryRsltVo)
               
               } else {
                   // // 조회 정보가 존재 하는 경우
                   const infoData = {
                       "data":checkVo.frwrLstQryRtnVo.frwrLstQryRsltVo, //DATA
                       "cnt" :checkVo.frwrLstQryRtnVo.tCnt._text //total

                   }
                   res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                   //console.log(checkVo.frwrLstQryRtnVo.flcoLstQryRsltVo)
               }

           }
       }
   }
});
}

//서비스ID : API007
//서비스명 : 화물운송주선업자내역조회
//서비스명 : retrieveFrwrBrkd

const API007 = (req, res) => {
 //console.log(req.body)
 const OPTIONS = {
     "Access-Control-Allow-Origin":"*",
     "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
     "Access-Control-Allow-Max-Age":"3600",
     "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
 }

 // API URL 조합한다.
 let uni_url = config.UNI_PASS_URL+config.FRWRBRKD_URL+'?&crkyCn='+config.URL_API_KEY_FRWRBRKD + "&frwrSgn=" + encodeURIComponent(req.body.param);
 //console.log(uni_url);
 request({
     url : uni_url,
     method:'GET'
 }, (error, apiRes, xml ) => {
     if(error) {
        //  res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API007 Error');
     } else {

         if( apiRes.statusCode == 200 ) {
             let json = convert.xml2json(xml, {compact:true,spaces:4});
             let jsonParse = JSON.parse( json );
             let checkVo = jsonParse;
             
             // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
             let returnList = [];
             //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
             //console.log(checkVo)
             if( checkVo.frwrBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                 //error
                 res.status(200).send({"message":"ERROR", "errMsg":checkVo.frwrBrkdQryRtnVo.ntceInfo._text});
             } else {
                 
                 if( 0 > checkVo.frwrBrkdQryRtnVo.tCnt._text ){
                     //tCnt가 0보다 작은 경우 에러
                     res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                 } else if( 0 == checkVo.frwrBrkdQryRtnVo.tCnt._text ) {
                     // 조회 정보가 없는 경우
                     res.status(200).send( {"message" : "NO_DATA"} );
                 } else {
                     // // 조회 정보가 존재 하는 경우
                     const infoData = {
                         "data":checkVo.frwrBrkdQryRtnVo.frwrBrkdQryRsltVo, //DATA
                         "cnt" :checkVo.frwrBrkdQryRtnVo.tCnt._text //total

                     }
                     res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                     //console.log(checkVo.frwrBrkdQryRtnVo.frwrBrkdQryRsltVo)
                 }

             }
         }
     }
 });
}

//서비스ID : API011
//서비스명 : 해외공급자부호조회
//서비스명 : retrieveOvrsSplrSgn

const API011 = (req, res) => {
//console.log(req.body)
const OPTIONS = {
   "Access-Control-Allow-Origin":"*",
   "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
   "Access-Control-Allow-Max-Age":"3600",
   "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

// API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.OVRSSPLRSGN_URL+'?&crkyCn='+config.URL_API_KEY_OVRSSPLRSGN + "&cntySgn=" + encodeURIComponent(req.body.cntySgn) + "&conm=" + encodeURIComponent(req.body.conm);
//console.log(uni_url);
request({
   url : uni_url,
   method:'GET'
}, (error, apiRes, xml ) => {
   if(error) {
    //    res.status(error.statusCode).send(error);
    res.status('401').send('UNI-PASS API011 Error');
   } else {

       if( apiRes.statusCode == 200 ) {
           let json = convert.xml2json(xml, {compact:true,spaces:4});
           let jsonParse = JSON.parse( json );
           let checkVo = jsonParse;
           
           // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
           let returnList = [];
           //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
           //console.log(checkVo)
           if( checkVo.ovrsSplrSgnQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
               //error
               res.status(200).send({"message":"ERROR", "errMsg":checkVo.ovrsSplrSgnQryRtnVo.ntceInfo._text});
           } else {
               
               if( 0 > checkVo.ovrsSplrSgnQryRtnVo.tCnt._text ){
                   //tCnt가 0보다 작은 경우 에러
                   res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
               } else if( 0 == checkVo.ovrsSplrSgnQryRtnVo.tCnt._text ) {
                   // 조회 정보가 없는 경우
                   res.status(200).send( {"message" : "NO_DATA"} );
               } else if( 1 == checkVo.ovrsSplrSgnQryRtnVo.tCnt._text ) {
                   // 조회 정보가 1건인 경우
                   const infoData = {
                           "data":[checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo], //DATA
                           "cnt" :checkVo.ovrsSplrSgnQryRtnVo.tCnt._text //total

                       }
                       res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                       //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
               } else {
                   // // 조회 정보가 존재 하는 경우
                   const infoData = {
                       "data":checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo, //DATA
                       "cnt" :checkVo.ovrsSplrSgnQryRtnVo.tCnt._text //total

                   }
                   res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                   //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
               }

           }
       }
   }
});
}
//서비스ID : API016
//서비스명 : 간이정액 적용/비적용 업체 조회
//서비스명 : retrieveSimlFxamtAplyNnaplyEnts

const API016 = (req, res) => {
console.log(req.body)
const OPTIONS = {
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
 "Access-Control-Allow-Max-Age":"3600",
 "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API016_URL+'?crkyCn='+config.URL_API_KEY_API016 + "&ecm=" + encodeURIComponent(req.body.param);
console.log(uni_url);
request({
 url : uni_url,
 method:'GET'
}, (error, apiRes, xml ) => {
 if(error) {
    //  res.status(error.statusCode).send(error);
    res.status('401').send('UNI-PASS API016 Error');
 } else {

     if( apiRes.statusCode == 200 ) {
         let json = convert.xml2json(xml, {compact:true,spaces:4});
         let jsonParse = JSON.parse( json );
         let checkVo = jsonParse;
         
         // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
         let returnList = [];
         //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
         console.log(checkVo)
         if( checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
             //error
             res.status(200).send({"message":"ERROR", "errMsg":checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.ntceInfo._text});
         } else {
             
             if( 0 > checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.tCnt._text ){
                 //tCnt가 0보다 작은 경우 에러
                 res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
             } else if( 0 == checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.tCnt._text ) {
                 // 조회 정보가 없는 경우
                 res.status(200).send( {"message" : "NO_DATA"} );
             } else if( 1 == checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.tCnt._text ) {
                 // 조회 정보가 1건인 경우
                 const infoData = {
                         "data":[checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.simlFxamtAplyNnaplyEntsQryRsltVo], //DATA
                         "cnt" :checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.tCnt._text //total

                     }
                     res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                     //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
             } else {
                 // // 조회 정보가 존재 하는 경우
                 const infoData = {
                     "data":checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.simlFxamtAplyNnaplyEntsQryRsltVo, //DATA
                     "cnt" :checkVo.simlFxamtAplyNnaplyEntsQryRtnVo.tCnt._text //total

                 }
                 res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                 //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
             }

         }
     }
 }
});
}

//서비스ID : API015
//서비스명 : 간이정액 환급율표
//서비스명 : retrieveSimlXamrttXtrnUser

const API015 = (req, res) => {
console.log(req.body)
const OPTIONS = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
"Access-Control-Allow-Max-Age":"3600",
"Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API015_URL+'?crkyCn='+config.URL_API_KEY_API015 + "&baseDt=" + encodeURIComponent(req.body.param1);

if(req.body.param2) {
	uni_url = uni_url+"&hsSgn="+ encodeURIComponent(req.body.param2);
}

console.log(uni_url);
request({
url : uni_url,
method:'GET'
}, (error, apiRes, xml ) => {
if(error) {
//    res.status(error.statusCode).send(error);
res.status('401').send('UNI-PASS API015 Error');
} else {

   if( apiRes.statusCode == 200 ) {
       let json = convert.xml2json(xml, {compact:true,spaces:4});
       let jsonParse = JSON.parse( json );
       let checkVo = jsonParse;
       
       // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
       let returnList = [];
       //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
       console.log(checkVo)
       if( checkVo.simlXamrttXtrnUserQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
           //error
           res.status(200).send({"message":"ERROR", "errMsg":checkVo.simlXamrttXtrnUserQryRtnVo.ntceInfo._text});
       } else {
           
           if( 0 > checkVo.simlXamrttXtrnUserQryRtnVo.tCnt._text ){
               //tCnt가 0보다 작은 경우 에러
               res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
           } else if( 0 == checkVo.simlXamrttXtrnUserQryRtnVo.tCnt._text ) {
               // 조회 정보가 없는 경우
               res.status(200).send( {"message" : "NO_DATA"} );
           } else if( 1 == checkVo.simlXamrttXtrnUserQryRtnVo.tCnt._text ) {
               // 조회 정보가 1건인 경우
               const infoData = {
                       "data":[checkVo.simlXamrttXtrnUserQryRtnVo.simlXamrttXtrnUserQryRsltVo], //DATA
                       "cnt" :checkVo.simlXamrttXtrnUserQryRtnVo.tCnt._text //total

                   }
                   res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                   //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
           } else {
               // // 조회 정보가 존재 하는 경우
               const infoData = {
                   "data":checkVo.simlXamrttXtrnUserQryRtnVo.simlXamrttXtrnUserQryRsltVo, //DATA
                   "cnt" :checkVo.simlXamrttXtrnUserQryRtnVo.tCnt._text //total

               }
               res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
               //console.log(checkVo.ovrsSplrSgnQryRtnVo.ovrsSplrSgnQryRsltVo)
           }

       }
   }
}
});
}

//서비스ID : API024
//서비스명 : 입출항보고내역
//서비스명 : retrieveIoprRprtBrkd

const API024 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.IOPRPRTLST_URL+'?&crkyCn='+config.URL_API_KEY_IOPRPRTLST + "&seaFlghIoprTpcd=" + encodeURIComponent(req.body.gubunCode) + "&shipCallImoNo=" + encodeURIComponent(req.body.shipCallImoNo);
        uni_url += "&cstmSgn=" + encodeURIComponent(req.body.customNo);
    //console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API024 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse;
               
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               let returnList = [];
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               //console.log(checkVo.ioprRprtBrkdQryRtnVo)
               if( checkVo.ioprRprtBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                   //error
                   res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
               } else {
                   
                   if( 0 > checkVo.ioprRprtBrkdQryRtnVo.tCnt._text ){
                       //tCnt가 0보다 작은 경우 에러
                       res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                   } else if( 0 == checkVo.ioprRprtBrkdQryRtnVo.tCnt._text ) {
                       // 조회 정보가 없는 경우
                       res.status(200).send( {"message" : "NO_DATA"} );
                   } else if( "1" === checkVo.ioprRprtBrkdQryRtnVo.tCnt._text ) {
                    
                       const infoData = {
                               "data":[checkVo.ioprRprtBrkdQryRtnVo.etprRprtQryBrkdQryVo], //DATA
                               "cnt" :checkVo.ioprRprtBrkdQryRtnVo.tCnt._text //total
    
                           }
                           res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                           //console.log(checkVo.ovrsSplrSgnQryRsltVo)
                    } else if( "1" < checkVo.ioprRprtBrkdQryRtnVo.tCnt._text ) {
                
                        const infoData = {
                                "data":checkVo.ioprRprtBrkdQryRtnVo.etprRprtQryBrkdQryVo, //DATA
                                "cnt" :checkVo.ioprRprtBrkdQryRtnVo.tCnt._text //total
        
                            }
                            res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                            //console.log(checkVo.ovrsSplrSgnQryRsltVo)
                   } else {
                       // // 조회 정보가 존재 하는 경우
                       const infoData = {
                           "data":checkVo.ioprRprtBrkdQryRtnVo.etprRprtQryBrkdQryVo, //DATA
                           "cnt" :checkVo.ioprRprtBrkdQryRtnVo.tCnt._text //total
    
                       }
                       res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                       //console.log(checkVo.etprRprtQryBrkdQryVo)
                       
                   }
    
               }
           }
       }
    });
    }

//서비스ID : API021
//서비스명 : 입항보고내역
//서비스명 : retrieveetprRprtQryBrkd

const API021 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.ETPRPRTLST_URL+'?&crkyCn='+config.URL_API_KEY_ETPRPRTLST + "&ioprSbmtNo=" + encodeURIComponent(req.body.mrnNo) + "&shipCallSgn=" + encodeURIComponent(req.body.shipCallImoNo);
        
    //console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API021 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse;
               
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               let returnList = [];
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               //console.log(checkVo.etprRprtQryBrkdQryRtnVo)
               if( checkVo.etprRprtQryBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                   //error
                   res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
               } else {
                   
                   if( 0 > checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text ){
                       //tCnt가 0보다 작은 경우 에러
                       res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                   } else if( 0 == checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text ) {
                       // 조회 정보가 없는 경우
                       res.status(200).send( {"message" : "NO_DATA"} );
                    } else if( "1" === checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text ) {
                        
                        const infoData = {
                                "data":[checkVo.etprRprtQryBrkdQryRtnVo.etprRprtQryBrkdQryVo], //DATA
                                "cnt" :checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text //total
    
                            }
                            res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                               //console.log(checkVo.ovrsSplrSgnQryRsltVo)
                   } else if( "1" < checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text ) {
                    //console.log(">>0 보다 큰 경우");
                       const infoData = {
                               "data":checkVo.etprRprtQryBrkdQryRtnVo.etprRprtQryBrkdQryVo, //DATA
                               "cnt" :checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text //total
    
                           }
                           res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                           //console.log(checkVo.ovrsSplrSgnQryRsltVo)
                   } else {
                       // // 조회 정보가 존재 하는 경우
                       const infoData = {
                           "data":checkVo.etprRprtQryBrkdQryRtnVo.etprRprtQryBrkdQryVo, //DATA
                           "cnt" :checkVo.etprRprtQryBrkdQryRtnVo.tCnt._text //total
    
                       }
                       res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                       //console.log(checkVo.etprRprtQryBrkdQryVo)
                       
                   }
    
               }
           }
       }
    });
}

//서비스ID : API005
//서비스명 : 입항보고내역
//서비스명 : retrieveShedInfo

const API005 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.SHEDINFO_URL+'?&crkyCn='+config.URL_API_KEY_SHEDINFO + "&jrsdCstmCd=" + encodeURIComponent(req.body.customNo) + "&snarSgn=" + encodeURIComponent(req.body.csaCode);
        
    //console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API005 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse;
               
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               let returnList = [];
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               //console.log(checkVo.shedInfoQryRtnVo)
               if( checkVo.shedInfoQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                   //error
                   res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
               } else {
                   
                   if( 0 > checkVo.shedInfoQryRtnVo.tCnt._text ){
                       //tCnt가 0보다 작은 경우 에러
                       res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                   } else if( 0 == checkVo.shedInfoQryRtnVo.tCnt._text ) {
                       // 조회 정보가 없는 경우
                       res.status(200).send( {"message" : "NO_DATA"} );
                    } else if( "1" === checkVo.shedInfoQryRtnVo.tCnt._text ) {
                        
                        const infoData = {
                                "data":[checkVo.shedInfoQryRtnVo.shedInfoQryRsltVo], //DATA
                                "cnt" :checkVo.shedInfoQryRtnVo.tCnt._text //total
    
                            }
                            res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                               ////console.log(checkVo.ovrsSplrSgnQryRsltVo)
                   } else if( "1" < checkVo.shedInfoQryRtnVo.tCnt._text ) {
                    //console.log(">>0 보다 큰 경우");
                       const infoData = {
                               "data":checkVo.shedInfoQryRtnVo.shedInfoQryRsltVo, //DATA
                               "cnt" :checkVo.shedInfoQryRtnVo.tCnt._text //total
    
                           }
                           res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                           //console.log(checkVo.ovrsSplrSgnQryRsltVo)
                   } else {
                       // // 조회 정보가 존재 하는 경우
                       const infoData = {
                           "data":checkVo.shedInfoQryRtnVo.shedInfoQryRsltVo, //DATA
                           "cnt" :checkVo.shedInfoQryRtnVo.tCnt._text //total
    
                       }
                       res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                       //console.log(checkVo.etprRprtQryBrkdQryVo)
                       
                   }
    
               }
           }
       }
    });
}

//서비스ID : API020
//서비스명 : 컨테이너내역조회
//서비스명 : retrieveCntrQryBrkd

const API020 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.CNTRQRY_URL+'?&crkyCn='+config.URL_API_KEY_CNTRQRY + "&cargMtNo=" + encodeURIComponent(req.body.mrn);
        
    //console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API020 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse;
               
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               let returnList = [];
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               //console.log(checkVo.shedInfoQryRtnVo)
               if( checkVo.cntrQryBrkdQryRtnVo.ntceInfo.hasOwnProperty('_text')) {
                   //error
                   res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
               } else {
                   
                   if( 0 > checkVo.cntrQryBrkdQryRtnVo.tCnt._text ){
                       //tCnt가 0보다 작은 경우 에러
                       res.status(200).send({"message":"ERROR", "errMsg":"에러가 발생했습니다. 관리자에게 문의하시기 바랍니다."});
                   } else if( 0 == checkVo.cntrQryBrkdQryRtnVo.tCnt._text ) {
                       // 조회 정보가 없는 경우
                       res.status(200).send( {"message" : "NO_DATA"} );
                    } else if( "1" === checkVo.cntrQryBrkdQryRtnVo.tCnt._text ) {
                        
                        const infoData = {
                                "data":[checkVo.cntrQryBrkdQryRtnVo.cntrQryBrkdQryVo], //DATA
                                "cnt" :checkVo.cntrQryBrkdQryRtnVo.tCnt._text //total
    
                            }
                            res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                               //console.log(checkVo.cntrQryBrkdQryRtnVo)
                   } else if( "1" < checkVo.cntrQryBrkdQryRtnVo.tCnt._text ) {
                    //console.log(">>0 보다 큰 경우");
                       const infoData = {
                               "data":checkVo.cntrQryBrkdQryRtnVo.cntrQryBrkdQryVo, //DATA
                               "cnt" :checkVo.cntrQryBrkdQryRtnVo.tCnt._text //total
    
                           }
                           res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                           //console.log(checkVo.cntrQryBrkdQryRtnVo)
                   } else {
                       // // 조회 정보가 존재 하는 경우
                       const infoData = {
                           "data":checkVo.cntrQryBrkdQryRtnVo.cntrQryBrkdQryVo, //DATA
                           "cnt" :checkVo.cntrQryBrkdQryRtnVo.tCnt._text //total
    
                       }
                       res.status(200).send( {"infoData" : infoData, "message":"SUCCESS"} );
                       //console.log(checkVo.cntrQryBrkdQryRtnVo)
                       
                   }
    
               }
           }
       }
    });
}




//서비스ID : API028
//서비스명 : 수입신고 개인통관고유부호 검증
//서비스명 : retrievePersEcms

const API028 = (req, res) => {
    //console.log(req.body)
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.PERSECMQRY_URL+'?crkyCn='+config.URL_API_KEY_PERSECMQRY + "&persEcm=" + encodeURIComponent(req.body.persEcm) + "&pltxNm="+encodeURIComponent(req.body.pltxNm);
        
    console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API028 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               if( jsonParse.persEcmQryRtnVo.tCnt._text == "1") {
                   //error
                   res.status(200).send({"message":"SUCCESS"});
               } else if( jsonParse.persEcmQryRtnVo.tCnt._text =="0"){
                    const infoData = {
                        "data":[jsonParse.persEcmQryRtnVo], //DATA
                        "cnt" :jsonParse.persEcmQryRtnVo.tCnt._text //total
                    }
                    res.status(200).send( {"message":"ERROR","infoData" : infoData, "errMsg":jsonParse.persEcmQryRtnVo.ntceInfo._text} );
                }else {
                    res.status(200).send( {"message":"INERROR", "errMsg":jsonParse.persEcmQryRtnVo.ntceInfo._text} );
                }
    
               
           }
       }
    });
}

//서비스ID : API022
//서비스명 : 수입신고 필증 검증
//서비스명 : retrieveDclrCrfnVrfc

const API022 = (req, res) => {
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.DCLRCRFNVRFC_URL+'?&crkyCn='+config.URL_API_KEY_DCLRCRFNVRFC;

    let uni_url2 = "";
        uni_url2 += "&impDclrCrfnPblsNo=" +encodeURIComponent(req.body.impDclrCrfnPblsNo);
        uni_url2 += "&impDclrNo="+ encodeURIComponent(req.body.impDclrNo);
        uni_url2 += "&pltxIdfyNo="+ encodeURIComponent(req.body.pltxIdfyNo.replace(/-/g, ""));
        uni_url2 += "&orcyCntyCd="+ encodeURIComponent(req.body.orcyCntyCd);
        uni_url2 += "&dclrPrnm="+ encodeURIComponent(req.body.dclrPrnm);
        uni_url2 += "&dclrWght="+ encodeURIComponent(req.body.dclrWght);
        uni_url2 += "&dclrWghtUtCd="+ encodeURIComponent(req.body.dclrWghtUtCd);
        uni_url2 += "&txPrcWncrTamt="+ encodeURIComponent(req.body.txPrcWncrTamt);
        uni_url2 += "&impPayQxmt="+ encodeURIComponent(req.body.impPayQxmt);
        
    
    uni_url = uni_url + uni_url2;
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API022 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {
               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               const infoData = {
                   "data":[jsonParse.impDclrCrfnVrfcQryRtnVo.ntceInfo._text], //DATA
                    "cnt" :jsonParse.impDclrCrfnVrfcQryRtnVo.tCnt._text //total
                }
                res.status(200).send( {"infoData" : infoData} );
    
               
           }
       }
    });
}


//서비스ID : API017
//서비스명 : 수출이행기간 단축대상 품목
//서비스명 : retrieveExpFfmnPridShrtTrgPrlst

const API017 = (req, res) => {
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.EXPFFMNPRIDSHRTTRGTPRLST_URL+'?crkyCn='+config.URL_API_KEY_EXPFFMNPRIDSHRTTRGTPRLST+"&hsSgn="+encodeURIComponent(req.body.param);   
    console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API017 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {

               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse.expFfmnPridShrtTrgtPrlstQryRtnVo;
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               if( checkVo.tCnt._text == "1") {
                   //error
                   const infoData = {
                    "data":[checkVo.expFfmnPridShrtTrgtPrlstQryRsltVo], //DATA
                    "cnt" :checkVo.tCnt._text //total
                    }   
                   res.status(200).send({"message":"SUCCESS", "infoData":infoData});
                }else if( 0 > checkVo.tCnt._text ){
                    //tCnt가 0보다 작은 경우 에러
                    res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
                }else if( 0 == checkVo.tCnt._text ) {
                    // 조회 정보가 없는 경우
                    res.status(200).send( {"message" : "NO_DATA", "errMsg":checkVo.ntceInfo._text} );
                } 
           }
       }
    });
}

//서비스ID : API003
//서비스명 : 수출입요건 승인내역 조회
//서비스명 : retrieveXtrnUserReqApreBrkd

const API003 = (req, res) => {
    const OPTIONS = {
       "Access-Control-Allow-Origin":"*",
       "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
       "Access-Control-Allow-Max-Age":"3600",
       "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    
    // API URL 조합한다.
    let uni_url = config.UNI_PASS_URL+config.XTRNUSERREQAPREBRKD_URL+'?crkyCn='+config.URL_API_KEY_XTRNUSERREQAPREBRKD+"&imexTpcd="+encodeURIComponent(req.body.imexTpcd)+"&reqApreNo="+encodeURIComponent(req.body.reqApreNo);   
    console.log(uni_url);
    request({
       url : uni_url,
       method:'GET'
    }, (error, apiRes, xml ) => {
       if(error) {
        //    res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API003 Error');
       } else {
    
           if( apiRes.statusCode == 200 ) {

               let json = convert.xml2json(xml, {compact:true,spaces:4});
               let jsonParse = JSON.parse( json );
               let checkVo = jsonParse.xtrnUserReqApreBrkdQryRtnVo;
               // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
               //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
               if( 0 > checkVo.tCnt._text ) {
                   res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
               }else if( 0 == checkVo.tCnt._text ){
                    res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
                }else {
                    const infoData = {
                        "data":[checkVo], //DATA
                        "cnt" :checkVo.tCnt._text //total
                    }  
                    
                       res.status(200).send({"message":"SUCCESS", "infoData":infoData});
                      
                } 
           }
       }
    });
}


//서비스ID : API018
//서비스명 : HS코드조회
//서비스명 : searchHsSgn

const API018 = (req, res) => {
  const OPTIONS = {
     "Access-Control-Allow-Origin":"*",
     "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
     "Access-Control-Allow-Max-Age":"3600",
     "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
  }
  
  // API URL 조합한다.
  let uni_url = config.UNI_PASS_URL+config.API018_URL+'?crkyCn='+config.URL_API_KEY_API018+"&hsSgn="+encodeURIComponent(req.body.param1)+"&koenTp="+encodeURIComponent(req.body.param2);   
  console.log(uni_url);
  request({
     url : uni_url,
     method:'GET'
  }, (error, apiRes, xml ) => {
     if(error) {
        //  res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API018 Error');
     } else {

         if( apiRes.statusCode == 200 ) {
             let json = convert.xml2json(xml, {compact:true,spaces:4});
             let jsonParse = JSON.parse( json );
             let checkVo = jsonParse.hsSgnSrchRtnVo;

             // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
             //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
             if( 0 > checkVo.tCnt._text ) {
                 res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
             }else if( 0 == checkVo.tCnt._text ){
                  res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
              }else {
                  const infoData = {
                      "data":[checkVo.hsSgnSrchRsltVo[0]]
                  }  
                  
                  res.status(200).send({"message":"SUCCESS", "infoData":infoData});
                    
              } 
         }
     }
  });
}


//서비스ID : API013
//서비스명 : 관세사 목록
//서비스명 : retrieveLcaBrkd

const API013 = (req, res) => {
  const OPTIONS = {
     "Access-Control-Allow-Origin":"*",
     "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
     "Access-Control-Allow-Max-Age":"3600",
     "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
  }
  
  // API URL 조합한다.
  let uni_url = config.UNI_PASS_URL+config.API013_URL+'?crkyCn='+config.URL_API_KEY_API013;
  if(req.body.param1) {
	  uni_url +="&lcaSgn="+encodeURIComponent(req.body.param1);
  }
  if(req.body.param2) {
	  uni_url +="&jrsdCstm="+encodeURIComponent(req.body.param2); 
  }
  console.log(uni_url);
  request({
     url : uni_url,
     method:'GET'
  }, (error, apiRes, xml ) => {
     if(error) {
        //  res.status(error.statusCode).send(error);
        res.status('401').send('UNI-PASS API013 Error');
     } else {
  
         if( apiRes.statusCode == 200 ) {

             let json = convert.xml2json(xml, {compact:true,spaces:4});
             let jsonParse = JSON.parse( json );
             let checkVo = jsonParse.lcaLstInfoQryRtnVo;
             // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
             //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
             if( 0 > checkVo.tCnt._text ) {
                 res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
             } else if( 0 == checkVo.tCnt._text ){
                  res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
             } else if( 1 == checkVo.tCnt._text ){
            	 const infoData = {
                         "data":[checkVo.lcaLstInfoQryRsltVo], //DATA
                         "cnt" :checkVo.tCnt._text //total
                     }  
            	 res.status(200).send({"message":"SUCCESS", "infoData":infoData});
             } else {
                  const infoData = {
                      "data":checkVo.lcaLstInfoQryRsltVo, //DATA
                      "cnt" :checkVo.tCnt._text //total
                  }     
                  res.status(200).send({"message":"SUCCESS", "infoData":infoData});
                    
              } 
         }
     }
  });
}



//서비스ID : API014
//서비스명 : 관세사 내역
//서비스명 : retrieveLcaBrkd

const API014 = (req, res) => {
const OPTIONS = {
   "Access-Control-Allow-Origin":"*",
   "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
   "Access-Control-Allow-Max-Age":"3600",
   "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

// API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API014_URL+'?crkyCn='+config.URL_API_KEY_API014+"&lcaSgn="+encodeURIComponent(req.body.param1)+"&jrsdCstm="+encodeURIComponent(req.body.param2);

console.log(uni_url);
request({
   url : uni_url,
   method:'GET'
}, (error, apiRes, xml ) => {
   if(error) {
    //    res.status(error.statusCode).send(error);
    res.status('401').send('UNI-PASS API014 Error');
   } else {

       if( apiRes.statusCode == 200 ) {

           let json = convert.xml2json(xml, {compact:true,spaces:4});
           let jsonParse = JSON.parse( json );
           let checkVo = jsonParse.lcaBrkdQryRtnVo;
           // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
           //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
           if( 0 > checkVo.tCnt._text ) {
               res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
           }else if( 0 == checkVo.tCnt._text ){
                res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
            }else {

                res.status(200).send({"message":"SUCCESS", "infoData":[checkVo.lcaBrkdQryRsltVo]});
                  
            } 
       }
   }
});
}

//서비스ID : API030
//서비스명 : 관세율 조회
//서비스명 : retrieveLcaBrkd

const API030 = (req, res) => {
const OPTIONS = {
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
 "Access-Control-Allow-Max-Age":"3600",
 "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API030_URL+'?crkyCn='+config.URL_API_KEY_API030+"&hsSgn="+encodeURIComponent(req.body.param1);
if(req.body.param2) {
	uni_url += "&trrtTpcd="+encodeURIComponent(req.body.param2);
}

console.log(uni_url);
request({
 url : uni_url,
 method:'GET'
}, (error, apiRes, xml ) => {
 if(error) {
    //  res.status(error.statusCode).send(error);
    res.status('401').send('UNI-PASS API030 Error');
 } else {

     if( apiRes.statusCode == 200 ) {

         let json = convert.xml2json(xml, {compact:true,spaces:4});
         let jsonParse = JSON.parse( json );
         let checkVo = jsonParse.trrtQryRtnVo;
        
         // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
         //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
         if( 0 > checkVo.tCnt._text ) {
             res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
         } else if( 0 == checkVo.tCnt._text ){
              res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
         } else if( 1 == checkVo.tCnt._text ){
        	 const infoData = {
                     "data":[checkVo.trrtQryRsltVo], //DATA
                     "cnt" :checkVo.tCnt._text //total
                 } 
        	  res.status(200).send({"message":"SUCCESS", "infoData":infoData});  
         } else {
        	 const infoData = {
                     "data":checkVo.trrtQryRsltVo, //DATA
                     "cnt" :checkVo.tCnt._text //total
                 } 
        	 console.log("INFO:",infoData);
              res.status(200).send({"message":"SUCCESS", "infoData":infoData});            
          } 
     }
 }
});
}

//서비스ID : API031
//서비스명 : 우편번호별 관할세관 정보 조회
//서비스명 : retrievePostNoPrCstmSgnQry

const API031 = (req, res) => {
const OPTIONS = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
"Access-Control-Allow-Max-Age":"3600",
"Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API031_URL+'?crkyCn='+config.URL_API_KEY_API031+"&jrsdPsno="+encodeURIComponent(req.body.param1);

console.log(uni_url);
request({
url : uni_url,
method:'GET'
}, (error, apiRes, xml ) => {
if(error) {
//    res.status(error.statusCode).send(error);
res.status('401').send('UNI-PASS API031 Error');
} else {

   if( apiRes.statusCode == 200 ) {

       let json = convert.xml2json(xml, {compact:true,spaces:4});
       let jsonParse = JSON.parse( json );
       let checkVo1 = jsonParse.psnoPrJrsdCstmQryRtnVo;
       let checkVo2 = jsonParse.statsSgnQryRtnVo;

      if(checkVo1 != undefined) {
          // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
          //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
          if( 0 > checkVo1.tCnt._text ) {
              res.status(200).send({"message":"ERROR", "errMsg":checkVo1.ntceInfo._text});
          } else if( 0 == checkVo1.tCnt._text ){
               res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
          } else if( 1 == checkVo1.tCnt._text ){
         	 const infoData = {
                      "data":[checkVo1.psnoPrJrsdCstmQryRsltVoList], //DATA
                      "cnt" :checkVo1.tCnt._text //total
                  } 
         	  res.status(200).send({"message":"SUCCESS", "infoData":infoData});  
          } else {
         	 const infoData = {
                      "data":checkVo1.psnoPrJrsdCstmQryRsltVoList, //DATA
                      "cnt" :checkVo1.tCnt._text //total
                  } 
         	 console.log("INFO:",infoData);
               res.status(200).send({"message":"SUCCESS", "infoData":infoData});            
           } 
      } else {
    	  // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
          //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
    	  res.status(200).send( {"message" : "NO_DATA", "errMsg":checkVo2.ntceInfo._text} );
          
      }

   }
}
});
}

//서비스ID : API032
//서비스명 : 수출입신고 전자첨부서류 제출 완료 유무
//서비스명 : retrieveExplmpAffcSbmtInfo

const API032 = (req, res) => {
const OPTIONS = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
"Access-Control-Allow-Max-Age":"3600",
"Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API032_URL+'?crkyCn='+config.URL_API_KEY_API032+"&dclrBsopDtlTpcd="+encodeURIComponent(req.body.param1);
if(req.body.param2) {
	uni_url += "&dcshSbmtNo="+encodeURIComponent(req.body.param2);
}
// console.log(uni_url);
request({
url : uni_url,
method:'GET'
}, (error, apiRes, xml ) => {
if(error) {
//  res.status(error.statusCode).send(error);
res.status('401').send('UNI-PASS API032 Error');
} else {

 if( apiRes.statusCode == 200 ) {

     let json = convert.xml2json(xml, {compact:true,spaces:4});
     let jsonParse = JSON.parse( json );
     let checkVo = jsonParse.expImpAffcSbmtInfoQryRtnVo;
    
     // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
     //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
     if( 0 > checkVo.tCnt._text ) {
         res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
     } else if( 0 == checkVo.tCnt._text ){
          res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
     } else if( 1 == checkVo.tCnt._text ){
    	 const infoData = {
                 "data":[checkVo.expImpAffcSbmtInfoQryRsltVoList], //DATA
                 "cnt" :checkVo.tCnt._text //total
             } 
    	  res.status(200).send({"message":"SUCCESS", "infoData":infoData});  
     } else {
    	 const infoData = {
                 "data":checkVo.expImpAffcSbmtInfoQryRsltVoList, //DATA
                 "cnt" :checkVo.tCnt._text //total
             } 
    	 console.log("INFO:",infoData);
          res.status(200).send({"message":"SUCCESS", "infoData":infoData});            
      } 
 }
}
});
}

//서비스ID : API033
//서비스명 : 농림축산검역본부 동축산물 업체코드 조회
//서비스명 : retrieveAlspEntsCd

const API033 = (req, res) => {
const OPTIONS = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
"Access-Control-Allow-Max-Age":"3600",
"Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
}

//API URL 조합한다.
let uni_url = config.UNI_PASS_URL+config.API033_URL+'?crkyCn='+config.URL_API_KEY_API033+"&alspEntsCd="+encodeURIComponent(req.body.param1);

// console.log(uni_url);
request({
url : uni_url,
method:'GET'
}, (error, apiRes, xml ) => {
if(error) {
//    res.status(error.statusCode).send(error);
   res.status('401').send('UNI-PASS API033 Error');
} else {

   if( apiRes.statusCode == 200 ) {

       let json = convert.xml2json(xml, {compact:true,spaces:4});
       let jsonParse = JSON.parse( json );
       let checkVo = jsonParse.alspEntsCdQryRtnVo;
      
       // API 데이터 표준 XML -> json -> json Parse 처리하여 _text가 붙는다.
       //ntceInfo 데이터는 오류일경우 데이터(_text)가 존재하고 정상일 경우 데이터(_text)가 없다.
       if( 0 > checkVo.tCnt._text ) {
           res.status(200).send({"message":"ERROR", "errMsg":checkVo.ntceInfo._text});
       } else if( 0 == checkVo.tCnt._text ){
            res.status(200).send( {"message" : "NO_DATA", "errMsg":"조회 결과가 없습니다."} );
       } else if( 1 == checkVo.tCnt._text ){
      	 const infoData = {
                   "data":[checkVo.alspEntsCdQryVo], //DATA
                   "cnt" :checkVo.tCnt._text //total
               } 
      	  res.status(200).send({"message":"SUCCESS", "infoData":infoData});  
       } else {
      	 const infoData = {
                   "data":checkVo.alspEntsCdQryVo, //DATA
                   "cnt" :checkVo.tCnt._text //total
               } 
      	 console.log("INFO:",infoData);
            res.status(200).send({"message":"SUCCESS", "infoData":infoData});            
        } 
   }
}
});
}

module.exports = {
    API001,
    API002,
    API003,

    API005,
    API006,
    API007,
    API008,
    API009,
    API010,
    API011,
    API012,
    API013,
    API014,
    API015,
    API016,
    API017,
    API018,
    API019,
    API020,
    API021,
    API022,
    API023,
    API024,
    API025,
    API026,
    API027,
    API028,
    API029,
    API030,
    API031,
    API033,

    
    selectPassInfo,
    selectShedInfo,
    selectLcaInfo,
    selectCntrInfo,
    selectExpDclrInfo,
}