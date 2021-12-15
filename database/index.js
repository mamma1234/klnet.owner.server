const pool = require('./pool.js');

module.exports.oracle = require('./oracle/template.js');
module.exports.oradb = require('./oracle/oracle.js');
module.exports.oradocs = require('./oracle/docs.js');
module.exports.oracomp = require('./oracle/comp.js');
module.exports.orausers = require('./oracle/user.js');
module.exports.oraschedule = require('./oracle/schedule.js');
module.exports.schedule = require('./postgresql/schedule.js');
module.exports.tracking = require('./oracle/tracking.js');
module.exports.pgusers = require('./postgresql/users.js');
module.exports.pgcodes = require('./postgresql/codes.js');
module.exports.postgresql = require('./postgresql/template.js');
module.exports.pgtracking = require('./postgresql/tracking.js');
module.exports.pgdemdet = require('./postgresql/demdet.js');
module.exports.pgboard = require('./postgresql/board.js');
module.exports.pgstat = require('./postgresql/stat.js');
module.exports.push = require('./postgresql/push.js');
module.exports.docs = require('./postgresql/docs.js');
module.exports.company = require('./postgresql/company.js');
module.exports.weidongsql = require('./postgresql/weidong.js');
module.exports.history = require('./postgresql/history.js');


// const oracle = {};
// oracle.user =  require('./oracle/user.js');
// module.exports.ora = oracle;