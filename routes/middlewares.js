// const sUser = require('../models/sessionUser');
const {UserNo,User} = require('../models/localUser');
const jwt = require('jsonwebtoken');
const  { OAuth2 } = require('oauth');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const pgSql = require('../database/postgresql/users');
require('dotenv').config();
// const User = require('../models/localUser');


exports.isLoggedIn = (req, res, next) => { //console.log(">>>>>>",req);
   // console.log("(middlewares.js) isLoggedIn:req.isAuthenticated():".req.isAuthenticated());
	//console.log("(isLoggedIn middlewares.js)req.session.sUser:", req.session.sUser);
    if(req.isAuthenticated()) {
        console.log("로그인 완료");
        next();
    }
    else {
    //    res.redirect('/login');
        console.log("로그인 필요");
        res.status(403).send('로그인 필요');
    }
};
 
exports.isNotLoggedIn = (req, res, next) => {
    console.log("(middlewares.js) isNotLoggedIn:req.isAuthenticated():",req.isAuthenticated());
    console.log("(isNotLoggedIn middlewares.js) req.session.sUser:", req.session.sUser);
    if(!req.isAuthenticated()) {
        next();
    }
    else {
    	console.log(" no login");
        //res.redirect('/');
        next();
    }
};


exports.isLoggedPass = (req, res, next) => {
    // console.log("A.(middlewares.js) isLoggedPass:req.isAuthenticated():",req.isAuthenticated());
    console.log("(middlewares.js) isLoggedPass ");
    next();
};




exports.isVerifyToken = (req, res, next) => {
    if(!req.url.indexOf('/image')) {
        this.isLoggedPass(req,res,next);
    }else {
        console.log("0. isVerifyToken call");
        try { //console.log("req:",req);
            //console.log("req:",req.headers['authorization']);
            //console.log("req:",req.cookies['x_auth']);
            // var AUTH_HEADER = "authorization",
            // LEGACY_AUTH_SCHEME = "JWT", 
            // BEARER_AUTH_SCHEME = 'bearer';
            
            // var extractors = {};
            let authorization;
            //let refreshToken = req.cookies['plismplus.com']?req.cookies['plismplus.com']:'';
            // console.log(req)
            if(req.cookies['x_auth']) {
                authorization = req.cookies['x_auth'];
                
            //	console.log("authorization:",authorization);
            //if (req.headers['authorization']) {
            //   authorization = req.headers['authorization'];
                //console.log("authorization:",authorization);
                //const re = /(\S+)\s+(\S+)/;
                //const matches = authorization.match(re);
            // const clientToken = matches[2];
            // const decoded = jwt.verify(clientToken, JWT_SECRET_KEY);
                const decoded = jwt.verify(authorization, JWT_SECRET_KEY);
                console.log("(middlewares.js) decoded", decoded);

                
                if (decoded && (decoded.userno != undefined)) {
                    console.log("(middlewares.js) decoded.userno", decoded.userno)
                    //req.session.sUser = sUser;
                    // sUser.userno = decoded.userno; //20211005
                    req.localUser = new User({});
                    req.localUser.userno = decoded.userno;
                    // console.log('(middlewares.js_ req.localUser)localUSerUser>>> ', req.localUser)
                    
                    next();
                } else {
                    console.log("(middlewares.js) isVerifyToken unauthorized");
                    res.status(401).json({ errorcode: 401, error: 'unauthorized' });
                }
            } else {
                console.log("(middlewares.js) token not logged in");
                res.status(403).json({ errorcode: 403, error: 'no logged in' });
            }
        
        } catch (err) {
            // console.log(err);

            if(err.name === 'TokenExpiredError') {
                console.log("(middlewares.js) err isVerifyToken token expired",err);
                res.status(419).json({ errorcode: 419, error: 'token expired' });
            } else {
                console.log("(middlewares.js) err isVerifyToken unauthorized",err);
                res.status(401).json({ errorcode: 401, error: 'unauthorized' });
            }
/* 2021.06.22 pdk ship update.. delay
            if(err instanceof jwt.TokenExpiredError) {
                console.log("(middlewares.js) isVerifyToken token reissue");

                try {
            
                    let y_auth = req.cookies['y_auth'];
                    const y_auth_decoded = jwt.verify(y_auth, JWT_SECRET_KEY);
                    console.log("(auth.js) y_auth_decoded:", y_auth_decoded);
                                    
                    
                    (async () => {
                        await new OAuth2('5vSPppBEGLWEwMT8p9kZ', 's94tuPZ0Go', '', '', 'http://localhost:5002/oauth/access_token', '')
                        .getOAuthAccessToken(y_auth, {'grant_type':'refresh_token'}, (ret, access_token, refresh_token, results) => {   
                            console.log("ret:" + ret + ", access_token:" + access_token + ", refresh_token:" + refresh_token + ",results:" + results);

                            const decoded = jwt.verify(access_token, JWT_SECRET_KEY);
                                if (decoded && (decoded.userno != undefined)) {
                                    //console.log("(middlewares.js) decoded.userno", decoded.userno)
                                    sUser.userno = decoded.userno;
                                    //req.session.sUser = sUser;
                                    //req.user=decoded.userno;
                                    console.log("(middlewares.js) reissue:", access_token);
            
                                    res.cookie("x_auth",access_token,{domain:'localhost',httpOnly: true});
                                    next();
                                } else {
                                    console.log("(middlewares.js) isVerifyToken unauthorized");
                                    res.status(401).json({ errorcode: 401, error: 'unauthorized' });
                                }
                            });
                    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); }))
    


    
                } catch (err1) {
                    console.log("(middlewares.js) isVerifyToken err1:", err1);
                    res.status(419).json({ errorcode: 419, error: 'token expired' });
                }


                
            } else {
                console.log("(middlewares.js) isVerifyToken unauthorized");
                res.status(401).json({ errorcode: 401, error: 'unauthorized' });
            }
*/    
        }
    }
};
    
    