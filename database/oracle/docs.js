'use strict';

const oraclePool = require("../pool.js").oraclePool
const dao = require('./../../database/');



// const oraMapout = (request, response) => {

//     console.log(request.body);
//     let sql = "";
//     sql += " select a.doc_msg_id, a.xml_msg_id, a.login_id, a.originator, a.recipient, a.error_code, a.cur_status, TO_CHAR(a.timestamp,'YYYY-MM-DD HH24:MI:SS') as timestamp, "
//     sql += " b.doc_msg_id as ou_doc_msg_id, b.xml_msg_id as ou_xml_msg_id , b.login_id as ou_login_id, b.originator as ou_originator, "
//     sql += " b.recipient as ou_recipient, b.error_code as ou_error_code, b.cur_status as ou_cur_status, TO_CHAR(b.send_time,'YYYY-MM-DD HH24:MI:SS') as send_time "
//     sql += " from cnedi.manage_tbl a left outer join cnedi.manage_tbl b "
//     sql += " on (a.xml_msg_id || 'OU' = b.xml_msg_id) "
//     sql += " where 1=1 "
//     sql += " and a.xml_msg_id ='"+request.body.targetId+"' "
//     sql += request.body.beforeRecipient!==""?"and a.recipient = upper('"+request.body.beforeRecipient+"')":""
//     sql += request.body.afterRecipient!==""?"and b.recipient = upper('"+request.body.afterRecipient+"')":""
//     console.log(sql);
//     oraclePool.getConnection(function(err,conn,done) {
//         if(err){
//             console.log("err" + err);
//             response.status(400).send(err);
//         } else {

//             conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
//                 if (error) {
//                     response.status(400).json({ "error": error.message });
//                     return;
//                 } else {
//                     response.status(200).json(results.rows);
//                 }
//                 conn.close();                
//             });
//             // conn.release();
//         }

//     });
// }

async function oraMapout(request,response,parameter) {
    console.log(request.body)

    const map = await Promise.all(parameter.rows.map((element,index) => {
        return new Promise((resolve, reject) => {
            let sql = "";
            sql += " select a.doc_msg_id, a.xml_msg_id, a.login_id, a.originator, a.recipient, a.error_code, a.cur_status, TO_CHAR(a.timestamp,'YYYY-MM-DD HH24:MI:SS') as timestamp, "
            sql += " b.doc_msg_id as ou_doc_msg_id, b.xml_msg_id as ou_xml_msg_id , b.login_id as ou_login_id, b.originator as ou_originator, "
            sql += " b.recipient as ou_recipient, b.error_code as ou_error_code, b.cur_status as ou_cur_status, TO_CHAR(b.send_time,'YYYY-MM-DD HH24:MI:SS') as send_time "
            sql += " from cnedi.manage_tbl a left outer join cnedi.manage_tbl b "
            sql += " on (a.xml_msg_id || 'OU' = b.xml_msg_id) "
            sql += " where 1=1 "
            sql += " and a.xml_msg_id ='"+element.target_xml_msg_id+"' "
            sql += request.body.beforeRecipient!==""?" and a.recipient = upper('"+request.body.beforeRecipient+"')":""
            sql += request.body.afterRecipient!==""?" and b.recipient = upper('"+request.body.afterRecipient+"')":""
            sql += request.body.beforeXmlId!==""?" and a.xml_msg_id = upper('"+request.body.beforeXmlId+"')":""
            sql += request.body.afterXmlId!==""?" and b.xml_msg_id = upper('"+request.body.afterXmlId+"')":""

            oraclePool.getConnection(function(err,conn,done) {
                if(err){
                    reject({out_p:element,out_o:[]})
                } else {
        
                    conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
                        
                        if (error) {
                            reject({out_p:element,out_o:[]});
                        } else {
                            if(results.rows.length > 0) {
                                resolve({out_p:element,out_o:results.rows});
                            }else {
                                resolve(null);
                            }
                            
                        }
                        conn.close();
                    });
                }
            })
        })
        
    }))
    response.status(200).json(map);
}




const oraMapIn = (request, response) => {

    console.log(request.body)

    let sql ="";
    sql += " select c.* from ("
    sql += " select floor(((row_number() over(order by a.timestamp desc))-1)+1) AS rowcount, FLOOR(count(*) over()/10+1) as tot_page, "
    sql += " floor(((row_number() over(order by a.timestamp desc))-1)/10+1) as curpage, count(*) over() as tot_cnt, "
    sql += " a.doc_msg_id, a.xml_msg_id, a.login_id, a.originator, a.recipient, TO_CHAR(a.timestamp,'YYYY-MM-DD HH24:MI:SS') as timestamp, b.doc_name, b.doc_code, b.error_code, b.error_msg, b.doc_no "
    sql += " From cnedi.manage_tbl a, cnedi.manage_ref b "
    sql += " WHERE 1=1 "
    sql += " AND TO_CHAR(a.timestamp,'YYYYMMDD') > '"+request.body.fromDate+"' "
    sql += " AND TO_CHAR(a.timestamp,'YYYYMMDD') < '"+request.body.toDate+"' "
    sql += " and a.xml_flow = 'R' "
    sql += " and a.xml_msg_id = b.xml_msg_id "
    sql += request.body.originator!==""?" and a.originator = '"+request.body.originator+"' ":""
    sql += request.body.fromRecipient!==""?" and a.recipient = '"+request.body.fromRecipient+"' ":""
    sql += request.body.fromXmlId!==""?" and a.xml_msg_id = '"+request.body.fromXmlId+"' ":""
    sql += " )c where c.curpage='"+request.body.num+"' "


    console.log(sql);

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {

            conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
                if (error) {
                    console.log('error',error)
                    response.status(400).json({ "error": error.message });
                } else {
                    dao.docs.mapin(request,response,results);
                }
                conn.close();                
            })
        }

    });
}





module.exports = {
    oraMapout,
    oraMapIn,
}