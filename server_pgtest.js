'use strict';
const express = require("express");
const { Client } = require('pg');
const connectionString = "postgresql://owner:!ghkwn_20@172.21.1.199:5432/owner";

const app = express();


const client = new Client({
    connectionString: connectionString
});
client.connect();
client.query("select  * from own_comp_user", function(err,result) {
	if (err) {
		console.log(err);
		done(null, false, { message: '존재하지 않는 아이디 입니다.' });
	}
	console.log(`result.rows:`, result.rows);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
   