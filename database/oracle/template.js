'use strict';

const oraclePool = require("../pool.js").oraclePool
// const oracledb = require('oracledb');

const getTestSimple = (request, response) => {
    response.send([    
        {
            'id': 1,
            'image': 'https://placeimg.com/64/64/1',
            'name': '홍길동',
            'birthday': '961222',
            'gender': '남자',
            'job': '대학생'
        },
        {
            'id': 2,
            'image': 'https://placeimg.com/64/64/2',
            'name': '나동빈',
            'birthday': '960508',
            'gender': '남자',
            'job': '프로그래머'
        },
        {
            'id': 3,
            'image': 'https://placeimg.com/64/64/3',
            'name': '이순신',
            'birthday': '961127',
            'gender': '남자',
            'job': '디자이너'
        }
    ]);
}



const getTestQuerySample = (request, response) => {
    const sql = "SELECT sysdate, sysdate FROM dual";
    oraclePool.getConnection(function (err, conn) {
        conn.execute(sql, (error, results) => {
            if (error) {
            response.status(400).json({ "error": error.message });
            return;
            }
            // response.send(results);
            response.send(results.rows);
        });  
    });

}


const getTestQueryParamSample = (request, response) => {
    const sql = "SELECT * FROM NCS_EXP_MRN where dpt_date = :1 and dpt_date = :2 "

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.execute(sql, ['20111218', '20111218'], (error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            }

            // console.log(results.json);
            // console.log(results);
            // response.send(results.rows);
            response.status(200).json(results.rows);
        });  

        // conn.release();
    });
}


const getTestQueryAttibuteSample = (request, response) => {
	console.log(">>>>>>>>>>>>");
    const sql = "SELECT * FROM NCS_EXP_MRN where dpt_date = :1 and dpt_date = :2 "
    console.log(request.body)

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.execute(sql, {outFormat:oraclePool.OBJECT}, (error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            }

            // console.log(results.json);
            // console.log(results);
            // response.send(results.rows);
            
            response.status(200).json(results.rows);
            // console.log(results.fields);

            // console.log(results.rows.length);
        });  

        // conn.release();
    });
}

const getImpFlowSample = (request, response) => {

    let sql = "select *from (select FLOOR(count(*) over()/10+1) as tot_page,  \n";
    sql += "FLOOR((ROWNUM-1)/10+1) as curpage, count(*) over() as tot_cnt,a.*,to_char(a.update_date,'YYYY-MM-DD hh24:mi') as update_date2,to_char(a.reg_date,'YYYY-MM-DD hh24:mi') as reg_date2 from mfedi.tcs_flow_import_tracking a \n";
    if(request.body.cntrNo !="") {
		sql +=  "where cntr_no='"+request.body.cntrNo+"'";
	}
    sql += "order by reg_Date desc) where curpage='"+request.body.num+"' \n";

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.execute(sql,{},{outFormat:oraclePool.OBJECT}, (error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            }

            response.status(200).json(results.rows);

        }); 
    });
}

const getExpFlowSample = (request, response) => {

	let sql = "select *from (select FLOOR(count(*) over()/10+1) as tot_page,  \n";
    sql += "FLOOR((ROWNUM-1)/10+1) as curpage, count(*) over() as tot_cnt,a.*,to_char(a.update_date,'YYYY-MM-DD hh24:mi') as update_date2,to_char(a.reg_date,'YYYY-MM-DD hh24:mi') as reg_date2 from mfedi.tcs_flow_export_tracking a \n";
    if(request.body.cntrNo !="") {
		sql +=  "where cntr_no='"+request.body.cntrNo+"'";
	}
    sql += "order by reg_Date desc) where curpage='"+request.body.num+"' \n";
    

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.execute(sql, {},{outFormat:oraclePool.OBJECT}, (error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            }

            response.status(200).json(results.rows);
        });  

    });
}


const setSms = (phone, msg,res,rows) => {

	let sql = "INSERT INTO ebill.em_tran \n";
	    sql += "(tran_pr, tran_phone, tran_callback, tran_status, tran_date, tran_msg, tran_etc3) VALUES \n";
	    sql += "(ebill.em_tran_pr.nextval,'"+phone+"','15771172', '1', SYSDATE,'"+msg+"', 'ETR100') \n";
	    
    console.log(sql);

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            return res.status(404).json({ "error": err });
        } else {

	        conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
	        	
	            if (error) {
	                return res.status(404).json({ "error": error });
	            } else {
		            conn.close();
		            return res.status(200).json(rows);
	            }
	        });
        }
    });
}

const getProgressInfo = (request, response) => {
	  let sql = "";
	  //const portCode=request.body.portCode.substr(0,3);
	console.log("입력Keyword:");
        sql = "select line_code as \"line_code\",case when line_code='OTHER' then '기타' else NVL(kname,line_code) end as \"line_name\", per_value||'%' as \"per_value\", round(per_value,2)||'%' as \"per_view\" from ("
	          +" select case when customs_line_code ='OTHER' then 'OTHER' when customs_line_code='ONEY' then 'ONE' else \n"
	          + "  NVL((select line_code from PORTMIS.CODE_CUSHIP WHERE line_code is not null and id = customs_line_code and rownum=1),customs_line_code) end as line_code, \n"
		      +" (select shipper_kname from KMCS.STAT_SHIPPER_ID "
		      +" where shipper_id = customs_line_code and shipper_kname is not null and rownum=1) as kname,"
		      +" ROUND((RATIO_TO_REPORT(sum(weight))OVER()*100),1) as per_value from ("
		      +" select case when rnk > 5 then 'OTHER' else customs_line_code end as customs_line_code, weight from ("
		      +" select customs_line_code, sum(gross_weight_sum) as weight, row_number() over(order by 2) rnk from KMCS.STAT_ALL_CMS_EXP_MBL_DTL"
		      +" where stat_year = to_char(sysdate,'YYYY')-1 and pol ='"+request.body.startPort+"' and POD = '"+request.body.endPort+"' group by customs_line_code order by weight desc)where weight > 0) group by customs_line_code"
		      +" order by per_value desc)";
	    
	    console.log("쿼리:"+sql);

oraclePool.getConnection(function(err,conn,done) {
    if(err){
        console.log("err" + err);
        response.status(400).send(err);
    } else {

        conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            } else {

                // console.log(results.json);
                // console.log(results.rows);
                // response.send(results.rows);
        
                response.status(200).json(results.rows);
            }

            conn.close();
            
        });
        // conn.release();
    }

});
}

module.exports = {
	    getTestSimple,
	    getTestQuerySample,
	    getTestQueryParamSample,
	    getTestQueryAttibuteSample,
	    getImpFlowSample,
	    getExpFlowSample,
	    setSms,
	    getProgressInfo
	}