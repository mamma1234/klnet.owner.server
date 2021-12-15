'use strict';

const pgsqlPool = require("../database/pool.js").pgsqlPool
const request = require('request');
const config = require('./uniPassConfig');
const moment = require('moment')
require('moment-timezone')
const apiHistory = (param) => {
  let sql = "";
  sql += " INSERT INTO own_api_call_log "
  
  sql += " (seq, user_id, api_key, call_url, parameter, work_start_time, work_end_time, row_count, result, inserttime, ip) "
  sql += " VALUES( "
  sql += " to_char( now(), 'yymmddhh24miss' )||lpad(cast( nextval('api_seq') as varchar),5,'0'), "
  sql += " '"+param.userId+"', " 
  sql += " '"+param.apiKey+"', "
  sql += " '"+param.callUrl+"', "
  sql += " '"+JSON.stringify(param.param)+"', "
  sql += " '"+param.workStart+"', "
  sql += " '"+param.workEnd+"', "
  sql += " '"+param.rowCount+"', "
  sql += " '"+param.workState+"', "
  sql += " now(), "
  sql += " '"+param.ip+"') "
  console.log(sql)
  try{    
    pgsqlPool.connect(function(err,client,release) {
        if(err){
            console.log("err" + err);
        } else {
            client.query(sql, function(err,result){
                // done();
                if(err){
                    console.log(err);
                }
                release()
                console.log(result)
            });    

        }
    });
    }catch(e) {
        //done();
      release();
        console.log(e);
    }
}





const apiScheduleInfo = (request, response) => {
    let authorization = request.headers['authorization'];
    const parameter = {
      callUrl:request.route.path,
      param:request.query,
      ip:request.connection.remoteAddress,
      apiKey:authorization,
      userId:"",
      workStart: moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS'),
      workEnd:null,
      workState:"",
      rowCount:0
    }
    if (!authorization) {
        parameter.workState='Unauthorization'
        parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
        apiHistory(parameter);
        response.status(401).send('Unauthorization');
    } else if (authorization) {
        let tmp = authorization.split(' ');
        

        let buf = new Buffer(tmp[1], 'base64');

        let plain_auth = buf.toString();

        let creds = plain_auth.split(':');
        
        let username = creds[0];
        let password = creds[1];

        console.log(username);
        console.log(password)
        parameter.userId=username;
        if((username =="dipark@seavantage.com") && (password =="klnet1234")) {
            

                if ((request.query.carrierCode == (null||undefined)) || (request.query.datafrom == (null || undefined)) || (request.query.datato == (null || undefined))) {
                    response.status(400).send('bad request');
                    parameter.workState='Bad Request'
                    parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
                    apiHistory(parameter);
                    return;
                }
            

            const carrierCode = request.query.carrierCode.toUpperCase();
            const datafrom = request.query.datafrom;
            const datato = request.query.datato;
             
            // let sql = " select line_code, vessel_name, voyage_no, call_sign, route_code, a.port_code as pol, a.eta, a.etb, a.etd, b.port_code as calling_port, coalesce(b.eta, b.etb) as calling_eta, b.etd as calling_etd " +
            //           " from mfedi_tcs_vsl_sch a, mfedi_tcs_vsl_sch_port b " +
            //           " where a.voyage_sid = b.voyage_sid " +
            //           " and line_code ='"+carrierCode+"'" +
            //           " and a.etd between substr('"+ datafrom +"',1,8) and substr('"+datato+"', 1, 8)" +
            //           " order by a.voyage_sid, b.route_seq ";

           try {           
            let sql = 
                      " select line_code, vessel_name, voyage_no, call_sign, route_code, a.port_code as pol, b.route_seq ,a.eta, a.etb, a.etd, b.port_code as calling_port, coalesce(b.eta, b.etb) as calling_eta, b.etd as calling_etd " +
                      " from mfedi_tcs_vsl_sch a, mfedi_tcs_vsl_sch_port b " +
                      " where a.voyage_sid = b.voyage_sid " +
                      " and line_code ='"+carrierCode+"' " +
                      " and a.etd between substr('"+datafrom+"',1,9) and substr('"+datato+"',1,9) " + 
                      " order by a.voyage_sid, b.route_seq ";

            console.log("query == ",sql);
            
            pgsqlPool.connect(function(err,client,done) {
              if(err){
                console.log("err" + err);
                parameter.workState=err
                parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
                response.status(400).send(err);
              }
              client.query(sql, function(err,result){
                done();
                if(err){
                  console.log(err);
                  response.status(400).send(err);
                  parameter.workState=err
                  parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
                  apiHistory(parameter);

                }
                parameter.workState="SUCCESS"
                parameter.rowCount=result.rowCount
                parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
                response.status(200).send(result.rows);
                apiHistory(parameter);
              });
          
            });
            
           } catch(error) {
              done();
              parameter.workState=error
              parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
              response.status(400).send(error);
              apiHistory(parameter);
           }


        }else {
            parameter.workState='authorizationError'
            parameter.workEnd= moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
            response.status(401);
            response.send('authorizationError');
            apiHistory(parameter);
        }
        
    
    }

}

const apiBaltic = (req, response) => {
  try{
    request({
      url:  config.TRADING_URL,
      method: 'GET'
    }, (err, res, data) => {
      if(err) {
        console.log(err);
        }else {
          if(res.statusCode == 200) {
            response.send(data);
          }else {
            response.send([])
          }
      }
    })
  }catch(e) {
    response.send([]);
    console.log(e);

  }

}

const apiscfi = (req, response) => {
  try{
    request({
      url:  config.SCFI_URL,
      method: 'GET'
    }, (err, res, data) => {
      if(err) {
        console.log(err);
        }else {
          console.log('res.statusCode',res.statusCode)
          if(res.statusCode == 200) {
            const obj = JSON.parse(data);
            console.log('obj',obj);
            response.send(obj);
          }else {
            response.send([])
          }
      }
    })
  }catch(e) {
    response.send([]);
    console.log(e);

  }
}


const apiteuRank = (req,res) => {
  const raw = [
    {"action":"top100","method":"getTop100Table","data":null,"type":"rpc","tid":1}
  ]
  try {
    request({
      url: config.TEU_URL,
      method: 'POST',
      body: JSON.stringify(raw)
    }, (error, response, data) => {
      if(error) {
        console.log('error : ', error);
        res.send([]);
      }else {
        if(response.statusCode === 200) {
          if(data.length != 0) {
            const obj = JSON.parse(data);
            res.send(obj);
          }else {
            res.send([]);
          }
        }else {
          res.send([]);
        }
      }
    })
  }catch(e) {
    res.send([])
    console.log('error : ', e);
  }

}

const seaventageShipSearch = (req,res) => {

  let searchUrl = config.SEAVENTAGE_URL + 'ship/search?keyword=' + encodeURIComponent(req.body.param);
  console.log(searchUrl)
  try {
    request({
      url: searchUrl,
      method: 'GET',
      headers: {
        'authorization' : config.SEAVENTAGE_KEY
      }
    }, (error, response, data) => {
      if(error) {
        console.log('error : ', error);
        res.send([]);
      }else {
        if(response.statusCode === 200) {
          if(data.length != 0) {
            const obj = JSON.parse(data);
            res.send(obj);
          }else {
            res.send([]);
          }
        }else {
          res.send([]);
        }
      }
    })
  }catch(e) {
    res.send([])
    console.log('error : ', e);
  }  
} 

const seaventageTrackSearch = (req,res) => {
  let searchUrl = config.SEAVENTAGE_URL + 'ship/' + encodeURIComponent(req.body.ship) + '/pastTrack?endDateTime=' + encodeURIComponent(req.body.toD) + '&startDateTime='+encodeURIComponent(req.body.fromD);
  console.log(searchUrl)
  try {
    request({
      url: searchUrl,
      method: 'GET',
      headers: {
        'authorization' : config.SEAVENTAGE_KEY
      }
    }, (error, response, data) => {
      if(error) {
        console.log('error : ', error);
        res.send([]);
      }else {
        if(response.statusCode === 200) {
          if(data.length != 0) {
        	let obj;
        	try {
        		obj = JSON.parse(data);
        	} catch(e) {
        		console.log('JSON.parse error : ', e);
        	}
            res.send(obj);
          }else {
            res.send([]);
          }
        }else {
          res.send([]);
        }
      }
    })
  }catch(e) {
    res.send([])
    console.log('error : ', e);
  }  
}

const asyncWork = async(data) => {
  let newData = [];
  for(const item of data) {
    await getShipInfo(item).then(
      res => {newData.push(res)}
    )
  }
  return newData;
}
const getShipInfo = (data) => {
  return new Promise((resolve, reject) => {
    let shipInfo = null;
    let searchUrl = config.SEAVENTAGE_URL + 'ship/search?keyword=' + encodeURIComponent(data.imo);
    console.log(searchUrl)
    try {
      request({
        url: searchUrl,
        method: 'GET',
        headers: {
          'authorization' : config.SEAVENTAGE_KEY
        }
      }, (error, response, data) => {
        if(error) {
          console.log('error : ', error);
          resolve(null)
        }else {
          if(response.statusCode === 200) {
            if(data.length != 0) {
              const obj = JSON.parse(data);
              // res.send(obj);
              resolve(obj.response);
            }else {
              resolve(null)
            }
          }else {
            resolve(null)
          }
        }
      })
    }catch(e) {
      resolve(null)
      console.log('error : ', e);
    }
  })
}


const shipSearch = (data, request , response) => {
  asyncWork(data).then(
    res => {
      console.log(res)
      response.status(200).send(res);
    }
  )

}


module.exports = {
  apiScheduleInfo,
  apiBaltic,
  apiscfi,
  apiteuRank,
  seaventageShipSearch,
  seaventageTrackSearch,
  shipSearch
}
