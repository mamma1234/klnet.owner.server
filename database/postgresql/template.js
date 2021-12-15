'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
// const sUser = require('../../models/sessionUser');

const getTestSimple = (request, response) => {

    response.send(
      [
        {
            "rownum": 1,
            "shipper_code": 'LGE',
            "ca_code": 'COSU',
            "bkg_no": '6224557860',
            "actual_gubun": 'ACTUAL',
            "ship_req_date": '2019-12-02'
        },
        {
            "rownum": 2,
            "shipper_code": 'LGE',
            "ca_code": 'MAEU',
            "bkg_no": 'D71090511',
            "actual_gubun": 'DUMMY',
            "ship_req_date": '2020-11-14'
        },
        {
            "rownum": 3,
            "shipper_code": 'LGE',
            "ca_code": 'ONEY',
            "bkg_no": 'SELV53286300',
            "actual_gubun": 'DUMMY',
            "ship_req_date": '2020-11-19'
        }
    ]
  );
}

const getTestQuerySample = (request, response) => {
    const sql = "SELECT * FROM OWN_COMP_USER limit 100";
    pgsqlPool.connect(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.query(sql, function(err,result){
            done();
            if(err){
                console.log(err);
                response.status(400).send(err);
            }else{
              // response.status(200).send(result.rows);
              // console.log(result.rows);
              console.log("query log:", err, result);
              response.status(200).json(result.rows);
            }
        });

        // conn.release();
    });
}


const getTestQueryParamSample = (request, response) => {
    const sql = "SELECT * FROM own_vsl_sch_route_list where line_code= $1 and ts_yn = $2 limit 100"

    pgsqlPool.connect(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.query(sql, ['APL', 'N'], function(err,result){
            done();
            if(err){
                console.log(err);
                response.status(400).send(err);
            }
            response.status(200).json(result.rows);
        });

        // conn.release();
    });
}

const getSnkMasterList = (request, response) => {
    const bl_no = request.body.bl_no
    const search_date = request.body.search_date

    bl_no == "" ? console.log("o") : console.log(" x" );
    let sql = "SELECT web_seq, line_code, bl_no, cntr_no, sz_tp, coc_soc, recipient, departure, etd, arrival, eta, delivery, vessel, voyage_no FROM own_web_master_snk "
        sql += " where 1=1 "
        sql += " and web_seq like '"+ search_date+"%'"
        bl_no == "" ? sql += "" : sql += " and bl_no= '"+bl_no +"'";
    
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        response.status(200).send(result.rows);
      });
  
    });
  
  };

  const getKmdMasterList = (request, response) => {
    const bl_no = request.body.bl_no
    const search_date = request.body.search_date
    let sql = "SELECT web_seq, line_code, bl_no, booking_no, cntr_no, cntr_trace FROM own_web_master_kmd "
        sql += " where 1=1 "
        sql += " and web_seq like '"+ search_date+"%'"
        bl_no == "" ? sql += "" : sql += " and bl_no= '"+bl_no +"'";
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        response.status(200).send(result.rows);
      });
  
    });
  
  };

  const getYmlMasterList = (request, response) => {
    const bl_no = request.body.bl_no
    const search_date = request.body.search_date
    let sql = "SELECT web_seq, line_code, bl_no, cntr_no, recipient, loading, discharge, delivery, vessel, voyage_no, no_of_packages, on_board_date, gross_cargo_weight, no_of_containsers, measurement, service_requirement, cntr_size, cntr_type, seal_no, move_type, date_time, latest_event, place, vgm FROM own_web_master_yml "
          sql += " where 1=1 "
          sql += " and web_seq like '"+ search_date+"%'"
          bl_no == "" ? sql += "" : sql += " and bl_no= '"+bl_no +"'";
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        response.status(200).send(result.rows);
      });
  
    });
  
  };
  

  const getTestQueryAttibuteSample = (request, response) => {
    const sql = {
        text: 'SELECT * FROM own_vsl_sch_route_list where line_code= $1 and ts_yn = $2 limit 100',
        values: [request.body.param1, request.body.param2],
        rowMode: 'array',
    }

    pgsqlPool.connect(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.query(sql, function(err,result){
            done();
            if(err){
                console.log(err);
                response.status(400).send(err);
            }
            response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
            // console.log(result.fields.map(f => f.name));

        });

        // conn.release();
    });
}
  
  const getUserInfoSample = (request, response) => {
	  console.log ("value:"+request.body.id);
	    const sql = {
	        text: 'SELECT 1 FROM own_user_test where  user_id= $1 and user_pw = $2 limit 1',
	        values: [request.body.id, request.body.pw],
	        rowMode: 'array',
	    }

	    
	    pgsqlPool.connect(function(err,conn,done) {
	        if(err){
	            console.log("err" + err);
	            response.status(400).send(err);
	        }

	        conn.query(sql, function(err,result){
	            done();
	            if(err){
	                console.log(err);
	                response.status(400).send(err);
	            }
	            
	            response.status(200).send(result.rows);
	            console.log("ok"+result.rows);
	            // console.log(result.fields.map(f => f.name));

	        });

	        // conn.release();
	    });
  }
  


  const getAllPort = (request, response) => {
    const port = request.body.portCode;
    

    let sql = "SELECT port_code, port_name, port_kname, float8(wgs84_x) as wgs84_x, float8(wgs84_y) as wgs84_y FROM own_code_port "
        sql += " where 1=1 ";
        sql += " and use_yn = 'Y'"
        sql += " and port_id is not null"
    port == "" ? sql +="" : sql += " and port_code = '" + port + "'" 

    console.log("query == ",sql);    
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        response.status(200).send(result.rows);
      });
  
    });
  
  }


  const getPort = (request, response) => {
    const port = request.body.portCode;
    

    let sql = "SELECT port_code, port_name, port_kname, float8(wgs84_x) as wgs84_x, float8(wgs84_y) as wgs84_y FROM own_code_port "
        sql += " where 1=1 ";
        sql += " and use_yn = 'Y'"
        sql += " and nation_code = 'KR'"
        sql += " and port_code in('KRPUS', 'KRKAN', 'KRINC', 'KRUSN', 'KRPTK', 'KRKPO')"
    port == "" ? sql +="" : sql += " and port_code = '" + port + "'" 

    console.log("query == ",sql);    
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        console.log(result.rows);
        response.status(200).send(result.rows);
      });
  
    });
  
  }  
//   const getPortwgx84 = (request, response) => {
//     const DataSet = request.body ;
//     pgsqlPool.connect(function(err,client,done) {
//       if(err){
//         console.log("err" + err);
//       }
//     DataSet.forEach(element => {
      
//       console.log('element',element);
      
//       if (element.unlocode !== undefined){ 
//         console.log( element.unlocode );
//         let sql1 = " update own_code_port set "
//         sql1 += " wgs84_x = '" + element.longitude + "', "
//         sql1 += " wgs84_y = '" + element.latitude + "', "
//         element.portAlias == null ? sql1 +="" : sql1 += " port_alias = '" + element.portAlias + "', "
//         element.timezone == null ? sql1 +="" : sql1 += " timezone = '" + element.timezone + "', " 
//         element.geoData == null ? sql1 +="" : sql1 += " geo_data = '" + element.geoData + "', " 
//         element.portShipType == null ? sql1 +="" : sql1 += " port_ship_type = '" + element.portShipType + "', " 
//         element.portId == null ? sql1 +="" : sql1 += " port_id = '" + element.portId + "' "
//         sql1 += " where port_code = '"+ element.unlocode +"'"

//         console.log(sql1);
        
        
//         client.query(sql1, function(err,result){
//           done();
//           if(err){
//             console.log(err);
//             response.status(400).send(err);
//           }
//           console.log('success');
//           result.
//           response.status(200).send("SUCCESS");

//         });
        
      
//       } else{
//         console.log('success1');
//         response.status(200).send("SUCCESS");
//       }
//     });
//     response.status(200).send("SUCCESS");
//   });
// }



const getPortwgx84 = (request, response) => {
  const DataSet = request.body ;
  pgsqlPool.connect(function(err,client) {
    if(err){
      console.log("err" + err);
    }
  DataSet.forEach(element => {
    
    console.log('element',element);
    
    if (element.unlocode !== undefined){ 
      console.log( element.unlocode );
      let sql1 = " update own_code_port set "
      sql1 += " wgs84_x = '" + element.longitude + "', "
      sql1 += " wgs84_y = '" + element.latitude + "', "
      element.portAlias == null ? sql1 +="" : sql1 += " port_alias = '" + element.portAlias + "', "
      element.timezone == null ? sql1 +="" : sql1 += " timezone = '" + element.timezone + "', " 
      element.geoData == null ? sql1 +="" : sql1 += " geo_data = '" + element.geoData + "', " 
      element.portShipType == null ? sql1 +="" : sql1 += " port_ship_type = '" + element.portShipType + "', " 
      element.portId == null ? sql1 +="" : sql1 += " port_id = '" + element.portId + "' "
      sql1 += " where port_code = '"+ element.unlocode +"'"

      console.log(sql1);
      
      
      client.query(sql1, function(err,result){
        if(err){
          console.log(err);
          //response.status(400).send(err);
        }
        console.log('success');
        client.query('COMMIT');

      });
      
    
    } else{
      console.log('err');
    }
  });
  response.status(200).send("SUCCESS");
});
}

    // let sql = "select count(*) from own_code_port where port_code = unlocode";
    // port == "" ? sql +="" : sql += " and port_code = '" + port + "'" 

    // console.log("query == ",sql);    
    // pgsqlPool.connect(function(err,client,done) {
    //   if(err){
    //     console.log("err" + err);
    //     response.status(400).send(err);
    //   }
    //   client.query(sql, function(err,result){
    //     done();
    //     if(err){
    //       console.log(err);
    //       response.status(400).send(err);
    //     }
    //     console.log(result.rows);
    //     response.status(200).send(result.rows);
    //   });
  
    // });

const getExcelSchLogList = (request, response) => {
    const seq = request.body.seq;
    const start = request.body.startDate;
    const end = request.body.endDate;
    console.log(seq + start + end);

/*     let sql = "select LOG_DATE as \"LOG_DATE\", SEQ as \"SEQ\", NAME as \"NAME\", MESSAGE as \"MESSAGE\" from own_scheduleloader_log "
        sql += " where 1=1 ";
    cntrNo == "" ? sql +="" : sql += " and port_code = '" + cntrNo + "'"  */
    const sql = {
      text: "select LOG_DATE, SEQ, NAME, MESSAGE from own_scheduleloader_log "
      + " where 1=1 "
      + "and to_char(log_date,'yyyymmdd') >= $1 and to_char(log_date,'yyyymmdd') <= $2 " 
      + "and case when $3 != '' then text(seq) = $3 else 1=1 end " 
      + "order by log_date " ,
      values: [start,end,seq],
      rowMode: 'array',
  }

  //seq == "" ? sql.text +="" : sql.text += " and port_code = " + seq

    console.log("query == ",sql);    
    pgsqlPool.connect(function(err,client,done) {
      if(err){
        console.log("err" + err);
        response.status(400).send(err);
      }
      client.query(sql, function(err,result){
        done();
        if(err){
          console.log(err);
          response.status(400).send(err);
        }
        console.log(result.rows);
        response.status(200).send(result.rows);
      });
  
    });
  
  }  
const getThreadSearch = (request, response) => {
	    const sql = {
		  text: " select id1,id2,last_key1,last_key2 from (   \n"+
		  	    "   select count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, * from own_thread_manage \n"+
		  		")a where curpage ='"+request.body.num+"'",
		  //values: [sUser.userno],
	          //rowMode: 'array',
	    }
	    //console.log("sql>>>>",sql);
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	          release();
	            response.status(400).send(err);
	        } else {
			conn.query(sql, function(err,result){
				// done();
				if(err){
					console.log(err);
					release();
					response.status(400).send(err);
				} else {
					if(result != null) {
						console.log("data::",result.rows);
						release();
						response.status(200).json(result.rows);
					} else {
						release();
						response.status(200).json([]);
					}
				}
			});

		}


	    });
}


const getDemDetOsc = (request, response) => {
    
	let sql ="";
	
	
	if (request.body.cntrno) {
		sql = {
				  text: " select * from (   \n"+
				  	    "   select count(*) over()/5+1 as tot_page,floor(((row_number() over()) -1) /5 +1) as curpage, * from own_dem_det \n"+
				  	    "   where cntr_no='"+request.body.cntrno+"' order by req_seq desc \n"+
				  		")a where curpage ='"+request.body.num+"'",
				  //values: [sUser.userno],
			          //rowMode: 'array',
			    }
	} else {
		sql = {
				  text: " select * from (   \n"+
				  	    "   select count(*) over()/5+1 as tot_page,floor(((row_number() over()) -1) /5 +1) as curpage, * from own_dem_det \n"+
				  		")a where curpage ='"+request.body.num+"'",
				  //values: [sUser.userno],
			          //rowMode: 'array',
			    }
	}
   
    
    //console.log("sql>>>>",sql);
    pgsqlPool.connect(function(err,conn,release) {
        if(err){
            console.log("err" + err);
          release();
            response.status(400).send(err);
        } else {
		conn.query(sql, function(err,result){
			// done();
			if(err){
				console.log(err);
				release();
				response.status(400).send(err);
			} else {
				if(result != null) {
					console.log("data::",result.rows);
					release();
					response.status(200).json(result.rows);
				} else {
					release();
					response.status(200).json([]);
				}
			}
		});

	}


    });
}


const saveExcelData = ( request, response ) => {
     console.log( request.body );

    let dataRows = request.body.dataRows;

    try {
    	for( let i = 0; i < dataRows.length; i++ ){
        // $1 user_no
        let userNo = request.localUser.userno;
        const ofamt = dataRows[i][17]?dataRows[i][17].replace(',',''):0;
        const bafamt = dataRows[i][19]?dataRows[i][19].replace(',',''):0;
        const cafamt = dataRows[i][21]?dataRows[i][21].replace(',',''):0;
        const lssamt = dataRows[i][23]?dataRows[i][23].replace(',',''):0;
        const ebsamt = dataRows[i][25]?dataRows[i][25].replace(',',''):0;
        const othcamt = dataRows[i][27]?dataRows[i][27].replace(',',''):0;
        const dthcamt = dataRows[i][29]?dataRows[i][29].replace(',',''):0;
        const docamt = dataRows[i][31]?dataRows[i][31].replace(',',''):0;
        const boxamt = dataRows[i][33]?dataRows[i][33].replace(',',''):0;
        const dooramt = dataRows[i][35]?dataRows[i][35].replace(',',''):0;
        const cntramt = dataRows[i][37]?dataRows[i][37].replace(',',''):0;
        const etcamt = dataRows[i][39]?dataRows[i][39].replace(',',''):0;
        const soccoc = dataRows[i][11] == '화주소유 컨테이너(SOC)'?'SOC':'COC';
    	
        const mergeSql = " WITH upsert AS ( UPDATE OWN_SHIP_CHARGE SET OF_UNIT = '"+dataRows[i][16]+"' , OF_AMT = '"+ofamt+"' \n"+
        " WHERE LINE_NAME = '" +dataRows[i][1]+"' \n" +
        "   AND PUBLIC_DATE = replace('"+dataRows[i][3]+"','-','') \n" +
        "   AND EFFECT_DATE = replace('"+dataRows[i][4]+"','-','') \n" +
        "   AND POL_NM = '" +dataRows[i][7] +"' \n" +
        "   AND PLD_NM = '" +dataRows[i][9]+ "' \n" +
        "   AND COC_SOC = '" +soccoc +"' \n" +
        "   AND CNTR_TYPE =  case when upper('"+dataRows[i][12]+"') ='DRY' then 'DRY' when upper('"+dataRows[i][12]+"') ='REEFER' then 'RF' when upper('"+dataRows[i][12]+"') ='TANK' then 'TK' else 'ETC' end \n" +
        "   AND CNTR_SIZE = case when upper('"+dataRows[i][13]+"') = '20 FEET' then '20' when upper('"+dataRows[i][13]+"') = '40 FEET' then '40' else 'ETC' end \n" +
        "   AND GOODS = '"+dataRows[i][14]+"' AND OF_AMT::float <= '"+ofamt+"'::float RETURNING*) \n"+
        " INSERT INTO own_ship_charge (line_name, line_code, public_num, public_date, effect_date, route, in_out, pol_nm, pol, pod_nm, \n" +
        " pod,pld_nm,pld,ts,coc_soc,cntr_type,cntr_size,goods,tr_unit,of_unit, \n" +
        " of_amt,baf_unit,baf_amt,caf_unit,caf_amt,lss_unit,lss_amt,ebs_unit,ebs_amt,othc_unit, \n" +
        " othc_amt,dthc_unit,dthc_amt,docu_unit,docu_amt,do_unit,do_amt,whf_unit,whf_amt,csf_unit, \n"+
        " csf_amt,etc_unit,etc_amt,etc_remark,remark,insert_user,insert_date) \n" +
        " select '"+dataRows[i][1]+"',(select line_code from own_ship_charge_line where line_name ='"+dataRows[i][1]+"' limit 1) ,'"+dataRows[i][2]+"',replace('"+dataRows[i][3]+"','-',''),replace('"+dataRows[i][4]+"','-',''),'"+dataRows[i][5]+"','"+dataRows[i][6]+"', \n"+
        " '"+dataRows[i][7]+"',(select port_code from own_code_port where port_kname = '"+dataRows[i][7]+"' and port_type='P' limit 1),'"+dataRows[i][8]+"',(select port_code from own_ship_charge_port where port_name='"+dataRows[i][8]+"' limit 1),'"+dataRows[i][9]+"',(select port_code from own_ship_charge_port where port_name='"+dataRows[i][9]+"' limit 1),'"+dataRows[i][10]+"', \n"+
        " '"+soccoc+"', case when upper('"+dataRows[i][12]+"') ='DRY' then 'DRY' when upper('"+dataRows[i][12]+"') ='REEFER' then 'RF' when upper('"+dataRows[i][12]+"') ='TANK' then 'TK' else 'ETC' end, \n"+
        " case when upper('"+dataRows[i][13]+"') = '20 FEET' then '20' when upper('"+dataRows[i][13]+"') = '40 FEET' then '40' else 'ETC' end,'"+dataRows[i][14]+"','"+dataRows[i][15]+"','"+dataRows[i][16]+"','"+ofamt+"','"+dataRows[i][18]+"','"+bafamt+"', \n"+ 
        " '"+dataRows[i][20]+"','"+cafamt+"','"+dataRows[i][22]+"','"+lssamt+"','"+dataRows[i][24]+"','"+ebsamt+"','"+dataRows[i][26]+"'," +  
        " '"+othcamt+"','"+dataRows[i][28]+"','"+dthcamt+"','"+dataRows[i][30]+"','"+docamt+"','"+dataRows[i][32]+"','"+boxamt+"',"+ 
        " '"+dataRows[i][34]+"','"+dooramt+"','"+dataRows[i][36]+"','"+cntramt+"','"+dataRows[i][38]+"','"+etcamt+"','"+dataRows[i][40]+"', "+
        " '"+dataRows[i][41]+"','"+userNo+"', now() WHERE NOT EXISTS ( SELECT * FROM upsert) \n";  
        
    	//console.log(insertConditions);
        
    	let sql = {
		        text: mergeSql,
		        // values: multi_params,
		    }
		    //console.log( sql );
    	pgsqlPool.connect( (err,conn,release) =>{
    		
		        if(err){
		        	console.log("err:" + err);

		            response.status(400).send(err);
		        } else {
		        	conn.query(sql, function(err,result) {
		                release();
		                if(err){
		                    //error = err;
		                    console.log("db err",err);
		                    console.log("sql:",sql);
		                    //response.status(400).send();
		                }
		                
		                if(i == dataRows.length-1 ) {
		                	res(request,response,dataRows);
		                }
		                //console.log(i);
		            });
		        }
		    });
    	
    	} // for end
    } catch (err) {
    	console.log(err);
    }
}

const res =(request,response,dataRows) => {
	    console.log("commit count",dataRows.length);
		response.status(200).json(dataRows.length+"건의 데이터가 저장 되었습니다.");
}

module.exports = {
    getTestSimple,
    getTestQuerySample,
    getTestQueryParamSample,
    getTestQueryAttibuteSample,
    getSnkMasterList,
    getKmdMasterList,
    getYmlMasterList,
    getUserInfoSample,
    getPort,
    getAllPort,
    getPortwgx84,
    getExcelSchLogList,
    getThreadSearch,
    getDemDetOsc,
    saveExcelData
}