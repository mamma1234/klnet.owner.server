'use strict';

const oraclePool = require("../pool.js").oraclePool
const crypto = require('crypto')
// const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');
const oracleSql = require('../oracle/user');
const requestIp = require('request-ip');

async function setUserToken  (user,token){
    process.on('unhandledRejection',(reason,p )=>{
        console.error('Unhandled Rejection at : ', p , 'reason: ', reason);
    })
    let conn;
    try{
        conn = await oraclePool.getConnection();
        const result = await conn.execute(`UPDATE DO_COMP_USER_TBL 
                                        SET KLNET_LOCAL_TOKEN=:1 , LAST_LOGIN_DATE=SYSDATE WHERE USER_ID=:2`		
                                        ,{1:token, 2:user }, {outFormat:oraclePool.OBJECT});
        
        console.log('user.js setUserToken) result: ', result);
        if (result.rowsAffected){
            await conn.commit();							
        }else{
            await conn.rollback();
            console.log("[ERROR]",err); 
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}


const getUser = async(decoded,user) => {
    let conn;
    try{
        conn = await oraclePool.getConnection();
        const result =  await conn.execute(`select
                                            user_id as \"user_no\",
                                            Upper(email) as \"user_email\",
                                            uname_kr as \"user_name\",
                                            user_id as \"local_id\",
                                            case when system_admin_flag ='Y' then 'Y'
                                                else nvl((select 'Y' from NCS_USER_AUTHOR x where x.user_id = a.user_id and x.author_code ='ROLE_OWN_SYS_MGT' and rownum = 1), 'N') 
                                            end as \"role\",
                                            pwd_chg_date as \"next_pwd_modify_date\",
                                            klnet_id as \"klnet_id\"
                                            from do_comp_user_tbl a
                                            where user_id = :1`, {1:decoded.userno}, {outFormat:oraclePool.OBJECT})
        console.log(result.rows.length)
        if (result.rows.length > 0) {
            return user(null,result.rows[0]);
        } else {
            return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
        }             
    }catch(err){
        // console.log("[ERROR]",err); response.status(400).json(err); 
        return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}
// const getUser = (decoded,user) => {
//     oraclePool.getConnection(function (err, conn) {
//         if (err) {
//             console.log('err:', err);
//             return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
//         }

//         try{
            
// // const sql = `select * from do_comp_user_tbl a where user_id = :1`;

// // console.log('sql:', sql);
// // console.log('decoded:', decoded);
//             conn.execute(`select 
//             user_id as \"user_no\",
//             email as \"user_email\",
//             uname_kr as \"user_name\",
//             user_id as \"local_id\",
//             case when system_admin_flag ='Y' then 'Y'
//                  else nvl((select 'Y' from NCS_USER_AUTHOR x where x.user_id = a.user_id and x.author_code ='ROLE_OWN_SYS_MGT' and rownum = 1), 'N') 
//             end as \"role\",
//             pwd_chg_date as \"next_pwd_modify_date\",
//             klnet_id as \"klnet_id\"
//             from do_comp_user_tbl a
//             where user_id = :1`, {1:decoded.userno}, {outFormat:oraclePool.OBJECT},(err, result) => {
    
//                 if (err) {
//                     console.log('err:', err);
//                     conn.close(function(er) { 
//                         if (er) {
//                             console.log('Error closing connection', er);
//                         } else {
//                             console.log('Connection closed');
//                         }
//                     });                        
//                     return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
//                 } else {
//                     if (result.rows.length < 1) {
//                         conn.close(function(er) { 
//                             if (er) {
//                                 console.log('Error closing connection', er);
//                             } else {
//                                 console.log('Connection closed');
//                             }
//                         });                            
//                         return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
//                     } else {
//                         // console.log('result:', result);
//                         // return user(null, null, result.rows[0]);
//                         conn.close(function(er) { 
//                             if (er) {
//                                 console.log('Error closing connection', er);
//                             } else {
//                                 console.log('Connection closed');
//                             }
//                         });                            
//                         return user(null,result.rows[0]);
//                     }
//                 }
//             });
//         } catch(exception) {
//             //console.log(">>>>>error",error);
//             console.error('exception:', exception);
//             return user("no data",null,{message:'사용자 정보가 존재하지 않습니다.'});
//         }
//     });
// }



const getUserAuthor = (decoded, callback) => {


    oraclePool.getConnection(function (err, conn) {
        if (err) {
            console.log('err:', err);
            return callback("no data",null,{message:'오류가 발생했습니다.'});
        }

        try{
            

// const sql = `select * from do_comp_user_tbl a where user_id = :1`;

// console.log('sql:', sql);
// console.log('decoded:', decoded);
            conn.execute(`select author_code from nplism.ncs_user_author a where user_id = :1`, {1:decoded.userno}, {outFormat:oraclePool.OBJECT},(err, result) => {
    
                if (err) {
                    console.log('err:', err);
                    conn.close(function(er) { 
                        if (er) {
                            console.log('Error closing connection', er);
                        } else {
                            console.log('Connection closed');
                        }
                    });                        
                    return callback("no data",null,{message:'사용자 권한이 존재하지 않습니다.'});
                } else {
                    if (result.rows.length < 1) {
                        conn.close(function(er) { 
                            if (er) {
                                console.log('Error closing connection', er);
                            } else {
                                console.log('Connection closed');
                            }
                        });                            
                        return callback("no data",null,{message:'사용자 권한이 존재하지 않습니다.'});
                    } else {
                        // console.log('result:', result);
                        // return user(null, null, result.rows[0]);
                        conn.close(function(er) { 
                            if (er) {
                                console.log('Error closing connection', er);
                            } else {
                                console.log('Connection closed');
                            }
                        });                            
                        return callback(null,result.rows);
                    }
                }
            });
        } catch(exception) {
            //console.log(">>>>>error",error);
            console.error('exception:', exception);
            return callback("no data",null,{message:'사용자 권한이 존재하지 않습니다.'});
        }

    });
  


}



const getUserInfo = (request,response) => {
    console.log("getUserInfo Param =====" , request.body);
    let query = 
        ` SELECT 
            USER_ID, UNAME_KR, BIRTHDAY, GENDER, PHONE AS TEL,UPPER(EMAIL) AS EMAIL, TO_CHAR(IN_DATE,'YYYY-MM-DD HH24:MI:SS') AS IN_DATE,
            TO_CHAR(PWD_CHG_DATE,'YYYY-MM-DD HH24:MI:SS') AS PWD_CHG_DATE , API_SERVICE_KEY, SVC_TYPE
            ,TO_CHAR(NAVER_LOGIN_DATE,'YYYY-MM-DD') AS NAVER_LOGIN_DATE
            ,TO_CHAR(FACEBOOK_LOGIN_DATE,'YYYY-MM-DD') AS FACEBOOK_LOGIN_DATE
            ,TO_CHAR(GOOGLE_LOGIN_DATE,'YYYY-MM-DD') AS GOOGLE_LOGIN_DATE
            ,TO_CHAR(KAKAO_LOGIN_DATE,'YYYY-MM-DD') AS KAKAO_LOGIN_DATE
           ,KAKAO_ID,NAVER_ID,FACEBOOK_ID,GOOGLE_ID,GOOGLE_ACCESS_TOKEN
          FROM MFEDI.DO_COMP_USER_TBL 
          WHERE USER_ID = :1 `;
    let param = [request.body.userId];

    oraclePool.getConnection((err,conn) => {
        if (err) {
            console.log('err:', err);
            response.status(400).send("Connection Error " + err);
        }
        conn.execute(query,param,{outFormat:oraclePool.OBJECT},(error,result) => {
            if(error) {
                conn.rollback();
                doRelease(conn);
                return;
            }
            conn.commit()
            console.log(result.rows)
            doRelease(conn,result.rows);
            
        })
    })
    function  doRelease(conn,rowList){
        conn.release(err => {
            if(err) {
                response.status(400).send("Execute Error " + error);
            }
            console.log(rowList)
            response.status(200).send(rowList);
        })
    }

}


const setUserInfo = async(request,response) => {
    console.log("setUserInfo Param =======",request.body);
    let sql="";
    let conn;

    if(request.body.gubun&&request.body.userno) {
            sql += " UPDATE MFEDI.DO_COMP_USER_TBL SET "
            if(request.body.gubun==="phone"){
                sql += " TEL = '"+request.body.newTel+"' "
            }else if(request.body.gubun==="email") {
                sql += " EMAIL = '"+request.body.email.toUpperCase()+"' "
            }else if(request.body.gubun==="modify") {
                sql += " PWD_CHG_DATE = SYSDATE "
            }
            sql +=request.body.birth!==undefined ? ` ,BIRTHDAY = '${request.body.birth}'` :''
            sql +=request.body.gender!==undefined ? ` ,GENDER = '${request.body.gender}'` :''
            sql+= request.body.userno!==undefined?" ,UPDATE_BY = '"+request.body.userno+"' ":""
            sql+=" WHERE USER_ID='"+request.body.userno+"' "
            console.log(sql);       
    }else{
        response.status(404).send("Bad Request");
    }       



    try{
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql,[],{outFormat:oraclePool.OBJECT});
        if (result.rowsAffected){
            await conn.commit();
            response.status(200).send(result);						
        }else{
            await conn.rollback();
            console.error("[ERROR]",error); 
        }            
    }catch(err){
        console.log(err)
        response.status(400).send("Connection Error " + err);
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.log(err)
                response.status(400).send("Execute Error " + err);
            }
        }
    }
}

const updateLocalUser=async(req,done)=>{
    let data = req.body
    console.log('updateLocalUser) req.data>>> : ', data )
    let conn;
    const accessToken = jwt.sign({userno:data.id}, process.env.JWT_SECRET_KEY, { expiresIn : 7200, }); //60*60 = 1h (3600)
    const refreshToken = jwt.sign({userno:data.id}, process.env.JWT_SECRET_KEY, { expiresIn : 172800, }); //60*60*48 = 48h
    const ipaddr = requestIp.getClientIp(req);
    const re = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$|::/;
    let sql=''
    // const binds = {1:accessToken, 2:refreshToken, provider_id:data.providerid, provider_token:data.provider_token, 9:data.id, USER_ID:{ type:oraclePool.STRING,dir:oraclePool.BIND_OUT}}
    const binds = {provider_id:data.providerid, provider_token:data.provider_token, 9:data.id, USER_ID:{ type:oraclePool.STRING,dir:oraclePool.BIND_OUT}}
    if(data.provider&&!(data.provider==='klnet'||data.provider==='local')){
            sql= `UPDATE DO_COMP_USER_TBL SET 
             ${data.provider}_ID = :provider_id ,
             ${data.provider}_ACCESS_TOKEN= :provider_token  
              WHERE USER_ID=:9 RETURNING  USER_ID INTO :USER_ID` //공통
    }
    // let sql = `UPDATE DO_COMP_USER_TBL 
    //             SET klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate `
    // if (!re.test(ipaddr)){
    //     console.log(ipaddr, ' >>> update with last_login_ip')
    //     sql += " , last_login_ip=:ipaddr "
    //     binds.ipaddr=ipaddr
    // }
    // if(data.provider&&!(data.provider==='klnet'||data.provider==='local')){
    //         sql += ","
    //         sql += data.provider + "_ID = :provider_id , "
    //         sql += data.provider +"_ACCESS_TOKEN= :provider_token , "
    //         sql += data.provider + "_LOGIN_DATE=sysdate "
    // }
    // sql += ` WHERE USER_ID=:9 RETURNING  USER_ID INTO :USER_ID` //공통
    console.log('sql>>> ',sql)
    console.log('binds>>> ',binds)	
    try{
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql, binds, {outFormat:oraclePool.OBJECT});
        console.log('user.js updateLocalUser) result: ', result);
        if (result.rowsAffected){
            await conn.commit();
            // done(result.outBinds.USER_ID, accessToken, refreshToken)							
            done(result.outBinds.USER_ID)							
        }else{
            await conn.rollback();
            console.log("[ERROR]",err); 
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}
async function getMyIdList(request,response){
    let conn;
    console.log(request.body.phoneNum,request.body.userName)
    try{
        let query, binds, options, result;

        conn =  await oraclePool.getConnection();

        //sql,binds by gubun
        if(request.body.gubun==='phone') {
            query = 
            ` SELECT USER_ID FROM MFEDI.DO_COMP_USER_TBL 
                WHERE UNAME_KR = :1 AND PHONE = :2 
                `
            binds={1:request.body.userName,2:request.body.phoneNum};
        // }else if(request.body.gubun==='birth'){
        //     query = 
        //     ` SELECT SUBSTR(USER_ID,1,CEIL(LENGTH(USER_ID)/2))|| lpad('*',CEIL(LENGTH(USER_ID))/2,'*') AS USER_ID 
        //         FROM MFEDI.DO_COMP_USER_TBL WHERE UNAME_KR = :1 AND BIRTHDAY = :2 AND GENDER = :3 `
        //     binds = {1:request.body.userName,2:request.body.birthDay,3:request.body.gender};
        }else if(request.body.gubun==="pw") {
            query =
            ` SELECT USER_ID FROM MFEDI.DO_COMP_USER_TBL 
                WHERE USER_ID = :1 AND PHONE = :2 AND UNAME_KR = :3  `
            binds = {1:request.body.id,2:request.body.phoneNum,3:request.body.userName};
        }
        query +=" ORDER BY USER_ID DESC "
        options = {outFormat:oraclePool.OBJECT} //공통
        console.log(query)

        result = await conn.execute(query,binds,options);
        console.log(binds)
        console.log(result.rows)

        return response.status(200).json(result.rows);

    }catch(err){
        console.log("[ERROR]",err);
        response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}


async function getUserPhoneInfo (req,res){
	console.log(req.body.id);
    // console.log("user info sms ------------------------------------------------");
	let conn;
    try{
        let sql, binds, options, result;
        conn =  await oraclePool.getConnection();
        sql = `SELECT USER_ID as origin_local_id
                    ,Rpad(substr(USER_ID,'1','3'),length(USER_ID),'*') as local_id
                    , to_char(IN_DATE,'YYYY-MM-DD') as insert_date
                    , substr(PHONE,'1','3')||'-'||substr(PHONE,'4','2')||'**-'|| substr(PHONE,'8','2')||'**' as user_phone
                    ,PHONE as origin_user_phone 
                FROM MFEDI.DO_COMP_USER_TBL
                where upper(PHONE) = upper(:1) 
                and UNAME_KR = :2  `
        if(req.body.id) {
            sql += "and upper(local_id) = upper('"+req.body.id+"')";
            // sql += "and USER_ID = '"+req.body.id+"' ";
        }
        binds={1:req.body.phone, 2:req.body.name}
        options = {outFormat:oraclePool.OBJECT} //공통
        result = await conn.execute(sql,binds,options);
        // console.log(sql,binds,options)
        console.log("result.rows[0] : ",result.rows[0])
        
        return res.status(200).json(result.rows[0]);

    }catch(err){
        console.log("[ERROR]",err);
        response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('fianally conn.close>>>')
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}


async function getJwtSelecter(request,response,parameter) {
    console.log(request.body)

    const map = await Promise.all(parameter.rows.map((element,index) => {
        return new Promise((resolve, reject) => {
            if(element.mbl_no !== null && element.mrn != null) {
                let sql = "";
                sql += " SELECT x.mrn, "
                sql += " y.mbl_no, x.dpt_date, y.status_cus, "
                sql += " CASE WHEN y.status_cus = 'B1' THEN '1차 보완' "
                sql += " WHEN y.status_cus = 'B2' THEN '2차 보완' "
                sql += " WHEN y.status_cus = 'B3' THEN '3차 보완' "
                sql += " WHEN y.status_cus = 'BA' THEN '1차마감 보완' "
                sql += " WHEN y.status_cus = 'BB' THEN '2차마감 보완' "
                sql += " WHEN y.status_cus = 'BF' THEN '3차마감 보완' "
                sql += " WHEN y.status_cus = 'CA' THEN '보완통보' "
                sql += " WHEN y.status_cus = 'E1' THEN '1차 오류' "
                sql += " WHEN y.status_cus = 'E2' THEN '2차 오류' "
                sql += " WHEN y.status_cus = 'E3' THEN '3차 오류' "
                sql += " WHEN y.status_cus = 'EA' THEN '1차마감 오류' "
                sql += " WHEN y.status_cus = 'EB' THEN '2차마감 오류' "
                sql += " WHEN y.status_cus = 'EF' THEN '최종마감 오류' "
                sql += " WHEN y.status_cus = 'FA' THEN '승인' "
                sql += " WHEN y.status_cus = 'H1' THEN '1차 확인' "
                sql += " WHEN y.status_cus = 'H2' THEN '2차 확인' "
                sql += " WHEN y.status_cus = 'H3' THEN '3차 확인' "
                sql += " WHEN y.status_cus = 'HA' THEN '1차마감 확인' "
                sql += " WHEN y.status_cus = 'HB' THEN '2차마감 확인' "
                sql += " WHEN y.status_cus = 'HF' THEN '3차마감 확인' "
                sql += " WHEN y.status_cus = 'ND' THEN '삭제' "
                sql += " WHEN y.status_cus = 'NI' THEN '추가' "
                sql += " WHEN y.status_cus = 'NO' THEN '제출전' "
                sql += " WHEN y.status_cus = 'NU' THEN '정정' "
                sql += " WHEN y.status_cus = 'R1' THEN '1차 접수' "
                sql += " WHEN y.status_cus = 'R2' THEN '2차 접수' "
                sql += " WHEN y.status_cus = 'R3' THEN '3차 접수' "
                sql += " WHEN y.status_cus = 'RA' THEN '1차마감 접수' "
                sql += " WHEN y.status_cus = 'RB' THEN '2차마감 접수' "
                sql += " WHEN y.status_cus = 'RF' THEN '최종마감 접수' "
                sql += " WHEN y.status_cus = 'S1' THEN '1차 제출' "
                sql += " WHEN y.status_cus = 'S2' THEN '2차 제출' "
                sql += " WHEN y.status_cus = 'S3' THEN '3차 제출' "
                sql += " WHEN y.status_cus = 'SA' THEN '1차마감 제출' "
                sql += " WHEN y.status_cus = 'SB' THEN '2차마감 제출' "
                sql += " WHEN y.status_cus = 'SF' THEN '최종마감 전송' "
                sql += " WHEN y.status_cus = 'T1' THEN '1차 미접수' "
                sql += " WHEN y.status_cus = 'T2' THEN '2차 미접수' "
                sql += " WHEN y.status_cus = 'T3' THEN '3차 미접수' "
                sql += " WHEN y.status_cus = 'TA' THEN '1차마감 미접수' "
                sql += " WHEN y.status_cus = 'TB' THEN '2차마감 미접수' "
                sql += " WHEN y.status_cus = 'TF' THEN '최종마감 미접수' "
                sql += " WHEN y.status_cus = 'WA' THEN '승인취소' "
                sql += " WHEN y.status_cus = 'WM' THEN '적하목록 취소' "
                sql += " ELSE y.status_cus "
                sql += " END AS status_name "
                sql += " FROM kmcs.cms_exp_mrn x, "
                sql += " kmcs.cms_exp_mbl y "
                sql += " WHERE x.mrn = y.mrn "
                sql += " and x.mrn = '"+element.mrn+"' "
                sql += " and y.mbl_no ='"+element.mbl_no+"' "
                console.log(sql);
                oraclePool.getConnection(function(err,conn,done) {
                    if(err){
                        reject({p:element,o:[]})
                    } else {

                        conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
                            if (error) {
                                reject({p:element,o:[]});
                            } else {
                                // console.log(results.json);
                                // console.log(results);
                                // response.send(results.rows);
                                resolve({p:element,o:results.rows});
                            }
                            conn.close();                
                        });
                        // conn.release();
                    }

                });
            }else {
                resolve({p:element,o:[]});
            }
        })
    }))
    response.status(200).json(map);
}

async function selectId (request,response) {
    console.log(request.body);
    let conn;
    try{
        conn =  await oraclePool.getConnection();
        const result = await conn.execute(`SELECT * FROM DO_COMP_USER_TBL WHERE USER_ID = :1`,{1:request.body.id});
        console.log(result.rows.length)
        if (result.rows.length > 0) {
            return response.status(200).json(result.rows.length);
        } else {
            return response.status(200).send("FAIL");
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}



const createUserApiKey = (request,response) => {
    console.log(request.body)
    if(request.body){

        let cipher = crypto.createCipher('aes-256-cbc', request.body.no);
        let apiKey = cipher.update(request.body.id,'uft8','base64');
        apiKey += cipher.final('base64');

        
        
        let query = 
            ` UPDATE MFEDI.DO_COMP_USER_TBL A SET API_SERVICE_KEY = :1 WHERE USER_ID = :2 AND API_SERVICE_KEY IS NULL `
        let param = [apiKey, request.body.id];

        try {
            oraclePool.getConnection((err,conn) => {
                if (err) {
                    console.log('err:', err);
                    response.status(400).send("Connection Error " + err);
                }
                conn.execute(query,param,{outFormat:oraclePool.OBJECT}, (error,result) => {
                    if(error) {
                        doRelease(conn)
                        return;
                    }
                    conn.commit();
                    if(result.rowsAffected===1) {
                        console.log('result',result)
                        
                        doRelease(conn,result.rows,'new',apiKey);
                        
                    }else {
                        
                        doRelease(conn,result.rows,'none','');
                        
                        
                    }
                    
                })
                function  doRelease(conn,rowList,state,apiKey){
                    conn.release(err => {
                        if(err) {
                            response.status(400).send("Query Execute Error " + err);
                        }
                        if(state === "new") {
                            response.status(200).send({state:'new',data:apiKey})
                        }else if(state === "none") {
                            response.status(200).send({state:'none',data:rowList})
                        }
                        
                    })
                }
                    
            })
        }catch(e) {
            console.log(e)
        }finally {

        }
    }else {
        response.status(400).send("BAD REQUEST");
    }

        
        

}



async function setSocialLoginInfo (provider, providerid, token , social_token) {
    console.log("setSocialLoginInfo>>>>provider:",provider,"providerid:",providerid,"token:",token);
    let conn;
    let sql;
    let binds = {1:providerid, 2:token, 3:social_token};
    if(provider == "kakao") {
        sql = 
        `MERGE INTO DO_COMP_USER_TBL
            USING DUAL 
            ON (KAKAO_ID=:1)
        WHEN MATCHED
            THEN UPDATE	SET KLNET_LOCAL_TOKEN= :2, KAKAO_ACCESS_TOKEN = :3 , KAKAO_LOGIN_DATE = SYSDATE
        WHEN NOT MATCHED
            THEN INSERT (KLNET_ID, USER_ID, KAKAO_ID, KLNET_LOCAL_TOKEN, KAKAO_ACCESS_TOKEN, KAKAO_LOGIN_DATE)
                VALUES('KLDUMY01',to_char(SYSDATE,'YYMMDDhh24miss'), :1, :2, :3, SYSDATE)`

    } else if (provider == "naver") {
        sql =        
         `MERGE INTO DO_COMP_USER_TBL
                USING DUAL 
                ON (NAVER_ID=:1)
        WHEN MATCHED
            THEN UPDATE	SET KLNET_LOCAL_TOKEN= :2, NAVER_ACCESS_TOKEN = :3 , NAVER_LOGIN_DATE = SYSDATE
        WHEN NOT MATCHED
            THEN INSERT (KLNET_ID, USER_ID, NAVER_ID, KLNET_LOCAL_TOKEN, NAVER_ACCESS_TOKEN, NAVER_LOGIN_DATE)
                VALUES('KLDUMY01',to_char(SYSDATE,'YYMMDDhh24miss'), :1, :2, :3, SYSDATE)`
    } else if (provider == "google") {
        sql = 
        `MERGE INTO DO_COMP_USER_TBL
                USING DUAL 
                ON (GOOGLE_ID=:1)
        WHEN MATCHED
            THEN UPDATE	SET KLNET_LOCAL_TOKEN= :2, GOOGLE_ACCESS_TOKEN = :3 , GOOGLE_LOGIN_DATE = SYSDATE
        WHEN NOT MATCHED
            THEN INSERT (KLNET_ID, USER_ID, GOOGLE_ID, KLNET_LOCAL_TOKEN, GOOGLE_ACCESS_TOKEN, GOOGLE_LOGIN_DATE)
                VALUES('KLDUMY01',to_char(SYSDATE,'YYMMDDhh24miss'), :1, :2, :3, SYSDATE)`
    } else if (provider == "facebook") {
        sql = 
        `MERGE INTO DO_COMP_USER_TBL
                USING DUAL 
                ON (FACEBOOK_ID=:1)
        WHEN MATCHED
            THEN UPDATE	SET KLNET_LOCAL_TOKEN= :2, FACEBOOK_ACCESS_TOKEN = :3 , FACEBOOK_LOGIN_DATE = SYSDATE
        WHEN NOT MATCHED
            THEN INSERT (KLNET_ID, USER_ID, FACEBOOK_ID, KLNET_LOCAL_TOKEN, FACEBOOK_ACCESS_TOKEN, FACEBOOK_LOGIN_DATE)
                VALUES('KLDUMY01',to_char(SYSDATE,'YYMMDDhh24miss'), :1, :2, :3, SYSDATE)`
    }

    try{
        conn =  await oraclePool.getConnection();
        const result = await conn.execute(sql,binds,{outFormat:oraclePool.OBJECT});
        
        if ( result.rowsAffected) {
            console.log(result)
            await conn.commit();							
        }else{
            await conn.rollback();
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}

module.exports = {
    getUser,
    getUserAuthor,
    getUserInfo,
    setUserInfo,
    getMyIdList,
    setUserToken,
    selectId,
    getUserPhoneInfo,
    createUserApiKey,
    setSocialLoginInfo,
    updateLocalUser,
}
