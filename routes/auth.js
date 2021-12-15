const express = require('express');
const pgSql = require('../database/postgresql/users');
const oraSql =require('../database/oracle/user')
// const usersOraDao = require('../database/oracle/users');
const passport = require('passport');
const crypto = require('crypto');
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isLoggedPass,isLoggedIn } = require('./middlewares');
const pgsqlPool = require("../database/pool.js").pgsqlPool
const oraclePool = require("../database/pool.js").oraclePool
const dao = require('../database/');
 const router = express.Router();
//const randtoken = require('rand-token');
const requestIp = require('request-ip');
const  { OAuth2 } = require('oauth');
require('dotenv').config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const PRODUCTION = process.env.PRODUCTION;
//const DOMAIN_URL = (PRODUCTION === 'LOCAL' ? 'http://localhost:5002' : (PRODUCTION === 'DEV' ? 'https://devauth.plismplus.com' : 'https://auth.plismplus.com' ));
const DOMAIN_URL = (PRODUCTION === 'LOCAL' ? 'http://localhost:5002' : (PRODUCTION === 'DEV' ? 'https://devauth.plism.com' : 'http://oauth:5002' ));

// console.log('PRODUCTION:', PRODUCTION);
//console.log("1.router path:",router.patch);

/*router.post('/join', isLoggedPass, async (req, res, next) => {
	console.log("express:",req.body);
    const { email, password, signgb, name, phone, company } = req.body;
    try {
        const exUser = await User.find({ where: { email } });
        if(exUser) {
            req.flash('joinError', '이미 가입된 이메일입니다.');
            return res.redirect('/join');
        }
    
        // const hash = await bcrypt.hash(password, 12);
        const hash = password;
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch(error) {
        console.error(error);
        return next(error);
    }            
});*/

router.get('/api',  function (req, res) {
	//console.log("express:",req.body);
    
    console.log("join body value:",req.query.api_key);
    var token='';
    if(req.query.key) {

        oraclePool.getConnection(function (err, conn) {
            conn.execute("select * from do_comp_user_tbl where api_service_key = :1", {1:req.query.key}, {outFormat:oraclePool.OBJECT},(err, result) => {
                if (err) {
                    console.log("err" + err);
                    conn.close(function(er) { 
                        if (er) {
                            console.log('Error closing connection', er);
                        } else {
                            console.log('Connection closed');
                        }
                    });                         
                } else {
                    conn.close(function(er) { 
                        if (er) {
                            console.log('Error closing connection', er);
                        } else {
                            console.log('Connection closed');
                        }
                    });                      
                    if (result.rows.length < 1) {
                        return res.json({err: 'No mached Api Key exists.'});
                    } else {
                        // const token = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : '1h'});
                        // return res.json({token:token});

                        return res.json({token:result.rows[0].KLNET_LOCAL_TOKEN});
                    }
                }
            });
        });

    } else {
    	return res.json({err: 'Api key Required value.'});
    }
});

router.post('/dupcheck', async (req, response) => {
	// console.log("express:",req.body);
    let conn; 
    try { 
        conn = await oraclePool.getConnection();
        const result = await conn.execute(` SELECT *
                                            FROM ( SELECT KLNET_ID, USER_ID FROM MFEDI.DO_COMP_USER_TBL A WHERE USER_ID = UPPER(:1)
                                                    UNION SELECT KLNET_ID, USER_ID FROM MFEDI.DO_COMP_USER_TBL_DES A WHERE USER_ID = UPPER(:1) AND ROWNUM = 1 ) 
                                            WHERE ROWNUM = 1` 
                                            , {1:req.body.id}, {outFormat:oraclePool.OBJECT});
        if (result.rows.length < 1) {
            return response.status(200).send("OK");
        } else {
            return response.status(200).send("FAIL");
        }
    }catch(err){
        console.log('Error closing connection', err);
        response.status(200).send("FAIL");
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
});


router.post('/dupcheckMail', async (req, response) => {
	// console.log("express:",req.body);
    let conn; 
    try { 
        conn = await oraclePool.getConnection();
        const result = await conn.execute(`SELECT *
                                            FROM (SELECT KLNET_ID, USER_ID, EMAIL FROM MFEDI.DO_COMP_USER_TBL WHERE UPPER(EMAIL)= UPPER(:1)
                                            UNION SELECT KLNET_ID, USER_ID, EMAIL FROM MFEDI.DO_COMP_USER_TBL_DES WHERE UPPER(EMAIL)= UPPER(:1) AND ROWNUM = 1)
                                            WHERE ROWNUM = 1` 
                                            ,{1:req.body.mail}, {outFormat:oraclePool.OBJECT});
        if (result.rows.length < 1) {
            return response.status(200).send("OK");
        } else {
            return response.status(200).send("FAIL");
        }
    }catch(err){
        console.log('Error closing connection', err);
        response.status(200).send("FAIL");
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
});

router.post('/dupcheckPhone', async (req, response) => {
	// console.log("express:",req.body);
    let conn; 
    try { 
        conn = await oraclePool.getConnection();
        const result = await conn.execute(`SELECT *
                                            FROM (SELECT KLNET_ID, USER_ID,PHONE FROM MFEDI.DO_COMP_USER_TBL  WHERE PHONE=:1
                                            UNION SELECT KLNET_ID, USER_ID,PHONE FROM MFEDI.DO_COMP_USER_TBL_DES  WHERE PHONE=:1 AND ROWNUM=1)
                                            WHERE ROWNUM = 1` 
                                            ,{1:req.body.num}, {outFormat:oraclePool.OBJECT});
        if (result.rows.length < 1) {
            return response.status(200).send("OK");
        } else {
            return response.status(200).send("FAIL");
        }
    }catch(err){
        console.log('Error closing connection', err);
        response.status(200).send("FAIL");
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
    // oraclePool.getConnection(function (err, conn) {
    //     conn.execute("select * from do_comp_user_tbl where upper(phone) = upper(:1)", {1:req.body.num}, {outFormat:oraclePool.OBJECT},(err, result) => {
    //         if (err) {
    //             conn.close(function(er) { 
    //                 if (er) {
    //                     console.log('Error closing connection', er);
    //                 } else {
    //                     console.log('Connection closed');
    //                 }
    //             });                  
    //             return response.status(200).send("FAIL");
    //         } else {
    //             conn.close(function(er) { 
    //                 if (er) {
    //                     console.log('Error closing connection', er);
    //                 } else {
    //                     console.log('Connection closed');
    //                 }
    //             });                  
    //             if (result.rows.length < 1) {
    //                 return response.status(200).send("OK");
    //             } else {
    //                 return response.status(200).send("FAIL");
    //             }
    //         }
    //     });
    // });
});

router.post('/joinCheck', async function joinCehck(req, response){
	// console.log("express:",req.body);

    let conn;
    try{
        conn =  await oraclePool.getConnection();
        const result = await conn.execute("select * from do_comp_user_tbl where upper(user_id) = upper(:1) and user_pwd = DAMO.HASH_SHA256_J(:2)", {1:req.body.id, 2:req.body.pw}, {outFormat:oraclePool.OBJECT});
        if (result.rows.length < 1) {
            return response.status(200).send("FAIL");
        } else {
            return response.status(200).send("OK");
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
    // oraclePool.getConnection(function (err, conn) {
    //     conn.execute("select * from do_comp_user_tbl where upper(user_id) = upper(:1) and user_pwd = DAMO.HASH_SHA256_J(:2)", {1:req.body.id, 2:req.body.pw}, {outFormat:oraclePool.OBJECT},(err, result) => {
    //         if (err) {
    //             conn.close(function(er) { 
    //                 if (er) {
    //                     console.log('Error closing connection', er);
    //                 } else {
    //                     console.log('Connection closed');
    //                 }
    //             });                  
    //             return response.status(200).send("FAIL");
    //         } else {
    //             conn.close(function(er) { 
    //                 if (er) {
    //                     console.log('Error closing connection', er);
    //                 } else {
    //                     console.log('Connection closed');
    //                 }
    //             });                  
    //             if (result.rows.length < 1) {
    //                 return response.status(200).send("FAIL");
    //             } else {
    //                 return response.status(200).send("OK");
    //             }
    //         }
    //     });
    // });
    
/*
	const sql = {
	        text: "SELECT * FROM OWN_COMP_USER where local_id = $1  and local_pw=$2 limit 1 ",
	        values: [ req.body.id,crypto.pbkdf2Sync(req.body.pw, 'salt', 100000, 64, 'sha512').toString('hex')],
	        //rowMode: 'array',
	    }
    console.log(sql);


    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		console.log("res:",res.rowCount);
            if(res.rowCount > 0) {
                return response.status(200).send("OK");
           } else {
                return response.status(200).send("FAIL");
           }
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {response.status(500).json(err); }))
*/
});

router.post('/join', isLoggedPass, async (req, res, next) => {
	// console.log("express server : join path pw value:",req.body.password);
    // const { id, password, name, phone, company ,provider,kakaoid,tokenkakao,naverid,tokennaver,faceid,tokenface,googleid,tokengoogle} = req.body;
    // console.log("join body value:",req.body);
    console.log('(routes/auth.js > /join )');
    passport.authenticate('localjoin',{session: false},(authError, user, info) => {
        console.log("auth/localjoin) authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            // return next(authError);210805
            return res.status(500).json({status:'FAIL',msg:authError});
        }
        if(info){
            console.log("!info", info);
            return res.status(200).json({status:'error',msg:info});            
        }

        if(user){
/**자동로그인?? klnet_local_token받으려면? 
            return req.login(user, (loginError) => {
                if(loginError) {
                    console.error("loginError", loginError);
                }
                const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
                console.log('accessToken decoded:', decoded);
                const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
                console.log('refreshToken decoded:', refresh_decoded);
                if(PRODUCTION === 'LOCAL') {
                    res.cookie("x_auth",user.accessToken,{httpOnly: true});
                    res.cookie("y_auth",user.refreshToken,{httpOnly: true});
                } else {
                    res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
                    res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
                }
                var ipaddr = requestIp.getClientIp(req);
                pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);

                return res.status(200).json({status:'SUCCESS'});
             })
*/
            //210809 const token = jwt.sign({userno:user[0]}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //res.cookie("x_auth",token,{domain:'plismplus.com',httpOnly: true});
            //210809res.cookie("x_auth",token,{httpOnly: true});
            //토큰 저장
            // console.log("token db save: ", token);
            //pgSql.setUserToken(user,token);//대체하기20210714
            //210809oraSql.setUserToken(user[0],token);
            //210809console.log("token value: "+token);
            /*//res.clearCookie('connect.sid',{ path: '/' });
            res.clearCookie('connect.userno',{ path: '/' });
            res.cookie("connect.sid",token);
            res.cookie("connect.userno",user.userno);*/
            // return res.json({status:'SUCCESS'});
            console.log('auth/localjoin) provider' , user.provider)
            return res.status(200).json({status:'SUCCESS',provider:user.provider});
        }else{
            return res.status(500).json({status:'FAIL'});
        }
        //return res.json(user);
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


async function getOAuthAuthCode(x_auth, grant_type) {
    return new Promise(function(resolve, reject){
        (async () => {
            
            const oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', `${DOMAIN_URL}/oauth/auth_code`, '');

            await oauth2.getOAuthAccessToken(x_auth, grant_type, (ret, auth_code, access_token, results) => {   
        
                console.log("ret:",  ret , ", auth_code:", auth_code, ", access_token:", access_token, ",results:", results);
                resolve(auth_code);            
            });

        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); reject(null);}))
    });
}


router.get('/readyplism', isLoggedPass, (req, res, next) => {

    console.log("(auth.js) readyplism call");
    
    (async () => {
        let decoded = '';
        try {        
            const x_auth = req.cookies['x_auth'];
            console.log("(auth.js) verify x_auth:", x_auth);
            decoded = jwt.verify(x_auth, JWT_SECRET_KEY);
            const auth_code = await getOAuthAuthCode(x_auth, {'grant_type':'refresh_token'});

            console.log("(auth.js) auth_code:", auth_code);


            return res.json({'auth_code':auth_code}); 

        } catch (err) {
            // console.log("(auth.js) verify err", err);
            if(err instanceof jwt.TokenExpiredError) {
                console.log("(auth.js) verify isVerifyToken unauthorized");
                return res.status(401).json({ isAuth:false, errorcode: 401, error: {message:'isVerifyToken unauthorized'} });                
            } else {
                console.log("(auth.js) verify isVerifyToken unauthorized");
                return res.status(401).json({ isAuth:false, errorcode: 401, error: {message:'isVerifyToken unauthorized'} });
            }
        }
        
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); }))

});


async function getOAuthAccessToken(y_auth, grant_type) {
    return new Promise(function(resolve, reject){
        (async () => {

            
            const oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', `${DOMAIN_URL}/oauth/access_token`, '');

            // if (PRODUCTION === 'LOCAL') {
            //     oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'http://localhost:5002/oauth/access_token', '');
            // } else if (PRODUCTION === 'DEV') {
            //     oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'https://devauth.plismplus.com/oauth/access_token', '');
            // } else { //REAL
            //     oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'https://auth.plismplus.com/oauth/access_token', '');
            // }
            // const oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'http://localhost:5002/oauth/access_token', '');
            // const oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'https://devauth.plismplus.com/oauth/access_token', '');
            // const oauth2 = new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'https://auth.plismplus.com/oauth/access_token', '');
            await oauth2.getOAuthAccessToken(y_auth, grant_type, (ret, access_token, refresh_token, results) => {   
        
                console.log("ret:",  ret , ", access_token:", access_token, ", refresh_token:", refresh_token, ",results:", results);
                resolve(access_token);            
            });

        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); reject(null);}))
    });
}

router.get('/verify', isLoggedPass, (req, res, next) => {

    console.log("(auth.js) verify call");
    
//사용자 정보와 현재의 accessToken가 맞는지 확인 필요.
//맞지 않다면. accessToken 발급 하지 않고, 로그아웃 시킴
const x_auth = req.cookies['x_auth'];
    (async () => {
        let decoded = '';
        try {        
           
            console.log("(auth.js) verify x_auth:", x_auth);
            decoded = jwt.verify(x_auth, JWT_SECRET_KEY);

            console.log("(auth.js) verify accessToken decoded:", decoded, ',curtime:', Date.now()/1000);

            if (decoded.exp < Date.now()/1000+60) {
                console.log('TokenExpired>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                throw new jwt.TokenExpiredError();
            }

        } catch (err) {
            // console.log("(auth.js) verify err", err);
            if(err instanceof jwt.TokenExpiredError) {
                try {
                    console.log("(auth.js) isVerifyToken jwt.TokenExpiredError:", err);
                    let y_auth = req.cookies['y_auth'];
                    let y_auth_decoded = jwt.verify(y_auth, JWT_SECRET_KEY);
                    console.log("-------------------refreshToken:", y_auth);

                    const accessToken = await getOAuthAccessToken(y_auth, {'grant_type':'refresh_token'});

                    console.log("-------------------new accessToken:", accessToken);
                    decoded = jwt.verify(accessToken, JWT_SECRET_KEY);
                    console.log("-------------------ok accessToken:", accessToken);
                    if(PRODUCTION === 'LOCAL') {
                        res.cookie("x_auth",accessToken,{httpOnly: true});
                    } else {
                        res.cookie("x_auth",accessToken,{domain:'plism.com',httpOnly: true});
                    }


                } catch (err1) {
                    console.log("(auth.js) isVerifyToken err1:", err1);
                    return res.status(419).json({ isAuth:false, errorcode: 419, error: {message:'isVerifyToken'} });
                }
                
            } else {
                console.log("(auth.js) verify isVerifyToken unauthorized");
                return res.status(401).json({ isAuth:false, errorcode: 401, error: {message:'isVerifyToken unauthorized'} });
            }
        }

//        console.log("-----------------------checking-------------------------");

        dao.orausers.getUser(decoded,function(err,user,info){
    
    
                //pgsql recipient add setting.

            console.log('(auth.js /verify) user:', user);
            if(err) {
                console.error("err", err);
                return res.status(401).json({ isAuth:false, errorcode: 401, error: info });
            }

            user.company_list = [user.klnet_id];
            // user.iat = decoded.iat;
            user.exp = decoded.exp;
            user.accessToken = x_auth;
            dao.company.getCompanyWorkList(user.klnet_id, function(err,work,info){

                if(err) {
                    console.error("err", err);
                    return res.status(401).json({ isAuth:false, errorcode: 401, error: info });
                }

                for (let index = 0; index < work.length; index++) {
                    if (work[index].work_code === 'BOOKING') user.bkg_recipient = work[index].recipient;
                    if (work[index].work_code === 'SR') user.sr_recipient = work[index].recipient;
                    if (work[index].work_code === 'DECLARE') user.declare_recipient = work[index].recipient;
                    if (work[index].work_code === 'VGM') user.vgm_recipient = work[index].recipient;
                }
                
                req.login(user,async (loginError) => {

                    if(loginError) {
                        console.error("loginError", loginError);
                        return res.status(401).json({ isAuth:false, errorcode: 401, error: info });
                    }
    
                    const userInfo = Object.assign({}, user);
                    console.log("(auth.js /verify) userInfo:",userInfo);
                    return res.json({'isAuth':true,'user':userInfo}); 
                });

                
            });
            

        });

        
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); }))

/* 2021.06.22 pdk ship close update
    passport.authenticate('re-jwt',(authError, user, info) => {
        //console.log("2. JWT authenticate Return Val (authError:",authError,",user:",user,",info:",info);

        console.log("(auth.js) authError:", authError, ',user', user, ',info', info);

        if(authError) {
            console.error("authError", authError);
            return next(err);
        }
        if(!user){
        	if(info && info.name === 'TokenExpiredError') {
        		// res.clearCookie('x_auth',{ path: '/' });
        		return res.status(419).json({ isAuth:false, errorcode: 401, error: info });
        	} else {
        		return res.status(401).json({ isAuth:false, errorcode: 401, error: info });
        	}
        }

        req.login(user,async (loginError) => {
           // console.log("user", user);
        	
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            // const userInfo = {
            //     'user_no':user.user_no,
            //     'user_name':user.user_name,
            //     'role':user.user_type,
            //     'bkg_recipient': user.bkg_recipient,
            //     'sr_recipient': user.sr_recipient,
            //     'declare_recipient': user.declare_recipient,
            //     'vgm_recipient': user.vgm_recipient,

            // };
            const userInfo = Object.assign({}, user);
            console.log("userInfo:",userInfo);
            return res.json({'isAuth':true,'user':userInfo});
        });

    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
*/
});

router.get('/user', isLoggedPass, (req, res, next) => { //console.log("req:",req.cookies);
    console.log("(auth.js) req.isAuthenticated():", req.isAuthenticated());
    passport.authenticate('jwt',(authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            //console.log("!user", user);
            req.session = null;
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(401).json(info);
            //return res.status(401).json({ errorcode: 401, error: 'unauthorized' });
            return res.status(401).json({ errorcode: 401, error: info.message });
        }

        return req.login(user,async (loginError) => {
            //console.log("user", user);

            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            //req.session.sUser = user;
            // res.status(200).json(user);
            // return;

            //return res.json({user:user});
            //토큰 발행
            const userInfo = {'userno':user.user_no,'username':user.user_name,'role':user.user_type};
            const accessToken = jwt.sign(userInfo, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            //console.log("token db save: ", user.accessToken);
            await pgSql.setUserToken(user,accessToken);
            //console.log("token value:"+token);
            /*//res.clearCookie('connect.sid',{ path: '/' });
            res.clearCookie('connect.userno',{ path: '/' });
            res.cookie("connect.sid",token);
            res.cookie("connect.userno",user.userno);*/
            //return res.json({user:user, token:token});
            return res.json({'isAuth':true,'user':userInfo,'token':accessToken});            
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});



router.post('/login', (req, res, next) => { 
    console.log("(auth.js) req.isAuthenticated():", req.isAuthenticated());
    
     passport.authenticate('local',{session: false}, (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        //console.log("(auth.js) req.isAuthenticated():", req.isAuthenticated());
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(200).json(info);
            return res.status(401).json({ errorcode: 401, error: info.message });
            
        }

        req.login(user,async (loginError) => {

            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }

             const userInfo = {'user_no':user.user_no,'user_name':user.user_name,'role':user.user_type};
            //토큰 발행
            const accessToken = jwt.sign({userno:user.user_no}, process.env.JWT_SECRET_KEY, { expiresIn : '1h' });
            //const refleshToken = jwt.sign(userInfo, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });

            //토큰 저장
            var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
           //let ipaddr;
            req.body.ipaddr?ipaddr=req.body.ipaddr:ipaddr='';
        	   await pgSql.setUserToken(user,accessToken);
        	   await pgSql.setLoginHistory(user.user_no,'I',req.useragent, ipaddr);
        	   
        	  // res.cookie("x_auth",accessToken,{httpOnly:true});
               //console.log("token value:"+token);
               /*res.cookie("connect.sid",token);
               res.cookie("connect.userno",user.userno);*/
               //res.cookie("socialKey",{user:user, token:token});
        	   //console.log("acctoken:",accessToken);
               return res.json({'isAuth':true,'user':userInfo,'token':accessToken});
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


// kakao 로그인
router.get('/login/kakao',
		  passport.authenticate('kakao')
		);

router.get('/kakao/callback', isLoggedPass, (req, res,next) => {
    
    console.log("(auth.js) /kakao/callback:req.isAuthenticated():", req.isAuthenticated());
    // console.log("(auth.js) req:", req);
    
    passport.authenticate('kakao', (authError, user, info) => {
        console.log(">>>>>>>>>>authError:",authError,",user:",user,",info:",info);

        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }

        if(info && !user) {
        	//res.cookie("socialKey",{user:user});
        	//return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');
            res.cookie("xauth_social",info);
        	return res.redirect('/authpage?auth=register'); 
        }
        
/*        if(!user){
            console.log("!user", user);
            console.log("info", info);
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(200).json(info);
           // return res.status(405).json({ errorcode: 405, error: 'unauthorized' });
            res.cookie("socialKey",{info});
        	return res.redirect('/authpage?auth=register');     
        }   */

        return req.login(user, (loginError) => {

            if(loginError) {
                console.error("loginError", loginError);
               return next(loginError);
            }
            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
            res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            //console.log("http://localhost:3000 redirect");
            //return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;

            // const token = jwt.sign(user.userid, process.env.JWT_SECRET_KEY);

            
            //토큰 저장
            //res.cookie("socialKey",{user:user, token:token});

            
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            //res.json({user:user, token:token});

            //210810 const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //210810 res.cookie("x_auth",token,{domain:'plismplus.com',httpOnly: true});
            // oraSql.setSocialLoginInfo(user.provider,user.providerid, token , user.accessToken);
            // pgSql.setSocialLoginInfo(user.provider,user.userid, token , user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            //res.json({user:user, token:token});
            //res.json({user:user, token:user.accessToken});
            //console.log("res:",res);
           // return res.redirect('http://localhost:3000/authpage?auth=social');
            //return res.redirect('http://localhost:3000');
            //res.cookie("connect.sid",token);
            // res.cookie("connect.user",user);
            //res.cookie("connect.userno",user.userno);
            //return res.redirect('http://localhost:3000/landing?provider=kakao');
             //res.json({user:user, token:token});
           // return res.redirect('/landing');
            return res.redirect('https://'+req.headers.host);
            
            //return res.redirect('/authpage?auth=social');
            //res.cookie("connect.sid",token);
            // res.cookie("connect.user",user);
            //res.cookie("connect.userno",user.userno);
            //return res.redirect('http://localhost:3000/landing?provider=kakao');
            //res.json({user:user, token:token});
           // return res.redirect('/landing');
          //  return res.redirect('http://'+req.headers.host);
        });
    })(req, res,next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});
/*
router.get('/kakao/callback', (req, res,next) => {
    
    console.log("(auth.js) /kakao/callback:req.isAuthenticated():", req.isAuthenticated());

            res.cookie("socialKey",{provider:'kakao',id:'2123919239123',name:'12312321'});
            //res.body({param:'test'});

        	return res.redirect('/authpage'); 
 
});*/



// kakao 로그인 연동 콜백
// router.get('/kakao/callback',
//   passport.authenticate('kakao', {
//     successRedirect: '/',
//     failureRedirect: '/login'
//   })
// );

// router.get('/login/kakao/callback', 
//     passport.authenticate('kakao', {
//         failureRedirect: '/',
//     }), 
//     (req, res) => {
//         res.redirect('/');
//     }
// );


// // naver 로그인
// router.get('/auth/login/naver',
//   passport.authenticate('naver')
// );
// // naver 로그인 연동 콜백
// router.get('/auth/login/naver/callback',
//   passport.authenticate('naver', {
//     successRedirect: '/',
//     failureRedirect: '/login'
//   })
// );


router.get('/naver/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /naver/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('naver', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        /*if(info) {
        	res.cookie("socialKey",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');

        }
        
    
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }*/
        
        if(info && !user) {
        	res.cookie("xauth_social",info);
        	return res.redirect('/authpage?auth=register');
        }
        
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
            res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('https://'+req.headers.host);
            //res.json({user:user});
            //console.log("http://localhost:3000 redirect");
            //console.log("|||:",res);
            
        /*    const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            res.cookie("socialKey",{user:user, token:token});
            pgSql.setSocialLoginInfo(user.provider,user.userid, token, user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('/authpage?auth=social');*/
            
            //return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;
            /**
            const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            res.cookie("x_auth",token,{domain:'plism.com',httpOnly: true});
            pgSql.setSocialLoginInfo(user.provider,user.userid, token , user.accessToken);

            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('https://'+req.headers.host); */
            
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

// // facebook 로그인
// router.get('/auth/login/facebook',
//   passport.authenticate('facebook')
// );
// // facebook 로그인 연동 콜백
// router.get('/auth/login/facebook/callback',
//   passport.authenticate('facebook', {
//     successRedirect: '/',
//     failureRedirect: '/login'
//   })
// );
router.get('/facebook/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /facebook/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('facebook', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(info && !user) {
        	res.cookie("xauth_social",info);
        	return res.redirect('/authpage?auth=register');
        }
        
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
            res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('https://'+req.headers.host);


        /**
        if(info) {
        	res.cookie("xauth_social",info);
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');

        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            res.cookie("socialKey",{user:user, token:token});
// 보충필요 pgSql.setSocialLoginInfo(user.provider,user.userid, token ,user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('/authpage?auth=social');
           // console.log("http://localhost:3000 redirect");
           // return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;
 */
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get('/google/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /google/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('google', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        console.log('req.headers.host  >> : ',req.headers.host);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }

       /* if(info.message != undefined) {
        	//console.log("info");
        	res.cookie("socialKey",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');
        }*/
        
        if(info && !user) {
        	//console.log("info");
        	 res.cookie("xauth_social",info);
         	return res.redirect('/authpage?auth=register');    
        	//return res.redirect('http://localhost:3000/landing');
        }

        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);
    
            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);
    
            res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
            res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('https://'+req.headers.host);
/*            const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            res.cookie("socialKey",{user:user, token:token});
            pgSql.setSocialLoginInfo(user.provider,user.userid, token, user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('/authpage?auth=social');*/
            
            //res.redirect('http://localhost:3000');
            //res.status(200).send(user);
            //console.log(user);
           // console.log("http://localhost:3000 redirect");
            //return res.redirect('http://localhost:3000');
            
  /* 0930         const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            res.cookie("x_auth",token,{domain:'plism.com',httpOnly: true});
// 보충필요 pgSql.setSocialLoginInfo(user.provider,user.userid, token , user.accessToken);  
// oraSql.setSocialLoginInfo(user.provider,user.providerid, token , user.accessToken);
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            return res.redirect('https://'+req.headers.host);
    */        
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/openbank/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /openbank/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('openbank', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(info) {
        	res.cookie("socialKey",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');

        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('/authpage?auth=social');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/microsoft/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /microsoft/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('microsoft', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(info) {
        	res.cookie("socialKey",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');

        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('/authpage?auth=social');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/daum/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /daum/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('daum', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(info) {
        	res.cookie("socialKey",{profile:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');

        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('/authpage?auth=social');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});



router.get('/twitter/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /twitter/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('twitter', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('/authpage?auth=social');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/cognito/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /cognito/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('cognito', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/instagram/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /instagram/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('instagram', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get('/linkedin/callback', isLoggedPass, (req, res, next) => {
    
    console.log("(auth.js) /linkedin/callback:req.isAuthenticated():", req.isAuthenticated());
    
    passport.authenticate('linkedin', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            return next(authError);
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            return res.redirect('http://localhost:3000/login');

            // res.status(200).json(info);
            // return;
        }
        return req.login(user, (loginError) => {
            console.log("user", user);
            if(loginError) {
                console.error("loginError", loginError);
                return next(loginError);
            }
            console.log("http://localhost:3000 redirect");
            return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get('/local/callback', isLoggedPass, (req, res, next) => {
    // const url = require('url');
    // let url_value = '';
    
    //if(req.headers && req.headers.referer.indexOf('localhost') > 0) { console.log("connect >>>>>>>>>>>localhost");
    //	url_value = req.headers.referer;
    //} else {
    //	url_value = "https://"+req.headers.host;
    //}
    // if(PRODUCTION === 'LOCAL') {
    //     // return res.redirect("http://localhost:3000?code=SUCCESS" );
    //     url_value = "http://localhost:3000" ;
    // } else {
    //     url_value = "/" ;
    // }   
        
    //console.log("res:",res.body);
    //console.log("req:",req.query);
    //console.log("req:",req);
    console.log("(auth.js) /local/callback");
    // console.log("host:",url_value);
    //console.log('1.', req.body);
    
    // const accessToken = req.cookies['accessToken'];
    // const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    // console.log("decoded:", decoded);
    // req.body['userno'] = userno;
    // req.body['accessToken'] = accessToken;
    
    // console.log('2.', req.body);
    // if(req.query && req.query.errcode) { 
    	
    // 	return res.redirect(url.format({
	//     	pathname:url_value,//.slice(0,-1),
	//     	query:{code:req.query.errcode}
    // 	}));
    // }
    if(req.query && req.query.errcode) {         
        if(PRODUCTION === 'LOCAL') {
            return res.redirect("http://localhost:3000?code=" + req.query.errcode );
        } else {
            return res.redirect("/?code=" + req.query.errcode );
        }
    }    

    passport.authenticate('local', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            // return next(authError);
        }
        // if(info) {
        // 	//res.cookie("x_auth",{user:user});
        // 	//return res.redirect('http://localhost:3000/landing');
        // 	return res.redirect(url.format({
    	//     	pathname:url_value,//.slice(0,-1),
    	//     	query:{code:info.errcode}
        // 	}));
        // }
        if(info && Object.keys(info).length > 0) {
            console.log("----info---", info);
        	// res.cookie("x_auth",{user:user});
        	return res.redirect('/');
        	//return res.redirect('http://localhost:3000/landing');
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(200).json(info);
            //return res.status(405).json({ errorcode: 405, error: 'unauthorized' });
        	// return res.redirect(url.format({
    	    // 	pathname:url_value,//referer.slice(0,-1),
    	    // 	query:{code:'E1002'}
        	// }));
            return res.status(405).json({ errorcode: 405, error: 'unauthorized' });
        }        
        return req.login(user, (loginError) => {
            
            if(loginError) {
                console.error("loginError", loginError);
              //  return next(loginError);
            }
            //console.log("http://localhost:3000 redirect");
            //return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;

            // const token = jwt.sign(user.userid, process.env.JWT_SECRET_KEY);

            // const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            // res.cookie("socialKey",{user:user, token:token});
            //res.cookie("socialKey",{user:user, token:user.accessToken});

            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            //res.cookie("x_auth",user.accessToken,{domain:'plismplus.com',httpOnly: true});
            
            // if(PRODUCTION === 'LOCAL') {
            // 	res.cookie("x_auth",user.accessToken,{httpOnly: true});
            // } else {
            // 	res.cookie("x_auth",user.accessToken,{domain:'plismplus.com',httpOnly: true});
            // }
            if(PRODUCTION === 'LOCAL') {
                res.cookie("x_auth",user.accessToken,{httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{httpOnly: true});
            } else {
                res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            }

            //res.cookie("x_auth",user.accessToken,{httpOnly: true});
            //res.cookie("x_auth",user.accessToken,{domain:'plismplus.com',httpOnly: true});
            // pgSql.setSocialLoginInfo(user.provider,user.userid, token , user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            //res.json({user:user, token:token});
            //res.json({user:user, token:user.accessToken});
            //console.log("res:",res);
           // return res.redirect('http://localhost:3000/authpage?auth=social');
            //return res.redirect('http://localhost:3000');
            //res.cookie("connect.sid",token);
            // res.cookie("connect.user",user);
            //res.cookie("connect.userno",user.userno);
            //return res.redirect('http://localhost:3000/landing?provider=kakao');
             //res.json({user:user, token:token});
           // return res.redirect('/landing');
           // console.log("req.headers.host:",req)
            // return res.redirect(url_value);

            if(PRODUCTION === 'LOCAL') {
                return res.redirect("http://localhost:3000" );
            } else {
                return res.redirect("/" );
            }                  
        });
    })(req, res,next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});


router.get('/klnet/callback', (req, res, next) => {
    console.log("(auth.js) /klnet/callback:req.isAuthenticated():", req.isAuthenticated());
    console.log("req.originalUrl=", req.originalUrl);
    console.log('req', req.query,'//////',req.query.id,'////',req.query.lastPath,)
    // console.log()
    // req.sUser = sUser;

    // let url_value="";
    // if(req.headers && req.headers.referer.indexOf('localhost') > 0) { console.log("connect >>>>>>>>>>>localhost");
    //     url_value = req.headers.referer;
    // } else {
    //     url_value = "https://"+req.headers.host;
    // }

    if(req.query && req.query.errcode) {         
        if(PRODUCTION === 'LOCAL') {
            return res.redirect("http://localhost:3000?code=" + req.query.errcode );
        } else {
            return res.redirect("/?code=" + req.query.errcode );
        }
    }    

    passport.authenticate('klnet', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            // return next(authError);
        }
        if(info && Object.keys(info).length > 0) {
            console.log("----info---", info);
        	// res.cookie("x_auth",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(200).json(info);
            return res.status(405).json({ errorcode: 405, error: 'unauthorized' });
            
        }        
        return req.login(user, (loginError) => {
            if(loginError) {
                console.error("loginError", loginError);
              //  return next(loginError);
            }
            //console.log("http://localhost:3000 redirect");
            //return res.redirect('http://localhost:3000');
            // res.status(200).json(user);
            // return;

            // const token = jwt.sign(user.userid, process.env.JWT_SECRET_KEY);

            // const token = jwt.sign({userno:user.userno}, process.env.JWT_SECRET_KEY, { expiresIn : '1h', });
            //토큰 저장
            // res.cookie("socialKey",{user:user, token:token});
            //res.cookie("socialKey",{user:user, token:user.accessToken});


            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            //res.cookie("x_auth",user.accessToken,{domain:'plismplus.com'});


            // res.cookie("x_auth",user.accessToken,{domain:'localhost',httpOnly: true});
            // res.cookie("y_auth",user.refreshToken,{domain:'localhost',httpOnly: true});


//console.log('req.headers.referer:', req.headers.referer);

            if(PRODUCTION === 'LOCAL') {
                res.cookie("x_auth",user.accessToken,{httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{httpOnly: true});
            } else {
                res.cookie("x_auth",user.accessToken,{domain:'plism.com',httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{domain:'plism.com',httpOnly: true});
            }
            // pgSql.setSocialLoginInfo(user.provider,user.userid, token , user.accessToken);
            //var ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);
            //res.json({user:user, token:token});
            //res.json({user:user, token:user.accessToken});
            //console.log("res:",res);
           // return res.redirect('http://localhost:3000/authpage?auth=social');
            //return res.redirect('http://localhost:3000');
            //res.cookie("connect.sid",token);
            // res.cookie("connect.user",user);
            //res.cookie("connect.userno",user.userno);
            //return res.redirect('http://localhost:3000/landing?provider=kakao');
             //res.json({user:user, token:token});
           // return res.redirect('/landing');
           
            // return res.redirect(req.headers.referer);

            //if(req.headers && req.headers.referer.indexOf('localhost') > 0) { console.log("connect >>>>>>>>>>>localhost");
            //    return res.redirect("http://localhost:3000?code=SUCCESS");
            //} else {
                // return res.redirect("/?code=SUCCESS" );
            //}

            
            if(PRODUCTION === 'LOCAL') {
                return res.redirect(`http://localhost:3000${req.query.lastPath}?code=SUCCESS` );
            } else {
                return res.redirect(`${req.query.lastPath}?code=SUCCESS`);
            }            
            // if(PRODUCTION === 'LOCAL') {
            //     return res.redirect("http://localhost:3000?code=SUCCESS" );
            // } else {
            //     return res.redirect("/?code=SUCCESS" );
            // }            
                        
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get('/panlogis/callback', (req, res, next) => {
    console.log("(auth.js) /klnet/callback:req.isAuthenticated():", req.isAuthenticated());
    console.log("req.originalUrl=", req.originalUrl);
    // let url_value="";
    // if(req.headers && req.headers.referer.indexOf('localhost') > 0) { console.log("connect >>>>>>>>>>>localhost");
    //     url_value = req.headers.referer;
    // } else {
    //     url_value = "https://"+req.headers.host;
    // }


    if(req.query && req.query.errcode) {         
        if(PRODUCTION === 'LOCAL') {
            return res.redirect("http://localhost:3000?code=" + req.query.errcode );
        } else {
            return res.redirect("/?code=" + req.query.errcode );
        }
    }    

    passport.authenticate('klnet', (authError, user, info) => {
        console.log("authError:",authError,",user:",user,",info:",info);
        if(authError) {
            console.error("authError", authError);
            // return next(authError);
        }
        if(info && Object.keys(info).length > 0) {
            console.log("----info---", info);
        	// res.cookie("x_auth",{user:user});
        	return res.redirect('/authpage?auth=register');
        	//return res.redirect('http://localhost:3000/landing');
        }
        if(!user){
            console.log("!user", user);
            // req.flash('loginError', info.message);
            // return res.redirect('/');
            // return res.status(200).json(info);
            return res.status(405).json({ errorcode: 405, error: 'unauthorized' });
            
        }        
        return req.login(user, (loginError) => {

            if(loginError) {
                console.error("loginError", loginError);
              //  return next(loginError);
            }


            const decoded = jwt.verify(user.accessToken, process.env.JWT_SECRET_KEY);
            console.log('accessToken decoded:', decoded);

            const refresh_decoded = jwt.verify(user.refreshToken, process.env.JWT_SECRET_KEY);
            console.log('refreshToken decoded:', refresh_decoded);

            if(PRODUCTION === 'LOCAL') {
                res.cookie("x_auth",user.accessToken,{httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{httpOnly: true});
            } else {
                res.cookie("x_auth",user.accessToken,{domain:'panlogis.co.kr',httpOnly: true});
                res.cookie("y_auth",user.refreshToken,{domain:'panlogis.co.kr',httpOnly: true});
            }

            var ipaddr = requestIp.getClientIp(req);
            pgSql.setLoginHistory(user.userno,'I',req.useragent, ipaddr);

            if(PRODUCTION === 'LOCAL') {
                return res.redirect("http://localhost:3000?code=SUCCESS" );
            } else {
                return res.redirect("/?code=SUCCESS" );
            }            
                        
        });
    })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

// router.post('/login', isNotLoggedIn, (req, res, next) => {
//     passport.authenticate('local', (authError, user, info) => {
//         if(authError) {
//             console.error(authError);
//             return next(authError);
//         }
//         if(!user){
//             req.flash('loginError', info.message);
//             return res.redirect('/');
//         }
//         return req.login(user, (loginError) => {
//             if(loginError) {
//                 console.error(loginError);
//                 return next(loginError);
//             }
//             return res.redirect('/');
//         });
//     })(req, res, next)  //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
// });
 

 
router.post('/userfinder', (req, res) => {
    console.log(" express user info finder ----------------------");  
    //  pgSql.getUserPhoneInfo(req, res);
    oraSql.getUserPhoneInfo(req, res);
});

router.post('/userupdate', async (req, res) => {
    console.log("express update:",req.body);
    let conn;
    try{
        conn =  await oraclePool.getConnection();
        const result = await conn.execute("update do_comp_user_tbl set user_pwd=DAMO.HASH_SHA256_J(UPPER(:1)), pwd_chg_date=sysdate, pwd_fail_cnt=0, login_lock_flag='N', login_lock_reason=null where user_id=UPPER(:2)"
                    , {1:req.body.pw, 2:req.body.uno}, {outFormat:oraclePool.OBJECT})
                    console.log(result)
                    if(result.rowsAffected > 0) {
                        await conn.commit();
                        return res.status(200).send();
                    } else {
                        await conn.rollback();
                        return res.status(404).send();
                    }
    }catch(err){
        console.log("[ERROR]",err);
        response.status(404).json(err); 
    }finally{
        if(conn){
            try{
                console.log('fianally conn.close>>>')
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
})


router.post('/userupdate1', async (req, res) => {
	console.log("express update:",req.body);
    
    oraclePool.getConnection(function (error, conn) {
        conn.execute("update do_comp_user_tbl set user_pwd=DAMO.HASH_SHA256_J(UPPER(:1)), pwd_chg_date=sysdate, pwd_fail_cnt=0, login_lock_flag='N', login_lock_reason=null where user_id=UPPER(:2)"
        , {1:req.body.pw, 2:req.body.uno}, {outFormat:oraclePool.OBJECT},(err, result) => {
            if (err) {
                console.log(err);
                (async () => {
                    await conn.rollback();
                    conn.close(function(er) { 
                        if (er) {
                            console.log('Error closing connection', er);
                        } else {
                            console.log('Connection closed');
                        }
                    });                  
                    return res.status(404).send();
    
                })().then(ret=> {console.log("[RETUNT]",ret);} ).catch(err => {console.log("[ERROR]",err)} )                
            } 

            // console.log("result:", result);


            (async () => {
                await conn.commit();
                conn.close(function(er) { 
                    if (er) {
                        console.log('Error closing connection', er);
                    } else {
                        console.log('Connection closed');
                    }
                }); 
                if(result.rowsAffected > 0) {
                    return res.status(200).send();
                } else {
                    return res.status(404).send();
                }

            })().then(ret=> {console.log("[RETUNT]",ret);} ).catch(err => {console.log("[ERROR]",err)} )

            // if(result.rows.length > 0) {
            // 	return res.status(200).send();
            // } else {
            // 	return res.status(404).send();
            // }
        });  
    });

/*
    const inputpassword = crypto.pbkdf2Sync(req.body.pw, 'salt', 100000, 64, 'sha512').toString('hex');

	let sql = "update OWN_COMP_USER set local_pw = '"+inputpassword+"' , pwd_modify_date=now() \n";
	    sql +=" where user_no = '"+ req.body.uno+"' \n";	
	
    console.log(sql);
    pgsqlPool.connect(function(err,conn) {
        if(err){
            console.log("err" + err);
        }
        conn.query(sql, function(err,result){
            
            if(err){
                console.log(err);
            }
            console.log("result:",result);
            console.log("ROW CNT:",result.rowCount);
            if(result.rowCount > 0) {
            	return res.status(200).send();
            } else {
            	return res.status(404).send();
            }
        });
    });
*/
});

/*const resetKey = (request, response,user_data) => {
	console.log("certi3");
	let sql = "update  OWN_COMP_USER set certify_num = Rpad(trim(to_char(floor(random()*9999),'9999')),4,'0'),certify_date=now() \n";
	   sql += " where user_no = '"+user_data[0].user_no+"' \n";
	          
 console.log ("query:" +sql);

	   pgsqlPool.connect(function(err,conn) {
     if(err){
         console.log("err" + err);
         response.status(400).send(err);
     }

     conn.query(sql, function(err,result){
         if (err) {
             response.status(400).json({ "error": error.message });
             return;
         }
         if(result.rowCount > 0) {
        	 return response.status(200).send();
         } else {
        	 return response.status(404).send();
         }        
     });
     // conn.release();
 });
}*/
router.post('/changeSession', async (req, res, next) => { 
    console.log("(auth.js) req.isAuthenticated():", req.isAuthenticated());
    console.log("(auth.js) req.body):", req.body);
    let clientToken;
    const user_no = req.body.userid;
    const conn = await oraclePool.getConnection();
    try {
        console.log(req.body.adminKey, process.env.SESSION_ADMIN_KEY)
        if (req.body.adminKey=== process.env.SESSION_ADMIN_KEY){
            clientToken = req.cookies['x_auth']&&req.cookies['x_auth']
            const decoded = jwt.verify(clientToken, process.env.JWT_SECRET_KEY);
            console.log('DECODED >>>',decoded)
            var ipaddr = requestIp.getClientIp(req);
            if (decoded && (decoded.userno != undefined)) {
                //관리자 로그아웃 
                console.log('ADMIN LOGOUT>>')
                const logoutResult = await conn.execute(`update do_comp_user_tbl set last_logout_date=sysdate, klnet_local_token=null, klnet_auth_code=null,  
                                                        klnet_auth_date=null, klnet_access_token=null, klnet_refresh_token=null 
                                                        ,KAKAO_ACCESS_TOKEN=null,NAVER_ACCESS_TOKEN=null,FACEBOOK_ACCESS_TOKEN=null,GOOGLE_ACCESS_TOKEN=null
                                                        where user_id=:1 `,{1:decoded.userno},{outFormat:oraclePool.OBJECT});
                console.log('logoutResult>> : ' ,logoutResult)

                if (logoutResult.rowsAffected){
                    await conn.commit();
                    pgSql.setLoginHistory(decoded.userno,'O',req.useragent,ipaddr);
                    req.logout();
                    //세션변경 회원정보 세팅
                    console.log('changing Session>>')
                    const result = await   conn.execute("select * from do_comp_user_tbl where user_id = :1  ", {1:user_no}, {outFormat:oraclePool.OBJECT})
                        if (result.rows.length < 1) {              
                            console.log("[NOT FOUND USER]"); 
                            return res.json({'error':'NOT FOUND USER'});
                        } else {
                            console.log(result.rows[0])
                            const accessToken = jwt.sign({userno:result.rows[0].USER_ID}, JWT_SECRET_KEY, { expiresIn : 7200, }); //60*60 = 1h (3600)
                            const refreshToken = jwt.sign({userno:result.rows[0].USER_ID}, JWT_SECRET_KEY, { expiresIn : 172800, }); //60*60*48 = 48h
                            if(PRODUCTION === 'LOCAL') {
                                res.cookie("x_auth",accessToken,{httpOnly: true});
                                res.cookie("y_auth",refreshToken,{httpOnly: true});
                            } else {
                                res.cookie("x_auth",accessToken,{domain:'plism.com',httpOnly: true});
                                res.cookie("y_auth",refreshToken,{domain:'plism.com',httpOnly: true});
                            }
                            return res.json({'goChangeSession':true});
                        }
                }else{
                    await conn.rollback();
                    console.log("[ADMIN LOGOUT ERROR]"); 
                } 
            }
        }else{
            console.log('INCORRECT SESSION_ADMIN_KEY')
            return res.json({'error':'INCORRECT SESSION_ADMIN_KEY'});
        }
    }catch(error) {
        console.log(">>>>>error",error);
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
});

/**새로운 */
router.post('/logout',  function (req, res) {
  let clientToken;
  try {
	if(!req.body.sessionOut&&req.body.sessionOut!=='admin'){
        console.log(">>>>>>>>>LOG OUT" );
        if(req.cookies['x_auth']) {
            clientToken = req.cookies['x_auth'];
        }
        const decoded = jwt.verify(clientToken, process.env.JWT_SECRET_KEY);
  
        var ipaddr = requestIp.getClientIp(req);
        
          if (decoded && (decoded.userno != undefined)) {
              // pgSql.setUserTokenClear(decoded);
              
              oraclePool.getConnection(function (err, conn) {
                  conn.execute(`update do_comp_user_tbl set last_logout_date=sysdate, klnet_local_token=null, klnet_auth_code=null,  
                 klnet_auth_date=null, klnet_access_token=null, klnet_refresh_token=null 
                 ,KAKAO_ACCESS_TOKEN=null,NAVER_ACCESS_TOKEN=null,FACEBOOK_ACCESS_TOKEN=null,GOOGLE_ACCESS_TOKEN=null
                 where user_id=:1 `,{1:decoded.userno},{outFormat:oraclePool.OBJECT},(error, results) => {
                      if (error) {
                          console.log(error);
                      }
  
                      (async () => {
                          await conn.commit();
                          conn.close(function(er) { 
                              if (er) {
                                  console.log('Error closing connection', er);
                              } else {
                                  console.log('Connection closed');
                              }
                          });         
                      })().then(ret=> {console.log("[RETUNT]",ret);} ).catch(err => {console.log("[ERROR]",err)} )
  
                  });
              });
              
              pgSql.setLoginHistory(decoded.userno,'O',req.useragent,ipaddr);
          }
          req.logout();
        
    }  
        console.log('CLEAR COOKIES>>', req.body)
        if(PRODUCTION === 'LOCAL') {
	    	res.clearCookie('socialKey',{ path: '/'});
	    	res.clearCookie('x_auth',{ path: '/' });
            res.clearCookie('y_auth',{ path: '/' });
        } else {
	    	res.clearCookie('socialKey',{ path: '/'});
			res.clearCookie('x_auth',{ path: '/',domain:'plism.com' });
            res.clearCookie('y_auth',{ path: '/',domain:'plism.com' });
        }
      //res.clearCookie('express:sess.sig',{ path: '/' });
	  res.send(false);
  } catch (e) {
	    req.logout();
        if(PRODUCTION === 'LOCAL') {
	    	res.clearCookie('socialKey',{ path: '/'});
	        res.clearCookie('x_auth',{ path: '/' });
            res.clearCookie('y_auth',{ path: '/' });
        } else {
	    	res.clearCookie('socialKey',{ path: '/'});
			res.clearCookie('x_auth',{ path: '/',domain:'plism.com' });
            res.clearCookie('y_auth',{ path: '/',domain:'plism.com' });
        }
		//res.clearCookie('express:sess.sig',{ path: '/' });
		res.send(false);
  }
    
});
router.post('/weidongout', async (req, res) =>{
  try {

	  var userno = req.body.userno || null;
	  var ipaddr = requestIp.getClientIp(req);
	 
	  
	  if(userno) { 
          await pgSql.setUserTokenClear({'user':userno});
		  await pgSql.setLoginHistory(userno,'O',req.useragent,ipaddr);
	  }
	  res.clearCookie('x_auth',{ path: '/' });
	  req.logout();
	  res.send(false);
  } catch (e) {
	    req.logout();
		res.send(false);
  }
    
});


router.post('/changepassword', async(request,response)=>{
    console.log('>>>>>>',request.body)
    if(!request.body.user){
      return response.status(200).send({msg:'존재하지 않는 유저정보 입니다.',status:'danger'});   
    }
    const user = request.body.user;
    const currentpw = request.body.pw;
    const changepw = request.body.changepw;
    let conn;
    
    try{    
        conn = await oraclePool.getConnection();
        const result = await conn.execute(`SELECT U.USER_PWD AS USER_PW	
                                        ,(SELECT DAMO.HASH_SHA256_J(UPPER(:2)) FROM DUAL)  AS CURRENT_PW
                                        ,(SELECT DAMO.HASH_SHA256_J(UPPER(:3)) FROM DUAL)  AS CHANGE_PW 
                                        FROM MFEDI.DO_COMP_USER_TBL U WHERE 1=1 AND USER_ID= UPPER(:1)
                                        `,{1:user, 2:currentpw ,3:changepw}
                                        ,{outFormat:oraclePool.OBJECT});
        
        // console.log('result:>>>>', result,' result.rows:>>>>', result.rows[0].USER_PW)
        if (result.rows[0].USER_PW === result.rows[0].CURRENT_PW) {
            if(result.rows[0].CURRENT_PW===result.rows[0].CHANGE_PW){
                response.status(200).send({msg:'현재 비밀번호와 변경되는 비밀번호가 같습니다.',status:'error'});
            }else{
                //  기능 구현 필요  next_pwd_modify_date  부존재
                const updateResult = await conn.execute(`UPDATE MFEDI.DO_COMP_USER_TBL
                                                    SET  USER_PWD=DAMO.HASH_SHA256_J(UPPER(:2))
                                                    ,PWD_CHG_DATE = SYSDATE
                                                    WHERE USER_ID= UPPER(:1)
                                        `,{1:user, 2:changepw}
                                        ,{outFormat:oraclePool.OBJECT});
                console.log(updateResult)
                if (updateResult.rowsAffected){
                    await conn.commit();
                    response.status(200).send({msg:'비밀번호 변경이 완료되었습니다. 새로운 비밀번호로 로그인 해주세요.',status:'success'});						
                }else{
                    await conn.rollback();
                    console.log("[ERROR]",err); 
                    response.status(500).send(err);
                }
                
            }
        }else{
            response.status(200).send({msg:'현재 비밀번호가 일치하지 않습니다.',status:'error'});
        }

    }catch(err){
        console.log("[ERROR]",err); 
        response.status(500).send(err);
    }finally{
        if(conn){
            try{
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
});

router.post('/findpw', async function findpw (request, response){
	console.log("express:",request.body);
    let conn; 
    try{
        conn =  await oraclePool.getConnection();
        const result = await conn.execute(`SELECT USER_ID FROM MFEDI.DO_COMP_USER_TBL 
                                        WHERE USER_ID = UPPER(:1) AND PHONE = :2 AND UNAME_KR = :3 `
                                        ,{1:request.body.id,2:request.body.phoneNum,3:request.body.userName,}
                                        ,{outFormat:oraclePool.OBJECT});
        console.log(result.rows.length)
        if (result.rows.length > 0) {
           const updateResult = await conn.execute(
            `UPDATE MFEDI.DO_COMP_USER_TBL 
            SET USER_PWD = DAMO.HASH_SHA256_J(UPPER(:1))
                , PWD_CHG_DATE = SYSDATE
                , PWD_FAIL_CNT = 0
            WHERE USER_ID = UPPER(:2)
            AND PHONE = :3
            AND UNAME_KR = :4 `,
            {1:request.body.pw,2:request.body.id,3:request.body.phoneNum,4:request.body.userName},{outFormat:oraclePool.OBJECT}
           )
            console.log('updateResult>>',updateResult," affected>>>: " ,updateResult.rowsAffected)
            if (updateResult.rowsAffected){
                await conn.commit();							
                return response.status(200).json({code:"OK",msg:"변경이 완료 되었습니다."});
            }else{
                await conn.rollback();
                console.log("[ERROR]",err); 
                return response.status(400).json({code:"error",msg:err});
            }
        } else {   
            return response.status(200).json({code:"error",msg:"알 수 없는 사용자 입니다."});
        }
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
})
   


module.exports = router;
