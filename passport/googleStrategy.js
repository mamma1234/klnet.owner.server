const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const sUser = require('../models/sessionUser');
const {User,UserNo} = require('../models/localUser');
const pgsqlPool = require("../database/pool.js").pgsqlPool;
// console.log("sUser:",sUser);
const oraclePool = require("../database/pool.js").oraclePool;
const jwt = require('jsonwebtoken');
const requestIp = require('request-ip');

module.exports = (passport) => {

    // passport.use(new KakaoStrategy({
    //     clientID: secret_config.federation.kakao.client_id,
    //     callbackURL: '/auth/kakao/callback'
    //   },
    //   function (accessToken, refreshToken, profile, done) {
    //     var _profile = profile._json;
    
    //     loginByThirdparty({
    //       'auth_type': 'kakao',
    //       'auth_id': _profile.id,
    //       'auth_name': _profile.properties.nickname,
    //       'auth_email': _profile.id
    //     }, done);
    //   }
    // ));

    //{"web":{"client_id":"684197542136-kkba8s7e8a1l6pnqdio46vgdgkfkhsmn.apps.googleusercontent.com",
    // "project_id":"kl-net-1579596577680",
    // "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    // "token_uri":"https://oauth2.googleapis.com/token",
    // "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    // "client_secret":"zBaf8ektlPyt9i-crtmZe9__",
    // "redirect_uris":["http://localhost:5000/auth/google/callback"]}}

    passport.use(new GoogleStrategy({
        clientID: '684197542136-kkba8s7e8a1l6pnqdio46vgdgkfkhsmn.apps.googleusercontent.com', //process.env.KAKAO_ID,
        clientSecret: 'zBaf8ektlPyt9i-crtmZe9__',
        // callbackURL: '/auth/google/callback',
        callbackURL: 'https://booking.plism.com/auth/google/callback', 
        // profileFields: ['id', 'displayName', 'emails', 'birthday', 'friends', 'first_name', 'last_name', 'middle_name', 'gender', 'link'],
        passReqToCallback: true,
        proxy:true
    }, async (req, accessToken_social, refreshToken, profile, done) => {
        try {
            console.log('(googleStrategy.js) profile:', profile, 'accessToken_social:', accessToken_social, 'refreshToken:', refreshToken);
            // const exUser = await User.find({ where: { snsId: profile.id, provider: 'kakao' } });
            // console.log("google profile:",profile);
            /*
                2020.01.21 pdk ship 

                kakao id 로 DB를 검색하여 존재하면 accessToken, refreshToken 저장
                이후 서버 세션 저장 (미정, 토큰으로 클라이언트 처리할지 검토중)

                kakao id DB에 존재하지 않을 경우 회원 가입 페이지로 이동, 
                    옵션 1 신규 회원 가입 및 카카오 아이디, accessToken, refreshToken 신규 저장
                    옵션 2 기존 회원 정보 찾아 카카오 아이디 업데이트

            */
            const conn = await oraclePool.getConnection();
            console.log("google_id:",profile.id);
            //const password = accessToken

            if(!profile) {
            done(null, null, 'Missing PROFILE Required.(Missing error : GOOGLE PROFILE INFO )');
            }
            
            try{
                const result = await conn.execute( `SELECT * FROM DO_COMP_USER_TBL WHERE GOOGLE_ID = TRIM (:1) AND ROWNUM = 1`,{1: profile.id}, {outFormat:oraclePool.OBJECT});
                
                if(result.rows.length <1 ) {
                    const sUser = new User({});
                    sUser.provider = 'google';
                    sUser.providerid = profile.id; 
                    sUser.userno = '';
                    sUser.username =  profile.name.familyName+profile.name.givenName;
                    sUser.displayName = profile.displayName;
                    sUser.accessToken_social = accessToken_social;
                    sUser.email = profile.emails; 
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
                        sql = `update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate,  GOOGLE_ACCESS_TOKEN= :4, GOOGLE_LOGIN_DATE =sysdate where user_id=:5 and GOOGLE_ID =:6`
                        binds = {1:accessToken, 2:refreshToken, 4:accessToken_social, 5:result.rows[0].USER_ID , 6:profile.id}

                    }else{ 
                        console.log(ipaddr, ' >>> update with last_login_ip')
                        sql = ` update do_comp_user_tbl set klnet_access_token=:1, klnet_refresh_token=:2, last_login_date=sysdate, last_login_ip=:3, GOOGLE_ACCESS_TOKEN= :4, GOOGLE_LOGIN_DATE =sysdate where user_id=:5 and GOOGLE_ID =:6 `
                        binds = {1:accessToken, 2:refreshToken, 3:ipaddr, 4:accessToken_social, 5:result.rows[0].USER_ID , 6:profile.id}
                    }	

                    console.log('googleStrategy) sql >>> : ',sql)
                    console.log('googleStrategy) binds >>> : ',binds)
                    const result1 = await conn.execute(sql, binds, {outFormat:oraclePool.OBJECT})
                    console.log('googleStrategy update) result: ', result1);
                        if ( result1.rowsAffected) {
                            console.log("COMMIT>>")
                            await conn.commit();		
                            console.log(">>>>>>>>value set");
                            const sUser = new User({});
                            sUser.provider = 'google';
                            sUser.email = profile.emails; 
                            sUser.providerid = profile.id; 
                            sUser.userno = result.rows[0].USER_ID;
                            sUser.username = result.rows[0].UNAME_KR;
                            sUser.displayName = profile.displayName; 
                            sUser.accessToken_social = accessToken_social;
                            sUser.accessToken = accessToken;
                            sUser.refreshToken = refreshToken;
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
                
                
                
                // console.log("select : ",result.rows[0] ,' USER_ID>>>: ',result.rows[0].USER_ID)
                // if(result.rows.length>0) {
                //     console.log(">>>>>>>>value set");
                //     sUser.provider = 'google';
                //     sUser.email = profile.emails; 
                //     sUser.providerid = profile.id; 
                //     sUser.userno = result.rows[0].USER_ID;
                //     sUser.username = profile.name.familyName?profile.name.familyName+profile.name.givenName:result.rows[0].UNAME_KR;
                //     sUser.displayName = profile.displayName; 
                //     sUser.accessToken = accessToken;
                //     //sUser.refreshToken = refreshToken;
                //     //req.session.sUser = sUser;
                //     console.log(">user value:",sUser); 
                //     done(null, sUser,null); 
                // }else{
                //     sUser.provider = 'google';
                //     sUser.email = profile.emails;
                //     sUser.userno = '';
                //     sUser.providerid = profile.id;
                //     sUser.username = profile.name.familyName+profile.name.givenName;
                //     sUser.displayName = profile.displayName;      
                //     sUser.accessToken = accessToken;
                //     sUser.refreshToken = refreshToken;
                //     console.log('가입되지 않은 회원입니다.');

                //     done(null, null, sUser);
                // }
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




         /****기존 pg */
            // const userid = profile.id
            // const password = accessToken
            // const exUser = {userid, password}
        	// const sql = {
        	//         text: "SELECT * FROM OWN_COMP_USER \n"+
        	//               " where trim(google_id) = trim($1) \n"+
        	//         	  "  limit 1 ",
        	//         values: [profile.id],
        	//         //rowMode: 'array',
        	//     }

        	//     console.log(sql);
        	//     pgsqlPool.connect(function(err,conn,release) {
        	//         if(err){
        	//             console.log("err" + err);
        	//         }
        	//         conn.query(sql, function(err,result){
        	//         	release();
        	//             if(err){
        	//                 console.log(err);
        	//             }
        	//             //onsole.log(">>>",result);
        	//             //console.log("ROW CNT:",result.rowCount);
        	//             if(result.rowCount > 0) {
        	//                 sUser.provider = 'google';
        	//                 sUser.email = profile.emails; 
        	//                 sUser.id = profile.id; 
        	//                 sUser.userno = result.rows[0].user_no;
        	//                 sUser.username = profile.name.familyName?profile.name.familyName+profile.name.givenName:result.rows[0].user_name;
        	//                 sUser.displayName = profile.displayName;      
        	//                 //sUser.accessToken = accessToken;
        	//                 //sUser.refreshToken = refreshToken;
        	//                 //req.session.sUser = sUser;

    	    //                 done(null, sUser, null); 
        	//             } else {
        	//             	 sUser.provider = 'google';
        	//                  sUser.email = profile.emails;
        	//                  sUser.userno = '';
        	//                  sUser.id = profile.id;
        	//                  sUser.username = profile.name.familyName+profile.name.givenName;
        	//                  sUser.displayName = profile.displayName;      
        	//                  sUser.accessToken = accessToken;
        	//                  sUser.refreshToken = refreshToken;
        	//             	console.log('가입되지 않은 회원입니다.');
        	//                 //done(null, sUser, { message: '가입되지 않은 회원입니다.' });
        	//                 done(null, null, sUser);
        	//             }
        	//         });
        	//     });
        }
        catch(error) {
            console.error('googleStrategy error >>>>',error);
            done(error);
        }
    }));
};

