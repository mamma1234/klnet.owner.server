// var passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
// const bcrypt = require('bcrypt');
// const sUser = require('../models/sessionUser');
const  {User,UserNo} = require('../models/localUser');
const pgsqlPool = require("../database/pool.js").pgsqlPool
const pgSql = require('../database/postgresql/users');
const jwt = require('jsonwebtoken');
const oraclePool = require("../database/pool.js").oraclePool
const oracleSql = require('../database/oracle/user');
const requestIp = require('request-ip');
// const { User } = require('../models');

module.exports = (passport) => {  
	passport.use('localjoin',new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    }, async function localjoin(req, id, password, done){
		const conn = await oraclePool.getConnection();
		
    	// console.log('Sign (localStrategy.js) req:',req.body, 'password: ',password,'name',req.body.kname);
		// console.log("join step 1 insert status:",req.body.provider);	
		console.log('(localStrategy.js > localjoin) provider : ', req.body.provider );
		if(!id) {
			done(null, null, 'Missing ID Required.(Missing error : ID )');
		}
		if(!password) {
			done(null, null, 'Missing PW Required.(Missing error : PW )');
		}
    	if(!req.body.provider || req.body.provider==='') {
			done(null, null, 'Missing Provider Required.(Missing error : Provider )');
		}
		try {
			process.on('unhandledRejection',(reason,p )=>{
				console.error('Unhandled Rejection at : ', p , 'reason: ', reason);
			})
			let sql = 'SELECT * FROM DO_COMP_USER_TBL A WHERE USER_ID = :1'
			if(req.body.provider) {
				if(req.body.provider === 'kakao') {
					sql += " and kakao_id is not null "
				} else if(req.body.provider === 'naver') {
					sql += " and naver_id is not null "
				} else if(req.body.provider === 'facebook') {
					sql += " and facebook_id is not null "
				} else if(req.body.provider === 'google') {
					sql += " and google_id is not null "
				}
			}
			sql += " AND ROWNUM=1 ";

			console.log(sql)
			const result = await conn.execute( sql,{1: req.body.id});
			// console.log('>>>>', result.rows.length)
			if(result.rows.length>0) {
				// console.log("select : ",result)
				done(null, null,'이미 등록되어 있습니다.');
			}else{
				if(req.body.status === 'klnet') {	//신규 계정 (소셜x)
					const [insertAuthor,insertUserTbl] = await Promise.all([
						conn.execute(`INSERT INTO NPLISM.NCS_USER_AUTHOR  (USER_ID, AUTHOR_CODE, UPDATE_BY) 
										SELECT :1, 'ROLE_OWN_GNRL_ROLE', 'PLISMPLUS' FROM DUAL A
										WHERE NOT EXISTS (SELECT * FROM NPLISM.NCS_USER_AUTHOR WHERE USER_ID = :1 AND AUTHOR_CODE ='ROLE_OWN_GNRL_ROLE')`
									, {1:req.body.id}, {outFormat:oraclePool.OBJECT})
						,conn.execute(`INSERT INTO MFEDI.DO_COMP_USER_TBL ( KLNET_ID ,USER_ID ,USER_PWD ,UNAME_KR ,EMAIL ,PHONE ,GENDER ,BIRTHDAY,PWD_CHG_DATE, CONFIRM_FLAG,SVC_TYPE ,CERTIFY_MODE	,UPDATE_BY)  
									VALUES ( 'KLDUMY01' ,UPPER(:1) ,DAMO.HASH_SHA256_J(UPPER(:2)),:3,:4,:5,:6,:7,SYSDATE,'Y','H' , '1', 'PLISMPLUS' ) RETURNING  USER_ID INTO :USER_ID` 
									, {1:req.body.id, 2:req.body.password, 3:	req.body.kname, 4:req.body.email, 5:req.body.phone, 6:req.body.gender, 7:req.body.birthDay, USER_ID:{ type:oraclePool.STRING,dir:oraclePool.BIND_OUT}}
									, {outFormat:oraclePool.OBJECT})])	
					console.log("insertAuthor : ",insertAuthor)
					console.log("insertUserTbl : ",insertUserTbl)

					if ( insertAuthor.rowsAffected || insertUserTbl.rowsAffected) {
						// console.log("if TRUE ")
						const sUser = new User({});
						sUser.userid = insertUserTbl.outBinds.USER_ID
						// const user =new User(insertUserTbl.outBinds.USER_ID).userid
						console.log('status = klnet) user', sUser)
						done(null,sUser,null);
						await conn.commit();							
					}else{
						// console.log("if FALSE ")
						done(null,'no data', null);
						await conn.rollback();
					}
				}else if(req.body.status === 'merge'){ // 기존 프프 계정에 소셜 계정 연동 업뎃
					console.log(req.body.status)
					// await oracleSql.updateLocalUser(req,async(result, accessToken , refreshToken) =>{
					// 	console.log('result???>>>>' ,result, accessToken , refreshToken)
					// 	sUser.provider = req.body.provider;
					// 	sUser.userid = result[0];
					// 	sUser.userno = result[0];
					// 	sUser.accessToken = accessToken;
					// 	sUser.refreshToken = refreshToken;
					// 	done(null, sUser, null);
					// }); 
					if(req.body.provider){
						await oracleSql.updateLocalUser(req,async(result) =>{
							console.log('result???>>>>' ,result)
							const sUser = new User({});
							sUser.provider = req.body.provider;
							sUser.userid = result[0];
							sUser.userno = result[0];
							done(null, sUser, null);
						}); 
					}
				}else if(req.body.status === 'klnet with sns') {
					console.log(req.body.status)
					const [insertAuthor,insertUserTbl] = await Promise.all([
						conn.execute(`INSERT INTO NPLISM.NCS_USER_AUTHOR  (USER_ID, AUTHOR_CODE, UPDATE_BY) 
									SELECT :1, 'ROLE_OWN_GNRL_ROLE', 'PLISMPLUS' FROM DUAL A
									WHERE NOT EXISTS (SELECT * FROM NPLISM.NCS_USER_AUTHOR WHERE USER_ID = :1 AND AUTHOR_CODE ='ROLE_OWN_GNRL_ROLE')`
									, {1:req.body.id}, {outFormat:oraclePool.OBJECT})
						,conn.execute(`INSERT INTO MFEDI.DO_COMP_USER_TBL ( KLNET_ID ,USER_ID ,USER_PWD ,UNAME_KR ,EMAIL ,PHONE ,GENDER ,BIRTHDAY,PWD_CHG_DATE, CONFIRM_FLAG,SVC_TYPE ,CERTIFY_MODE, UPDATE_BY ${req.body.provider&&!(req.body.provider==='klnet'||req.body.provider==='local')?`,${req.body.provider}_ID,${req.body.provider}_ACCESS_TOKEN`:''})  
									VALUES ( 'KLDUMY01' ,UPPER(:1) ,DAMO.HASH_SHA256_J(UPPER(:2)),:3,:4,:5,:6,:7,SYSDATE,'Y','H' , '1', 'PLISMPLUS' ${req.body.provider&&!(req.body.provider==='klnet'||req.body.provider==='local')?`,:8,:9`:''}) RETURNING  USER_ID INTO :USER_ID` 
									, {1:req.body.id, 2:req.body.password, 3:	req.body.kname, 4:req.body.email, 5:req.body.phone, 6:req.body.gender, 7:req.body.birthDay,8:req.body.providerid,9:req.body.provider_token, USER_ID:{ type:oraclePool.STRING,dir:oraclePool.BIND_OUT}}
									, {outFormat:oraclePool.OBJECT})])	
					console.log("insertAuthor : ",insertAuthor)
					console.log("insertUserTbl : ",insertUserTbl)

					if ( insertAuthor.rowsAffected || insertUserTbl.rowsAffected) {
						// console.log("if TRUE ")
						// sUser.userid=insertUserTbl.outBinds.USER_ID;
						const sUser = new User({});
						sUser.userid=insertUserTbl.outBinds.USER_ID;
						// const user =new User().setId(insertUserTbl.outBinds.USER_ID)
						// console.log('status = klnet) user', user)
						done(null,sUser,null);
						await conn.commit();	
						// await oracleSql.updateLocalUser(req,async(result, accessToken , refreshToken) =>{
						// 	console.log('result???>>>>' ,result, accessToken , refreshToken)
						// 	sUser.provider = req.body.provider;
						// 	sUser.userid = result[0];
						// 	sUser.userno = result[0];
						// 	sUser.accessToken = accessToken;
						// 	sUser.refreshToken = refreshToken;
						// 	done(null, sUser, null);
						// }); 
						
						// done(null,insertUserTbl.outBinds.USER_ID,null);
						// await conn.commit();							
					}else{
						// console.log("if FALSE ")
						done(null,'no data', null);
						await conn.rollback();
					}
				}
			}
		} catch(error) {
			console.log(">>>>>error",error);
			// console.error(error);
			await conn.rollback();
			done(error,null,null);								
		}finally{
			console.log('finally conn.close>>>')
			if (conn){
				try{
					conn.close();
				}catch(err){console.log(err)}
			}	
		}
	
	}));

	/**0715svn */
	// passport.use('localjoin',new LocalStrategy({
    //     usernameField: 'id',
    //     passwordField: 'password',
    //     passReqToCallback: true
    // }, async (req, id, password, done) => {
        
    // 	console.log('Sign (localStrategy.js) req:',req.body, 'password: ',password,'name',req.body.kname);
    // 	//req.session.sUser = null;
    	
    // 	try {
    // 		console.log("join step 1 insert status:",req.body.provider);			
	// 		if(!id) {
	// 			done(null, null, 'Missing ID Required.(Missing error : ID )');
	// 		}
	// 		if(!password) {
	// 			done(null, null, 'Missing PW Required.(Missing error : PW )');
	// 		}

    // 		if(req.body.provider === 'local') {
	// 			oraclePool.getConnection(function(err,conn){
	// 					 //데이터 저장
	// 					conn.execute(`INSERT INTO MFEDI.DO_COMP_USER_TBL ( KLNET_ID ,USER_ID ,USER_PWD ,UNAME_KR ,EMAIL ,PHONE ,GENDER ,BIRTHDAY, CONFIRM_FLAG,SVC_TYPE ,CERTIFY_MODE	,UPDATE_BY)  
	// 						VALUES ( 'KLDUMY01' ,UPPER(:1) ,DAMO.HASH_SHA256_J(UPPER(:2)),:3,:4,:5,:6,:7,'Y','H' , '1', 'PLISMPLUS' ) RETURNING  USER_ID INTO :USER_ID`		
	// 					, {1:req.body.id, 2:req.body.password, 3:	req.body.kname, 4:req.body.email, 5:req.body.phone, 6:req.body.gender, 7:req.body.birthDay, USER_ID:{ type:oraclePool.STRING,dir:oraclePool.BIND_OUT}}
	// 					, {outFormat:oraclePool.OBJECT},(err, result) => {
	// 						if (err) {
	// 							console.log('err: ' ,err);

	// 							(async () => {
	// 								await conn.rollback();
	// 								conn.close(function(er) { 
	// 									if (er) {
	// 										console.log('Error closing connection', er);
	// 									} else {
	// 										console.log('Connection closed');
	// 									}
	// 								}); 
	// 								done(null,'no data' , {message: 'error'});

	// 							})().then(ret=> {console.log("[RETUNT]",ret);} ).catch(err => {console.log("[ERROR]",err)} )

	// 						} 
	// 						console.log('result=', result,', lastRowid: ',result.lastRowid ,', outBinds.USER_ID: ',result.outBinds.USER_ID);
	// 						//conn.commit();
	// 						conn.execute(`INSERT INTO NPLISM.NCS_USER_AUTHOR (USER_ID, AUTHOR_CODE, UPDATE_BY)  
	// 										VALUES (:1, 'ROLE_BLG_GNRL_MGT', 'PLISMPLUS')`
	// 						, {1:req.body.id}, {outFormat:oraclePool.OBJECT},(err, result) => {
	// 							if (err) {
	// 								console.log('err: ' ,err);
	// 							} 
	// 							// console.log('result=====', result);

	// 							(async () => {
	// 								await conn.commit();
	// 								conn.close(function(er) { 
	// 									if (er) {
	// 										console.log('Error closing connection', er);
	// 									} else {
	// 										console.log('Connection closed');
	// 									}
	// 								}); 
	// 								done(null,	result.outBinds.USER_ID,null);

	// 							})().then(ret=> {console.log("[RETUNT]",ret);} ).catch(err => {console.log("[ERROR]",err)} )

	// 						});
	// 					});
	// 			})
    // 		} 
    //         } catch(error) {
    //         	console.log(">>>>>error",error);
    //             console.error(error);
    //             done(error);
    //         }
    // }));

	/**210713 기존 로직 */
	// passport.use('localjoin',new LocalStrategy({
    //     usernameField: 'id',
    //     passwordField: 'password',
    //     passReqToCallback: true
    // }, async (req, id, password, done) => {
        
    // 	//console.log('Sign (localStrategy.js) provider:email:', id, 'req:',req.body);
    // 	//req.session.sUser = null;
    	
    // 	try {
    // 		//console.log("join step 1 insert status:",req.body.status);
    // 		const inputpassword = crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
	// 		//console.log("join step2 password incoding :",password,"/",inputpassword);
			
	// 		if(!id) {
	// 			done(null, null, 'Missing ID Required.(Missing error : ID )');
	// 		}
	// 		if(!password) {
	// 			done(null, null, 'Missing PW Required.(Missing error : PW )');
	// 		}
			
    // 		if(req.body.status === 'local') {
    // 			//신규
    // 			 await pgSql.getLocalUser(id,{provider:'local'},async(callback) =>{
    // 			// await uqery(checkUser);
    // 				 console.log("join step3 user select:",callback.rowCount);
    				 
    // 				 if(callback.rowCount > 0) {
    // 					 //데이터 존재
    // 					 done(null, null,'이미 등록되어 있습니다.');
    // 				 } else {
    // 					 //데이터 저장
    // 					 await pgSql.insertLocalUser(req.body,inputpassword,async(callback) =>{
    // 						 done(null, callback.rows,null);
    // 					 });
    					 
    // 				 }
    			
    // 			});
	
    // 		} else if(req.body.status === 'merge') {
    // 			// 기존 프프 계정 + 소셜 계정 연계
   	// 		 await pgSql.getLocalUser(id,req.body,async(callback) =>{
    //  			// await uqery(checkUser);
    //  				 console.log("join step3 user select:",callback.rowCount);
     				 
    //  				 if(callback.rowCount > 0) {
    //  					 //데이터 존재
    //  					 done(null, null,'계정이 이미 등록되어 있습니다.');
    //  				 } else {
    //  					 //데이터 저장
    //  					 await pgSql.updateLocalUser(req.body,async(callback) =>{
    //  						 done(null, callback.rows,null);
    //  					 });
     					 
    //  				 }
     			
    //  			});
    // 		} else {
    // 			// 신규 프프계정 + 소셜 계정 
    // 			 await pgSql.getLocalUser(id,req.body,async(callback) =>{
    // 	     			// await uqery(checkUser);
    // 	     				 console.log("join step3 user select:",callback.rowCount);
    	     				 
    // 	     				 if(callback.rowCount > 0) {
    // 	     					 //데이터 존재
    // 	     					 done(null, null,'이미 등록되어 있습니다.');
    // 	     				 } else {
    // 	     					 //데이터 저장
    // 	     					 await pgSql.insertLocalUser(req.body,inputpassword,async(callback) =>{
    // 	     						 done(null, callback.rows,null);
    // 	     					 }); 
    // 	     				 }
    	     			
    // 	     			});
    // 		}

    //         } catch(error) {
    //         	console.log(">>>>>error",error);
    //             console.error(error);
    //             done(error);
    //         }
    // }));
	
    passport.use('local',new LocalStrategy({
        usernameField: 'id',
        passwordField: 'code',
        passReqToCallback: true
    }, async (req, userid, password, done) => {
                console.log('(localStrategy.js) userid:', userid, 'password:', password);
            	// const crypto_password = crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
                // console.log(crypto_password);         

            try {
				oraclePool.getConnection(function (err, conn) {
					conn.execute("select * from do_comp_user_tbl where user_id = :1 and klnet_auth_code =:2  and klnet_auth_date <= sysdate and klnet_auth_date >= sysdate-1/24 ", {1:userid, 2:password}, {outFormat:oraclePool.OBJECT},(err, result) => {
						if (err) {
							const sUser = new User({});
							sUser.provider = 'klnet';
							// localUser.userid = '';  //1261001956
							// localUser.userno = '';
							// localUser.username = '';
							// localUser.displayName = '';
							// localUser.accessToken = '';
							// localUser.refreshToken = '';
							// localUser.email = '';
							console.log('가입되지 않은 회원입니다.1');
							// done(null, sUser, { message: '가입되지 않은 회원입니다.' });
							conn.close(function(er) { 
								if (er) {
									console.log('Error closing connection', er);
								} else {
									console.log('Connection closed');
								}
							});    							
							done(null, sUser, {errocode: 'E1002', message: '가입되지 않은 회원입니다.'});
						} else {
		// console.log(('result:', result));
							if (result.rows.length < 1) {

								const sUser = new User({});
								sUser.provider = 'klnet';
								// localUser.userid = '';  //1261001956
								// localUser.userno = '';
								// localUser.username = '';
								// localUser.displayName = '';
								// localUser.accessToken = '';
								// localUser.refreshToken = '';
								// localUser.email = '';
								console.log('가입되지 않은 회원입니다.2');
								// done(null, sUser, { message: '가입되지 않은 회원입니다.' });
								
								conn.close(function(er) { 
									if (er) {
										console.log('Error closing connection', er);
									} else {
										console.log('Connection closed');
									}
								});    								
								done(null, sUser, {errocode: 'E1002', message: '가입되지 않은 회원입니다.'});
							} else {

								// const accessToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 80, }); //60*60 = 1h (3600)
								// const refreshToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 140, }); //60*60*48 = 48h
								const accessToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 7200, }); //60*60 = 1h (3600)
								const refreshToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 172800, }); //60*60*48 = 48h
								
			
								const ipaddr = requestIp.getClientIp(req);

								// console.log('accessToken:',accessToken);
								// console.log('refreshToken:',refreshToken);
								// console.log('ipaddr:',ipaddr);

								const re = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$|::/;
								let sql;
								let binds;
								// console.log('>>>>>>re test:', re.test(ipaddr))
								if ( re.test(ipaddr)){
									console.log(ipaddr, ' >>> not update last_login_ip')
									sql = "update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate where user_id=:4"
									binds = {1:accessToken, 2:refreshToken, 4:result.rows[0].USER_ID}
								}else{ 
									console.log(ipaddr, ' >>> update with last_login_ip')
		
									sql = "update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate, last_login_ip=:3 where user_id=:4"
									binds = {1:accessToken, 2:refreshToken, 3:ipaddr, 4:result.rows[0].USER_ID}
								}								

								conn.execute(sql, binds, {outFormat:oraclePool.OBJECT},(err, result1) => {
									if (err) {
										console.log(err);
									} 
				
									// console.log('result=', result);

												
									(async () => {
										await conn.commit();
										conn.close(function(er) { 
												if (er) {
													console.log('local >> Error closing connection', er);
												} else {
													console.log('local >> Connection closed');
												}
										});
											const sUser = new User({});
											sUser.provider = 'klnet';
											sUser.userid = '';  //1261001956
											sUser.userno = result.rows[0].USER_ID;
											sUser.username = result.rows[0].UNAME_KR;
											sUser.displayName = result.rows[0].UNAME_KR;
											sUser.accessToken = accessToken;
											sUser.refreshToken = refreshToken;
											sUser.email = result.rows[0].EMAIL; //mamma1234@naver.com;
										done(null, sUser); 

										// try {
										// 	const res = await client.query(sql);
										// 	response.status(200).json(res.rows);
										// } finally {
										// 	client.release();
										// }
									})().then(ret=> {console.log("[RETURN]",ret);} ).catch(err => {console.log("[ERROR]",err)} )

									
									// catch(err => setImmediate(() => {console.log("[ERROR]",err); }))

									// conn.commit();
									// conn.close(function(er) { 
									// 	if (er) {
									// 		console.log('Error closing connection', er);
									// 	} else {
									// 		console.log('Connection closed');
									// 	}
									// });    				
						
								});

							}
						}
		
					});
				});   

/*
            	if(userid) {
						console.log("1.DB Connect");			
						const accessToken = req.cookies['socialKey'];
						const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
						

						pgsqlPool.connect(function(err,conn,release) {
							if(err){
								console.log("err" + err);
							}
							// const sql = {
							// 	text: "select * from own_comp_user where user_no = $1 limit 1",
							// 	values: [decoded.userno],
							// 	//rowMode: 'array',
							// }

							const sql = {
								text: "select  * from own_comp_user where klnet_auth_code = $1 and klnet_auth_date < now() and klnet_auth_date > now() - interval '1 hours'",
								values: [password],
								//rowMode: 'array',
							}

							conn.query(sql, function(err,result){
								release();
								if(err){
									console.log(err);
								}
								// console.log(">>>",result);
								//console.log("USER DATA CNT:",result.rowCount);
								if(result.rowCount > 0) {

									const crypto_token_local = crypto.pbkdf2Sync(result.rows[0].token_local, 'salt', 100000, 64, 'sha512').toString('hex');
									if ( password === crypto_token_local) {

										const accessToken2 = jwt.sign({userno:result.rows[0].user_no}, process.env.JWT_SECRET_KEY, { expiresIn : 7200, }); //60*60 = 1h (3600)
										const refreshToken2 = jwt.sign({userno:result.rows[0].user_no}, process.env.JWT_SECRET_KEY, { expiresIn : 172800, }); //60*60*48 = 48h
					
										conn.query("UPDATE OWN_COMP_USER SET klnet_access_token=$1, klnet_refresh_token=$2 , klnet_login_date= now() WHERE klnet_auth_code=$3", [accessToken2, refreshToken2, password], function(err,result) {
											// client.end();
											if (err) {
												console.log(err);
											} 
										});

										console.log(crypto_token_local); 
										sUser.provider = 'klnet';
										sUser.userid = '';  //1261001956
										sUser.userno = result.rows[0].user_no;
										sUser.username = result.rows[0].user_name;
										sUser.displayName = result.rows[0].user_name;
										sUser.accessToken = accessToken2;
										sUser.refreshToken = refreshToken2;
										sUser.email = result.rows[0].user_email; //mamma1234@naver.com;
										//req.session.sUser = sUser;
										//console.log(">user value:",sUser);
										done(null, sUser); 
									} else {
										sUser.provider = 'klnet';
										sUser.userid = '';  //1261001956
										sUser.userno = '';
										sUser.username = '';
										sUser.displayName = '';
										sUser.accessToken = '';
										sUser.refreshToken = '';
										sUser.email = ''; //mamma1234@naver.com;
										console.log('가입되지 않은 회원입니다.');
										done(null, sUser, {errocode: 'E1002'});
									}
								} else {
									sUser.provider = 'klnet';
									sUser.userid = '';  //1261001956
									sUser.userno = '';
									sUser.username = '';
									sUser.displayName = '';
									sUser.accessToken = '';
									sUser.refreshToken = '';
									sUser.email = ''; //mamma1234@naver.com;
									console.log('가입되지 않은 회원입니다.');
									done(null, sUser, {errocode: 'E1002'});
								}
								
								
							});
						});
            	}else{
					done(null, false, {errocode: 'E1009' });
				}
*/
            } catch(error) {
            	//console.log(">>>>>error",error);
                console.error(error);
                done(error);
            }
    }));    
    //console.log('passport2');   
};
