const { Pool } = require('pg');
// const dotenv = require('dotenv');

// dotenv.config();

// const pool = new Pool({connectionString: process.env.POSTGRESQL_URL});
// let pool = "";
// pool.on(`connect`, () => {
//    console.log(`connected to the db`);
// });

//try {
const pool = new Pool({
    connectionString:  "postgresql://owner:!ghkwn_20@172.21.1.199:5432/owner",
    max: 20,
    min: 4,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
});


console.log("postgresql pool creating...");
//}catch(err){
//    console.error('init error: ' + err.message);
//}
  


module.exports = pool;