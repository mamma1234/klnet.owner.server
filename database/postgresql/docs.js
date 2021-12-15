'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool

const dao = require('./../../database/');



const originatorList = (request,response) => {
    console.log(request.body);

    let sql =" select distinct originator from public.own_line_work_originator ";

    console.log(sql);

    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(sql);
            response.status(200).json(result.rows);
        } finally {
            client.release();
        }
    })().catch(err => {console.log(err);response.status(500).json(err)});
}




const mapout = (request, response) => {
    console.log(request.body)

    let sql ="";
    sql += " select c.* from ("
    sql += " select count(*) over()/10+1 as tot_page, floor(((row_number() over(order by a.timestamp desc))-1)/10+1) as curpage, count(*) over() as tot_cnt, "
    sql += " floor(((row_number() over(order by a.timestamp desc))-1)+1) as rownum, "
    sql += " a.xml_msg_id, a.login_id, a.originator, a.recipient, a.doc_name, a.send_method, a.status, a.target_xml_msg_id, to_char(a.timestamp,'YYYY-MM-DD hh24:mi:ss') as timestamp, "
    sql += " b.error_code, b.error_msg, b.timestamp as err_timestamp, b.cur_status "
    sql += " from public.mapout_key a left outer join public.doc_error b "
    sql += " on (a.xml_msg_id = b.xml_msg_id) "
    sql += " where 1=1 "
    sql += " and a.timestamp > '"+request.body.fromDate+"' "
    sql += " and a.timestamp < '"+request.body.toDate+"' "
    sql += request.body.recipient!==""?" and a.recipient = upper('"+request.body.recipient+"')":""
    sql += request.body.fromXmlId!==""?" and a.xml_msg_id = upper('"+request.body.fromXmlId+"')":""
    sql += " order by a.timestamp desc "
    sql += " )c "
    sql += " where c.curpage='"+request.body.num+"' "
    console.log(sql);

    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(sql);
            // response.status(200).json(result.rows);
            dao.oradocs.oraMapout(request,response,result)
        } finally {
            client.release();
        }
    })().catch(err => response.status(500).json(err));
}



async function mapin(request,response,parameter) {
    console.log(request.body);
    const map = await Promise.all(parameter.rows.map((element,index) => {
        return new Promise((resolve, reject) => {
            console.log(element)
            let sql = "";

            sql += " select a.xml_msg_id, a.originator, a.recipient, a.doc_name, a.doc_code, a.cur_status, TO_CHAR(a.timestamp,'YYYY-MM-DD HH24:MI:SS') as timestamp, a.source_xml_msg_id, "
            sql += " b.error_code, b.error_msg, TO_CHAR(b.timestamp,'YYYY-MM-DD HH24:MI:SS') as err_timestamp, b.cur_status as err_cur_status"
            sql += " from public.mapin_tbl a left outer join public.doc_error b "
            sql += " on (a.xml_msg_id = b.xml_msg_id) "
            sql += " where 1=1 "
            sql += " and a.source_xml_msg_id ='"+element.XML_MSG_ID+"' "
            sql += request.body.toRecipient !== ""? " and a.recipient = upper('"+request.body.toRecipient+"') ":""
            sql += request.body.toXmlId !== ""? " and a.xml_msg_id = upper('"+request.body.toXmlId+"') ":""

            console.log(sql);

            ;(async () => {
                const client = await pgsqlPool.connect();
                try {
                    const result = await client.query(sql);
                    
                    if(result.rows.length > 0) {
                        resolve({out_o:element,out_p:result.rows});
                    }else {
                        resolve(null);
                    }
                } finally {
                    client.release();
                }
            })().catch(
                err => {
                    reject({out_o:element,out_p:[]});
                    console.log(err);
                }
            );
        })
    }))
    response.status(200).json(map);
}






module.exports = {
    mapout,
    mapin,
    originatorList
}





