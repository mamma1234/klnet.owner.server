'use strict';

const oraclePool = require("../pool.js").oraclePool
const dao = require('./../../database/');
// const sUser = require('../../models/sessionUser');

const getCompInfo = (request,response) => {
    try {
    console.log("getCompInfo) param ===", request.body,", request.localUser === ",request.localUser );
    let query = "";
    let param = [];
    if(request.body.klnetId) {
        query = 
        ` SELECT * \n 
            FROM MFEDI.TCS_COMP_HEADER_TBL \n
            WHERE 1=1 \n
            AND KLNET_ID = :1`
        param.push(request.body.klnetId);
    }else{
        query = 
        ` SELECT * \n 
            FROM MFEDI.TCS_COMP_HEADER_TBL \n
            WHERE 1=1 \n
            AND REG_NO = :1`
        param.push(request.body.bn);
    } 
    console.log("getCompInfo: ",query);
    oraclePool.getConnection(async(err,conn) => {
        if (err) {
            console.log('err:', err);
            response.status(400).send("DB Connection Error " + err);
        }
        await conn.execute(query,param,{outFormat:oraclePool.OBJECT},(error,result) => {
            if(error) {
                doRelease(conn);
                return;
            }
            doRelease(conn,result.rows);
        })
    })
    function  doRelease(conn,rowList){
        conn.release(err => {
            if(err) {
                response.status(400).send("Query Execute Error " + error);
            }
            // console.log(rowList)
            response.status(200).send(rowList);
        })
    }
    }
    catch(error) {
    console.error('comp.js error >>>>',error);
    response.status(400).send(error);
    }   
}


const addCompany = (request,response) => {
    try{
        console.log("addCompany) param ===", request.body,", request.localUser === ",request.localUser );

        oraclePool.getConnection(async(err,conn) => {
            if (err) {
                console.log('err:', err);
                response.status(400).send("DB Connection Error " + err);
            }
            await conn.execute('SELECT KLNET_ID FROM MFEDI.DO_COMP_USER_TBL WHERE USER_ID = :1 ',[request.localUser.userno],{outFormat:oraclePool.OBJECT},async(error,result) => {
                if(error) {
                    doRelease(conn);
                    return;
                }
                if(result.rows.length > 0) {
                    if(result.rows[0].KLNET_ID ==="KLDUMY01") {
                        let updateQuery = ` UPDATE MFEDI.DO_COMP_USER_TBL SET KLNET_ID = :1 WHERE USER_ID = :2 `
                        console.log('update QUERY=== ', updateQuery);
                        await conn.execute(updateQuery,[request.body.param.KLNET_ID,request.localUser.userno],async(err,result) => {
                            if(err) {
                                await conn.rollback();
                                doRelease(conn);
                                return;
                            }
                            if(result.rowsAffected===1) {
                                conn.execute(" UPDATE NPLISM.NCS_USER_AUTHOR SET AUTHOR_CODE = 'ROLE_OWN_COMP_ROLE' WHERE USER_ID = :1 AND AUTHOR_CODE = 'ROLE_BLG_COMP_MGT' ",
                                [request.localUser.userno],async(err1,result1) => {
                                    if(err1) {
                                        await conn.rollback();
                                        doRelease(conn);
                                        return;
                                    }
                                    if(result1.rowsAffected===1) {
                                        await conn.commit();
                                        doRelease(conn,'success');
                                    } else {
                                        conn.execute(" INSERT INTO NPLISM.NCS_USER_AUTHOR (USER_ID, AUTHOR_CODE, UPDATE_BY) VALUES(:1, 'ROLE_OWN_COMP_ROLE', 'PLISMPLUS') ",
                                            [request.localUser.userno],async(err2,result2) => {
                                                if(err2) {
                                                    await conn.rollback();
                                                    doRelease(conn);
                                                    return;
                                                }
                                                
                                                if(result2.rowsAffected===1) {
                                                    await conn.commit();
                                                    doRelease(conn,'success');
                                                }
                                            })
                                    }
                                })
                            }else {
                                doRelease(conn);
                            }
                        })
                        
                    }else {
                        doRelease(conn,'duplicate');
                    }
                }else {
                    doRelease(conn,'error');
                }
            })
        
        })
        function doRelease(conn,state){
            conn.release(err => {
                if(err) {
                    response.status(400).send(err);
                }
                response.status(200).send(state);

            })
        }
    }catch(error) {
        console.error('comp.js error >>>>',error);
        response.status(400).send(error);
        } 
}
const writeAuthority = (request, response) => {
    console.log("writeAuthority) param ===", request.body,", request.localUser === ",request.localUser );
    try{
    oraclePool.getConnection(async(err,conn) => {
        if (err) {
            console.log('err:', err);
            response.status(400).send("DB Connection Error " + err);
        }

        conn.execute(` 
            SELECT KLNET_ID FROM mfedi.TCS_COMP_HEADER_TBL tcht 
            WHERE REG_NO ='2208102504' 
            OR KLNET_ID = 'WDFCE032' 
            OR cname_kr LIKE '%위동%' 
            GROUP BY KLNET_ID `,[],{outFormat:oraclePool.OBJECT},(error,result) => {
            if(error) {
                doRelease(conn);
                return;
            }
            doRelease(conn,result.rows);
        })
    })
    function  doRelease(conn,rowList){
        conn.release(err => {
            if(err) {
                response.status(400).send("Query Execute Error " + error);
            }
            console.log(rowList)
            response.status(200).send(rowList);
        })
    }
}catch(error) {
    console.error('comp.js error >>>>',error);
    response.status(400).send(error);
    }     
}


module.exports = {
    getCompInfo,
    addCompany,
    writeAuthority
    
}