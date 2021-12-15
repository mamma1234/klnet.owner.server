'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
// const sUser = require('../../models/sessionUser');
const log = require("../../log/log.js");

const getPortCode = (request, response) => {

	  const portCode=request.body.portCode+"%";
	console.log("입력Keyword:"+portCode);
       const sql = {
                    text: "select distinct PORT_CODE, PORT_NAME from own_code_port \n" +
                    	  " where (PORT_CODE LIKE upper($1)) \n"+
                          " and COALESCE(PORT_TYPE,' ') LIKE (CASE WHEN NATION_CODE = 'KR' THEN 'P' ELSE '%%' END) \n",
                    values: [portCode],
                    //rowMode: 'array',
                }
            
	    console.log("쿼리:"+sql);

       ;(async () => {
    		const client = await pgsqlPool.connect();
    		try {
    			const result = await client.query(sql);
    			response.status(200).json(result.rows);
    		} finally {
    			client.release();
    		}
    	})().catch(err => console.log(err))
       
/*      pgsqlPool.connect(function(err,conn,release) {
          if(err){
              console.log("err" + err);
              response.status(400).send(err);
          } else {
              console.log("sql : " + sql.text);
              conn.query(sql, function(err,result){
            	  release();
                  if(err){
                      console.log(err);
                      response.status(400).send(err);
                  } else {
                      //response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
                      //console.log(result);
                      response.status(200).json(result.rows);
                      // console.log(result.fields.map(f => f.name));
                  }
              });
          }
  
          // conn.release();
      });*/
}

const getPortTrackingCode = (request, response) => {

	  const portCode="%"+request.body.portCode+"%";
	console.log("입력Keyword:"+portCode);
     const sql = {
                  text: "select distinct PORT_CODE, PORT_NAME from own_code_port \n" +
                  	    " where ( PORT_CODE LIKE upper($1) or port_name like upper($1) ) \n"+
                        " and COALESCE(PORT_TYPE,' ') LIKE (CASE WHEN NATION_CODE = 'KR' THEN 'P' ELSE '%%' END) \n",
                  values: [portCode],
                  //rowMode: 'array',
              }
          
	    console.log("쿼리:"+sql);

     ;(async () => {
 		const client = await pgsqlPool.connect();
 		try {
 			const result = await client.query(sql);
 			response.status(200).json(result.rows);
 		} finally {
 			client.release();
 		}
 	})().catch(err => console.log(err))
     /*
    pgsqlPool.connect(function(err,conn,release) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            console.log("sql : " + sql.text);
            conn.query(sql, function(err,result){
            	release();
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
                    //response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
                    //console.log(result);
                    response.status(200).json(result.rows);
                    // console.log(result.fields.map(f => f.name));
                }
            });
        }

        // conn.release();
    });*/
}

  const getPortCodeInfo = (request, response) => {
    const sql = {
        text: "select port_code,port_name from own_code_port order by port_code",
       // values: [sUser.userno],
        rowMode: 'array',
    }

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
    
    /*pgsqlPool.connect(function(err,conn,release) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            conn.query(sql, function(err,result){
            	release();
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
                    console.log(result);
                    
                    if(result != null) {
                        //console.log(result.rows[0]);
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }

                }
    
            });

        }


        // conn.release();
    });*/
}



const getCustomLineCode = (request, response) => {
                      
    let sql = 
        " select id, case when nm is not null then '['|| nm || ']' else '[ No Name ]' end as nm " +
        " from own_code_cuship " +
        " where view_yn='Y'"        
                                            

        ;(async () => {
    		const client = await pgsqlPool.connect();
    		try {
    			const result = await client.query(sql);
    			response.status(200).json(result.rows);
    		} finally {
    			client.release();
    		}
    	})().catch(err => console.log(err))
        

   /* pgsqlPool.connect(function(err,client,release) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            client.query(sql, function(err,result){
            	release();
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
                    response.status(200).send(result.rows);
                }
            });

        }
    
    });*/
    
}



const getErrorLogList = (request, response) => {
    //console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, ";
        sql += " error_date, seq, sql_state, message, detail, hint, context, name from own_error_log ";
        sql += " where 1=1 "
        request.body.seq==""?" ":"and seq ="+ request.body.seq;
        
        if(request.body.fromDate != "" && request.body.toDate != "") {
            " and error_date between to_timestamp('"+request.body.fromDate+"','yyyymmdd') and to_timestamp('"+request.body.toDate+"','yyyymmdd') "
        }else if(request.body.fromDate != "" && request.body.toDate == "") {
            " and error_date > to_timestamp('"+request.body.fromDate+"','yyyymmdd24') ";
        }else if(request.body.fromDate == "" && request.body.toDate != "") {
            " and error_date < to_timestamp('"+request.body.toDate+"','yyyymmdd24') ";
        }else {

        }
        sql += " order by error_date desc ";
        sql +=")a where curpage ='"+request.body.num+"'";
        console.log(sql);
    try{    
        pgsqlPool.connect(function(err,client,release) {
            if(err){
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result){
                	release();
                    if(err){
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });

            }
        
        });
    }catch(e) {
        done();
        console.log(e);
    }
}

const getUserRequest = (request, response) => {
    //console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, * from own_user_request ";
        sql += " where 1=1 "
        sql += request.body.req_seq==""?" ":" and req_seq ='"+ request.body.req_seq + "' ";
        sql += request.body.userno==""?" ":" and user_no ='"+ request.body.userno + "' ";
        sql += request.body.carrier_code==""?" ":" and carrier_code ='"+ request.body.carrier_code + "' ";
        sql += request.body.bl_bkg==""?" ":" and bl_bkg ='"+ request.body.bl_bkg + "' ";
        sql += request.body.ie_type==""?" ":" and ie_type ='"+ request.body.ie_type + "' ";
        sql += " order by user_no desc ";
        sql +=")a where curpage ='"+request.body.num+"'";
        console.log(sql);
    try{    
        pgsqlPool.connect(function(err,client,release) {
            if(err){
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result){
                	release();
                    if(err){
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });

            }
        
        });
    }catch(e) {
        //done();
    	release();
        console.log(e);
    }
}


const getTerminalInfo = (request, response) => {
    //console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, * from own_terminal_info ";
        sql += " where 1=1 "
        sql += request.body.terminal==""?" ":" and terminal ='"+ request.body.terminal + "' ";
        sql += " order by terminal desc ";
        sql +=")a where curpage ='"+request.body.num+"'";
        console.log(sql);
    try{    
        pgsqlPool.connect(function(err,client,release) {
            if(err){
                console.log("err" + err);
                response.status(400).send(err);
            } else {

                client.query(sql, function(err,result){
                	release();
                    if(err){
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });
            }
        
        });
    }catch(e) {
        //done();
    	release();
        console.log(e);
    }
}



const getCodecuship = (request, response) => {
    //console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, * from own_code_cuship ";
        sql += " where 1=1 "
        sql += request.body.id==""?" ":" and id ='"+ request.body.id + "' ";
        sql += request.body.lineCode==""?" ":" and line_code ='"+ request.body.lineCode + "' ";
        sql += " order by id desc ";
        sql +=")a where curpage ='"+request.body.num+"'";
        console.log(sql);
    try{    
        pgsqlPool.connect(function(err,client,release) {
            if(err){
                console.log("err" + err);
                response.status(400).send(err);
            } else {

                client.query(sql, function(err,result){
                	release();
                    if(err){
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });
            }
        
        });
    }catch(e) {
        done();
        console.log(e);
    }
}
const getPortLocation = (req,res) => {

    const port = req.body.portCode;
    let sql = "";
    
    sql += " select port_code, port_name, a.nation_code, (select nation_kname from own_code_nation b where a.nation_code = b.nation_code limit 1) as nation_kname "
    sql += " , (select nation_ename from own_code_nation b where a.nation_code = b.nation_code limit 1) as nation_ename , port_ename, float8(wgs84_x) as wgs84_x, float8(wgs84_y) as wgs84_y "
    sql += " from own_code_port a"
    sql += " where wgs84_x is not null "
    sql += " and wgs84_y is not null ";
    port == "" ? sql +="" : sql += " and port_code = '" + port + "'" 
    console.log(sql);
    try{    
        pgsqlPool.connect(function(err,client,release) {
            if(err){
                console.log("err" + err);
                res.status(400).send(err);
            } else {
                client.query(sql, function(err,result){
                	release();
                    if(err){
                        console.log(err);
                        res.status(400).send(err);
                    } else {
                        res.status(200).send(result.rows);
                    }
                });
            
            }
        });
    }catch(e) {
        //done();
    	release();
        console.log(e);
    }
}
const getVslTypeList = (request, response) => {
    //console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page, floor(((row_number() over(order by insert_date desc))-1)/10+1) as curpage, * from own_vsl_type ";
        sql += " where 1=1 "
        sql += request.body.vsltype==""?" ":" and vsl_type ='"+ request.body.vsltype + "' ";
        sql += " order by insert_date desc ";
        sql += " ) a where curpage ='"+request.body.num+"' ";
        console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                    // done();
                    if(err) {
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });

            }
        });
    } catch(e) {
        done();
        console.log(e);
    }
}

const getVslInfoList = (request, response) => {
    console.log(">>>>>>>", request.body);
    let sql = "";
        sql += " select * from ( ";
        sql += " select count(*) over()/10+1 as tot_page, floor(((row_number() over())-1)/10+1) as curpage, * from own_vsl_info ";
        sql += " where 1=1 "
        sql += request.body.id==""?" ":" and id ='"+ request.body.id + "' ";
        sql += request.body.vsltype==""?" ":" and vsl_type ='"+ request.body.vsltype + "' ";
        sql += request.body.shipimo==""?" ":" and ship_imo ='"+ request.body.shipimo + "' ";
        sql += " order by id ";
        sql += " ) a where curpage ='"+request.body.num+"' ";
    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}


const getNationInfo = (request, response) => {
    let sql = "";
        sql += " select nation_kname, nation_ename, nation_code "
        sql += " from own_code_nation "
        sql += " where 1=1 "
        sql += request.body.nationCode !== ""?" and nation_code = '"+request.body.nationCode +"' ":""
        sql += " order by nation_kname asc "
        //sql += " limit 1 "


    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}

const getEventCodeCarrier = (request, response) => {

	let sql = " select carrier_code as value, (select case when nm_kor is not null then nm_kor else nm end from own_code_cuship where id=carrier_code) as label ";
	sql = sql+"  from own_iftsta_detail_event  group by carrier_code";


    console.log("event sql:",sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send([]);
                    } else {
                        response.status(200).send(result.rows);
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}

const getEventCodeList = (request, response) => {

	let sqlmap = "select carrier_code,event_code,description,master_event_code,"
  	  +"(select description from own_iftsta_master_event where event_code = a.master_event_code  ) as master_des"
	  +" from own_iftsta_detail_event a where carrier_code = '"+request.body.line+"'  \n";
	  
	  if(request.body.code) {
		  sqlmap = sqlmap +" and event_code like '%"+request.body.code+"%' \n"; 
	  }
	  if(request.body.des) {
		  sqlmap = sqlmap +" and description like '%"+request.body.code+"%' \n";
	  }
	
	console.log(sqlmap);
    const sql = {
            text: sqlmap
            	  
            //values: [sUser.userno],
            //rowMode: 'array',
        }
    
    console.log(sql);
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		console.log(res.rows[0]);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {throw err}))
}


const setEventCode = (request, response) => {

    let sql ="update own_iftsta_detail_event set ";
	sql = sql + " event_code = '"+request.body.code+"',";
	sql = sql + " description = '"+request.body.des+"',";
	sql = sql + " master_event_code = '"+request.body.master+"',";
	sql = sql + " update_date = now() , update_user = '"+request.localUser.userno+"'"
    sql = sql + " where carrier_code = '"+request.body.line+"' and event_code = '"+request.body.ordcode+"'";
        
    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send([]);
                    } else {
                    	console.log("data:",result.rows);
                        response.status(200).send(result.rows);
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}

const setEventDeleteCode = (request, response) => {

    let sql ="delete from own_iftsta_detail_event where carrier_code = '"+request.body.line+"' and event_code ='"+request.body.code+"'";
    
    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send("Event Code 삭제 실패 하였습니다.");
                    } else {
                        response.status(200).send("Event Code 삭제 성공 하였습니다.");
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}

const setEventCodeRows = (request, response) => {

    let sql ="insert into own_iftsta_detail_event (carrier_code,event_code,description,master_event_code,insert_date,insert_user)";
     sql +=  "values ('"+request.body.line+"','"+request.body.code+"','"+request.body.des+"','"+request.body.master+"',now(),'"+request.localUser.userno+"')";
     
     
    
    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send(err);
                    } else {
                        response.status(200).send("추가 성공 하였습니다.");
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}

const setCarrierCodeAdd = (request, response) => {

    let sql ="insert into own_tracking_event_code (event_name,event_type,event_seq,event_code,event_description)";
     sql = sql+" select '"+request.body.carrier+"' as event_name,'1' as event_type,event_seq,event_code,event_description";
     sql = sql+" from own_tracking_event_code where event_name='DEFAULT' ";
 
    console.log(sql);
    try {    
        pgsqlPool.connect(function(err,client,release) {
            if(err) {
                console.log("err" + err);
                response.status(400).send(err);
            } else {
                client.query(sql, function(err,result) {
                	release();
                    if(err) {
                        console.log(err);
                        response.status(400).send("선사 추가 실패 하였습니다.");
                    } else {
                        response.status(200).send("선사 추가 성공 하였습니다.");
                    }
                });
            }
        });
    } catch(e) {
        //done();
    	release();
        console.log(e);
    }
}


const getMasterEventCode = (request, response) => {
	
    const sql = {
            text: "select * from own_iftsta_master_event order by event_code \n"
            //values: [sUser.userno],
            //rowMode: 'array',
        }
    console.log(sql);
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		//console.log(res.rows[0]);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {throw err}))
   
}

const getEventCarrierList = (request, response) => {

	var line = request.body.line;
	var lined = "";

	line.map((data,index) => {
		if(index === 0 ) {
			lined += "'"+data+"'";
		} else if (index === line.length-1) {
			lined += ",'"+data+"'";
		} else {
			lined +=  ",'"+data+"'";
		}
		
	})
	
	let sql = "";
		sql += "select distinct carrier_code as carrier_code,(select case when nm_kor is not null then nm_kor else nm end from own_code_cuship where id=carrier_code limit 1) as carrier_name" +
				" from own_iftsta_detail_event  \n";

		
		if(lined) {
			sql += " where carrier_code in ("+lined+") \n";
		}
		
		
		 if (!lined && request.body.code){
			sql += " where event_code like '%"+request.body.code+"%'";
		 } else if(request.body.code) {
			sql += " and event_code like '%"+request.body.code+"%'";
		 }
		 
		if (!lined && !request.body.code && request.body.des){
			sql += " where description like '%"+request.body.des+"%'";
		} else if (request.body.des){
			sql += " and description like '%"+request.body.des+"%'";
		}

    console.log(sql);
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		//console.log(res.rows);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {throw err}))
   
}
const getEventMasterCode = (request, response) => {

	
	
	 const sql = {
	            text: "select * from own_iftsta_master_event order by event_code \n"
	            //values: [sUser.userno],
	            //rowMode: 'array',
	        }

    console.log(sql);
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		//console.log(res.rows);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {throw err}))
   
}

const getCarrierAddList = (request, response) => {

	
	
    let sql = 
        " select id, case when nm_kor is not null then '['|| nm_kor || ']' else '[ nm ]' end as nm " +
        " from own_code_cuship " +
        " where view_yn='Y'" +
        " and id not in (select distinct carrier_code from own_iftsta_detail_event)"

   console.log(sql);
   ;(async () => {
   	const client = await pgsqlPool.connect();
   	try {
   		const res = await client.query(sql);
   		//console.log(res.rows);
   		response.status(200).json(res.rows);
   	} finally {
   		client.release();
   	}
   })().catch(err => setImmediate(() => {throw err}))
  
}


const setMasterUpdate = (request, response) => {

	
	 const sql = {
	            text: "with upsert as (update own_iftsta_master_event set \n" +
	            	  " description = $1 ,update_user = $2,update_date=now() \n" +
	            	  " where event_code = $3 returning *) \n" +
	            	  " insert into own_iftsta_master_event(event_code,description,insert_date,insert_user) \n" +
	            	  " select $3, $1,now(),$2 where not exists (select * from upsert) \n",
	            values: [request.body.des,request.localUser.userno,request.body.code],
	            //rowMode: 'array',
	        }

   console.log(sql);
   ;(async () => {
   	const client = await pgsqlPool.connect();
   	try {
   		const res = await client.query(sql);
   		//console.log(res.rows);
   		response.status(200).json(res.rows);
   	} finally {
   		client.release();
   	}
   })().catch(err => setImmediate(() => {throw err}))
  
}


const setMasterDelete = (request, response) => {

	
	 const sql = {
	            text: "delete from own_iftsta_master_event where event_code = $1 \n",
	            values: [request.body.code],
	            //rowMode: 'array',
	        }

  console.log(sql);
  ;(async () => {
  	const client = await pgsqlPool.connect();
  	try {
  		const res = await client.query(sql);
  		//console.log(res.rows);
  		response.status(200).json(res.rows);
  	} finally {
  		client.release();
  	}
  })().catch(err => setImmediate(() => {throw err}))
 
}

const getForwarderCode = (request, response) => {
                      
    let sql = 
        " select id, case when fw_name is not null then '['|| fw_name || ']' else '[ No Name ]' end as nm " +
        " from own_code_fw " +
        " where 1=1 "        
    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(sql);
            response.status(200).json(result.rows);
        } finally {
            client.release();
        }
    })().catch(err => console.log(err))
}


const getForwardInfo = (request, response) => {
    const kname = request.body.knm;
    const ename = request.body.enm;
    const sql = {
        text: " select id, fw_name, fw_ename, master from own_code_fw where 1=1 and fw_name like '%"+kname+"%' and fw_ename like '%"+ename.toUpperCase()+"%'",
        //values: [request.body.carriercode, request.body.blno, request.body.cntrno],
        rowMode: 'array',
    }

    console.log("query == ",sql);    
    ;(async () => {
    	  const client = await pgsqlPool.connect();
    	  try {
    		  const result = await client.query(sql);
    		  response.status(200).json(result.rows);
    	  } finally {
    		  client.release();
    	  }
      })().catch(err =>response.status(400).send(err));
}
const getWorkCodeList = (request,response) => {
    let sql = "";
    sql += " select work_code, '['|| work_name || ']' as work_name from own_code_work where 1=1 and work_name like '%"+request.body.nm+"%' "

    console.log("query == ",sql);    
    ;(async () => {
    	  const client = await pgsqlPool.connect();
    	  try {
    		  const result = await client.query(sql);
    		  response.status(200).json(result.rows);
    	  } finally {
    		  client.release();
    	  }
      })().catch(err =>response.status(400).send(err));



}
const checkLineCode = (request, response) => {
    console.log('parameter ===', request.body);
    console.log('query ===', "  select id from own_code_cuship where id = '"+request.body.param+"'  ")
    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(" select id from own_code_cuship where id = '"+request.body.param+"' ");
            if(result.rowCount > 0 ) {
                response.status(200).send("OK");
            }else {
                response.status(200).send("fail");
            }
            
        } finally {
            client.release();
        }
    })().catch(err =>response.status(400).send(err));
}

const insertLineCode = (request, response) => {
    console.log('parameter ===', request.body.data.line_code);
    let sql = "";

    sql += " INSERT INTO public.own_line_company "
    sql += " (line_code, klnet_id, insert_user, use_yn, shipper_yn, forwarder_yn, partner_code, business_number) "
    sql += " VALUES( " 
    sql += " '"+request.body.data.line_code+"', "
    sql += " '"+request.body.data.klnet_id+"', "
    sql += " '"+request.localUser.userno+"', "
    sql += request.body.data.use_yn? " '"+request.body.data.use_yn+"', " : " 'Y', "
    sql += request.body.data.shipper_yn? " '"+request.body.data.shipper_yn+"', " : " 'Y', "
    sql += request.body.data.forwarder_yn? " '"+request.body.data.forwarder_yn+"', " : " 'Y', "
    sql += " '"+request.body.data.partner_code+"', "
    sql += request.body.data.business_number? " '"+request.body.data.business_number+"') " : " null ) "
    
    console.log(sql)


    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(sql);
            response.status(200).send("OK")

        } finally {
            client.release();
        }
    })().catch(err =>{
        console.log(err.code)
        if(err.code ==="23505") {
            console.log('1')
            response.status(200).send(err.code);    
        }
    });
}
const imoSearch = (request,response) => {
    log.info(request.body);

    const sql = {
        text: ` select a.* from ( select
                (row_number() over(order by ship_name)) as num, count(*) over() as tot_cnt, count(*) over()/10+1 as tot_page, floor(((row_number() over()) -1) /10 +1) as curpage, *
                from own_vsl_search_name where ship_name like '%'||upper($1)||'%' order by ship_name ) a `,
        values: [request.body.shipName]
    }
    
    log.info(JSON.stringify(sql));
    ;(async () => {
        const client = await pgsqlPool.connect();
        try {
            const result = await client.query(sql);
            log.info(JSON.stringify(result.rows));
            response.status(200).send(result.rows)
        } finally {
            client.release();
        }
    })().catch(err =>{
        log.error(err);
        response.status(400).send(err);
    });

}


module.exports = {
        getPortCodeInfo,
        getPortTrackingCode,
        getCustomLineCode,
        getPortCode,
        getErrorLogList,
        getUserRequest,
        getTerminalInfo,
        getCodecuship,
        getPortLocation,
        getVslTypeList,
        getVslInfoList,
        getNationInfo,
        getEventCodeCarrier,
        getEventCodeList,
        setEventCode,
        setEventCodeRows,
        setEventDeleteCode,
        setCarrierCodeAdd,
        getMasterEventCode,
        getEventCarrierList,
        getEventMasterCode,
        getCarrierAddList,
        setMasterUpdate,
        setMasterDelete,
        getForwarderCode,
        getForwardInfo,
        getWorkCodeList,
        checkLineCode,
        insertLineCode,
        imoSearch
}