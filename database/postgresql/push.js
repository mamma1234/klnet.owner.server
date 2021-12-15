
const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
// const sUser = require('../../models/sessionUser');






const createPushUser = (request, response) => {
    console.log(request.body.deviceId)

    let sql = "";
    //유저생성
    sql += " INSERT INTO own_push_user "
    sql += " (app_id ,user_no, device_id, fcm_token, device_os, push_use_yn, push_send_time_fm, push_send_time_to, device_model, last_receive_date, insert_date) "
    sql += " VALUES( 'PLISMPLUS', '" + request.localUser.userno + "', "
    sql += " '"+ request.body.deviceId +"', "
    sql += " '"+ request.body.fcm_token +"', "
    sql += " '"+ request.body.deviceOS +"', "
    sql += " 'Y', "
    sql += " '0000', "
    sql += " '2359', "
    sql += " '"+ request.body.deviceModel +"', "
    sql += " null, "
    sql += " now()); "
    //유저세팅 기본값
    sql +=" insert into own_push_user_setting (app_id, user_no, device_id, service_gubun, service_use_yn ) "
    sql +=" values('PLISMPLUS', '"+request.localUser.userno+"', '"+request.body.deviceId+"','NT', 'Y'),"
    sql +=" ('PLISMPLUS','"+request.localUser.userno+"', '"+request.body.deviceId+"','DD', 'Y'),"
    sql +=" ('PLISMPLUS','"+request.localUser.userno+"', '"+request.body.deviceId+"','TR', 'Y');"



    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });*/
}

const checkPushUser = (request, response) => {
    console.log(request.body.deviceId)
    let sql ="";
    sql += " select *, "
    sql += " (select service_use_yn from own_push_user_setting where user_no = a.user_no and device_id = a.device_id and service_gubun ='NT' and app_id = 'PLISMPLUS') as noti_service, "
    sql += " (select service_use_yn from own_push_user_setting where user_no = a.user_no and device_id = a.device_id and service_gubun ='DD' and app_id = 'PLISMPLUS') as demdet_service, "
    sql += " (select service_use_yn from own_push_user_setting where user_no = a.user_no and device_id = a.device_id and service_gubun ='TR' and app_id = 'PLISMPLUS') as tracking_service "
    sql += " from own_push_user a"
    sql += " where 1=1 "
    sql += " and user_no ='"+ request.localUser.userno +"'"
    sql += " and device_id = '"+ request.body.deviceId +"'"
    sql += " and app_id = 'PLISMPLUS' "
    sql += " order by insert_date desc "

    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });*/
}

const deletePushUser = (request, response) => {
    let sql = "";

    sql +=" delete from own_push_user "
    sql +=" where user_no='"+request.localUser.userno+"'"
    sql +=" and device_id='"+request.body.deviceId+"' "
    sql +=" and app_id = 'PLISMPLUS';"
    sql +=" delete from own_push_user_setting "
    sql +=" where user_no='"+request.localUser.userno+"'"
    sql +=" and device_id='"+request.body.deviceId+"' "
    sql +=" and app_id = 'PLISMPLUS' ;"


    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });   */ 
}
const updatePushToken = (request, response) => {
    let sql = "";
    
    sql += " update own_push_user set fcm_token = '"+request.body.fcmToken+"'"
    sql += " where user_no='"+request.localUser.userno+"'"
    sql += " and device_id='"+request.body.deviceId+"'"
    sql += " and app_id = 'PLISMPLUS' "
    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    }); */       
}

const pushUserSettingUpdate = (request, response) => {
    let sql = "";
    
    sql += " update own_push_user set "

    if(request.body.updateGubun === "startTime") {
        sql += " push_send_time_fm = '"+request.body.param+"' "
    }else if (request.body.updateGubun === "endTime") {
        sql += " push_send_time_to = '"+request.body.param+"' "
    }else if (request.body.updateGubun === "any") {
        sql += " push_send_time_fm ='0000', push_send_time_to ='2359' "
    }
    else {
        return;
    }

    sql += " where user_no='"+request.localUser.userno+"'"
    sql += " and device_id='"+request.body.deviceId+"'"
    sql += " and app_id = 'PLISMPLUS' "
    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });  */      
}

const pushServiceGubun = (request, response) => {
    let sql = "";
    let yn = request.body.param === true?"Y":"N"

    sql += " update own_push_user_setting set service_use_yn = '"+yn+"'";
    sql += " where user_no='"+request.localUser.userno+"'"
    sql += " and device_id='"+request.body.deviceId+"'"
    sql += " and app_id = 'PLISMPLUS' "
    if(request.body.updateGubun === "NOTICE") {
        sql += " and service_gubun = 'NT' "
    }else if (request.body.updateGubun === "DEMDET") {
        sql += " and service_gubun = 'DD' "
    }else if (request.body.updateGubun === "TRACKING") {
        sql += " and service_gubun = 'TR' "
    }


    console.log(sql);
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    }); */       
}
const pushUserSearch = (request, response) => {
    let sql ="";
        sql += " select b.user_no, b.user_name "
        sql += " from own_push_user a, own_comp_user b "
        sql += " where a.user_no = b.user_no and a.push_use_yn = 'Y' "
        sql += " and app_id = 'PLISMPLUS' "
        sql += " group by b.user_no "


    console.log(sql);
        
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });   */   
}


const pushSend =(request,response) => {

    

    const param = request.body.param
    let sql ="";

    
    sql += " insert into own_push_message "
    sql += " (push_seq, service_gubun, app_id,destination_user, push_title, push_body, push_param, send_flag, insert_date, user_no, device_id, read_flag) select "
    
    sql += " to_char( now(), 'yymmddhh24miss' )||lpad(cast( nextval('push_seq') as varchar),5,'0') as push_seq "
    sql += " ,'"+param.gubun+"' as service_gubun "
    sql += " ,'PLISMPLUS' "
    sql += " ,'"+param.sender+"' as destination_user "
    sql += " ,'"+param.title+"' as push_title "
    sql += " ,'"+param.body+"' as push_body "
    sql += " ,'' as push_param "
    sql += " ,'N' as send_flag "
    sql += " ,now() as insert_date "
    sql += " , user_no "
    sql += " , device_id "
    sql += " , 'N' as read_flag " 
    sql += " from own_push_user  "
    sql += " where 1=1 "
    sql += " and fcm_token <> ''"
    if(param.checkAll === false) {
        sql += " group by user_no, device_id "
    }else {
        
        sql += param.user!==""?" and user_no in ("+param.user.substr(0,param.user.length-1)+")":""
        sql += param.device!==""?" and device_os in ("+param.device.substr(0,param.device.length-1)+")":""
        sql += " group by user_no, device_id "
        
    }
    console.log(sql)
    
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
                    	release();
                        response.status(200).json(result.rows);
                    } else {
                    	release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    }); */
}


const readPush = (request,response) => {
    if(request.body.push_seq !== undefined) {
        let sql ="";

        

        sql += " update own_push_message set read_flag = 'Y'"
        sql += " where push_seq = '"+request.body.push_seq+"' "

        
        ;(async () => {
    		const client = await pgsqlPool.connect();
    		try {
    			const result = await client.query(sql);
    			response.status(200).json(result.rows);
    		} finally {
    			client.release();
    		}
    	})().catch(err => console.log(err))
        
/*        pgsqlPool.connect(function(err,conn,release) {
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
                            release();
                            response.status(200).json(result.rows);
                        } else {
                            release();
                            response.status(200).json([]);
                        }
                    }
                });

            }

        }); */
    }
}
const searchPushMessage = (request, response) => {
    let sql = "";

    sql += " select * from own_push_message "
    sql += " where 1=1 "
    sql += " and send_flag = 'Y' "
    sql += " and user_no = '"+request.localUser.userno+"' "
    sql += " and device_id = '"+request.body.deviceId+"' "
    sql += " and app_id ='PLISMPLUS' "
    if (request.body.param === 'D') {
        sql += " and to_char(insert_date,'YYYYMMDD') = to_char(now(),'YYYYMMDD') "
    }else if (request.body.param === 'W') {
        sql += " and to_char(insert_date,'YYYYMMDD') between to_char(date_trunc('week', now()),'YYYYMMDD') and to_char(date_trunc('week', now()+'6 day'),'YYYYMMDD') "
    }else if (request.body.param === 'M') {
        sql += " and to_char(insert_date,'YYYYMMDD') between to_char(date_trunc('month', now()),'YYYYMMDD') and to_char(date_trunc('month', now()+ interval '1 month - 1 day'),'YYYYMMDD') "
    }else if (request.body.param === 'Y') {
        sql += " and to_char(insert_date,'YYYYMMDD') between to_char(date_trunc('year', now()),'YYYYMMDD') and to_char(date_trunc('year', now()+ interval '1 year - 1 day'),'YYYYMMDD') "
    }else if (request.body.param === 'TIME') {
        sql += " and to_char(insert_date,'YYYY-MM-DD') between '"+request.body.startDate+"' and '"+request.body.endDate+"' " 
    }
    sql += " order by insert_date"


    console.log(sql)
    
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
                        release();
                        response.status(200).json(result.rows);
                    } else {
                        release();
                        response.status(200).json([]);
                    }
                }
            });

        }

    });*/
}

module.exports = {
    createPushUser,
    checkPushUser,
    deletePushUser,
    updatePushToken,
    pushUserSettingUpdate,
    pushServiceGubun,
    pushUserSearch,
    pushSend,
    readPush,
    searchPushMessage
}