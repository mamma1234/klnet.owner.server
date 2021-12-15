//const sUser = require('../models/sessionUser');

//var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy,
	ExtractJwt = require('passport-jwt').ExtractJwt;
//const pgsqlPool = require("../database/pool.js").pgsqlPool
const pgSql = require('../database/postgresql/users');

require('dotenv').config();

var cookieExtractor = function(req) {
	var token = null;
	if(req && req.cookies) token = req.cookies['x_auth'];
	return token;
}
module.exports = (passport) => {  
	passport.use('re-jwt',new JwtStrategy({
		jwtFromRequest: cookieExtractor,
		secretOrKey : process.env.JWT_SECRET_KEY
	}, async function(jwtPayload,done) {
		 try {
			 await pgSql.getJwtSelecter(jwtPayload,function(err,user,info){
	
				 if(err) {
					 done(err,false,info);
				 } else {
					 done(null,user);
				 }
				 
			 });
			
			 
		 } catch(e) {
			 console.log(e);
		     done(e,false,{message:e});
		 }
	}));

	passport.use('jwt',new JwtStrategy({
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey : process.env.JWT_SECRET_KEY
	}, async function(jwtPayload, done) {
		console.log("jwtPayload", jwtPayload);
		 try {
			 await pgSql.getJwtSelecter(jwtPayload,function(err,user,info){
					
				 if(err) {
					 done(null,null,info);
				 } else {
					 done(null,user);
				 }
				 
			 });
		 } catch(e) {
		     console.log(e);
		     done(null,null,{message:e});
		 }
	}));
}