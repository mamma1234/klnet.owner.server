const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
const multer = require('multer');
const fs = require('fs');
// const sUser = require('../../models/sessionUser');

const selectBKList = (request, response) => {
    console.log(request.body);

    let sql="";
    //     sql += "   select m.*";
    //     sql += "  from ( select row_number() over() as num ";
    //     sql += "  , floor(((row_number() over()) -1) /10 +1) as curpage";
    //     sql += "  , count(*) over()/10+1 as tot_page";
    //     sql += "  , count(*) over() as tot_cnt";
    //     sql += "  , sb.*";
    //     sql += "  from shp_bkg sb";
    //     sql += "  where (sb.bkg_no,sb.bkg_date ,sb.user_no) in (";
    //     sql += "  select h.bkg_no ,h.bkg_date,h. user_no";
    //     sql += "  from shp_bkg_h h";
    //     sql += "  where 1=1";
    // if( request.body.toDate !== null && request.body.endDate !== null ) {
    //     sql += " and h.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and h.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    // }
    // if(request.body.mode != "" && request.body.mode != "A") {
    //     sql += " and h.history_mode='"+request.body.mode+"' ";
    // }
    //     sql += "  ) ";
    //     sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    //     sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    //     sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    //     sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    //     sql += "  ) m  ";
    //     sql += "  where curpage ='"+request.body.num+"' " ;
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbh.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbh.*";
    sql += " from shp_bkg_h sbh";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbh.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbh.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbh.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);


    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

const selectBkgCargo = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_bkg_cargo_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

const selectBkgCargoGoods = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_bkg_cargo_goods_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

const selectBkgCntr = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_bkg_cntr_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

const selectBkgCntrSpecial = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_bkg_cntr_special_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

const selectBkgCntrSpecialAttach = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_bkg_cntr_special_attach_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.bkgNo!==""?"  and bkg_no like upper('%"+request.body.bkgNo+"%')":"";
    sql += request.body.bkgDate!==""?"  and bkg_date like upper('%"+request.body.bkgDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

/*** SR History*********** */
const selectSr = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select to_char(b.insert_date,'yyyy-mm-dd hh:mi:ss') as ins_date,to_char(b.update_date,'yyyy-mm-dd hh:mi:ss') as up_date,b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += request.body.ownerNo!==""?"  and owner_no like upper('%"+request.body.ownerNo+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrBkg = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_bkg_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrCargo = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_cargo_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrCargoGoods = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_cargo_goods_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrCargoMark = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_cargo_mark_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrCntr = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_cntr_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrCntrSpecial = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_cntr_special_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}
const selectSrDeclare = (request, response) => {
    console.log(request.body);
    let sql="";
    sql += " select b.* ";
    sql += " from (select row_number() over() as rownum"; 
    sql += "     , floor(((row_number() over()) -1) /10 +1) as curpage";
    sql += "     , count(*) over()/10+1 as tot_page";
    sql += "     , count(*) over() as tot_cnt";
    sql += "     , a.*";
    sql += " from (     select";
    sql += "     to_char(sbch.history_date,'yyyy-mm-dd hh:mi:ss') as his_date";
    sql += " ,sbch.*";
    sql += " from shp_sr_declare_h sbch ";
    sql += " where 1=1  ";
    if( request.body.toDate !== null && request.body.endDate !== null ) {
        sql += " and sbch.history_date >= to_timestamp('"+request.body.fromDate+"','YYYY-MM-DD') and sbch.history_date < to_timestamp('"+request.body.toDate+"','YYYY-MM-DD')+ interval '1' DAY "
    }
    if(request.body.mode != "" && request.body.mode != "A") {
        sql += " and sbch.history_mode='"+request.body.mode+"' ";
    }
    sql += request.body.userNo!==""?"  and user_no like upper('%"+request.body.userNo+"%')":"";
    sql += request.body.srNo!==""?"  and sr_no like upper('%"+request.body.srNo+"%')":"";
    sql += request.body.srDate!==""?"  and sr_date like upper('%"+request.body.srDate+"%')":"";
    sql += " order by his_date desc";
    sql += "    )a ) b ";
    sql += "  where curpage ='"+request.body.pageNum+"' " ;

    console.log(sql);

    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
}

module.exports = {
    selectBKList
    ,selectBkgCargo
    ,selectBkgCargoGoods
    ,selectBkgCntr
    ,selectBkgCntrSpecial
    ,selectBkgCntrSpecialAttach
    ,selectSr
    ,selectSrBkg
    ,selectSrCargo
    ,selectSrCargoGoods
    ,selectSrCargoMark
    ,selectSrCntr
    ,selectSrCntrSpecial
    ,selectSrDeclare
}