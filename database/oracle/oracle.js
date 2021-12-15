'use strict';

const oraclePool = require("../pool.js").oraclePool
// const oracledb = require('oracledb');


async function getOraKmcs(request,response,parameter) {
    console.log(request.body)

    const map = await Promise.all(parameter.rows.map((element,index) => {
        return new Promise((resolve, reject) => {
            if(element.mbl_no !== null && element.mrn != null) {
                
                let sql = "";
                sql += " SELECT x.mrn, "
                sql += " y.mbl_no, x.dpt_date, y.status_cus, "
                sql += " TO_CHAR(TO_DATE(x.dpt_date, 'YYYYMMDDHH24MISS'), 'YYYY-MM-DD HH24:MI:SS') as dpt_date_x, "
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
                                console.log('results.rows[0]====',results);
                                // console.log(results);
                                // response.send(results.rows[0]);
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

module.exports = {
    getOraKmcs,
}