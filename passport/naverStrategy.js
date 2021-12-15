const NaverStrategy = require('passport-naver').Strategy;
// const sUser = require('../models/sessionUser');
const {User,UserNo} = require('../models/localUser');
const pgSql = require('../database/postgresql/users');
const pgsqlPool = require("../database/pool.js").pgsqlPool
// console.log("sUser:",sUser);
const jwt = require('jsonwebtoken');
const requestIp = require('request-ip');
const oraclePool = require("../database/pool.js").oraclePool;
module.exports = (passport) => {
    // Client Secret	= s94tuPZ0Go  5VoB2_ZRwUMHKM0JPuUM
    passport.use(new NaverStrategy({
        clientID: '5vSPppBEGLWEwMT8p9kZ', 
        clientSecret: 's94tuPZ0Go',
        callbackURL: 'https://booking.plism.com/auth/naver/callback',
        passReqToCallback: true,
        proxy:true
    }, async (req, accessToken_social, refreshToken, profile, done) => {
        try {
            console.log('(naverStrategy.js) profile:', profile, 'accessToken_social:', accessToken_social, 'refreshToken:', refreshToken);
            // const exUser = await User.find({ where: { snsId: profile.id, provider: 'kakao' } });
/*	            sUser.provider = 'kakao';
	            //sUser.userid = profile.id;  //1261001956
	            sUser.userno = '';
	            sUser.username = profile.username;
                sUser.displayName = profile.displayName;
                sUser.accessToken = accessToken;
                sUser.refreshToken = '';
                sUser.email = profile._json.kakao_account.email; //mamma1234@naver.com;
*/
            /*
                2020.01.21 pdk ship 

                kakao id 로 DB를 검색하여 존재하면 accessToken, refreshToken 저장
                이후 서버 세션 저장 (미정, 토큰으로 클라이언트 처리할지 검토중)

                kakao id DB에 존재하지 않을 경우 회원 가입 페이지로 이동, 
                    옵션 1 신규 회원 가입 및 카카오 아이디, accessToken, refreshToken 신규 저장
                    옵션 2 기존 회원 정보 찾아 카카오 아이디 업데이트

            */
            const conn = await oraclePool.getConnection();
            console.log("naver_id:",profile.id);
           //const password = accessToken

           if(!profile) {
			done(null, null, 'Missing PROFILE Required.(Missing error : NAVER PROFILE INFO )');
		    }
            
            try{
                const result = await conn.execute( `SELECT * FROM DO_COMP_USER_TBL WHERE NAVER_ID = TRIM (:1) AND ROWNUM = 1`,{1: profile.id}, {outFormat:oraclePool.OBJECT});
                // console.log("select : ",result.rows[0] ,' USER_ID>>>: ',result.rows[0].USER_ID)
                if(result.rows.length <1 ) {
                    const sUser = new User({});
                    sUser.provider = 'naver';
                    sUser.providerid = profile.id; 
                    sUser.userno = '';
                    sUser.username = profile.username;
                    sUser.displayName = profile.nickName;
                    sUser.accessToken_social = accessToken_social;
                    sUser.refreshToken = '';
                    sUser.email = profile.email; 
                    console.log('가입되지 않은 회원입니다.');
                    done(null, null, sUser);
				}else{
                    console.log("select : ",result.rows[0] ,' USER_ID>>>: ',result.rows[0].USER_ID)
                    const accessToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 7200, }); //60*60 = 1h (3600)
                    const refreshToken = jwt.sign({userno:result.rows[0].USER_ID}, process.env.JWT_SECRET_KEY, { expiresIn : 172800, }); //60*60*48 = 48h
                    const ipaddr = requestIp.getClientIp(req);
                    const re = /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$|::/;
                    let sql;
                    let binds;
                    if ( re.test(ipaddr)){
                        console.log(ipaddr, ' >>> not update last_login_ip')
                        sql = `update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate,  NAVER_ACCESS_TOKEN= :4, NAVER_LOGIN_DATE =sysdate where user_id=:5 and NAVER_ID =:6`
                        binds = {1:accessToken, 2:refreshToken, 4:accessToken_social, 5:result.rows[0].USER_ID , 6:profile.id}

                    }else{ 
                        console.log(ipaddr, ' >>> update with last_login_ip')
                        sql = ` update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate, last_login_ip=:3, NAVER_ACCESS_TOKEN= :4, NAVER_LOGIN_DATE =sysdate where user_id=:5 and NAVER_ID =:6 `
                        binds = {1:accessToken, 2:refreshToken, 3:ipaddr, 4:accessToken_social, 5:result.rows[0].USER_ID , 6:profile.id}
                    }	

                    console.log('naverStrategy) sql >>> : ',sql)
                    console.log('naverStrategy) binds >>> : ',binds)
                    const result1 = await conn.execute(sql, binds, {outFormat:oraclePool.OBJECT})
                  console.log('naverStrategy update) result: ', result1);
                        if ( result1.rowsAffected) {
                            console.log("COMMIT>>")
                            await conn.commit();		
                            console.log(">>>>>>>>value set");
                            const sUser = new User({});
                            sUser.provider = 'naver';
                            sUser.providerid = profile.id;
                            sUser.userno = result.rows[0].USER_ID;
                            sUser.username = result.rows[0].UNAME_KR;
                            sUser.displayName =  profile.nickName;
                            sUser.accessToken_social = accessToken_social;
                            sUser.accessToken = accessToken;
                            sUser.refreshToken = refreshToken;
                            sUser.email =profile.email; 
                            //req.session.sUser = sUser;
                            console.log(">user value:",sUser); 
                            done(null, sUser,null); 					
                        }else{
                            console.log("ROLLBACK>>")
                            await conn.rollback();
                            done('로그인 실패',null,null); 
                            // console.log("[ERROR]",err); 
                        }
                }
            }catch(error) {
				console.log(">>>>>error",error);
				// console.error(error);
			 	await conn.rollback();
				done(error);								
			}finally{
				console.log('finally conn.close>>>')
				if (conn){
					try{
						conn.close();
					}catch(err){console.log(err)}
				}	
			}
        
        
        
        
        
//         try {
//             console.log('(naverStrategy.js) profile:', profile, 'accessToken:', accessToken, 'refreshToken:', refreshToken);
            
//             process.nextTick(function () {
//                 // const exUser = await User.find({ where: { snsId: profile.id, provider: 'naver' } });

//                 //const userid = profile.id
//                 //const password = accessToken
//                // const exUser = {userid, password}
//                // console.log(exUser);


//                /* pgSql.setUserSocial('naver',userid, password, function(error, exUser) {
//                 if(error) {
//                     done(error);
//                 }
//                  console.log('DB OK');
//                  });

//                 sUser.provider = 'naver';
//                 sUser.email = profile._json.email; //mamma1234@naver.com
//                 sUser.id = profile.id;  //30625476
//                 sUser.username = profile.displayName
//                 sUser.displayName = profile.displayName       
//                 sUser.accessToken = accessToken;
//                 sUser.refreshToken = refreshToken;
//                 req.session.sUser = sUser;

//                 // @todo Remove necessary comment
//                 //console.log("profile=");
//                 //console.log(profile);
//                 // data to be saved in DB
//                 // user = {
//                 //     name: profile.displayName,
//                 //     email: profile.emails[0].value,
//                 //     username: profile.displayName,
//                 //     provider: 'naver',
//                 //     naver: profile._json
//                 // };
//                 //console.log("user=");
//                 //console.log(user);
//                 // return done(null, profile);
// */                
                
           	
             
//             	const sql = {
//             	        text: "SELECT * FROM OWN_COMP_USER  \n"+
//             	              " where trim(naver_id) = trim($1) \n"+
//             	        	  "  limit 1 ",
//             	        values: [profile._json.id],
//             	        //rowMode: 'array',
//             	    }

//             	    console.log(sql);
//             	    pgsqlPool.connect(function(err,conn,release) {
//             	        if(err){
//             	            console.log("err" + err);
//             	        }
//             	        conn.query(sql, function(err,result){
//             	        	release();
//             	            if(err){
//             	                console.log(err);
//             	            }
//             	           // console.log(">>>",result);
//             	           // console.log("ROW CNT:",result.rowCount);
//             	            if(result.rowCount > 0) {
//             	            	sUser.userno = result.rows[0].user_no;
//       	                        sUser.provider = profile.provider;
// 								sUser.email = profile._json.email; //mamma1234@naver.com
// 								sUser.providerid = profile.id;  //30625476
// 								sUser.username = profile._json.nickname;
// 								sUser.displayName = profile.displayName; 
// 								//sUser.accessToken = accessToken;
// 								//sUser.refreshToken = refreshToken;
//         	                   // req.session.sUser = sUser;
//         	                    done(null, sUser, null); 
//             	            } else {
//             	            	 sUser.provider = profile.provider;
//             	                 sUser.email = profile._json.email; //mamma1234@naver.com
//             	                 sUser.providerid = profile._json.id;  //30625476
//             	                 sUser.username = profile._json.nickname;
//             	                 sUser.displayName = profile.displayName; 
//             	                 sUser.accessToken = accessToken;
//             	                 sUser.refreshToken = refreshToken;
//             	            	console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>가입되지 않은 회원입니다.');
//             	            	//req.session.sUser = sUser;
//             	                //done(null, sUser, { message: '가입되지 않은 회원입니다.' });
//             	                done(null, null, sUser);
//             	            }
            	            
            	            
//             	        });
//             	    });

//                /* if(exUser) {
//                     return done(null, exUser);
//                 }
//                 else {
//                     console.log('가입되지 않은 회원입니다.');
//                     return done(null, false, { message: '가입되지 않은 회원입니다.' });
//                 }        */        
//             });


            /*
                2020.01.21 pdk ship 

                kakao id 로 DB를 검색하여 존재하면 accessToken, refreshToken 저장
                이후 서버 세션 저장 (미정, 토큰으로 클라이언트 처리할지 검토중)

                kakao id DB에 존재하지 않을 경우 회원 가입 페이지로 이동, 
                    옵션 1 신규 회원 가입 및 카카오 아이디, accessToken, refreshToken 신규 저장
                    옵션 2 기존 회원 정보 찾아 카카오 아이디 업데이트

            */

            // const userid = profile.id
            // const password = accessToken
            // const exUser = {userid, password}


            // sUser.provider = 'naver';
            // // sUser.email = profile._json.kakao_account.email; //mamma1234@naver.com
            // sUser.id = profile.id;  //1261001956
            // sUser.username = profile.username
            // sUser.displayName = profile.displayName       
            // sUser.accessToken = accessToken;
            // sUser.refreshToken = refreshToken;
            // req.session.sUser = sUser;


            // if(exUser) {
            //     done(null, exUser);
            // }
            // else {
            //     console.log('가입되지 않은 회원입니다.');
            //     done(null, false, { message: '가입되지 않은 회원입니다.' });
            //     // const newUser = await User.create({
            //     //     email: profile._json && profile._json.kaccount_email,
            //     //     nick: profile.displayName,
            //     //     snsId: profile.id,
            //     //     provider: 'kakao',
            //     // });
            //     // done(null, newUser);
            // }
        }
        catch(error) {
            console.error(error);
            done(error);
        }
    }));
};

