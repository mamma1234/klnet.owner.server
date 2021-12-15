const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
const multer = require('multer');
const fs = require('fs');
// const sUser = require('../../models/sessionUser');



const searchIdentify =(request,response) => {


  let sql = "";

  sql += " select b.* from ( "
  sql += " SELECT count(*) over()/10+1 as tot_page, (row_number() over()) as num, "
  sql += " count(*) over() total_cnt,floor(((row_number() over()) -1) /10 +1) as curpage, "
  sql += " * "
  sql += " FROM own_company_identify "
  sql += " where 1=1 "
  sql += request.body.companyId!==""?" and company_id = upper('"+request.body.companyId+"') ":""
  sql += request.body.sectionId!==""?" and section_id = upper('"+request.body.sectionId+"') ":""
  sql += request.body.workCode!==""?" and work_code = upper('"+request.body.workCode+"') ":""
  sql += " )b where b.curpage ='"+request.body.num+"' " 


  console.log(sql)
  ;(async () => {
    const client = await pgsqlPool.connect();
  try {
    const result = await client.query(sql);
    response.status(200).json(result.rows);
  } finally {
    client.release();
  }})().catch(err => console.log(err))

}



const checkLineWDFCCompany = (request,response) => {
  const sql = {
    text : `
          select * 
          from own_line_company 
          where klnet_id = $1
          and line_code = $2
      `,
    values:[request.body.param, request.body.lineCode]
  }
  console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}




const getCompanyWorkList = (klnet_id, done) => {
   
  try{

    console.log('getCompanyWorkList klnet_id:', klnet_id);
  
    const sql = {
      text: ` select work_code, recipient from own_company_identify where klnet_id=$1 `,
      values: [
        klnet_id
      ]
    }
    
    console.log('getCompanyWorkList sql:', sql);

    pgsqlPool.connect(function(err,conn,release) {

      conn.query(sql, function(err,result){
        if(err){
          console.log(err);
          return done("no data",null,{message:'업체 업무 정보가 존재하지 않습니다.'});
        }

        // console.log('result:', result);
        if(result.rowCount > 0) {
          return done(null, result.rows);
        } else {
          return done(null, []);
        }

      });

      release();
    });

  } catch(exception) {
    //console.log(">>>>>error",error);
    console.error('exception:', exception);
    return user("no data",null,{message:'업체 업무 정보가 존재하지 않습니다.'});
  }

}


const getLineCompany = (request,response) => {
  console.log("PARAM ====", request.body)
  let sql = "";
  sql += " select (row_number() over()) as num ,* from own_line_company where 1=1 "
  sql += request.body.carrier_code===""?"":" and line_code = '"+request.body.carrier_code+"'"
  sql += request.body.klnet_id===""?"":" and klnet_id = '"+request.body.klnet_id+"'"
  sql += request.body.partner_code===""?"":" and partner_code = '"+request.body.partner_code+"'"
  console.log(sql);
  (async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const updateLineCompany = (request,response) => {
    console.log(request.body)

    let sql ="";
    sql += " UPDATE public.own_line_company "
    sql += " SET use_yn='"+request.body.newData.use_yn+"', "
    sql += " shipper_yn='"+request.body.newData.shipper_yn+"', "
    sql += " forwarder_yn='"+request.body.newData.forwarder_yn+"', "
    sql += " business_number='"+request.body.newData.business_number+"' "
    sql += " WHERE line_code= '"+request.body.oldData.line_code+"' "
    sql += " and klnet_id='"+request.body.oldData.klnet_id+"' "
    sql += " AND partner_code='"+request.body.oldData.partner_code+"'"
    console.log(sql);
    (async () => {
      const client = await pgsqlPool.connect();
      try {
        const result = await client.query(sql);
        response.status(200).json(result.rowCount);
      } finally {
        client.release();
      }
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const deleteLineCompany = (request,response) => {
  console.log(request.body);
  let sql =""
  sql += " DELETE FROM public.own_line_company "
  sql += " WHERE line_code='"+request.body.oldData.line_code+"' "
  sql += " AND klnet_id='"+request.body.oldData.klnet_id+"' "
  sql += " AND partner_code='"+request.body.oldData.partner_code+"'"
  
  console.log(sql);
  (async () => {
    const client = await pgsqlPool.connect();
    try {
      const result = await client.query(sql);
      response.status(200).json(result.rowCount);
    } finally {
      client.release();
    }
  })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const selectLineCodeById = (request,response) => {
  const sql = {
      text: ` select id, nm, user_name, user_tel, user_email, user_dept, user_fax, address
,substring(nm, 0, 35) as line_name1
,substring(nm, 35) as line_name2
,substring(address, 0, 35) as line_address1
,substring(address, 35, 35) as line_address2
,substring(address, 70, 35) as line_address3
 from own_code_cuship a
 where id = $1
 limit 1 `,
      values: [request.body.line_code]
  }
  
  console.log(sql);
  ;(async () => {
      const client = await pgsqlPool.connect();
      try {
          const result = await client.query(sql);
          response.status(200).send(result.rows)
      } finally {
          client.release();
      }
  })().catch(err =>{
      response.status(400).send(err);
  });

}

module.exports = {
    searchIdentify,
    checkLineWDFCCompany,
    getCompanyWorkList,
    getLineCompany,
    updateLineCompany,
    deleteLineCompany,
    selectLineCodeById
}