'use strict';

const request = require('request');
const convert = require('xml-js');
const config = require('./NaverApiConfig');

const jsonData1 = {"results":
	{"common":
		{"errorMessage":"정상","countPerPage":"5","totalCount":"10","errorCode":"0","currentPage":"1"}
		,"juso":[
		{"detBdNmList":"정보통신","engAddr":"178, Sejong-daero, Jongno-gu, Seoul","rn":"세종대로","emdNm":"세종로","zipNo":"03154"
			,"roadAddrPart2":" (세종로)","emdNo":"01","sggNm":"종로구"
			,"jibunAddr":"서울특별시 종로구 세종로 100 KT 광화문 빌딩 West"
			,"siNm":"서울특별시","roadAddrPart1":"서울특별시 종로구 세종대로 178"
			,"bdNm":"KT 광화문 빌딩 West","admCd":"1111011900","udrtYn":"0","lnbrMnnm":"100"
			,"roadAddr":"서울특별시 종로구 세종대로 178 (세종로)","lnbrSlno":"0","buldMnnm":"178"
			,"bdKdcd":"0","liNm":"","rnMgtSn":"111102005001","mtYn":"0","bdMgtSn":"1111011900101000000015819","buldSlno":"0"}
	 ,{"detBdNmList":"","engAddr":"33, Jong-ro 3-gil, Jongno-gu, Seoul","rn":"종로3길","emdNm":"청진동","zipNo":"03155"
		 ,"roadAddrPart2":" (청진동)","emdNo":"01","sggNm":"종로구","jibunAddr":"서울특별시 종로구 청진동 244 KT 광화문빌딩 East"
		 ,"siNm":"서울특별시","roadAddrPart1":"서울특별시 종로구 종로3길 33","bdNm":"KT 광화문빌딩 East","admCd":"1111012200","udrtYn":"0"
		 ,"lnbrMnnm":"244","roadAddr":"서울특별시 종로구 종로3길 33 (청진동)","lnbrSlno":"0","buldMnnm":"33","bdKdcd":"0"
		 ,"liNm":"","rnMgtSn":"111104100333","mtYn":"0","bdMgtSn":"1111012200102350001000001","buldSlno":"0"}
	 ,{"detBdNmList":"KT용산지점","engAddr":"148, Hangang-daero, Yongsan-gu, Seoul","rn":"한강대로","emdNm":"한강로2가"
		 ,"zipNo":"04382","roadAddrPart2":" (한강로2가)","emdNo":"05","sggNm":"용산구","jibunAddr":"서울특별시 용산구 한강로2가 44-3 KT용산지점"
		 ,"siNm":"서울특별시","roadAddrPart1":"서울특별시 용산구 한강대로 148","bdNm":"KT용산지점","admCd":"1117012500"
		 ,"udrtYn":"0","lnbrMnnm":"44","roadAddr":"서울특별시 용산구 한강대로 148 (한강로2가)","lnbrSlno":"3"
		 ,"buldMnnm":"148","bdKdcd":"0","liNm":"","rnMgtSn":"111702005005","mtYn":"0","bdMgtSn":"1117012500100440003029143","buldSlno":"0"}
	 ,{"detBdNmList":"","engAddr":"43, Cheonho-daero 101-gil, Gwangjin-gu, Seoul","rn":"천호대로101길","emdNm":"중곡동","zipNo":"04917"
		 	,"roadAddrPart2":" (중곡동)","emdNo":"01","sggNm":"광진구","jibunAddr":"서울특별시 광진구 중곡동 614-11 KT광진지사"
		 	,"siNm":"서울특별시","roadAddrPart1":"서울특별시 광진구 천호대로101길 43","bdNm":"KT광진지사","admCd":"1121510100"
		 	,"udrtYn":"0","lnbrMnnm":"614","roadAddr":"서울특별시 광진구 천호대로101길 43 (중곡동)","lnbrSlno":"11","buldMnnm":"43",
		 	"bdKdcd":"0","liNm":"","rnMgtSn":"112154112490","mtYn":"0","bdMgtSn":"1121510100106140011005212","buldSlno":"0"}
	 	,{"detBdNmList":"","engAddr":"58, Hongneung-ro, Dongdaemun-gu, Seoul","rn":"홍릉로","emdNm":"청량리동","zipNo":"02484"
	 		,"roadAddrPart2":" (청량리동)","emdNo":"01","sggNm":"동대문구","jibunAddr":"서울특별시 동대문구 청량리동 368 KT청량지점"
	 		,"siNm":"서울특별시","roadAddrPart1":"서울특별시 동대문구 홍릉로 58","bdNm":"KT청량지점","admCd":"1123010700","udrtYn":"0"
	 		,"lnbrMnnm":"368","roadAddr":"서울특별시 동대문구 홍릉로 58 (청량리동)","lnbrSlno":"0","buldMnnm":"58","bdKdcd":"0","liNm":""
             ,"rnMgtSn":"112303105018","mtYn":"0","bdMgtSn":"1123010700103680000013258","buldSlno":"0"}
             
	 	]}}

         const jsonData2 = {"results":
         {"common":
             {"errorMessage":"정상","countPerPage":"5","totalCount":"10","errorCode":"0","currentPage":"2"}
             ,"juso":[
            {"detBdNmList":"","engAddr":"33, Bongujae-ro, Jungnang-gu, Seoul","rn":"봉우재로","emdNm":"면목동","zipNo":"02128","roadAddrPart2":" (면목동)"
                ,"emdNo":"01","sggNm":"중랑구","jibunAddr":"서울특별시 중랑구 면목동 182-80 kt 중랑분기국사","siNm":"서울특별시"
                ,"roadAddrPart1":"서울특별시 중랑구 봉우재로 33","bdNm":"kt 중랑분기국사","admCd":"1126010100","udrtYn":"0","lnbrMnnm":"182"
                ,"roadAddr":"서울특별시 중랑구 봉우재로 33 (면목동)","lnbrSlno":"80","buldMnnm":"33","bdKdcd":"0","liNm":"","rnMgtSn":"112603106002"
                ,"mtYn":"0","bdMgtSn":"1126010100101820080028141","buldSlno":"0"},
            {"detBdNmList":"","engAddr":"58, Hongneung-ro, Dongdaemun-gu, Seoul","rn":"홍릉로","emdNm":"청량리동","zipNo":"02484"
                  ,"roadAddrPart2":" (청량리동)","emdNo":"01","sggNm":"동대문구","jibunAddr":"서울특별시 동대문구 청량리동 368 KT청량지점"
                  ,"siNm":"서울특별시","roadAddrPart1":"서울특별시 동대문구 홍릉로 58","bdNm":"KT청량지점","admCd":"1123010700","udrtYn":"0"
                  ,"lnbrMnnm":"368","roadAddr":"서울특별시 동대문구 홍릉로 58 (청량리동)","lnbrSlno":"0","buldMnnm":"58","bdKdcd":"0","liNm":""
                  ,"rnMgtSn":"112303105018","mtYn":"0","bdMgtSn":"1123010700103680000013258","buldSlno":"0"}
            ,{"detBdNmList":"","engAddr":"33, Bongujae-ro, Jungnang-gu, Seoul","rn":"봉우재로","emdNm":"면목동","zipNo":"02128","roadAddrPart2":" (면목동)"
                  ,"emdNo":"01","sggNm":"중랑구","jibunAddr":"서울특별시 중랑구 면목동 182-80 kt 중랑분기국사","siNm":"서울특별시"
                  ,"roadAddrPart1":"서울특별시 중랑구 봉우재로 33","bdNm":"kt 중랑분기국사","admCd":"1126010100","udrtYn":"0","lnbrMnnm":"182"
                  ,"roadAddr":"서울특별시 중랑구 봉우재로 33 (면목동)","lnbrSlno":"80","buldMnnm":"33","bdKdcd":"0","liNm":"","rnMgtSn":"112603106002"
                  ,"mtYn":"0","bdMgtSn":"1126010100101820080028141","buldSlno":"0"}
              ,{"detBdNmList":"경비실,중랑지점","engAddr":"54, Bongujae-ro, Jungnang-gu, Seoul","rn":"봉우재로","emdNm":"면목동","zipNo":"02130"
                  ,"roadAddrPart2":" (면목동)","emdNo":"01","sggNm":"중랑구","jibunAddr":"서울특별시 중랑구 면목동 180-68 KT프라자","siNm":"서울특별시"
                  ,"roadAddrPart1":"서울특별시 중랑구 봉우재로 54","bdNm":"KT프라자","admCd":"1126010100","udrtYn":"0","lnbrMnnm":"180"
                  ,"roadAddr":"서울특별시 중랑구 봉우재로 54 (면목동)","lnbrSlno":"68","buldMnnm":"54","bdKdcd":"0","liNm":"","rnMgtSn":"112603106002"
                  ,"mtYn":"0","bdMgtSn":"1126010100101800068029333","buldSlno":"0"}
            ,{"detBdNmList":"","engAddr":"43, Solmae-ro 50-gil, Gangbuk-gu, Seoul"
                  ,"rn":"솔매로50길","emdNm":"미아동","zipNo":"01158","roadAddrPart2":" (미아동)","emdNo":"01","sggNm":"강북구"
                  ,"jibunAddr":"서울특별시 강북구 미아동 127-7 KT강북지사","siNm":"서울특별시","roadAddrPart1":"서울특별시 강북구 솔매로50길 43"
                  ,"bdNm":"KT강북지사","admCd":"1130510100","udrtYn":"0","lnbrMnnm":"127","roadAddr":"서울특별시 강북구 솔매로50길 43 (미아동)"
                  ,"lnbrSlno":"7","buldMnnm":"43","bdKdcd":"0","liNm":"","rnMgtSn":"113054124343","mtYn":"0","bdMgtSn":"1130510100101270007018451","buldSlno":"0"}
            //   ,{"detBdNmList":"","engAddr":"1082, Dongil-ro, Nowon-gu, Seoul","rn":"동일로","emdNm":"공릉동","zipNo":"01840","roadAddrPart2":" (공릉동)"
            //       ,"emdNo":"01","sggNm":"노원구","jibunAddr":"서울특별시 노원구 공릉동 375-4 KT 공릉지점","siNm":"서울특별시","roadAddrPart1":"서울특별시 노원구 동일로 1082"
            //       ,"bdNm":"KT 공릉지점","admCd":"1135010300","udrtYn":"0","lnbrMnnm":"375","roadAddr":"서울특별시 노원구 동일로 1082 (공릉동)","lnbrSlno":"4"
            //       ,"buldMnnm":"1082","bdKdcd":"0","liNm":"","rnMgtSn":"113503000001","mtYn":"0","bdMgtSn":"1135010300103750004013817","buldSlno":"0"}
            //   ,{"detBdNmList":"","engAddr":"3, Dongil-ro 193ga-gil, Nowon-gu, Seoul","rn":"동일로193가길","emdNm":"공릉동","zipNo":"01852"
            //   ,"roadAddrPart2":" (공릉동)","emdNo":"01","sggNm":"노원구","jibunAddr":"서울특별시 노원구 공릉동 379-22 kt공릉분기국사","siNm":"서울특별시"
            //   ,"roadAddrPart1":"서울특별시 노원구 동일로193가길 3","bdNm":"kt공릉분기국사","admCd":"1135010300","udrtYn":"0","lnbrMnnm":"379"
            //   ,"roadAddr":"서울특별시 노원구 동일로193가길 3 (공릉동)","lnbrSlno":"22","buldMnnm":"3","bdKdcd":"0","liNm":"","rnMgtSn":"113504130189","mtYn":"0"
            //   ,"bdMgtSn":"1135010300103790022013725","buldSlno":"0"}
            ]}}


const localAddressNotUse = (req, res) => {
    console.log("================NAVER API===============");
    console.log(req.body);
    //https://www.juso.go.kr/addrlink/addrLinkApi.do
    
    // 파라미터 검증
    // if( !req.body.address ) {
    //     res.status(401).send('NO_LOCAL');
    // }
    // const params = req.body.address; 
    // // naver api url
    // const api_url = 'https://openapi.naver.com/v1/search/local?display=5&query='+encodeURI( params );
    // const options = {
    //     url: api_url,
    //     headers: {
    //         'X-Naver-Client-Id': config.client_id,
    //         'X-Naver-Client-Secret': config.client_secret
    //     }
    // }
    console.log( "aaaaaaaaaaaaaaaaaaaaaaaa");
    const errCode = jsonData1.results.common.errorCode;
    const errDesc = jsonData1.results.common.errorMessage;
    console.log( errCode, errDesc );
    if( errCode != "0" ) {
        res.status(errCode).end();
        console.log('error = '+ errCode );
    } else {
        if( req.body.currentPage == '1') {
            res.status(200).json(jsonData1.results);
        } else if( req.body.currentPage == '2') {
            res.status(200).json(jsonData2.results);
        }
    }

    // call naver api
    // request.get( options, function( error, response, body ) {
    //     if( !error && response.statusCode == 200 ) {
    //         res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'}).json(body.items);
    //     } else {
    //         res.status(response.statusCode).end();
    //         console.log('error = '+ response.statusCode );
    //     }
    // });

    

}

module.exports = {
    localAddressNotUse,
}