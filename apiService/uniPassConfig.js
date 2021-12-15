
module.exports = {
    // UNI PASS URL
    'UNI_PASS_URL' : 'https://unipass.customs.go.kr:38010',

    // 수입 (API001)
    'UNI_API_KEY_IMPORT' : 'm230z280b075e200q080q090l0', //'x240d195q172y239h040w070v0',
    'IMPORT_URL' : '/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo',


    // 수출 (API002)
    'UNI_API_KEY_EXPORT' : 'l240m240v065h280g090k090s1', //'c250r165v102q229m080h090a0',
    'EXPORT_URL' : '/ext/rest/expDclrNoPrExpFfmnBrkdQry/retrieveExpDclrNoPrExpFfmnBrkd',

    // 장치장 정보 (API005)
    'UNI_API_KEY_SHED' : 'z290a250z015h280a090h000n2',
    'SHED_URL' : '/ext/rest/shedInfoQry/retrieveShedInfo',

    // 관세사 목록 (API013)
    'UNI_API_KEY_LCA' : 'q220k230l035l210a090v050e2',
    'LCA_URL' : '/ext/rest/lcaBrkdQry/retrieveLcaBrkd',
    
    // 컨테이너 내역 조회 (API020)
    'UNI_API_KEY_CNTR' : 't280x280a075b260y000w060o0',
    'CNTR_URL' : '/ext/rest/cntrQryBrkdQry/retrieveCntrQryBrkd',
    // 통계부호내역조회 (API019)
    'URL_API_KEY_SGN' : 'b200r200q055k200w090r070s0',
    'SGN_URL' : '/ext/rest/statsSgnQry/retrieveStatsSgnBrkd',
    // 통관고유부호조회 (API010)
    'URL_API_KEY_ECM' : 'v290d220u025y200s010o050n0',
    'ECM_URL' : '/ext/rest/ecmQry/retrieveEcm',
    // 통관단일창구 처리이력조회 (API025)
    'URL_API_KEY_APFMPRCSSTUS' : 'o200g270g015v270v010r010n0',
    'APFMPRCSSTUS_URL' : '/ext/rest/apfmPrcsStusQry/retrieveApfmPrcsStus',
    // 항공사 내역 (API009)
    'URL_API_KEY_FLCOBRKD' : 'm260c270j065m220j070o050k0',
    'FLCOBRKD_URL' : '/ext/rest/flcoBrkdQry/retrieveFlcoBrkd',
    //TRADING CONOMICS URL
    'TRADING_URL':'https://api.tradingeconomics.com/markets/symbol/bdiy:ind?c=guest:guest',
    //SCFI SCRAP
    'SCFI_URL' : 'https://en.sse.net.cn/currentIndex?indexName=scfi',
    //TEU_URL
    'TEU_URL' : 'https://alphaliner.axsmarine.com/PublicTop100/rooter.php',
    //씨벤티지 URL
    // 'SEAVENTAGE_URL' : 'http://ec2-54-180-192-69.ap-northeast-2.compute.amazonaws.com:8082/v1/',
    // 'SEAVENTAGE_KEY' : 'Basic aGRraW1Aa2xuZXQuY28ua3I6a2xuZXQxMjM0',

    // 운영씨벤티지 URL
    'SEAVENTAGE_URL' : 'https://svmp.seavantage.com/api/v1/',
    'SEAVENTAGE_KEY' : 'Basic aGRraW1Aa2xuZXQuY28ua3I6a2xuZXQhMjAyMA==',



    // 보세운송차량등록 내역 조회 (API023)
    'URL_API_KEY_API023' : 'f210u230c015s240b040j030f2',
    'API023_URL' : '/ext/rest/btcoVhclQry/retrieveBtcoVhcl',
    // 선박회사목록조회 (API026)
    'URL_API_KEY_API026' : 'k260n230w045z270k030x050b1',
    'API026_URL' : '/ext/rest/shipCoLstQry/retrieveShipCoLst',
    // 선박회사내역 (API027)
    'URL_API_KEY_API027' : 'j240g210y035v220z070f040k3',
    'API027_URL' : '/ext/rest/shipCoBrkdQry/retrieveShipCoBrkd',
    // 세관장확인대상 법령코드 조회 (API029)
    'URL_API_KEY_API029' : 'r270c220l065d210p050c070i1',
    'API029_URL' : '/ext/rest/ccctLworCdQry/retrieveCcctLworCd',
    // 관세환율 정보 조회 (API012)
    'URL_API_KEY_API012' : 'f290x270o075e280r070u070t2',
    'API012_URL' : '/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo',
    //(API008)	항공사목록조회
    //https://unipass.customs.go.kr:38010/ext/rest/flcoLstQry/retrieveFlcoLst?crkyCn=h250s270b085y260t070b090q0&flcoNm=대한항공
    'URL_API_KEY_FLCOLST' : 'h250s270b085y260t070b090q0',
    'FLCOLST_URL' : '/ext/rest/flcoLstQry/retrieveFlcoLst',
    //(API011)	해외공급자부호조회
    //https://unipass.customs.go.kr:38010/ext/rest/ovrsSplrSgnQry/retrieveOvrsSplrSgn?crkyCn=l200g230a085z260v070c030p0&cntySgn=TD&conm=AA
    'URL_API_KEY_OVRSSPLRSGN' : 'l200g230a085z260v070c030p0',
    'OVRSSPLRSGN_URL' : '/ext/rest/ovrsSplrSgnQry/retrieveOvrsSplrSgn',    
    //(API007)	화물운송주선업자내역조회
    //https://unipass.customs.go.kr:38010/ext/rest/frwrBrkdQry/retrieveFrwrBrkd?crkyCn=t220o290m035v230c030g050j1&frwrSgn=CRST
    'URL_API_KEY_FRWRBRKD' : 't220o290m035v230c030g050j1',
    'FRWRBRKD_URL' : '/ext/rest/frwrBrkdQry/retrieveFrwrBrkd',
    //(API006)	화물운송주선업자목록조회
    //https://unipass.customs.go.kr:38010/ext/rest/frwrLstQry/retrieveFrwrLst?crkyCn=l270g270i015g290o020z040x1&frwrNm=한국&intpTp=3
    'URL_API_KEY_FRWRLST' : 'l270g270i015g290o020z040x1',
    'FRWRLST_URL' : '/ext/rest/frwrLstQry/retrieveFrwrLst',
    //(API016)	간이정액 적용/비적용 업체 조회
    //https://unipass.customs.go.kr:38010/ext/rest/simlFxamtAplyNnaplyEntsQry/retrieveSimlFxamtAplyNnaplyEnts?crkyCn=q260i200j075a200a010b040s2&ecm=케**********15
    'URL_API_KEY_API016' : 'q260i200j075a200a010b040s2',
    'API016_URL' : '/ext/rest/simlFxamtAplyNnaplyEntsQry/retrieveSimlFxamtAplyNnaplyEnts',
    //(API016)	간이정액 적용/비적용 업체 조회
    //https://unipass.customs.go.kr:38010/ext/rest/simlXamrttXtrnUserQry/retrieveSimlXamrttXtrnUser?crkyCn=y260m230t045g200s040t080s2&baseDt=19930201
    'URL_API_KEY_API015' : 'y260m230t045g200s040t080s2',
    'API015_URL' : '/ext/rest/simlXamrttXtrnUserQry/retrieveSimlXamrttXtrnUser',
    //(API024)	입출항보고내역조회
    //(입항)https://unipass.customs.go.kr:38010/ext/rest/ioprRprtQry/retrieveIoprRprtBrkd?crkyCn=w230q200d055l210y070u000j1&seaFlghIoprTpcd=10&shipCallImoNo=DSFS8
    //(출항)https://unipass.customs.go.kr:38010/ext/rest/ioprRprtQry/retrieveIoprRprtBrkd?crkyCn=w230q200d055l210y070u000j1&shipCallImoNo=DSFS8&seaFlghIoprTpcd=11&cstmSgn=030
    'URL_API_KEY_IOPRPRTLST' : 'w230q200d055l210y070u000j1',
    'IOPRPRTLST_URL' : '/ext/rest/ioprRprtQry/retrieveIoprRprtBrkd', 
    //(API021)	입항보고내역조회
    //https://unipass.customs.go.kr:38010/ext/rest/etprRprtQryBrkdQry/retrieveetprRprtQryBrkd?crkyCn=j270e250o085m250i090o050k2&ioprSbmtNo=16SRDJA0023&shipCallSgn=3FBO6
    'URL_API_KEY_ETPRPRTLST' : 'j270e250o085m250i090o050k2',
    'ETPRPRTLST_URL' : '/ext/rest/etprRprtQryBrkdQry/retrieveetprRprtQryBrkd', 
    //(API005)	장치장정보조회
    //https://unipass.customs.go.kr:38010/ext/rest/shedInfoQry/retrieveShedInfo?crkyCn=z290a250z015h280a090h000n2&jrsdCstmCd=020&snarSgn=02010126
    'URL_API_KEY_SHEDINFO' : 'z290a250z015h280a090h000n2',
    'SHEDINFO_URL' : '/ext/rest/shedInfoQry/retrieveShedInfo', 
    //(API020)	컨테이너내역조회
    //https://unipass.customs.go.kr:38010/ext/rest/cntrQryBrkdQry/retrieveCntrQryBrkd?crkyCn=t280x280a075b260y000w060o0&cargMtNo=20ANLU0001I2033
    'URL_API_KEY_CNTRQRY' : 't280x280a075b260y000w060o0',
    'CNTRQRY_URL' : '/ext/rest/cntrQryBrkdQry/retrieveCntrQryBrkd', 
    //(API028) 수입신고 개인통관고유부호 검증
    'URL_API_KEY_PERSECMQRY' : 'i200n250i055z270p050t050f1',
    'PERSECMQRY_URL' : '/ext/rest/persEcmQry/retrievePersEcm',
    //(API022) 수입신고 필증 검증
    'URL_API_KEY_DCLRCRFNVRFC' : 'g210f260x065e270d000g000u1',
    'DCLRCRFNVRFC_URL' : '/ext/rest/impDclrCrfnVrfcQry/retrieveImpDclrCrfnVrfc',
    //(API017) 수출이행기간 단축대상 품목
    'URL_API_KEY_EXPFFMNPRIDSHRTTRGTPRLST' : 'a230q200q075i280y080q030m1',
    'EXPFFMNPRIDSHRTTRGTPRLST_URL' : '/ext/rest/expFfmnPridShrtTrgtPrlstQry/retrieveExpFfmnPridShrtTrgtPrlst',
    //(API003) 수출입요건 승인 내역
    'URL_API_KEY_XTRNUSERREQAPREBRKD' : 'i260r280i035i200h000f020u1',
    'XTRNUSERREQAPREBRKD_URL' : '/ext/rest/xtrnUserReqApreBrkdQry/retrieveXtrnUserReqApreBrkd',
    //(API018) HS부호
    'URL_API_KEY_API018' : 't220d270r085b290d020g060b0',
    'API018_URL' : '/ext/rest/hsSgnQry/searchHsSgn',
    //(API013) 관세사 목록
    'URL_API_KEY_API013' : 'q250q230q035d280v010n090f2',
    'API013_URL' : '/ext/rest/lcaLstInfoQry/retrieveLcaBrkd',
    //(API014) 
    'URL_API_KEY_API014' : 'q220k230l035l210a090v050e2',
    'API014_URL' : '/ext/rest/lcaBrkdQry/retrieveLcaBrkd',
    //(API030) 
    'URL_API_KEY_API030' : 'j250o250s045n290c010f000w2',
    'API030_URL' : '/ext/rest/trrtQry/retrieveTrrt',
    //(API031) 
    'URL_API_KEY_API031' : 'q200p290a067q197a040m040u0',
    'API031_URL' : '/ext/rest/postNoPrCstmSgnQry/retrievePostNoPrCstmSgnQry',
    //(API032) 
    'URL_API_KEY_API032' : 'o280g280h017h187u000d080x0',
    'API032_URL' : '/ext/rest/expImpAffcSbmtInfoQry/retrieveExpImpAffcSbmtInfo',
    //(API033) 
    'URL_API_KEY_API033' : 'v280k210k017b127h030r050c0',
    'API033_URL' : '/ext/rest/alspEntsCdQry/retrieveAlspEntsCd',
}