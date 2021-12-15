'use strict';

const request = require('request');
// 승인키 정보
const config = require('./JusoroApiConfig');



function checkSearchedWord(obj){
	if(obj.length >0){
		//특수문자 제거
		var expText = /[%=><]/ ;
		if(expText.test(obj) == true){
			obj = obj.split(expText).join(""); 
			return false;
        }

		//특정문자열(sql예약어의 앞뒤공백포함) 제거
		var sqlArray = new Array(
			//sql 예약어
			"OR", "SELECT", "INSERT", "DELETE", "UPDATE", "CREATE", "DROP", "EXEC",
             		 "UNION",  "FETCH", "DECLARE", "TRUNCATE" 
        );

		var regex;
		for(var i=0; i<sqlArray.length; i++){
			regex = new RegExp( sqlArray[i] ,"gi") ;
			if (regex.test(obj) ) {
				obj =obj.replace(regex, "");
				return false;
			}
		}
	}
	return true ;
}

const localAddress = (req, res) => {
    if( !checkSearchedWord(req.body.keyword)) {
        res.status(200).send({"message":"ERROR", "errMsg":"금칙문자를 사용하였습니다."});
        return false;
    }

    const options = {
        uri:config.url,
        method:'POST',
        form:{
            // 현재 페이지
            currentPage:req.body.currentPage,
            // 조회 할 데이터 수 최대 10
            countPerPage:'5',
            // 리턴 데이터
            resultType:'json',
            // 주소로 승인키
            confmKey:config.confmKey,
            // 검색조건
            keyword:req.body.keyword
        }    
    }
    try{
        request( options, function( error, response, body ) {
            console.log( "error: ",error);
            console.log( "status : ",response.statusCode)
            if( !error && response.statusCode == 200 ) {
                const apiResult = JSON.parse(body);
                res.status(200).send(apiResult.results);
            } else {
                res.status(400).end();
                console.log('error = '+ 400 );
            }
        });
    } catch(error) {
        // done();
        res.status(400).send(error);
    }
}


const chainPortal = (req, res) => {
    // if( !checkSearchedWord(req.body.keyword)) {
    //     res.status(200).send({"message":"ERROR", "errMsg":"금칙문자를 사용하였습니다."});
    //     return false;
    // }
    const resOptions = { 
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Max-Age":"3600",
        "Access-Control-Allow-Headers":"Origin,Accept,X-Requested,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization"
    }
    const options = {
        url:'https://www.chainportal.co.kr/openapi/rl5587m8vtiw',
        method:'POST',
        headers:{
            'Content-Type': 'application/json',
// 'User-Agent': 'PostmanRuntime/7.26.5',
'Accept': '*/*',
// 'Postman-Token': '4bdce8e4-f148-40ea-935f-f15ee66a7322',
'Host': 'www.chainportal.co.kr',
'Accept-Encoding': 'gzip, deflate, br',
// 'Connection': 'keep-alive',
'Content-Length': '34',
'Cookie': "JSESSIONID=j5YaXKcSBhgVBwsByF91mfvw3YTG3Z0isU53VmcixOZx3fgvVRk1uIQLOq7612J8.UEJJR0RBVEEvQ0hBSU4xMQ==; JSESSIONID=j5YaXKcSBhgVBwsByF91mfvw3YTG3Z0isU53VmcixOZx3fgvVRk1uIQLOq7612J8.UEJJR0RBVEEvQ0hBSU4xMQ=="
    },
        body:{
            "conNo":"CON0000001"
        },
        json:true
    }
    try{
        request( options, function( error, response, body ) {
            // response.headers = resOptions;
            console.log( "error: ",error);
            console.log( "status : ",response.statusCode)
            console.log(body);
            if( !error && response.statusCode == 200 ) {
                const apiResult = JSON.parse(body);
                res.status(200).send(apiResult.results);
            } else {
                res.status(400).end();
                console.log('error = '+ 400 );
            }
        });
    } catch(error) {
        // done();
        res.status(400).send(error);
    }
}

module.exports = {
    localAddress,
    chainPortal
}