const KlnetStrategy = require('../passport-klnet/lib').Strategy;
// const sUser = require('../models/sessionUser');
const {User,UserNo} = require('../models/localUser');
const pgSql = require('../database/postgresql/users');
const pgsqlPool = require("../database/pool.js").pgsqlPool
const oraclePool = require("../database/pool.js").oraclePool

// console.log("sUser:",sUser);

module.exports = (passport) => {
    // Client Secret	= s94tuPZ0Go  5VoB2_ZRwUMHKM0JPuUM
    passport.use(new KlnetStrategy({
        clientID: '5vSPppBEGLWEwMT8p9kZ', 
        clientSecret: 's94tuPZ0Go',
        callbackURL: '/auth/klnet/callback',
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('(klnetStrategy.js) profile:', profile, ', accessToken:', accessToken, ', refreshToken:', refreshToken );
            
            process.nextTick(function () {
                // const exUser = await User.find({ where: { snsId: profile.id, provider: 'kakao' } });

                //const userid = profile.id
                //const password = accessToken
               // const exUser = {userid, password}
               // console.log(exUser);


            	//     console.log(sql);
                    oraclePool.getConnection(function (err, conn) {
                        conn.execute("select * from do_comp_user_tbl where user_id = :1", {1:profile._json.id}, {outFormat:oraclePool.OBJECT},(err, result) => {
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
                            
                                console.log('가입되지 않은 회원입니다.');
                                conn.close(function(er) { 
                                    if (er) {
                                        console.log('Error closing connection', er);
                                    } else {
                                        console.log('Connection closed');
                                    }
                                });                                    
                                done(null, sUser, { message: '가입되지 않은 회원입니다.' });
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
                                    
                                    console.log('가입되지 않은 회원입니다.');
                                    conn.close(function(er) { 
                                        if (er) {
                                            console.log('Error closing connection', er);
                                        } else {
                                            console.log('Connection closed');
                                        }
                                    });                                        
                                    done(null, sUser, { message: '가입되지 않은 회원입니다.' });
                                } else {
                                    const sUser = new User({});
                                    console.log('klnet Strategy > ',)
                                    sUser.provider = 'klnet';
                                    sUser.userid = '';  //1261001956
                                    sUser.userno = result.rows[0].USER_ID;
                                    sUser.username = result.rows[0].UNAME_KR;
                                    sUser.displayName = result.rows[0].UNAME_KR;
                                    sUser.accessToken = accessToken;
                                    sUser.refreshToken = refreshToken;
                                    sUser.email = result.rows[0].user_email; //mamma1234@naver.com;
                                    console.log('klnet Strategy > ',sUser)
                                    conn.close(function(er) { 
                                        if (er) {
                                            console.log('Error closing connection', er);
                                        } else {
                                            console.log('Connection closed');
                                        }
                                    });    
                                    done(null, sUser); 
                                }
                            }
            
                        });
                    });

     
            });


            /*
                2020.01.21 pdk ship 

                kakao id 로 DB를 검색하여 존재하면 accessToken, refreshToken 저장
                이후 서버 세션 저장 (미정, 토큰으로 클라이언트 처리할지 검토중)

                kakao id DB에 존재하지 않을 경우 회원 가입 페이지로 이동, 
                    옵션 1 신규 회원 가입 및 카카오 아이디, accessToken, refreshToken 신규 저장
                    옵션 2 기존 회원 정보 찾아 카카오 아이디 업데이트

            */

        }
        catch(error) {
            console.error(error);
            done(error);
        }
    }));
};

