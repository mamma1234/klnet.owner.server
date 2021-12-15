'use strict';
const ora = require('../../database/oracle/template');
const multer = require('multer');
const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
const apiJs = require("../../apiService/openApi");
// const sUser = require('../../models/sessionUser');
const moment = require('moment');
var path = require('path');
const fs = require('fs');
const dao = require('./../../database/');
const log = require('./../../log/log');

const selectDashboard = (request, response) => {
	const bkgList = request.body.bkgList?request.body.bkgList.map(element => {return element.value;}):[];
	let paramIndex=1;
	let param = [];
	let sql = "";
	if(request.body.num) {
		sql += " select d.* from ( "
	}
	sql += " select count(*) over()/ 10 + 1 as tot_page, (row_number() over()) as num, count(*) over() total_count, floor(((row_number() over()) -1) / 10 + 1) as curpage, " 
	sql += " count(case when a.bkg_date is not null and a.bk_send_date is null and a.res_confirm_date is null and a.pick_up_time is null and a.drop_off_time is null and a.sr_no is null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as save_count_sum, "
	sql += " count(case when a.bk_send_date is not null and a.res_confirm_date is null and a.pick_up_time is null and a.drop_off_time is null and  a.sr_no is null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as send_count_sum, "
	sql += " count(case when a.res_confirm_date is not null and a.pick_up_time is null and a.drop_off_time is null and a.sr_no is null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as confirm_count_sum, "
	sql += " count(case when a.pick_up_time is not null and a.drop_off_time is null and a.sr_no is null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as pick_up_count, "
	sql += " count(case when a.drop_off_time is not null and a.sr_no is null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as drop_off_count, "
	sql += " count(case when a.sr_no is not null and a.sr_send_date is null and a.issue_date is null then 1 end) over(partition by 1) as sr_save_count_sum, "
	sql += " count(case when a.sr_send_date is not null and a.issue_date is null then 1 end) over(partition by 1) as sr_send_count_sum, "
	sql += " count(case when a.issue_date is not null then 1 end) over(partition by 1) as bl_count, "
	sql += " a.* from ( select "
	sql += " case when a.bkg_date is not null then true "
	sql += " else false end as bk_save_stats, "
	sql += " case when a.send_date is not null then true "
	sql += " else false end as bk_send_stats, "
	sql += " case when b.res_confirm_date is not null then true "
	sql += " else false end as confirm_stats, "
	sql += " case when e.pick_up_time is not null then true "
	sql += " else false end as pick_up_stats, "
	sql += " case when e.drop_off_time is not null then true "
	sql += " else false end as drop_stats, "
	sql += " case when c.send_date is null then "
	sql += " case when c.sr_no is not null then true "
	sql += " else false end "
	sql += " else false end as sr_save_stats, "
	sql += " case when c.send_date is not null then true "
	sql += " else false end as sr_stats, "
	sql += " case when d.issue_date is not null then true "
	sql += " else false end as bl_stats, "
	// sql += " count(*) over(partition by 1) as total_count, "
	// sql += " count(case when a.bkg_date is not null and a.send_date is null and b.res_confirm_date is null and e.pick_up_time is null and e.drop_off_time is null and c.send_date is null and d.issue_date is null then 1 end) over(partition by 1) as save_count_sum, "
	// sql += " count(case when a.send_date is not null and b.res_confirm_date is null and e.pick_up_time is null and e.drop_off_time is null and c.send_date is null and d.issue_date is null then 1 end) over(partition by 1) as send_count_sum, "
	// sql += " count(case when a.res_confirm_date is not null and e.pick_up_time is null and e.drop_off_time is null and c.send_date is null and d.issue_date is null then 1 end) over(partition by 1) as confirm_count_sum, "
	// sql += " count(case when e.pick_up_time is not null and e.drop_off_time is null and c.send_date is null and d.issue_date is null then 1 end) over(partition by 1) as pick_up_count, "
	// sql += " count(case when e.drop_off_time is not null and c.send_date is null and d.issue_date is null then 1 end) over(partition by 1) as drop_off_count, "
	// sql += "  count(case when c.send_date is not null and d.issue_date is null then 1 end) over(partition by 1) as sr_count_sum, "
	// sql += " count(case when d.issue_date is not null then 1 end) over(partition by 1) as bl_count, "
	sql += " a.user_no, a.status_cus, a.send_date as bk_send_date, a.status_cud, a.bkg_no, a.bkg_date, a.res_confirm_recv_date, b.res_bkg_no, b.res_confirm_date, "
	sql += " b.res_bkg_date, c.status_cus, c.send_date as sr_send_date, c.sr_no, c.sr_date, c.status_cud, d.mbl_no, d.issue_date, d.mrn, d.line_code, "
	sql += " to_char(to_timestamp(a.bkg_date, 'YYYYMMDD'), 'YYYY-MM-DD') as status1, "
	sql += " to_char(to_timestamp(a.send_date, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') as status2, "
	sql += " a.sending_count as status_cnt2, "
	sql += " to_char(to_timestamp(b.res_confirm_date, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') as status3, "
	sql += " case when a.status_cus = 'RA' then 'Confirm' when a.status_cus = 'EJ' then 'Reject' when a.status_cus = 'EC' then 'Cancel' "
	sql += " when a.status_cus = 'EA' then 'Cancel' end as status_name3, to_char(to_timestamp(c.send_date, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') as status4, "
	sql += " c.sending_count as status_cnt4, to_char(to_timestamp(d.issue_date, 'YYYYMMDD'), 'YYYY-MM-DD') as status5, "
	sql += " TO_CHAR(TO_TIMESTAMP(e.pick_up_time, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') AS pick_up_time_f, TO_CHAR(TO_TIMESTAMP(e.drop_off_time, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') AS drop_off_time_f, "
	sql += " e.pick_up_time, e.drop_off_time "
	sql += " from shp_bkg a left outer join shp_confirm b on (a.user_no = b.user_no and a.res_bkg_no = b.res_bkg_no "
	sql += " and b.res_confirm_date = a.res_confirm_date) left outer join ( select x.user_no, x.sr_no, x.sr_date, x.send_date, x.status_cus, "
	sql += " x.status_cud, x.res_mbl_no, x.res_issue_date, x.sending_count, y.res_bkg_no from shp_sr x, shp_sr_bkg y "
	sql += " where 1 = 1 "
	sql += " and x.user_no = y.user_no and x.sr_no = y.sr_no and x.sr_date = y.sr_date and x.status_cud !='D' ) c on (b.user_no = c.user_no and b.res_bkg_no = c.res_bkg_no) "
	sql += "  left outer join shp_bl d on (a.user_no = d.user_no and c.res_mbl_no = d.mbl_no and c.res_issue_date = d.issue_date) "
	sql += "  left outer join public.sf_get_inout_terminal(b.user_no,b.res_bkg_no,b.line_code) e on (b.res_bkg_no = e.res_bkg_no) "
	sql += " where 1 = 1 "

	if( bkgList.length !== 0) {
		sql += " and a.bkg_no = ANY ($"+`${paramIndex}`+") "
		paramIndex += 1;
		param.push(bkgList);
	}
	if( request.body.toDate && request.body.endDate ) {
		sql += " and a.bkg_date between to_char(to_timestamp($"+`${paramIndex}`+" ,'YYYY-MM-DD'),'YYYYMMDD') "
		paramIndex += 1;
		param.push(request.body.toDate);
		sql += " and to_char(to_timestamp($"+`${paramIndex}`+",'YYYY-MM-DD')+ interval '1' day,'YYYYMMDD') "
		paramIndex += 1;
		param.push(request.body.endDate);
	}
	if( request.body.lineCode) {
		sql += " and a.line_code = $"+`${paramIndex}`
		paramIndex += 1;
		param.push(request.body.lineCode);
	}
	if(request.body.userNo.user_no) {
		sql += " and a.user_no = $"+`${paramIndex}`
		paramIndex += 1;
		param.push(request.body.userNo.user_no);
	}else {
		sql += " and a.user_no = '' "
	}
	sql += " and a.status_cud != 'D' "
	sql += " order by a.bkg_date desc "
	sql += " ) a "
	sql += " where 1=1 "
	sql += request.body.stats.bkgSave===true?" and a.bk_save_stats= true ":" and a.bk_save_stats = false "
	sql += request.body.stats.bkgSend===true?" or a.bk_send_stats= true ":"  and a.bk_send_stats = false "
	sql += request.body.stats.bkgConfirm===true?" or a.confirm_stats= true ":" and a.confirm_stats = false "
	// if(!request.body.viewChange) {
	// 	sql += request.body.stats.mtStats===true?" or a.pick_up_stats= true ":" and a.pick_up_stats = false "
	// 	sql += request.body.stats.dropStats===true?" or a.drop_stats= true ":" and a.drop_stats = false "
	// }
	sql += request.body.stats.mtStats===true?" or a.pick_up_stats= true ":" and a.pick_up_stats = false "
	sql += request.body.stats.dropStats===true?" or a.drop_stats= true ":" and a.drop_stats = false "
	sql += request.body.stats.srSave===true?" or a.sr_save_stats= true ":" and a.sr_save_stats = false "
	sql += request.body.stats.srStats===true?" or a.sr_stats= true ":" and a.sr_stats = false "
	sql += request.body.stats.blStats===true?" or a.bl_stats= true ":" and a.bl_stats = false "

	if(request.body.num) {
		sql += " ) d where d.curpage = $"+`${paramIndex}`
		param.push(request.body.num);
	}
	
	
	console.log(sql);

	const sqlText= {
		text:sql,
		values:param
	}
	console.log(sqlText)
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sqlText);
			//console.log(res.rows[0]);
    		dao.oradb.getOraKmcs(request,response,res);
    	} catch(e) {
			console.log('e = ', e)
		}finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); console.log('start = ' , startTime , ' end ' , moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS')); response.status(400).json(err);}))
   
}
const selectGroupBkg = (request, response) => {
	let paramIndex=1;
	let param = [];
	log.info(request.body);
	try {
		let sql = "";
		sql += " select a.bkg_no as value, a.bkg_no as label  from ( "
		sql += " select a.bkg_no "
		sql += " from shp_bkg a ";
		sql += " where 1=1 ";
		
		if( request.body.toDate !== undefined && request.body.endDate !== undefined ) {
			sql += " and a.bkg_date between to_char(to_timestamp($"+`${paramIndex}` + ",'YYYY-MM-DD'),'YYYYMMDD') "
			param.push(request.body.toDate)
			paramIndex = paramIndex +1;
			sql += " and to_char(to_timestamp($"+`${paramIndex}` + ",'YYYY-MM-DD')+ interval '1' day,'YYYYMMDD') "
			param.push(request.body.endDate)
			paramIndex = paramIndex +1;
		}
		sql += " and a.user_no = $"+`${paramIndex}`
		param.push(request.body.userNo.user_no);
		sql += " and a.status_cud != 'D' "
		sql += " )a group by bkg_no "
		console.log(sql);
		;(async () => {
			const client = await pgsqlPool.connect();
			try {
				const res = await client.query({text:sql,values:param});
				//console.log(res.rows[0]);
				response.status(200).json(res.rows);
			} finally {
				client.release();
			}
		})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	}catch(e){
		log.error('weidong.js error => selectGroupBkg Error:' + e);
		console.log(e);
	}
}


const getScheduleCal = (request, response) => {
	
    
	/*    let sql  = "";
			sql += "select * from (select  vsl_name,voyage_no,to_char(to_date(start_date,'YYYYMMDD'),'YYYY-MM-DD') as start_day, \n" +
			" (select vessel_code from own_line_code_vessel_name where vessel_name = vsl_name) as sch_vessel_code, \n"+
			" start_port_code as start_port,(select '[' || port_code || '] ' || port_name from own_code_port where port_code = start_port_code) as start_port_name, \n"+
		  " to_char(to_date(end_date,'YYYYMMDD'),'YYYY-MM-DD') as end_day, end_port_code as end_port, \n" +
		  " (select '[' || port_code || '] ' || port_name from own_code_port where port_code = end_port_code) as end_port_name, \n"+
		  " vsl_name as title,to_date(start_date,'YYYYMMDD') as start,to_date(start_date,'YYYYMMDD') as end,'true' as \"allDay\", \n"+
		  " case when to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') in ('0','1') then to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Day' \n"+
		  " else to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Days' end as tt, \n"+
		  " vsl_name as sch_vessel_name,voyage_no as sch_vessel_voyage,start_port_code as sch_pol, end_port_code as sch_pod, \n"+
		  " ( select port_name from own_line_code_port a where a.line_code = 'WDFC' and a.port_code = start_port_code  limit 1) as sch_pol_name, \n"+
		  " ( select port_name from own_line_code_port a where a.line_code = 'WDFC' and a.port_code = end_port_code  limit 1) as sch_pod_name \n"+
		  " from own_vsl_sch sch where line_code='WDF' and (length(start_date) = 8 and length(end_date) = 8) \n"+
		  " and start_date >= to_char(now(),'yyyymmdd') \n";
		  if(request.body.startport) {
			  sql += " and start_port_code = '"+request.body.startport+"' \n";
		  }
		  if(request.body.endport) {
			  sql += " and end_port_code = '"+request.body.endport+"' \n";
		  }	  
	
		  sql += " and start_date between '"+request.body.eta+"' and  to_char( '"+request.body.eta+"' ::date + interval '"+request.body.week+"','yyyymmdd') \n"+
				 " group by line_Code, vsl_name, voyage_no, start_port_code, end_port_code, start_date, end_date, start_port_name, end_port_name \n"+
				 " order by start_date, vsl_name) a where 1=1";*/
		 
		// let sql  = "";
		// sql += "select vsl_name,voyage_no,to_char(to_date(start_date,'YYYYMMDD'),'YYYY-MM-DD') as start_day, \n" +
		//        " (select vessel_code from own_line_code_vessel_name where vessel_name = vsl_name) as sch_vessel_code, \n"+
		//        " start_port_code as start_port,(select '[' || port_code || '] ' || port_name from own_code_port where port_code = start_port_code) as start_port_name, \n"+
		// 	  " to_char(to_date(end_date,'YYYYMMDD'),'YYYY-MM-DD') as end_day, end_port_code as end_port, \n" +
		// 	  " (select '[' || port_code || '] ' || port_name from own_code_port where port_code = end_port_code) as end_port_name, \n"+
		// 	  " vsl_name as title,to_date(start_date,'YYYYMMDD') as start,to_date(start_date,'YYYYMMDD') as end,'true' as \"allDay\", \n"+
		// 	  " case when to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') in ('0','1') then to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Day' \n"+
		// 	  " else to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Days' end as tt, \n"+
		// 	  " vsl_name as sch_vessel_name,voyage_no as sch_vessel_voyage,start_port_code as sch_pol, end_port_code as sch_pod, \n"+
		// 	  " ( select port_name from own_line_code_port a where a.line_code = 'WDFC' and a.port_code = start_port_code  limit 1) as sch_pol_name, \n"+
		// 	  " ( select port_name from own_line_code_port a where a.line_code = 'WDFC' and a.port_code = end_port_code  limit 1) as sch_pod_name, \n"+
		// 	  " case when doc_closing_date is not null then case when length(doc_closing_date) = 8 then  \n"+
		// 	  " substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2) \n"+
		// 	  " when  length(doc_closing_date)=12 then substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2) \n"+
		// 	  " ||' '||substring(doc_closing_date,9,2)||':'||substring(doc_closing_date,11,2) else doc_closing_date end else doc_closing_date end as doc_closing_date, \n"+
		// 	  " case when cargo_closing_date is not null then case when length(cargo_closing_date) = 8 then   \n"+
		// 	  " substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2) \n"+
		// 	  " when  length(cargo_closing_date)=12 then substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2) \n"+
		// 	  " ||' '||substring(cargo_closing_date,9,2)||':'||substring(cargo_closing_date,11,2) else cargo_closing_date end else cargo_closing_date end as cargo_closing_date \n"+
		// 	  " ,call_sign as sch_call_sign,(select vsl_type from own_line_code_vessel where line_code = 'WDFC' and vessel_name = trim(vsl_name)) as vsl_type,pod_date as sch_eta \n"+
		// 	  " ,pol_date as sch_etd, pod_date as sch_eta  \n"+
		// 	  " from own_vsl_sch \n"+
		// 	  " where (vsl_name,voyage_no,start_date,start_port_code,end_date, end_port_code) in ( \n"+
		// 	  " select  vsl_name,voyage_no,start_date,start_port_code,end_date, end_port_code \n"+
		// 	  " from own_vsl_sch sch where line_code='WDF' \n";
		// 	//   " and (length(start_date) = 8 and length(end_date) = 8) and start_date >= to_char(now(),'yyyymmdd') \n";
		// if(request.body.sch_vessel_name) {
		// 	sql += " and vsl_name = '"+request.body.sch_vessel_name+"' \n";
		// }
		// if(request.body.startport) {
		// 	sql += " and start_port_code = '"+request.body.startport+"' \n";
		// }
		// if(request.body.endport) {
		// 	sql += " and end_port_code = '"+request.body.endport+"' \n";
		// }	  
	
		// sql += " and start_date between '"+request.body.eta+"' and  to_char( '"+request.body.eta+"' ::date + interval '"+request.body.week+"','yyyymmdd') \n"+
		// 	 " group by line_Code, vsl_name, voyage_no, start_port_code, end_port_code, start_date, end_date) \n"+
		// 	 " order by start_date \n";
		// if(request.body.limit_yn) {
		// 	if ("Y" === request.body.limit_yn ) {
		// 		sql += " limit 1 \n";
		// 	}
		// }
	
	
		let sql = ` select vsl_name,voyage_no,to_char(to_date(start_date,'YYYYMMDD'),'YYYY-MM-DD') as start_day,
	 (select vessel_code from own_line_code_vessel_name where vessel_name = vsl_name) as sch_vessel_code,
	 a.start_port_code as start_port,(select '[' || port_code || '] ' || port_name from own_code_port where port_code = a.start_port_code) as start_port_name,
	 to_char(to_date(end_date,'YYYYMMDD'),'YYYY-MM-DD') as end_day, a.end_port_code as end_port,
	 (select '[' || port_code || '] ' || port_name from own_code_port where port_code = a.end_port_code) as end_port_name,
	 vsl_name as title,to_date(start_date,'YYYYMMDD') as start,to_date(start_date,'YYYYMMDD') as end,'true' as "allDay",
	 case when to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') in ('0','1') then to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Day'
	 else to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Days' end as tt,
	 vsl_name as sch_vessel_name,voyage_no as sch_vessel_voyage,a.start_port_code as sch_pol, a.end_port_code as sch_pod,
	 ( select port_name from own_line_code_port c where c.line_code = 'WDFC' and c.port_code = a.start_port_code  limit 1) as sch_pol_name,
	 ( select port_name from own_line_code_port c where c.line_code = 'WDFC' and c.port_code = a.end_port_code  limit 1) as sch_pod_name,
	 case when doc_closing_date is not null then case when length(doc_closing_date) = 8 then
	 substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
	 when  length(doc_closing_date)=10 then substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
	 ||' '||substring(doc_closing_date,9,2)||':00'
	 when  length(doc_closing_date)=12 then substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
	 ||' '||substring(doc_closing_date,9,2)||':'||substring(doc_closing_date,11,2) else doc_closing_date end else doc_closing_date end as doc_closing_date,
	 case when cargo_closing_date is not null then case when length(cargo_closing_date) = 8 then
	 substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2)
	 when  length(cargo_closing_date)=12 then substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2)
	 ||' '||substring(cargo_closing_date,9,2)||':'||substring(cargo_closing_date,11,2) else cargo_closing_date end else cargo_closing_date end as cargo_closing_date
	 ,call_sign as sch_call_sign,(select vsl_type from own_line_code_vessel where line_code = 'WDFC' and vessel_name = trim(vsl_name)) as vsl_type
	 ,pod_date as sch_eta
	 ,pol_date as sch_etd, case when a.start_hour is not null then a.start_hour||':00' else '' end as start_hour,
	 case when a.end_hour is not null then a.end_hour||':00' else '' end  as end_hour, mrn,
	 case when public.sf_compute_booking_condition(coalesce((select id from own_code_cuship b where line_code = a.line_code limit 1), a.line_code), a.start_date, a.vsl_name, a.start_port_code, a.end_port_code) = '1'
	  then 'Y' else 'N' end as booking_yn,
     case when length(a.line_code) = 3
	 then (select cus.id from own_code_cuship cus where line_code = a.line_code limit 1)
	 else a.line_code end as line_code
	 from own_vsl_sch a
	 ,own_line_service_route_manage b
	 where b.line_code = 'WDFC'
	 and a.start_port_code = b.start_port_code
	 and a.end_port_code = b.end_port_code
	 and a.line_code in (
	 select line_code from own_code_cuship cus where id='WDFC'
	 union
	 select id from own_code_cuship cus where id='WDFC') `
	if(request.body.sch_vessel_name) {
		sql += " and vsl_name = '"+request.body.sch_vessel_name+"' \n";
	}
	if(request.body.startport) {
		sql += " and a.start_port_code = '"+request.body.startport+"' \n";
	}
	if(request.body.endport) {
		sql += " and a.end_port_code = '"+request.body.endport+"' \n";
	}	  

	sql += " and a.start_date between '"+request.body.eta+"' and  to_char( '"+request.body.eta+"' ::date + interval '"+request.body.week+"','yyyymmdd') \n";
	sql +=" order by start_date "
	if(request.body.limit_yn) {
		if ("Y" === request.body.limit_yn ) {
			sql += " limit 1 ";
		}
	}
	console.log(sql);
	;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			// console.log(res.rows[0]);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	
}


const getWdSchList = (request, response) => {
	
	// let sql = "select * from (select floor((count(*) over() / 11) +1) as total_page, count(*) over() as tot_cnt,floor(((row_number() over()) -1) /11 +1) as curpage, \n" +
    //               " vsl_name,voyage_no,to_char(to_date(start_date,'YYYYMMDD'),'YYYY-MM-DD') as start_day, \n"+
    //         	  " start_port_code as start_port,(select '[' || port_code || '] ' || port_name from own_code_port where port_code = start_port_code) as start_port_name, \n"+
    //         	  " to_char(to_date(end_date,'YYYYMMDD'),'YYYY-MM-DD') as end_day, end_port_code as end_port, \n" +
    //         	  " (select '[' || port_code || '] ' || port_name from own_code_port where port_code = end_port_code) as end_port_name, \n"+
    //         	  " vsl_name as title,to_date(start_date,'YYYYMMDD') as start,to_date(start_date,'YYYYMMDD') as end,'true' as \"allDay\", \n"+
    //         	  " case when to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') in ('0','1') then to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Day' \n"+
    //         	  " else to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Days' end as tt \n"+
    //         	  " from own_vsl_sch sch where line_code='WDF' \n";
	// 			//   " and (length(start_date) = 8 and length(end_date) = 8) \n"+
    //         	//   " and start_date >= to_char(now(),'yyyymmdd') \n";
	//   if(request.body.startport) {
	// 	  sql += " and start_port_code = '"+request.body.startport+"' \n";
	//   }
	//   if(request.body.endport) {
	// 	  sql += " and end_port_code = '"+request.body.endport+"' \n";
	//   }
	// 	  sql += " and start_date between '"+request.body.eta+"' and  to_char( '"+request.body.eta+"' ::date + interval '"+request.body.week+"','yyyymmdd') \n"+
    //         	  " group by line_Code, vsl_name, voyage_no, start_port_code, end_port_code, start_date, end_date, start_port_name, end_port_name \n"+
    //         	  " order by start_date, vsl_name) a where 1=1 and curpage= '"+request.body.culnum+"' \n";
	   
				  
	let sql = ` select * from (select floor((count(*) over() / 11) +1) as total_page, count(*) over() as tot_cnt,floor(((row_number() over()) -1) /11 +1) as curpage,
 vsl_name,voyage_no,to_char(to_date(start_date,'YYYYMMDD'),'YYYY-MM-DD') as start_day,
 a.start_port_code as start_port,(select '[' || port_code || '] ' || port_name from own_code_port where port_code = a.start_port_code) as start_port_name,
 to_char(to_date(end_date,'YYYYMMDD'),'YYYY-MM-DD') as end_day, a.end_port_code as end_port,
 (select '[' || port_code || '] ' || port_name from own_code_port where port_code = a.end_port_code) as end_port_name,
 vsl_name as title,to_date(start_date,'YYYYMMDD') as start,to_date(start_date,'YYYYMMDD') as end,'true' as "allDay",
 case when to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') in ('0','1') then to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Day'
 else to_date(end_date,'yyyymmdd') - to_date(start_date,'yyyymmdd') || ' Days' end as tt
 ,(select vsl_type from own_line_code_vessel where line_code = 'WDFC' and vessel_name = trim(vsl_name)) as vsl_type, pod_date as sch_eta
 ,pol_date as sch_etd, pod_date as sch_eta, a.call_sign as sch_call_sign 
 ,(select start_hour::integer||':00' from own_vsl_sch where line_code = a.line_code and vsl_name = a.vsl_name and voyage_no = a.voyage_no and start_port_code = a.start_port_code and end_port_code = a.end_port_code limit 1) as start_hour
 ,(select end_hour::integer||':00' from own_vsl_sch where line_code = a.line_code and vsl_name = a.vsl_name and voyage_no = a.voyage_no and start_port_code = a.start_port_code and end_port_code = a.end_port_code limit 1) as end_hour
 ,(select  case when doc_closing_date is not null then case when length(doc_closing_date) = 8 then
 substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
 when  length(doc_closing_date)=10 then substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
 ||' '||substring(doc_closing_date,9,2)||':00'
 when  length(doc_closing_date)=12 then substring(doc_closing_date,1,4)||'-'||substring(doc_closing_date,5,2)||'-'||substring(doc_closing_date,7,2)
 ||' '||substring(doc_closing_date,9,2)||':'||substring(doc_closing_date,11,2) else doc_closing_date end else doc_closing_date end from own_vsl_sch where line_code = a.line_code and vsl_name = a.vsl_name and voyage_no = a.voyage_no and start_port_code = a.start_port_code and end_port_code = a.end_port_code limit 1) as doc_closing_date
 ,(select  case when cargo_closing_date is not null then case when length(cargo_closing_date) = 8 then
		substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2)
		when  length(cargo_closing_date)=12 then substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2)
		||' '||substring(cargo_closing_date,9,2)||':'||substring(cargo_closing_date,11,2) 
		when  length(cargo_closing_date)=10 then substring(cargo_closing_date,1,4)||'-'||substring(cargo_closing_date,5,2)||'-'||substring(cargo_closing_date,7,2)
		||' '||substring(cargo_closing_date,9,2)||':00'
		else cargo_closing_date end else cargo_closing_date end
		from own_vsl_sch where line_code = a.line_code and vsl_name = a.vsl_name and voyage_no = a.voyage_no and start_port_code = a.start_port_code and end_port_code = a.end_port_code limit 1) as cargo_closing_date,mrn,
		case when public.sf_compute_booking_condition(coalesce((select id from own_code_cuship b where line_code = a.line_code limit 1), a.line_code ), a.start_date, a.vsl_name, a.start_port_code, a.end_port_code) = '1'
          then 'Y' else 'N' end as booking_yn	
 from own_vsl_sch a
 ,own_line_service_route_manage b
 where b.line_code = 'WDFC'
 and a.start_port_code = b.start_port_code
 and a.end_port_code = b.end_port_code
 and a.line_code in (
 select line_code from own_code_cuship cus where id='WDFC'
 union
 select id from own_code_cuship cus where id='WDFC') `
	if(request.body.startport) {
		sql += " and a.start_port_code = '"+request.body.startport+"' \n";
	}
	if(request.body.endport) {
		sql += " and a.end_port_code = '"+request.body.endport+"' \n";
	}
	sql += " and start_date between '"+request.body.eta+"' and  to_char( '"+request.body.eta+"' ::date + interval '"+request.body.week+"','yyyymmdd') \n"+
	" group by a.line_Code, vsl_name, voyage_no, a.start_port_code, a.end_port_code, start_date, end_date, a.start_port_name, a.end_port_name, pod_date ,pol_date, a.call_sign,mrn \n"+
	" order by start_date, vsl_name) a where 1=1 and curpage= '"+request.body.culnum+"' \n";
    console.log(sql);
    ;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		//console.log(res.rows[0]);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
   
}

const getShipSearch = (request, response) => {

	let sql ="";


	sql += " select * from own_line_code_vessel "
	sql += " where 1=1 "
	sql += " and use_yn = 'Y'"


	;(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
			apiJs.shipSearch(res.rows, request, response);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))



}


// Document Bookmark 조회
const selectBookingDocumentBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no 
 , document_bookmark_seq, document_bookmark_name 
 , document_bookmark_seq as value, document_bookmark_name as label
 , docu_user_name, docu_user_tel, docu_user_phone, docu_user_fax 
 , docu_user_email, docu_tax_email, insert_date, update_user, update_date 
 FROM shp_bkg_document_bookmark 
 where user_no = $1
 order by insert_date desc `,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Document Bookmark 입력
const insertBookingDocumentBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_document_bookmark
 (user_no, document_bookmark_seq, document_bookmark_name
 , docu_user_name, docu_user_tel, docu_user_phone, docu_user_fax
 , docu_user_email, docu_tax_email, insert_date, insert_user)
 VALUES( 
 $1,
 (select coalesce(max(cast (document_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_document_bookmark
 where user_no = $2),
 $3, $4, $5, $6, $7, $8,$9, now(), $10 ) `,
		values: [
			request.body.user_no,
			request.body.user_no,
			request.body.document.document_bookmark_name,
			request.body.document.docu_user_name,
			request.body.document.docu_user_tel,
			request.body.document.docu_user_phone,
			request.body.document.docu_user_fax,
			request.body.document.docu_user_email,
			request.body.document.docu_tax_email,
			request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Document Bookmark 수정
const updateBookingDocumentBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_document_bookmark 
 SET document_bookmark_name=$1, docu_user_name=$2, docu_user_tel=$3 
 , docu_user_phone=$4, docu_user_fax=$5, docu_user_email=$6 
 , docu_tax_email=$7, update_user=$8, update_date=now() 
 WHERE user_no=$9 AND document_bookmark_seq=$10 `,
		values: [
			request.body.document.document_bookmark_name,
			request.body.document.docu_user_name,
			request.body.document.docu_user_tel,
			request.body.document.docu_user_phone,
			request.body.document.docu_user_fax,
			request.body.document.docu_user_email,
			request.body.document.docu_tax_email,
			request.body.user_no,
			request.body.user_no,
			request.body.document.document_bookmark_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Document Bookmark 삭제
const deleteBookingDocumentBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_document_bookmark
 WHERE user_no=$1 AND document_bookmark_seq=$2 `,
		values: [
			request.body.document.user_no,
			request.body.document.document_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// 계약번호 Bookmark 조회
const selectBookingOtherBookmark = (request, response) => {
    const sql = {
		text: ` SELECT (row_number() over(order by insert_date desc)) as seq
 , user_no, other_bookmark_seq, other_bookmark_name
 , other_bookmark_seq as value, other_bookmark_name as label, shp_payment_type
 , sc_no, remark1, remark2, insert_date, update_user, update_date, trans_service_code
 , (select service_type from own_code_service_type b where b.service_code=a.trans_service_code) trans_service_code_name
 FROM shp_bkg_other_bookmark a
 where user_no = $1
 order by insert_date desc  `,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// 계약번호 Bookmark 입력
const insertBookingOtherBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_other_bookmark
 (user_no, other_bookmark_seq, other_bookmark_name
 , sc_no, remark1, remark2, insert_date, trans_service_code, shp_payment_type)
 VALUES($1, (select coalesce(max (cast(other_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_other_bookmark
 where user_no = $2), $3, $4, $5, $6, now(), $7, $8 ) `,
		values: [
			request.body.user_no,
			request.body.user_no,
			request.body.other.other_bookmark_name,
			request.body.other.sc_no,
			request.body.other.remark1,
			request.body.other.remark2,
			request.body.other.trans_service_code,
			request.body.other.shp_payment_type
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// 계약번호 Bookmark 수정
const updateBookingOtherBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_other_bookmark
 SET other_bookmark_name=$1, sc_no=$2, remark1=$3,
 remark2=$4, update_user=$5, update_date=now(), trans_service_code=$6, shp_payment_type=$7
 WHERE user_no=$8 AND other_bookmark_seq=$9 `,
		values: [
			request.body.other.other_bookmark_name,
			request.body.other.sc_no,
			request.body.other.remark1,
			request.body.other.remark2,
			request.body.user_no,
			request.body.other.trans_service_code,
			request.body.other.shp_payment_type,
			request.body.user_no,
			request.body.other.other_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// 계약번호 Bookmark 삭제
const deleteBookingOtherBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_other_bookmark
 WHERE user_no=$1 AND other_bookmark_seq=$2 `,
		values: [
			request.body.other.user_no,
			request.body.other.other_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// INCOTERMS 코드 조회
const selectLineCodeIncoterms = (request, response) => {
    const sql = {
		text: ` SELECT line_code, incoterms_code
 FROM own_line_code_incoterms `,
		values: []
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// Booking 조회
const selectBooking = (request, response) => {
	let data = request.body.params;
	// console.log("DATA ",data)
	let params = [];
	let query = ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date
, status_cus
,case when a.status_cus in ('S0', 'NO') then '저장' 
 when a.status_cus ='S9' then '전송'
 when a.status_cus ='S4' then '정정전송'
 when a.status_cus ='S1' then '취소전송'
 when a.status_cus ='RA' then '승인'
 when a.status_cus ='EJ' then '거절'
 when a.status_cus ='EC' then '취소승인'
 when a.status_cus ='EA' then '승인취소'
 else 'ERROR'
 end as status_cus_kr
, send_date, sc_no
, schedule_bookmark_seq
, (select schedule_bookmark_name from shp_bkg_schedule_bookmark b where a.user_no = b.user_no and b.schedule_bookmark_seq = a.schedule_bookmark_seq) as schedule_bookmark_name
, document_bookmark_seq
, (select document_bookmark_name from shp_bkg_document_bookmark b where a.user_no = b.user_no and b.document_bookmark_seq = a.document_bookmark_seq) as document_bookmark_name
, shipper_bookmark_seq
, (select shipper_bookmark_name from shp_bkg_shipper_bookmark b where a.user_no = b.user_no and b.shipper_bookmark_seq = a.shipper_bookmark_seq) as shipper_bookmark_name
, forwarder_bookmark_seq
, (select forwarder_bookmark_name from shp_bkg_forwarder_bookmark b where a.user_no = b.user_no and b.forwarder_bookmark_seq = a.forwarder_bookmark_seq) as forwarder_bookmark_name
, consignee_bookmark_seq
, (select consignee_bookmark_name from shp_bkg_consignee_bookmark b where a.user_no = b.user_no and b.consignee_bookmark_seq = a.consignee_bookmark_seq) as consignee_bookmark_name
, line_bookmark_seq
, (select line_bookmark_name from shp_bkg_line_bookmark b where a.user_no = b.user_no and b.line_bookmark_seq = a.line_bookmark_seq) as line_bookmark_name
, transport_bookmark_seq
, (select transport_bookmark_name from shp_bkg_transport_bookmark b where a.user_no = b.user_no and b.transport_bookmark_seq = a.transport_bookmark_seq) as transport_bookmark_name
, other_bookmark_seq
, (select other_bookmark_name from shp_bkg_other_bookmark b where a.user_no = b.user_no and b.other_bookmark_seq = a.other_bookmark_seq) as other_bookmark_name
, docu_user_name, docu_user_tel, docu_user_phone, docu_user_fax, docu_user_email, docu_tax_email
, sch_line_code, sch_vessel_code
, sch_vessel_name
,(select vsl_type 
 from own_line_code_vessel b
 where b.line_code = a.line_code
 and b.vessel_name = a.sch_vessel_name limit 1) vsl_type
, sch_vessel_voyage, sch_svc
, sch_start_port_code, sch_end_port_code, sch_pol, sch_pol_name, sch_pod, sch_pod_name
, sch_call_sign, sch_mrn, sch_por, sch_por_name, sch_pld, sch_pld_name, sch_etd, sch_eta, sch_fdp, sch_fdp_name
, sch_srd, sch_led, sch_dct, sch_cct, sch_sr_closing_time, sch_ts_yn, shp_name1, shp_name2
, shp_code, shp_user_name, shp_user_tel, shp_user_email
, shp_address1, shp_address2, shp_address3, shp_address4, shp_address5, shp_user_dept, shp_user_fax
, shp_payment_type
,case when shp_payment_type = 'P'
 then '선불'
 when shp_payment_type = 'C'
 then '후불'
 else ''
 end shp_payment_type_name 
, fwd_name1, fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email
, fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5, fwd_user_dept, fwd_user_fax
, cons_name1, cons_name2, cons_code, cons_user_name, cons_user_tel, cons_user_email
, cons_address1, cons_address2, cons_address3, cons_address4, cons_address5, cons_user_dept, cons_user_fax
, trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name, trans_user_tel
, trans_user_email, trans_user_fax, trans_fac_area_name, trans_fac_name, trans_remark
, res_bkg_no, sending_count, res_bkg_date
,case when length(res_confirm_date) = 8
      then to_char(to_timestamp(res_confirm_date,'YYYYMMDD'),'YYYY-MM-DD')
      when length(res_confirm_date) = 12
      then to_char(to_timestamp(res_confirm_date,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
      else res_confirm_date
 end res_confirm_date
, res_user_no, res_user_name
, res_confirm_recv_date, klnet_id, res_confirm_klnet_id, res_remark1
, line_name1, line_name2, line_code, line_user_name, line_user_tel, line_user_email
, line_address1, line_address2, line_address3, line_address4, line_address5
, line_user_dept, line_user_fax, originator, recipient, consol_bkg_yn, bl_type
, bl_cnt, incoterms_code, resend_yn, order_no, si_no
, trans_service_code
, (select service_type
 from own_line_code_service_type b
 where b.line_code = a.line_code
 and b.service_code = a.trans_service_code ) trans_service_type
, remark1, remark2, load_type, res_remark2, xml_msg_id, xmldoc_seq
,bookmark_seq
,(select bookmark_name 
 from shp_bkg_bookmark b
 where b.user_no = a.user_no
 and b.bookmark_seq = a.bookmark_seq
 limit 1) bookmark_name
 ,(select b.business_number 
 from own_line_company b 
 where a.shp_code = b.partner_code
 limit 1) as business_number
 ,(select b.business_number 
 from own_line_company b 
 where a.fwd_code = b.partner_code
 limit 1) as fwd_business_number
 ,(select b.klnet_id
	from own_line_company b 
	where a.fwd_code = b.partner_code
	limit 1) as fwd_klnet_id
 ,a.klnet_id  `;
//  console.log("bkg_date ",data.bkg_date)
	if( data.bkg_date ) {
		query += ` ,coalesce(
 case when (select count(shipper_yn) from own_line_company b 
 where b.line_code= coalesce(a.sch_line_code, a.line_code) 
 and b.klnet_id=$1 and shipper_yn='Y') > 0
 then 'Y' 
 else 'N'
 end,'N') as user_shipper_yn
,coalesce(
 case when (select count(forwarder_yn) from own_line_company b 
 where b.line_code= coalesce(a.sch_line_code, a.line_code) 
 and b.klnet_id=$1 and forwarder_yn='Y') >0
 then 'Y'
 else 'N'
 end,'N') as user_forwarder_yn
 ,status_cud
 FROM shp_bkg a
 WHERE user_no = $2 
 AND bkg_no = $3 
 AND bkg_date = $4 `
 		params = [
			request.body.klnet_id,
			data.user_no,
			data.bkg_no,
			data.bkg_date
		];
	} else {
		query += ` ,coalesce(
 case when (select count(shipper_yn) from own_line_company b 
 where b.line_code= coalesce(a.sch_line_code, a.line_code) 
 and b.klnet_id=$1 and shipper_yn='Y') > 0
 then 'Y' 
 else 'N'
 end,'N') as user_shipper_yn
,coalesce(
 case when (select count(forwarder_yn) from own_line_company b 
 where b.line_code= coalesce(a.sch_line_code, a.line_code) 
 and b.klnet_id=$1 and forwarder_yn='Y') >0
 then 'Y'
 else 'N'
 end,'N') as user_forwarder_yn
 FROM shp_bkg a
 WHERE user_no = $2 
 AND bkg_no = $3 
 order by bkg_date desc limit 1 `
		params = [
			request.body.klnet_id,
			data.user_no,
			data.bkg_no
		];
	}
    const sql = {
		text: query,
		values: params
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking Bookmark 조회
const selectBookingBookmarkOfBooking = (request, response) => {
	
    const sql = {
		text: ` SELECT user_no ,bkg_date ,bkg_no ,sc_no ,status_cus , owner_no
 ,schedule_bookmark_seq, schedule_bookmark_seq as init_schedule_bookmark_seq 
 ,document_bookmark_seq, document_bookmark_seq as init_document_bookmark_seq 
 ,shipper_bookmark_seq, shipper_bookmark_seq as init_shipper_bookmark_seq 
 ,forwarder_bookmark_seq, forwarder_bookmark_seq as init_forwarder_bookmark_seq 
 ,consignee_bookmark_seq, consignee_bookmark_seq as init_consignee_bookmark_seq 
 ,line_bookmark_seq, line_bookmark_seq as init_line_bookmark_seq 
 ,transport_bookmark_seq, transport_bookmark_seq as init_transport_bookmark_seq 
 ,other_bookmark_seq, other_bookmark_seq as init_other_bookmark_seq 
 FROM shp_bkg 
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Document 조회
const selectDocumentOfBooking = (request, response) => {
	// SELECT user_no ,bkg_date ,bkg_no ,sc_no ,status_cus
	// ,coalesce(schedule_bookmark_seq,'0') as schedule_bookmark_seq, coalesce(schedule_bookmark_seq,'0') as init_schedule_bookmark_seq
	// ,coalesce(document_bookmark_seq,'0') as document_bookmark_seq, coalesce(document_bookmark_seq,'0') as init_document_bookmark_seq
	// ,coalesce(shipper_bookmark_seq,'0') as shipper_bookmark_seq, coalesce(shipper_bookmark_seq,'0') as init_shipper_bookmark_seq
	// ,coalesce(forwarder_bookmark_seq,'0') as forwarder_bookmark_seq, coalesce(forwarder_bookmark_seq,'0') as init_forwarder_bookmark_seq
	// ,coalesce(consignee_bookmark_seq,'0') as consignee_bookmark_seq, coalesce(consignee_bookmark_seq,'0') as init_consignee_bookmark_seq
	// ,coalesce(line_bookmark_seq,'0') as line_bookmark_seq, coalesce(line_bookmark_seq,'0') as init_line_bookmark_seq
	// ,coalesce(transport_bookmark_seq,'0') as transport_bookmark_seq, coalesce(transport_bookmark_seq,'0') as init_transport_bookmark_seq
	// ,coalesce(other_bookmark_seq,'0') as other_bookmark_seq, coalesce(other_bookmark_seq,'0') as init_other_bookmark_seq
	// FROM shp_bkg
	// WHERE user_no = $1
	// AND bkg_no = $2
	// AND bkg_date = $3
	const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no 
	, document_bookmark_seq , document_bookmark_seq as init_document_bookmark_seq
	,(select document_bookmark_name 
	from shp_bkg_document_bookmark b 
	where b.user_no = a.user_no 
	and b.document_bookmark_seq = a.document_bookmark_seq) as document_bookmark_name 
	, docu_user_name, docu_user_tel, docu_user_phone 
	, docu_user_fax, docu_user_email, docu_tax_email 
	,(select document_bookmark_name from shp_bkg_document_bookmark b where a.user_no=b.user_no and b.document_bookmark_seq = a.document_bookmark_seq) document_bookmark_name
	FROM shp_bkg a 
	WHERE user_no = $1 
	AND bkg_no = $2 
	AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
	console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking 중 Document 수정
const updateDocumentOfBooking = (request, response) => {
	console.log( request.body)
    const sql = {
		text: ` UPDATE shp_bkg 
 SET document_bookmark_seq=$1 , status_cus='S0' 
 , docu_user_name=$2, docu_user_tel=$3, docu_user_phone=$4 
 , docu_user_fax=$5, docu_user_email=$6, docu_tax_email=$7 
 , update_date=now(), update_user=$8
 WHERE user_no=$9 AND bkg_no=$10 AND bkg_date=$11 `,
		values: [
			request.body.booking.document_bookmark_seq, request.body.booking.docu_user_name
			, request.body.booking.docu_user_tel, request.body.booking.docu_user_phone
			, request.body.booking.docu_user_fax, request.body.booking.docu_user_email, request.body.booking.docu_tax_email
			, request.body.booking.user_no, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking 입력
const insertBooking = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg
 (owner_no, bkg_no, bkg_date, user_no, insert_date, status_cus
,line_code, sch_line_code, status_cud
,sch_vessel_name, sch_vessel_voyage, sch_pol
, sch_pol_name, sch_pod, sch_pod_name, sch_etd, sch_eta, sch_call_sign, klnet_id)
values(
 (select own_code from own_user_owner_mapping c where c.user_no = $1 limit 1)
 ,coalesce($2, $2, (select public.sf_get_work_ids($3, 'BOOKING')) )
 ,to_char(now(),'YYYYMMDD') ,$1 ,now() ,'NO' 
 ,$4 ,$5 ,'C'
 ,$6 ,$7 ,$8
 ,(select port_name
 from own_line_code_port
 where line_code = $9
 and port_code = $10)
 ,$11
 ,(select port_name
 from own_line_code_port
 where line_code = $12
 and port_code = $13)
 ,$14
 ,$15
 ,$16
 ,$17
)
 RETURNING user_no, bkg_no, bkg_date, load_type, incoterms_code, line_code, status_cus, sch_eta, sch_etd
 ,sch_vessel_name, sch_vessel_voyage, sch_pol, sch_pol_name, sch_pod, sch_pod_name, $18 as vsl_type, klnet_id `,
		values: [
			request.body.user_no,
			request.body.newBkgNo,
			request.body.klnet_id,
			request.body.params.line_code,
			request.body.params.line_code,
			request.body.params.sch_vessel_name,
			request.body.params.sch_vessel_voyage,
			request.body.params.sch_pol,
			request.body.params.line_code,
			request.body.params.sch_pol,
			request.body.params.sch_pod,
			request.body.params.line_code,
			request.body.params.sch_pod,
			request.body.params.sch_etd,
			request.body.params.sch_eta,
			request.body.params.sch_call_sign,
			request.body.klnet_id,
			request.body.params.vsl_type,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// Booking 수정
const updateBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg
 SET update_date=now(), status_cus='S0', update_user=$1, sc_no=$2
, incoterms_code=$3, order_no=$4
, remark1=$5, remark2=$6, load_type=$7, line_code=$8, other_bookmark_seq=$9, trans_service_code=$10
 WHERE user_no=$11 AND bkg_no=$12 AND bkg_date=$13 `,
		values: [
			request.body.user_no, request.body.booking.sc_no
			, request.body.booking.incoterms_code, request.body.booking.bkg_no
			, request.body.booking.remark1, request.body.booking.remark2, request.body.booking.load_type
			, request.body.booking.line_code, request.body.booking.other_bookmark_seq, request.body.booking.trans_service_code
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking 수정
const updateOtherofBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_date=now(), status_cus='S0', update_user=$1, other_bookmark_seq=$2 
 , sc_no=$3, remark1=$4, remark2=$5 
 WHERE user_no=$6 AND bkg_no=$7 AND bkg_date=$8 `,
		values: [
			request.body.user_no , request.body.booking.other_bookmark_seq
			, request.body.booking.sc_no
			, request.body.booking.remark1, request.body.booking.remark2
			, request.body.booking.user_no, request.body.booking.bkg_no
			, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking 삭제
const deleteBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg SET status_cud='D', update_date=now(), update_user=$1
                WHERE user_no=$2 AND bkg_no=$3 AND bkg_date=$4 `,
		values: [
			request.body.user_no, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

/*
 * name: SR Shipper list 
 * gb: select
 */ 

const getUserSRQuery = (request) => {
    
	let mergeSql = "select a.*,case when a.status_cus ='S0' then '저장'  when a.status_cus ='S9' then '전송' when a.status_cus ='S4' then '정정전송' \n" +
			" when a.status_cus ='S1' then '취소전송' when a.status_cus ='FA' then '확정' when a.status_cus ='RA' then '승인' when a.status_cus ='EJ' then '거절' when a.status_cus ='EC' then '취소승인' \n" +
			" when a.status_cus ='EA' then '승인취소' else 'ERROR' end as status_cus_kr from shp_sr a where a.user_no=$1 and a.line_code='WDFC' \n";
	    if(request.body.srno){
	    	mergeSql += " and sr_no='"+request.body.srno+"'"; 
	    }
	    if(request.body.sr_date){
	    	mergeSql += " and sr_date='"+request.body.sr_date+"'"; 
	    }
	    mergeSql += "order by insert_date desc";
	
	const sql = {
		text: mergeSql,
		values: [
			request.body.userno
		]
	}
    console.log("getUserSrDocNew:",sql);
   return sql;
}

/*
 * name: SR Shipper Booking Info 
 * gb: select
 */ 

const getUserBookingInfo = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(getUserBookingSql(request));
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const getUserBookingSql = (request) => {
	
	let query = "SELECT a.res_bkg_no as value, a.trans_service_code, a.res_bkg_no as label, a.user_no,a.owner_no,a.res_bkg_no,a.sc_no,a.sch_vessel_code, a.line_code, " +
			"a.sch_vessel_name,a.sch_vessel_voyage,a.sch_pol,sch_pol_name,a.sch_pod,a.sch_pod_name,a.sch_por,a.sch_por_name,a.sch_pld," +
			"a.sch_pld_name,a.sch_srd, case when length(a.sch_etd)>7 then substr(a.sch_etd,1,8) else a.sch_etd end as sch_etd,"+
			" case when length(a.sch_eta)>7 then substr(a.sch_eta,1,8) else a.sch_eta end as sch_eta,a.sch_fdp,a.sch_fdp_name,a.shp_name1,a.shp_name2,a.shp_address1,a.shp_address2,a.shp_address3," +
			"a.shp_address4,a.shp_address5,a.shp_payment_type,a.cons_name1,a.cons_name2,a.cons_address1,a.cons_address2,a.cons_address3,a.cons_address4," +
			"a.cons_address5,a.line_name1,a.line_name2,a.line_address1,a.line_address2,a.line_address3,a.line_address4,a.line_address5, " +
			"(select vsl_type from own_line_code_vessel where line_code = a.line_code and vessel_name = trim(a.sch_vessel_name)) as vsl_type, " +
			" a.shp_payment_type,a.trans_service_code,case when (select 1 from shp_sr aa where aa.res_bkg_no = a.res_bkg_no limit 1) is not null then '작성중' else '' end as sr_status " +
			"FROM ( \n";
	     query += "select row_number () over (partition by user_no,res_bkg_no  order by res_confirm_date desc) as row_num," +
	     		" * from shp_confirm where user_no='"+request.body.user_no+"' and res_bkg_no not in (select res_bkg_no from shp_sr where sr_no in (select sr_no from shp_bl where status_cus = 'RA') and res_bkg_no is not null) )a   \n";
	    query += "where a.row_num = 1  \n";
	    if(request.body.bkg_no) {
	    	query += " and a.res_bkg_no='"+request.body.bkg_no+"' \n"
	    }
		if(request.body.lineCode) {
			query += " and a.line_code='"+request.body.lineCode+"' \n"
		}
	    query += " and a.res_bkg_no is not null order by a.res_confirm_date desc \n";
	    if(request.body.bkg_no) {
	    	 query += "limit 1";
	    }
		console.log("booking quert:",query)
	    return query;
}


/*
 * name: SR Shipper Bookmark insert 
 * gb: insert
 */ 
const setUserShpBookmark = (request, response) => {
	var sql;
	if(request.body.data.shipper_bookmark_seq) {
		sql = {
				text: ` update shp_sr_shipper_bookmark set shipper_bookmark_name=$1,shp_name1=$2,shp_name2=$3,shp_code=$4,shp_user_name=$5,
				        shp_user_tel=$6,shp_user_fax=$7,shp_user_email=$8,shp_address1=$9,shp_address2=$10,shp_address3=$11,shp_address4=$12,shp_address5=$13,shp_country_code=$14
				        where user_no =$15 and shipper_bookmark_seq =$16 
				        `,
				values: [
					request.body.data.shipper_bookmark_name, request.body.data.shp_name1, request.body.data.shp_name2, request.body.data.shp_code, request.body.data.shp_user_name, request.body.data.shp_user_tel,
					request.body.data.shp_user_fax, request.body.data.shp_user_email, request.body.data.shp_address1, request.body.data.shp_address2, request.body.data.shp_address3,request.body.data.shp_address4,request.body.data.shp_address5,
					request.body.data.shp_country_code,request.body.user_no,request.body.data.shipper_bookmark_seq
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_shipper_bookmark(user_no,shipper_bookmark_seq,shipper_bookmark_name,shp_name1,shp_name2,shp_code,shp_user_name,
				        shp_user_tel,shp_user_fax,shp_user_email,shp_address1,shp_address2,shp_address3,shp_address4,shp_address5,shp_country_code)
				        select $1,coalesce((select max(shipper_bookmark_seq::integer) from shp_sr_shipper_bookmark where user_no=$16),0)+1 as shipper_bookmark_seq,
				        $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
				        `,
				values: [
					request.body.user_no, request.body.data.shipper_bookmark_name, request.body.data.shp_name1, request.body.data.shp_name2, request.body.data.shp_code, request.body.data.shp_user_name, request.body.data.shp_user_tel,
					request.body.data.shp_user_fax, request.body.data.shp_user_email, request.body.data.shp_address1, request.body.data.shp_address2, request.body.data.shp_address3,request.body.data.shp_address4,request.body.data.shp_address5,
					request.body.data.shp_country_code,request.body.user_no
				]
			}
	}

    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err.detail); }))
}
/*
 * name: SR Shipper Bookmark delete 
 * delete
 */ 
const setUserShpBookmarkDel = (request, response) => { console.log("request.body:",request.body)
    const sql = {
		text: ` delete from shp_sr_shipper_bookmark where user_no = $1 and shipper_bookmark_seq= $2 
		        `,
		values: [
			request.body.user_no, request.body.data.shipper_bookmark_seq]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


/*
 * name: SR Cntr Bookmark delete 
 * delete
 */ 
const setUserCntrBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_container_bookmark where user_no = $1 and container_bookmark_seq= $2 
		        `,
		values: [
			request.body.user_no, request.body.data.container_bookmark_seq]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/*
 * name: SR Shipper Bookmark Detail 
 * gb: select 
 */ 

const getUserShpBookmark = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(selectShpBookmark(request.body.user_no,request.body.seq));
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const selectShpBookmark = (user, seq) => {
	
	let sql_text = "select a.shipper_bookmark_name,a.shipper_bookmark_seq,a.shp_address1,a.shp_address2,a.shp_address3,a.shp_address4,a.shp_address5," +
			"a.shp_code,a.shp_country_code,a.shp_name1,a.shp_name2,a.shp_un_code,a.shp_user_name,a.shp_user_tel,a.shipper_bookmark_seq as value,a.shipper_bookmark_name as label from shp_sr_shipper_bookmark a where a.user_no = $1 \n";
    if(seq) {
    	sql_text += "and a.shipper_bookmark_seq='"+seq+"' limit 1 \n";
    } else {
    	sql_text += "order by a.shipper_bookmark_seq";
    }
    
    
    const sql = {
		text: sql_text,
		values: [user]
	}
    console.log(sql);
   return sql;
}



/*
 * name: SR Consignee Bookmark insert 
 * gb: insert
 */ 
const setUserConsBookmark = (request, response) => {
	var sql;
	if(request.body.data.consignee_bookmark_seq) {
		sql = {
				text: ` update shp_sr_consignee_bookmark set consignee_bookmark_name=$1,cons_name1=$2,cons_name2=$3,cons_code=$4,cons_user_name=$5,
				        cons_user_tel=$6,cons_user_fax=$7,cons_user_email=$8,cons_address1=$9,cons_address2=$10,cons_address3=$11,cons_address4=$12,cons_address5=$13,cons_country_code=$16
				        where user_no=$14 and consignee_bookmark_seq=$15`,
				values: [
					request.body.data.consignee_bookmark_name, request.body.data.cons_name1, request.body.data.cons_name2, request.body.data.cons_code, request.body.data.cons_user_name, request.body.data.cons_user_tel,
					request.body.data.cons_user_fax, request.body.data.cons_user_email, request.body.data.cons_address1, request.body.data.cons_address2, request.body.data.cons_address3,request.body.data.cons_address4,
					request.body.data.cons_address5,request.body.user_no, request.body.data.consignee_bookmark_seq,request.body.data.cons_country_code
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_consignee_bookmark(user_no,consignee_bookmark_seq,consignee_bookmark_name,cons_name1,cons_name2,cons_code,cons_user_name,
				        cons_user_tel,cons_user_fax,cons_user_email,cons_address1,cons_address2,cons_address3,cons_address4,cons_address5,cons_country_code)
				        select $1,coalesce((select max(consignee_bookmark_seq::integer) from shp_sr_consignee_bookmark where user_no=$12),0)+1 as consignee_bookmark_seq,
				        $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$13,$14,$15,$16
				        `,
				values: [
					request.body.user_no, request.body.data.consignee_bookmark_name, request.body.data.cons_name1, request.body.data.cons_name2, request.body.data.cons_code, request.body.data.cons_user_name, request.body.data.cons_user_tel,
					request.body.data.cons_user_fax, request.body.data.cons_user_email, request.body.data.cons_address1, request.body.data.cons_address2, request.body.user_no,request.body.data.cons_address3,request.body.data.cons_address4,
					request.body.data.cons_address5,request.body.data.cons_country_code
				]
			}
	}

    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: SR Consignee Bookmark delete 
 * gb: delete
 */ 
const setUserConsBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_consignee_bookmark where user_no = $1 and consignee_bookmark_seq = $2 `,
		values: [request.body.user_no, request.body.data.consignee_bookmark_seq]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: SR Consignee Bookmark Detail 
 * gb: select 
 */ 

const getUserConsBookmark = (request, response) => {
	
	let sql_text = "select a.*,a.consignee_bookmark_seq as value,a.consignee_bookmark_name as label from shp_sr_consignee_bookmark a where a.user_no = $1 \n";
    if(request.body.seq) {
    	sql_text += "and a.consignee_bookmark_seq='"+request.body.seq+"' limit 1 \n";
    }
    
    const sql = {
		text: sql_text,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(selectConsBookmark(request.body.user_no,request.body.seq));
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const selectConsBookmark = (user, seq) => {
	
	let sql_text = "select a.*,a.consignee_bookmark_seq as value,a.consignee_bookmark_name as label from shp_sr_consignee_bookmark a where a.user_no = $1 \n";
    if(seq) {
    	sql_text += "and a.consignee_bookmark_seq='"+seq+"' limit 1 \n";
    }
    
    const sql = {
		text: sql_text,
		values: [user]
	}
    console.log(sql);
    return sql;
}

/*
 * name: SR Notify Bookmark insert 
 * gb: insert
 */ 
const setUserNotiBookmark = (request, response) => {
	var sql;
	if(request.body.data.notify_bookmark_seq) {
		sql = {
				text: ` update shp_sr_notify_bookmark set notify_bookmark_name=$1,noti_name1=$2,noti_name2=$3,noti_user_name=$4,
				        noti_user_tel=$5,noti_user_fax=$6,noti_user_email=$7,noti_address1=$8,noti_address2=$9,noti_address3=$10,noti_address4=$11,noti_address5=$12,noti_country_code=$15,noti_code=$16
				        where user_no=$13 and notify_bookmark_seq=$14
				        `,
				values: [
					request.body.data.notify_bookmark_name, request.body.data.noti_name1, request.body.data.noti_name2, request.body.data.noti_user_name, request.body.data.noti_user_tel,
					request.body.data.noti_user_fax, request.body.data.noti_user_email, request.body.data.noti_address1, request.body.data.noti_address2, request.body.data.noti_address3,
					request.body.data.noti_address4,request.body.data.noti_address5,request.body.user_no, request.body.data.notify_bookmark_seq,request.body.data.noti_country_code,request.body.data.noti_code
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_notify_bookmark(user_no,notify_bookmark_seq,
				        notify_bookmark_name,noti_name1,noti_name2,noti_user_name,
				        noti_user_tel,noti_user_fax,noti_user_email,noti_address1,
				        noti_address2,noti_address3,noti_address4,noti_address5,
				        noti_country_code,noti_code)
				        select $1,coalesce((select max(notify_bookmark_seq::integer) from shp_sr_notify_bookmark where user_no=$11),0)+1 as notify_bookmark_seq,
				        $2,$3,$4,$5,
				        $6,$7,$8,$9,
				        $10,$12,$13,$14,
				        $15,$16`,
				values: [
					request.body.user_no, request.body.data.notify_bookmark_name, request.body.data.noti_name1, request.body.data.noti_name2, request.body.data.noti_user_name, request.body.data.noti_user_tel,
					request.body.data.noti_user_fax, request.body.data.noti_user_email, request.body.data.noti_address1, request.body.data.noti_address2, request.body.user_no,request.body.data.noti_address3,
					request.body.data.noti_address4,request.body.data.noti_address5,request.body.data.noti_country_code,request.body.data.noti_code
				]
			}
	}

    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: SR Notify Bookmark delete 
 * gb: delete
 */ 
const setUserNotiBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_notify_bookmark where user_no =$1 and notify_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.notify_bookmark_seq ]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/*
 * name: SR Mark Bookmark delete 
 * gb: delete
 */ 
const setUserMarkBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_cargo_mark_bookmark where user_no =$1 and cargo_mark_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.cargo_mark_bookmark_seq ]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/*
 * name: SR Goods Bookmark delete 
 * gb: delete
 */ 
const setUserGoodsBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_cargo_goods_bookmark where user_no =$1 and cargo_goods_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.cargo_goods_bookmark_seq ]
	}
    const detailsql = {
    		text: ` delete from shp_sr_cargo_goods_bookmark_detail where user_no =$1 and cargo_goods_bookmark_seq = $2
    		        `,
    		values: [request.body.user_no, request.body.data.cargo_goods_bookmark_seq ]
    	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const resdetail = await client.query(detailsql);
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: SR Cargo Bookmark delete 
 * gb: delete
 */ 
const setUserCargoBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_cargo_bookmark where user_no =$1 and cargo_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.cargo_bookmark_seq ]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		
    		if(request.body.data.mark_yn === "Y") {
    			const del_mark =  await client.query(deleteCaro_mark_relation(request));
    		}
    		
    	    if(request.body.data.mark_yn === "Y"){
    	    	const del_goods =  await client.query(deleteCaro_goods_relation(request));
    	    }

    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: deleteCaro_mark_relation  
 * gb: delete
 */ 
const deleteCaro_mark_relation= (request) => {
    const sql = {
		text: ` delete from shp_sr_cargo_mark_bookmark_relation where user_no =$1 and cargo_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.cargo_bookmark_seq ]
	}
    console.log(sql);
    return sql;
}
/*
 * name: deleteCaro_mark_relation  
 * gb: delete
 */ 
const deleteCaro_goods_relation= (request) => {
    const sql = {
		text: ` delete from shp_sr_cargo_goods_bookmark_relation where user_no =$1 and cargo_bookmark_seq = $2
		        `,
		values: [request.body.user_no, request.body.data.cargo_bookmark_seq ]
	}
    console.log(sql);
    return sql;
}
/*
 * name: SR Notify Bookmark Detail 
 * gb: select 
 */ 

const getUserNotiBookmark = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(selectNotiBookmark(request.body.user_no,request.body.seq));
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const selectNotiBookmark = (user, seq) => {
	
	let sql_text = "select a.*,a.notify_bookmark_seq as value,a.notify_bookmark_name as label from shp_sr_Notify_bookmark a where a.user_no = $1 \n";
	    if(seq) {
	    	sql_text += "and a.notify_bookmark_seq='"+seq+"' limit 1 \n";
	    }
	
    const sql = {
		text: sql_text,
		values: [user]
	}
    console.log(sql);
    return sql;
}

// Schedule Bookmark 조회
const selectBookingScheduleBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no, schedule_bookmark_seq, schedule_bookmark_name
 , schedule_bookmark_seq as value, schedule_bookmark_name as label
 , sch_pol, sch_pol_name , sch_pod, sch_pod_name, sch_por, sch_por_name
 , sch_pld, sch_pld_name, sch_etd, sch_eta, sch_fdp, sch_fdp_name
 , insert_date, update_date, sch_vessel_code, sch_vessel_name
 ,(select vsl_type from own_line_code_vessel b 
 where b.line_code = 'WDFC' 
 and b.vessel_name = trim( a.sch_vessel_name)) as vsl_type
 FROM shp_bkg_schedule_bookmark a
 where user_no = $1 
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// ScheduleBookmark 입력
const insertBookingScheduleBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_schedule_bookmark 
 (user_no, schedule_bookmark_seq, schedule_bookmark_name, sch_pol, sch_pol_name 
 , sch_pod, sch_pod_name, sch_por, sch_por_name, sch_pld, sch_pld_name 
 , sch_etd, sch_eta, sch_fdp, sch_fdp_name, insert_date, insert_user, sch_vessel_code, sch_vessel_name
 , sch_line_code) 
 VALUES($1
 , (select coalesce(max(cast (schedule_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_schedule_bookmark
 where user_no = $2)
 , $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), $16, $17, $18, $19 ) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.schedule.schedule_bookmark_name
			, request.body.schedule.sch_pol, request.body.schedule.sch_pol_name 
			, request.body.schedule.sch_pod, request.body.schedule.sch_pod_name
			, request.body.schedule.sch_por, request.body.schedule.sch_por_name
			, request.body.schedule.sch_pld, request.body.schedule.sch_pld_name 
			, request.body.schedule.sch_etd?request.body.schedule.sch_etd.replace(/-/gi,''):null
			, request.body.schedule.sch_eta?request.body.schedule.sch_eta.replace(/-/gi,''):null
			, request.body.schedule.sch_fdp, request.body.schedule.sch_fdp_name, request.body.user_no
			, request.body.schedule.sch_vessel_code, request.body.schedule.sch_vessel_name
			, request.body.schedule.sch_line_code
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ScheduleBookmark 수정
const updateBookingScheduleBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_schedule_bookmark 
 SET schedule_bookmark_name=$1, sch_pol=$2, sch_pol_name=$3 
 , sch_pod=$4, sch_pod_name=$5, sch_por=$6, sch_por_name=$7 
 , sch_pld=$8, sch_pld_name=$9, sch_etd=$10, sch_eta=$11 
 , sch_fdp=$12, sch_fdp_name=$13, update_date=now(), update_user=$14 
 , sch_vessel_code=$15, sch_vessel_name=$16
 WHERE user_no=$17 AND schedule_bookmark_seq=$18 `,
		values: [
			request.body.schedule.schedule_bookmark_name
			, request.body.schedule.sch_pol, request.body.schedule.sch_pol_name 
			, request.body.schedule.sch_pod, request.body.schedule.sch_pod_name
			, request.body.schedule.sch_por, request.body.schedule.sch_por_name
			, request.body.schedule.sch_pld, request.body.schedule.sch_pld_name 
			, request.body.schedule.sch_etd?request.body.schedule.sch_etd.replace(/-/gi, ''):null
			, request.body.schedule.sch_eta?request.body.schedule.sch_eta.replace(/-/gi, ''):null
			, request.body.schedule.sch_fdp, request.body.schedule.sch_fdp_name, request.body.user_no
			, request.body.schedule.sch_vessel_code, request.body.schedule.sch_vessel_name
			, request.body.user_no, request.body.schedule.schedule_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ScheduleBookmark 삭제
const deleteBookingScheduleBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_schedule_bookmark 
 WHERE user_no=$1 AND schedule_bookmark_seq=$2 `,
		values: [
			request.body.schedule.user_no, request.body.schedule.schedule_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 스케줄 조회
const selectScheduleOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no, schedule_bookmark_seq, schedule_bookmark_seq as init_schedule_bookmark_seq 
 , sch_line_code, sch_vessel_code, sch_vessel_name, sch_vessel_voyage, sch_svc 
 , sch_start_port_code, sch_end_port_code, sch_pol, sch_pol_name, sch_pod, sch_pod_name 
 , sch_call_sign, sch_mrn, sch_por, sch_por_name, sch_pld, sch_pld_name, sch_etd, sch_eta, sch_fdp, sch_fdp_name 
 , sch_srd, sch_led, sch_dct, sch_cct, sch_sr_closing_time, sch_ts_yn 
 ,(select schedule_bookmark_name from shp_bkg_schedule_bookmark b where a.user_no=b.user_no and b.schedule_bookmark_seq = a.schedule_bookmark_seq) schedule_bookmark_name
 FROM shp_bkg a
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 스케줄 부분을 Schedule 정보로 update
const updateScheduleBookmarkOfBooking = (request, response) => {
	console.log( request.body)
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_date=now(), status_cus='S0' 
 , schedule_bookmark_seq=$1 
 , sch_pol=$2, sch_pol_name=$3, sch_pod=$4, sch_pod_name=$5 
 , sch_por=$6, sch_por_name=$7, sch_pld=$8, sch_pld_name=$9 
 , sch_etd=$10, sch_eta=$11, sch_fdp=$12, sch_fdp_name=$13, update_user=$14 
 , sch_vessel_code=$15, sch_vessel_name=$16, sch_vessel_voyage=$17, sch_call_sign=$18
 WHERE user_no=$19 AND bkg_no=$20 AND bkg_date=$21 `,
		values: [
			request.body.booking.schedule_bookmark_seq
			, request.body.booking.sch_pol, request.body.booking.sch_pol_name
			, request.body.booking.sch_pod, request.body.booking.sch_pod_name
			, request.body.booking.sch_por, request.body.booking.sch_por_name
			, request.body.booking.sch_pld, request.body.booking.sch_pld_name
			, request.body.booking.sch_etd?request.body.booking.sch_etd.replace(/-/gi, ''):null
			, request.body.booking.sch_eta?request.body.booking.sch_eta.replace(/-/gi, ''):null
			, request.body.booking.sch_fdp, request.body.booking.sch_fdp_name, request.body.user_no
			, request.body.booking.sch_vessel_code, request.body.booking.sch_vessel_name
			, request.body.booking.sch_vessel_voyage, request.body.booking.sch_call_sign
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Schedule정보 update
const updateScheduleOfBooking = (request, response) => {
	console.log( request.body)
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_date=now(), status_cus='S0' 
 , schedule_bookmark_seq=$1 
 , sch_line_code=$2, sch_vessel_code=$3, sch_vessel_name=$4, sch_vessel_voyage=$5, sch_svc=$6 
 , sch_start_port_code=$7, sch_end_port_code=$8, sch_call_sign=$9, sch_mrn=$10 
 , sch_pol=$11, sch_pol_name=$12, sch_pod=$13, sch_pod_name=$14 
 , sch_por=$15, sch_por_name=$16, sch_pld=$17, sch_pld_name=$18 
 , sch_etd=$19, sch_eta=$20, sch_fdp=$21, sch_fdp_name=$22, sch_srd=$23, sch_led=$24, sch_dct=$25 
 , sch_cct=$26, sch_sr_closing_time=$27, sch_ts_yn=$28, update_user=$29 
 WHERE user_no=$30 AND bkg_no=$31 AND bkg_date=$32 `,
		values: [
			request.body.booking.schedule_bookmark_seq
			, request.body.booking.sch_line_code, request.body.booking.sch_vessel_code
			, request.body.booking.sch_vessel_name, request.body.booking.sch_vessel_voyage
			, request.body.booking.sch_svc, request.body.booking.sch_start_port_code
			, request.body.booking.sch_end_port_code, request.body.booking.sch_call_sign
			, request.body.booking.sch_mrn
			, request.body.booking.sch_pol, request.body.booking.sch_pol_name
			, request.body.booking.sch_pod, request.body.booking.sch_pod_name
			, request.body.booking.sch_por, request.body.booking.sch_por_name
			, request.body.booking.sch_pld, request.body.booking.sch_pld_name
			, request.body.booking.sch_etd?request.body.booking.sch_etd.replace(/-/gi, ''):null
			, request.body.booking.sch_eta?request.body.booking.sch_eta.replace(/-/gi, ''):null
			, request.body.booking.sch_fdp, request.body.booking.sch_fdp_name
			, request.body.booking.sch_srd?request.body.booking.sch_srd.replace(/-/gi, ''):null
			, request.body.booking.sch_led?request.body.booking.sch_led.replace(/-/gi, ''):null
			, request.body.booking.sch_dct?request.body.booking.sch_dct.replace(/-/gi, ''):null
			, request.body.booking.sch_cct?request.body.booking.sch_cct.replace(/-/gi, ''):null
			, request.body.booking.sch_sr_closing_time?request.body.booking.sch_sr_closing_time.replace(/-/gi, ''):null
			, request.body.booking.sch_ts_yn
			, request.body.user_no, request.body.booking.user_no
			, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// 선사PORT 조회
const selectLinePort = (request, response) => {
/*
	let query = ` select line_code, port_code as value, port_code as label, port_kr_name
 , port_code, port_name
 from own_line_code_port
 where line_code = $1 `;
	if ( 'out' === request.body.params.key ) {
		query +=` and out_port_yn = 'Y' `;
	} else if ( 'in' === request.body.params.key ) {
		query +=` and in_port_yn = 'Y' `;
	}
*/

	let query = ` select line_code, port_code as value, port_code as label, port_kr_name, port_code, port_name
	from
	(
	select distinct line_code, start_port_kr_name as port_kr_name, start_port_code as port_code, start_port_name as port_name,
		'Y' as out_port_yn, 'N'as in_port_yn
	from own_line_service_route_manage
	union
	select distinct line_code, end_port_kr_name as port_kr_name, end_port_code as port_code, end_port_name as port_name, 
		'N' as out_port_yn, 'Y'as in_port_yn
	from own_line_service_route_manage 
	) x
	where line_code = $1 `;

	if ( 'out' === request.body.params.key ) {
		query +=` and out_port_yn = 'Y' `;
	} else if ( 'in' === request.body.params.key ) {
		query +=` and in_port_yn = 'Y' `;
	}

    const sql = {
		text: query,
		values: [request.body.params.line_code]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

	// 선사PORT 조회
const selectLineCodePort = (request, response) => {
	let query = ` select line_code, port_code, port_name, port_kr_name
from own_line_code_port
where line_code = $1 `;

	const sql = {
		text: query,
		values: [request.body.line_code]
	}
	console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// 선사 VSL 조회
const selectLineCodeVesselName = (request, response) => {
	let query = ` select line_code
,vessel_name as label
,vessel_name as value
,vessel_name 
,(select vsl_type 
 from own_line_code_vessel b
 where b.line_code = a.line_code
 and b.vessel_name = a.vessel_name limit 1) vsl_type
 from own_line_code_vessel_name a
 where line_code = $1 `;

    const sql = {
		text: query,
		values: [request.body.params.line_code]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Shipper Bookmark 조회
const selectBookingShipperBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
, user_no, shipper_bookmark_seq, shipper_bookmark_name 
, shipper_bookmark_seq as value, shipper_bookmark_name as label
, shp_name1, shp_name2, shp_code, shp_user_name, shp_user_tel, shp_user_email 
, shp_address1, shp_address2, shp_address3, shp_address4, shp_address5 
, shp_user_dept, shp_user_fax, shp_payment_type, insert_date, update_date 
,(select business_number from own_line_company b where a.shp_code = b.partner_code) as business_number
 FROM shp_bkg_shipper_bookmark a
 WHERE user_no = $1
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ShipperBookmark 수정
const insertBookingShipperBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_shipper_bookmark
 (user_no, shipper_bookmark_seq, shipper_bookmark_name
, shp_name1, shp_name2, shp_code, shp_user_name, shp_user_tel
, shp_user_email, shp_address1, shp_address2, shp_address3, shp_address4, shp_address5
, shp_user_dept, shp_user_fax, shp_payment_type, insert_date, insert_user)
VALUES($1
, (select coalesce(max (cast(shipper_bookmark_seq as numeric) ),0)+1
from shp_bkg_shipper_bookmark
where user_no = $2)
, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), $18) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.shipper.shipper_bookmark_name
			, request.body.shipper.shp_name1, request.body.shipper.shp_name2 
			, request.body.shipper.shp_code, request.body.shipper.shp_user_name
			, request.body.shipper.shp_user_tel, request.body.shipper.shp_user_email
			, request.body.shipper.shp_address1, request.body.shipper.shp_address2 
			, request.body.shipper.shp_address3, request.body.shipper.shp_address4, request.body.shipper.shp_address5
			, request.body.shipper.shp_user_dept, request.body.shipper.shp_user_fax
			, request.body.shipper.shp_payment_type, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// ShipperBookmark 수정
const updateBookingShipperBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE public.shp_bkg_shipper_bookmark 
 SET shipper_bookmark_name=$1, shp_name1=$2, shp_name2=$3 
 , shp_code=$4, shp_user_name=$5, shp_user_tel=$6, shp_user_email=$7 
 , shp_address1=$8, shp_address2=$9, shp_address3=$10, shp_address4=$11, shp_address5=$12 
 , shp_user_dept=$13, shp_user_fax=$14, shp_payment_type=$15 
 , update_date=now(), update_user=$16 
 WHERE user_no=$17 AND shipper_bookmark_seq=$18 `,
		values: [
			request.body.shipper.shipper_bookmark_name
			, request.body.shipper.shp_name1, request.body.shipper.shp_name2 
			, request.body.shipper.shp_code, request.body.shipper.shp_user_name
			, request.body.shipper.shp_user_tel, request.body.shipper.shp_user_email
			, request.body.shipper.shp_address1, request.body.shipper.shp_address2 
			, request.body.shipper.shp_address3, request.body.shipper.shp_address4, request.body.shipper.shp_address5
			, request.body.shipper.shp_user_dept, request.body.shipper.shp_user_fax, request.body.shipper.shp_payment_type
			, request.body.user_no, request.body.user_no, request.body.shipper.shipper_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ShipperBookmark 삭제
const deleteBookingShipperBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM public.shp_bkg_shipper_bookmark
 WHERE user_no=$1 AND shipper_bookmark_seq=$2 `,
		values: [
			request.body.shipper.user_no, request.body.shipper.shipper_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


/*
 * SR 신규 문서 채번
 * select
 */

const getUserSrDataList = (request, response) => { 
//console.log("sql:",request.body.data);
	let sqlText = "select a.*,b.cargo_seq,b.cargo_bookmark_seq,b.cargo_hs_code,b.cargo_pack_type,b.cargo_pack_qty,b.cargo_total_volume,b.cargo_total_weight, \n"+
                  " (select line_bookmark_name from shp_sr_line_bookmark where user_no = a.user_no and line_bookmark_seq = a.line_bookmark_seq) as line_bookmark_name, \n"+
                  " (select shipper_bookmark_name from shp_sr_shipper_bookmark where user_no = a.user_no and shipper_bookmark_seq = a.shipper_bookmark_seq) as shipper_bookmark_name, \n"+
                  " (select consignee_bookmark_name from shp_sr_consignee_bookmark where user_no = a.user_no and consignee_bookmark_seq = a.consignee_bookmark_seq) as consignee_bookmark_name, \n"+
                  " (select notify_bookmark_name from shp_sr_notify_bookmark where user_no = a.user_no and notify_bookmark_seq = a.notify_bookmark_seq) as notify_bookmark_name, \n"+
                  " (select cargo_bookmark_name from shp_sr_cargo_bookmark where user_no = a.user_no and cargo_bookmark_seq = b.cargo_bookmark_seq) as cargo_bookmark_name, \n"+
                  " (select other_bookmark_name from shp_sr_other_bookmark where user_no = a.user_no and other_bookmark_seq = a.other_bookmark_seq) as other_bookmark_name, \n"+
                  " (select schedule_bookmark_name from shp_sr_schedule_bookmark where user_no = a.user_no and schedule_bookmark_seq = a.schedule_bookmark_seq) as schedule_bookmark_name, \n"+
				  " (select shipper_bookmark_name from shp_sr_shipper_bookmark where user_no = a.user_no and shipper_bookmark_seq = a.c_shipper_bookmark_seq) as c_shipper_bookmark_name, \n"+
                  " (select consignee_bookmark_name from shp_sr_consignee_bookmark where user_no = a.user_no and consignee_bookmark_seq = a.c_consignee_bookmark_seq) as c_consignee_bookmark_name, \n"+
                  " (select notify_bookmark_name from shp_sr_notify_bookmark where user_no = a.user_no and notify_bookmark_seq = a.c_notify_bookmark_seq) as c_notify_bookmark_name, \n"+
                  " (select bookmark_name from shp_sr_bookmark where user_no = a.user_no and bookmark_seq = a.bookmark_seq) as bookmark_name, \n"+
                  " case when a.status_cus ='S0' then '저장'  when a.status_cus ='S9' then '전송' when a.status_cus ='S4' then '정정전송' \n" +
			      " when a.status_cus ='S1' then '취소전송' when a.status_cus ='RA' then '승인' when a.status_cus ='EJ' then '거절' when a.status_cus ='EC' then '취소승인' \n" +
			      " when a.status_cus ='EA' then '승인취소' else 'ERROR' end as status_cus_kr, \n"+
			      " (select vsl_type from own_line_code_vessel where line_code = 'WDFC' and vessel_name = trim(a.sch_vessel_name)) as vsl_type \n"+
                  " from shp_sr a \n"+
                  " left outer join shp_sr_cargo b \n"+
                  " on (a.user_no = b.user_no and a.sr_no = b.sr_no) \n"+
                  " where a.user_no = $1 \n";
	              if(request.body.data) {
	            	  if(request.body.data.sr_no) {
	                	  sqlText += " and a.sr_no = '"+request.body.data.sr_no+"' \n";
	                  } 
	            	  if(request.body.data.sr_date) {
	                	  sqlText += " and a.sr_date = '"+request.body.data.sr_date+"' \n";
	                  }
	            	  if(request.body.list ==='Y' && request.body.data.from && request.body.data.to) {
	                	  sqlText += " and a.sr_date between '"+request.body.data.from+"' and '"+request.body.data.to+"' \n";
	                  }

	                  if(request.body.list ==='Y' && (request.body.data.status_cus && request.body.data.status_cus != "AA") ) {
	                	  sqlText += " and a.status_cus='"+request.body.data.status_cus+"' \n";
	                  }
	              } else {
	            	  if(request.body.list !='Y') {
	            		  sqlText += " and a.status_cus='S0' \n";
	            	  }
	              }
                  
                  if(request.body.list !='Y') {
                	  
                	  sqlText += " order by a.insert_date desc limit 1 \n";
                  } else {
                	  sqlText += " and a.status_cus != 'NO' order by a.insert_date desc \n";
                  }
	const sql = {
				text: sqlText,
				values: [request.body.user_no]
    }

    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);

            if(request.body.list === "Y") {
        		response.status(200).json(res.rows);
        	} else {
        			if( (request.body.link === 'N' && res.rows.length > 0) || ( request.body.link === 'Y' && request.body.data.sr_no && res.rows.length > 0) ) {

            			let data = res.rows[0];
            			let bkg;
            			let mark;
            			let goods;
            			let cntr;
            			let declare;
            			bkg = await client.query(getUserBkgData(data));
        	        	mark = await client.query(getUserMarkData(data));
        	        	goods = await client.query(getUserGoodsData(data));
            			cntr = await client.query(getUserCntrListData(data));
            			declare = await client.query(getUserDeclareListData(data));
                		const mergeData = Object.assign(res.rows[0],{'res_bkg_no':bkg.rows[0]?bkg.rows[0].value:'',bkglist:bkg.rows,'mark_desc':mark.rows[0].mark,'goods_desc':goods.rows[0].goods,'cntrlist':cntr.rows,'declarelist':declare.rows});
                		//console.log("data:",mergeData);
                		response.status(200).json(mergeData); 
            		} else { 	
            			const mergeData = Object.assign(res.rows,{'bkglist':[],'mark_desc':'','goods_desc':'','cntrlist':[],'declarelist':[]});
            			response.status(200).json(mergeData);
            		} 	

        			
        	}
    		
    		

    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const getUserDeclareListData = (data) => {
    const sql = {
    		text: `select a.*,(select real_file_name from own_file_upload where file_seq = a.declare_file_seq) as declare_file_name 
    		from shp_sr_declare a where a.user_no=$1 and a.sr_no=$2 and a.sr_date=$3`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}
        console.log(sql);
        return sql;
}

const getUserCntrListData = (data) => {
    const sql = {
    		text: `select * from shp_sr_cntr where user_no=$1 and sr_no=$2 and sr_date=$3`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}
        console.log(sql);
        return sql;
}

const getUserBkgData = (data) => {
    const sql = {
    		text: `select res_bkg_no as value,res_bkg_no as label  from shp_sr_bkg where user_no=$1 and sr_no=$2 and sr_date=$3`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}
        console.log(sql);
        return sql;
}

const getUserMarkData = (data) => {
/*    const sql = {
    		text: `select * from shp_sr_cargo_mark where user_no=$1 and sr_no=$2 and sr_date=$3`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}*/
    const sql = {
    		text: `select array_to_string(array_agg(mark),'') as mark from (
				select 	case when mark_desc1 is not null  then mark_desc1||case when mark_desc2 is not null then '\n' else '' end
					when mark_desc1 is null then '' else '\n' end||
							   case when mark_desc2 is not null then mark_desc2||case when mark_desc3 is not null then '\n' else '' end
									when mark_desc2 is null then '' else '\n' end||
							   case when mark_desc3 is not null then mark_desc3||case when mark_desc4 is not null then '\n' else '' end 
									when mark_desc3 is null then '' else '\n' end||
							   case when mark_desc4 is not null then mark_desc4||case when mark_desc5 is not null then '\n' else '' end
									when mark_desc4 is null then '' else '\n' end||
								case when mark_desc5 is not null then mark_desc5||case when mark_desc6 is not null then '\n' else '' end
									when mark_desc5 is null then '' else '\n' end||
								case when mark_desc6 is not null then mark_desc6||case when mark_desc7 is not null then '\n' else '' end
									when mark_desc6 is null then '' else '\n' end||
								case when mark_desc7 is not null then mark_desc7||case when mark_desc8 is not null then '\n' else '' end
									when mark_desc7 is null then '' else '\n' end||
								case when mark_desc8 is not null then mark_desc8||case when mark_desc9 is not null then '\n' else '' end
									when mark_desc8 is null then '' else '\n' end||
								case when mark_desc9 is not null then mark_desc9||case when mark_desc10 is not null then '\n' else '' end
									when mark_desc9 is null then '' else '\n' end||
							   case when mark_desc10 is not null then mark_desc10||'\n' 
									when mark_desc10 is null then '' else '\n' end  as mark 
					from shp_sr_cargo_mark a where user_no=$1
					and sr_no=$2  and sr_date = $3
					order by mark_seq::integer) a`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}
        console.log(sql);
        return sql;
}

const getUserGoodsData = (data) => {
    const sql = {
    		//text: `select * from shp_sr_cargo_goods where user_no=$1 and sr_no=$2 and sr_date=$3 order by goods_seq::integer`,
    		text: `select array_to_string(array_agg(goods),'') as goods from (
						select 	case when goods_desc1 is not null  then goods_desc1||case when goods_desc2 is not null then '\n' else '' end
							when goods_desc1 is null then '' else '\n' end||
									   case when goods_desc2 is not null then goods_desc2||case when goods_desc3 is not null then '\n' else '' end
											when goods_desc2 is null then '' else '\n' end||
									   case when goods_desc3 is not null then goods_desc3||case when goods_desc4 is not null then '\n' else '' end 
											when goods_desc3 is null then '' else '\n' end||
									   case when goods_desc4 is not null then goods_desc4||case when goods_desc5 is not null then '\n' else '' end
											when goods_desc4 is null then '' else '\n' end||
									   case when goods_desc5 is not null then goods_desc5||'\n' 
											when goods_desc5 is null then '' else '\n' end  as goods
					from shp_sr_cargo_goods a where user_no=$1
					and sr_no=$2  and sr_date = $3
					order by goods_seq::integer) a`,
    		values: [data.user_no,data.sr_no,data.sr_date]
    		
    	}
        console.log(sql);
        return sql;
}
/*
 * getLinePortCode
 * port Code
 * select
 */

const getLinePortCode = (request, response) => {
/*	
	let query = "SELECT port_code  as value,port_name,port_code as label  from own_line_code_port where line_code=$1 ";
	if(request.body.inyn) {
		query +=" and in_port_yn='"+request.body.inyn+"'";
	}
	if(request.body.outyn) {
		query +=" and out_port_yn='"+request.body.outyn+"'";
	}
	if(request.body.code) {
		query +=" and port_code='"+request.body.code+"' limit 1";
	}
*/

	let query = ` select port_code as value, port_name, port_name||'['||port_code||']' as label  
	from
	(
	select distinct line_code, start_port_kr_name as port_kr_name, start_port_code as port_code, start_port_name as port_name,
		'Y' as out_port_yn, 'N'as in_port_yn
	from own_line_service_route_manage
	union
	select distinct line_code, end_port_kr_name as port_kr_name, end_port_code as port_code, end_port_name as port_name, 
		'N' as out_port_yn, 'Y'as in_port_yn
	from own_line_service_route_manage 
	) x
	where line_code = $1 `;
	if(request.body.inyn) {
		query +=" and in_port_yn='"+request.body.inyn+"'";
	}
	if(request.body.outyn) {
		query +=" and out_port_yn='"+request.body.outyn+"'";
	}
	if(request.body.code) {
		query +=" and port_code='"+request.body.code+"' limit 1";
	}	

    const sql = {
		text: query,
		values: [request.body.line]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


/*
 * getUserMarkBookmark
 * Cargo mark bookmark 조회
 * select 
 * 
 */
const getUserMarkBookmark = (request, response) => {
	
	let sqltext = "SELECT a.cargo_mark_bookmark_seq  as value,a.cargo_mark_bookmark_name as label, "+
		          "(select array_to_string(array_agg(mark),'\n') as mark from ( "+
				  "select  Rtrim(case when mark_desc1 is not null then mark_desc1||'\n' else '' end|| "+
				  " case when mark_desc2 is not null then mark_desc2||'\n' else '' end|| "+
				  " case when mark_desc3 is not null then mark_desc3||'\n' else '' end|| "+
				  " case when mark_desc4 is not null then mark_desc4||'\n' else '' end|| "+
				  " case when mark_desc5 is not null then mark_desc5||'\n' else '' end|| "+
				  " case when mark_desc6 is not null then mark_desc6||'\n' else '' end|| "+
				  " case when mark_desc7 is not null then mark_desc7||'\n' else '' end|| "+
				  " case when mark_desc8 is not null then mark_desc8||'\n' else '' end|| "+
				  " case when mark_desc9 is not null then mark_desc9||'\n' else '' end|| "+
				  " case when mark_desc10 is not null then mark_desc10||'\n' else '' end,'\n' ) as mark "+
				" from shp_sr_cargo_mark_bookmark_detail where user_no= a.user_no and cargo_mark_bookmark_seq = a.cargo_mark_bookmark_seq "+
				" order by cargo_mark_bookmark_seq::integer "+
				" ) a) as mark_desc, a.* from shp_sr_cargo_mark_bookmark a WHERE a.user_no = $1";
	if(request.body.seq) {
		sqltext += " and a.cargo_mark_bookmark_seq = '"+request.body.seq+"'";
	}
	sqltext += " order by a.cargo_mark_bookmark_seq::integer";
	
    const sql = {
		text: sqltext,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
/*const getUserMarkBookmark = (request, response) => {   console.log(">>>>");
	
	let sqltext = "SELECT a.cargo_mark_bookmark_seq as value,a.cargo_mark_bookmark_name as label,* from shp_sr_cargo_mark_bookmark a WHERE a.user_no = $1";
	if(request.body.seq) {
		sqltext += " and a.cargo_mark_bookmark_seq = '"+request.body.seq+"'";
	}
	sqltext += " order by a.cargo_mark_bookmark_seq::integer  ";
	
    const sql = {
		text: sqltext,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}*/

/*
 * getUserDesBookmark
 * Cargo Description bookmark 조회
 * select 
 * 
 */
const getUserDesBookmark = (request, response) => {
	
	let sqltext = "SELECT a.cargo_goods_bookmark_seq  as value,a.cargo_goods_bookmark_name as label, "+
		          "(select array_to_string(array_agg(goods),'\n') as goods from ( "+
				  "select  Rtrim(case when goods_desc1 is not null then goods_desc1||'\n' else '' end|| "+
				  " case when goods_desc2 is not null then goods_desc2||'\n' else '' end|| "+
				  " case when goods_desc3 is not null then goods_desc3||'\n' else '' end|| "+
				  " case when goods_desc4 is not null then goods_desc4||'\n' else '' end|| "+
				  " case when goods_desc5 is not null then goods_desc5||'\n' else '' end,'\n' ) as goods "+
				" from shp_sr_cargo_goods_bookmark_detail where user_no= a.user_no and cargo_goods_bookmark_seq = a.cargo_goods_bookmark_seq "+
				" order by cargo_goods_bookmark_seq::integer "+
				" ) a) as goods_desc, a.* from shp_sr_cargo_goods_bookmark a WHERE a.user_no = $1";
	if(request.body.seq) {
		sqltext += " and a.cargo_goods_bookmark_seq = '"+request.body.seq+"'";
	}
	sqltext += " order by a.cargo_goods_bookmark_seq::integer";
	
    const sql = {
		text: sqltext,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

/*
 * getUserCargoBookmark
 * Cargo bookmark 조회
 * select 
 * 
 */
const getUserCargoBookmark = (request, response) => {
	
	let sqltext = "SELECT a.*, case when (select 1 from shp_sr_cargo_mark_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1 ) is not null then 'Y' " +
			" else 'N' end as mark_yn, case when (select 1 from shp_sr_cargo_goods_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1) is not null then 'Y'" +
			" else 'N' end as goods_yn,a.cargo_bookmark_seq as value, a.cargo_bookmark_name as label from shp_sr_cargo_bookmark a WHERE a.user_no = $1";
	if(request.body.seq) {
		sqltext += " and a.cargo_bookmark_seq = '"+request.body.seq+"'";
	}
	sqltext += " order by a.cargo_bookmark_seq::integer";
	
    const sql = {
		text: sqltext,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(selectCargoBookmark(request.body.user_no,request.body.seq));
    		if(request.body.seq) {
        		const mark = await client.query(getUserMarkRelation(request,request.body.seq));
        		const goods = await client.query(getUserGoodsRelation(request,request.body.seq));
        		
        		
        		//const mergeData = Object.assign({'mark.rows,goods.rows);
        		const mergeData = Object.assign(res.rows[0],goods.rows[0],mark.rows[0]);
        		
        		response.status(200).json(mergeData);
    		} else {
    		response.status(200).json(res.rows);
    		}
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectCargoBookmark = (user, seq) => {
	
	let sqltext = "SELECT a.*, case when (select 1 from shp_sr_cargo_mark_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1 ) is not null then 'Y' " +
			" else 'N' end as mark_yn, case when (select 1 from shp_sr_cargo_goods_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1) is not null then 'Y'" +
			" else 'N' end as goods_yn,a.cargo_bookmark_seq as value, a.cargo_bookmark_name as label from shp_sr_cargo_bookmark a WHERE a.user_no = $1";
	if(seq) {
		sqltext += " and a.cargo_bookmark_seq = '"+seq+"'";
	}
	sqltext += " order by a.cargo_bookmark_seq::integer";
	
    const sql = {
		text: sqltext,
		values: [user]
	}
    console.log(sql);
    return sql;
}

const getUserCargoRelation = (request, response) => {
	

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		
    		
    		const mark = await client.query(getUserMarkRelation(request,request.body.seq));
    		const goods = await client.query(getUserGoodsRelation(request,request.body.seq));
    		
    		
    		//const mergeData = Object.assign({'mark.rows,goods.rows);
    		
    		
    		response.status(200).json({...mark.rows[0],...goods.rows[0]});
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const getUserMarkRelation = (request,seq) => {
	

/*    const sql = {
		text: `SELECT a.*,b.cargo_mark_bookmark_name,b.mark_desc1,b.mark_desc2,b.mark_desc3,b.mark_desc4,b.mark_desc5
		       from shp_sr_cargo_mark_bookmark_relation a, shp_sr_cargo_mark_bookmark b
		        WHERE a.user_no = b.user_no 
		        and a.cargo_mark_bookmark_seq = b.cargo_mark_bookmark_seq
		        and a.user_no = $1 and a.cargo_bookmark_seq = $2 order by a.cargo_mark_bookmark_seq` ,
		values: [request.body.user_no,seq]
	}*/
    const sql = {
    		text: ` SELECT b.cargo_mark_bookmark_name,b.cargo_mark_bookmark_seq, (select array_to_string(array_agg(mark),'\n') as mark from ( 
    				  select  Rtrim(case when mark_desc1 is not null then mark_desc1||'\n' else '' end|| 
    				  case when mark_desc2 is not null then mark_desc2||'\n' else '' end|| 
    				  case when mark_desc3 is not null then mark_desc3||'\n' else '' end|| 
    				  case when mark_desc4 is not null then mark_desc4||'\n' else '' end|| 
					  case when mark_desc5 is not null then mark_desc5||'\n' else '' end||
					  case when mark_desc6 is not null then mark_desc6||'\n' else '' end||
					  case when mark_desc7 is not null then mark_desc7||'\n' else '' end||
					  case when mark_desc8 is not null then mark_desc8||'\n' else '' end||
					  case when mark_desc9 is not null then mark_desc9||'\n' else '' end||
    				  case when mark_desc10 is not null then mark_desc10||'\n' else '' end,'\n' ) as mark
    				 from shp_sr_cargo_mark_bookmark_detail where user_no= a.user_no and cargo_mark_bookmark_seq = b.cargo_mark_bookmark_seq 
    				 order by cargo_mark_bookmark_seq::integer
    				 ) a) as mark_desc
    				  from shp_sr_cargo_mark_bookmark_relation a, shp_sr_cargo_mark_bookmark b
    				  WHERE a.user_no = b.user_no 
    				    and a.cargo_mark_bookmark_seq = b.cargo_mark_bookmark_seq
    				    and a.user_no = $1 and a.cargo_bookmark_seq = $2 order by a.cargo_mark_bookmark_seq` ,
    		values: [request.body.user_no,seq]
    	}
    console.log(sql);
    return sql;
}
const getUserGoodsRelation = (request,seq) => {
	

    const sql = {
		text: ` SELECT b.cargo_goods_bookmark_name,b.cargo_goods_bookmark_seq, (select array_to_string(array_agg(goods),'\n') as goods from ( 
				  select  Rtrim(case when goods_desc1 is not null then goods_desc1||'\n' else '' end|| 
				  case when goods_desc2 is not null then goods_desc2||'\n' else '' end|| 
				  case when goods_desc3 is not null then goods_desc3||'\n' else '' end|| 
				  case when goods_desc4 is not null then goods_desc4||'\n' else '' end|| 
				  case when goods_desc5 is not null then goods_desc5||'\n' else '' end,'\n' ) as goods
				 from shp_sr_cargo_goods_bookmark_detail where user_no= a.user_no and cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq 
				 order by cargo_goods_bookmark_seq::integer
				 ) a) as goods_desc
				  from shp_sr_cargo_goods_bookmark_relation a, shp_sr_cargo_goods_bookmark b
				  WHERE a.user_no = b.user_no 
				    and a.cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq
				    and a.user_no = $1 and a.cargo_bookmark_seq = $2 order by a.cargo_goods_bookmark_seq` ,
		values: [request.body.user_no,seq]
	}
    console.log(sql);
    return sql;
}

/*
 * setUserCargoBookmark
 * Cargo bookmark 저장
 * insert
 * 
 */
const setUserCargoBookmark = (request, response) => {
	
	/*	let sqltext = " with upsert as (update shp_sr_cargo_bookmark set cargo_bookmark_name = $1,cargo_pack_qty = $2, cargo_pack_type = $3, cargo_hs_code = $4, \n"
			sqltext += "  cargo_total_weight = $5, cargo_total_volume=$6 where user_no = $7 and cargo_bookmark_seq = $8 returning * ) \n";
			sqltext += " insert into shp_sr_cargo_bookmark (user_no,cargo_bookmark_seq,cargo_bookmark_name,cargo_pack_qty,cargo_pack_type,cargo_hs_code,cargo_total_weight,cargo_total_volume) \n";
			sqltext += " select $9,(select  coalesce(max(cargo_bookmark_seq::integer),0)+1 from shp_sr_cargo_bookmark a where a.user_no=$10),$11,$12, \n";
			sqltext += " $13,$14,$15,$16 where not exists (select * from upsert); \n";
			
	
		const sql = {
			text: sqltext,
			values: [request.body.data.cargo_bookmark_name,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,request.body.data.cargo_hs_code,
					 request.body.data.cargo_weight,request.body.data.cargo_total_volume,request.body.user_no,request.body.data.cargo_bookmark_seq?request.body.data.cargo_bookmark_seq:'',
					 request.body.user_no,request.body.user_no,request.body.data.cargo_bookmark_name,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,
					 request.body.data.cargo_hs_code,request.body.data.cargo_weight, request.body.data.cargo_total_volume]
		}*/
		var sql;
		
		if(request.body.data.cargo_bookmark_seq) {
			sql = {
				text: `update shp_sr_cargo_bookmark set cargo_bookmark_name =$1 ,cargo_pack_qty=$2,cargo_pack_type=$3,cargo_hs_code=$4,
								cargo_total_weight=$5,cargo_total_volume=$6 where user_no = $7 and cargo_bookmark_seq = $8 returning cargo_bookmark_seq`,
				values: [
						 request.body.data.cargo_bookmark_name,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,
						 request.body.data.cargo_hs_code,request.body.data.cargo_total_weight, request.body.data.cargo_total_volume,
						 request.body.user_no,request.body.data.cargo_bookmark_seq ]
			}
		} else {
			 let sqltext = " insert into shp_sr_cargo_bookmark (user_no,cargo_bookmark_seq,cargo_bookmark_name,cargo_pack_qty,cargo_pack_type,cargo_hs_code,cargo_total_weight,cargo_total_volume) \n";
				sqltext += " values( $1,(select  coalesce(max(cargo_bookmark_seq::integer),0)+1 from shp_sr_cargo_bookmark a where a.user_no=$2),$3,$4, \n";
				sqltext += " $5,$6,$7,$8) returning cargo_bookmark_seq \n";
				
		
			sql = {
				text: sqltext,
				values: [
						 request.body.user_no,request.body.user_no,request.body.data.cargo_bookmark_name,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,
						 request.body.data.cargo_hs_code,request.body.data.cargo_total_weight, request.body.data.cargo_total_volume]
			}
		}
		
		console.log(sql);
		(async () => {
			const client = await pgsqlPool.connect();
			try {
	
				
				const res = await client.query(sql);
				// 삭제
				let seq = res.rows[0].cargo_bookmark_seq
				
				// const cargo_seq = await client.query(await getUserCargoBookmarkSeq(request));
				// seq = cargo_seq.rows[0].max;
	/*    		if(request.body.data.marklist && request.body.data.marklist.length > 0){
					// insert
					await client.query(await deleteMarkrelation(request, seq));
					await client.query(await insertMarkRelation(request, seq));
				}*/
				
				if(request.body.data.cargo_mark_bookmark_seq){
					// insert
					await client.query(await deleteMarkrelation(request, seq));
					await client.query(await insertMarkRelation(request, seq));
				}
				
		
				if(request.body.data.cargo_goods_bookmark_seq) {	
					// insert 
					await client.query(await deleteGoodsrelation(request, seq));
					await client.query(await insertGoodsRelation(request, seq));
				}
				
	
				response.status(200).json(res.rows);
			} finally {
				client.release();
			}
		})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	}
	
	// 순번 조회
	const getUserCargoBookmarkSeq = (request, response) => {
		
		let sqltext = "select  max(cargo_bookmark_seq::integer) from shp_sr_cargo_bookmark a where a.user_no= $1";
	
		const sql = {
			text: sqltext,
			values: [request.body.user_no]
		}
		console.log(sql);
		
		return sql;
	}
	
	const deleteMarkrelation = (request, seq) => {
		
		let sqltext = "delete from shp_sr_cargo_mark_bookmark_relation where user_no = $1 and cargo_bookmark_seq = $2";
	
		const sql = {
			text: sqltext,
			values: [request.body.user_no,seq]
		}
		console.log(sql);
		
		return sql;
	}
	
	const deleteGoodsrelation = (request, seq) => {
		
		let sqltext = "delete from shp_sr_cargo_goods_bookmark_relation where user_no = $1 and cargo_bookmark_seq = $2";
	
		const sql = {
			text: sqltext,
			values: [request.body.user_no,seq]
		}
		console.log(sql);
		
		return sql;
	}
	
	const insertMarkRelation = (request, seq) => {
		
		//let dataRows = request.body.data.marklist;
	
		let sqltext = "insert into  shp_sr_cargo_mark_bookmark_relation (user_no,cargo_bookmark_seq,cargo_mark_bookmark_seq)values";
		sqltext +=" ('"+request.body.user_no+"','"+seq+"','"+request.body.data.cargo_mark_bookmark_seq+"')";
				
	 /*   for( let i = 0; i < dataRows.length; i++ ) {
	
			if(i !== 0 && i < dataRows.length ) {
				sqltext +=",";
			}
				sqltext +=" ('"+request.body.user_no+"','"+seq+"','"+dataRows[i].cargo_mark_bookmark_seq+"')";
	
		}*/
		
		const sql = {
			text: sqltext,
			//values: [request.body.user_no,request.body.data.cargo_bookmark_seq]
		}
		console.log(sql);
		return sql;
	}
	
	const insertGoodsRelation = (request, seq) => {
		
		//let dataRows = request.body.data.goodlist;
	
		let sqltext = "insert into  shp_sr_cargo_goods_bookmark_relation (user_no,cargo_bookmark_seq,cargo_goods_bookmark_seq)values";
			sqltext +=" ('"+request.body.user_no+"','"+seq+"','"+request.body.data.cargo_goods_bookmark_seq+"')";
	/*    for( let i = 0; i < dataRows.length; i++ ) {
	
			if(i !== 0 && i < dataRows.length ) {
				sqltext +=",";
			}
				sqltext +=" ('"+request.body.user_no+"','"+seq+"','"+dataRows[i].cargo_goods_bookmark_seq+"')";
	
		}*/
		
		const sql = {
			text: sqltext,
			//values: [request.body.user_no,request.body.data.cargo_bookmark_seq]
		}
		console.log(sql);
		return sql;
	}
	



//Cargo Bookmark 수정
const updateCargoGoods = (request, response) => {
	console.log(request.body);
//     const sql = {
// 		text: ` UPDATE shp_bkg_cargo_goods 
//  SET goods_desc1=$1, goods_desc2=$2, goods_desc3=$3 
//  , goods_desc4=$4, goods_desc5=$5, owner_no=$6, cargo_goods_bookmark_seq=$7 
//  WHERE user_no=$8 AND bkg_no=$9 AND bkg_date=$10 AND cargo_seq=$11 AND goods_seq=$12 `,
// 		values: [
// 			request.body.cargo.cargo_bookmark_name
// 			, request.body.cargo.cargo_type, request.body.cargo.cargo_name 
// 			, request.body.cargo.cargo_hs_code , request.body.cargo.cargo_pack_qty
// 			, request.body.cargo.cargo_pack_type, request.body.cargo.cargo_weight
// 			, request.body.cargo.cargo_total_volume, request.body.cargo.cargo_remark
// 			, request.body.cargo.cargo_total_weight, request.body.user_no
// 			, request.body.user_no, request.body.cargo.cargo_bookmark_seq
// 		]
// 	}
//     console.log(sql);
//     (async () => {
//     	const client = await pgsqlPool.connect();
//     	try {
//     		const res = await client.query(sql);
//     		response.status(200).json(res);
//     	} finally {
//     		client.release();
//     	}
//     })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Goods 삭제 
const deleteCargoGoodsByCargoSeq = (booking) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_cargo_goods 
 WHERE user_no=$1 AND bkg_no=$2 AND bkg_date=$3 AND cargo_seq=$4 `,
		values: [
			booking.user_no, booking.bkg_no,
			booking.bkg_date, booking.cargo_seq,
		]
	}
    console.log(sql);
    return sql;
}

const selectBookingCargoGoodsBookmark = (request, response) => {
	console.log(request.body);
    const sql = {
		text: ` SELECT row_number() over(order by a.insert_date desc) seq
 , a.user_no, a.cargo_goods_bookmark_seq, a.cargo_goods_bookmark_name 
 , a.cargo_goods_bookmark_seq as value, a.cargo_goods_bookmark_name as label
 , a.goods_desc1, a.goods_desc2, a.goods_desc3, a.goods_desc4, a.goods_desc5 
 , array_to_string(array_agg( (select cargo_bookmark_name 
 from shp_bkg_cargo_bookmark c 
 where c.user_no = a.user_no 
 and c.cargo_bookmark_seq = b.cargo_bookmark_seq)),', ') relation_bookmark 
 , case when count(b.cargo_bookmark_seq) > 0 then 'Y' else '' end relation_yn 
 FROM shp_bkg_cargo_goods_bookmark a 
 left outer join shp_bkg_cargo_goods_bookmark_relation b 
 on a.user_no = b.user_no and a.cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq 
 where a.user_no = $1 
 group by a.user_no, a.cargo_goods_bookmark_seq, a.cargo_goods_bookmark_name 
 , a.goods_desc1, a.goods_desc2, a.goods_desc3, a.goods_desc4, a.goods_desc5 
 order by a.user_no, cast(a.cargo_goods_bookmark_seq as numeric) `,
		values: [
		request.body.user_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Bookmark 입력
const insertBookingCargoGoodsBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_cargo_goods_bookmark 
 (user_no, cargo_goods_bookmark_seq, cargo_goods_bookmark_name 
 , goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5, insert_user, insert_date) 
 VALUES($1
 , (select coalesce(max (cast(cargo_goods_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_cargo_goods_bookmark 
 where user_no = $2) 
 , $3, $4, $5, $6, $7, $8, $9, now()) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.goods.cargo_goods_bookmark_name
			, request.body.goods.goods_desc1, request.body.goods.goods_desc2
			, request.body.goods.goods_desc3, request.body.goods.goods_desc4
			, request.body.goods.goods_desc5, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Bookmark 수정
const updateBoookingCargoGoodsBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_cargo_goods_bookmark 
 SET cargo_goods_bookmark_name=$1, goods_desc1=$2, goods_desc2=$3 
 , goods_desc3=$4, goods_desc4=$5, goods_desc5=$6, update_user=$7, update_date=now()
 WHERE user_no=$8 AND cargo_goods_bookmark_seq=$9 `,
		values: [
			request.body.goods.cargo_goods_bookmark_name
			, request.body.goods.goods_desc1, request.body.goods.goods_desc2 
			, request.body.goods.goods_desc3, request.body.goods.goods_desc4
			, request.body.goods.goods_desc5, request.body.user_no
			, request.body.goods.user_no, request.body.goods.cargo_goods_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Bookmark 삭제
const deleteBoookingCargoGoodsBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_cargo_goods_bookmark 
 WHERE user_no=$1 AND cargo_goods_bookmark_seq=$2 `,
		values: [
			request.body.goods.user_no, request.body.goods.cargo_goods_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			let res = await client.query(sql);
			let goods = request.body.goods;
			// 1. Goods Bookmark Relation
			let deleteRelation = deleteCargoGoodsBookmarkRelationByGoods(goods);
			res = await client.query(deleteRelation);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const deleteCargoGoodsBookmarkRelationByGoods = ( goods ) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_cargo_goods_bookmark_relation 
 WHERE user_no=$1 AND cargo_goods_bookmark_seq=$2 `,
		values: [
			goods.user_no, goods.cargo_goods_bookmark_seq
		]
	}
    console.log(sql);
    return sql;
}


// 계약번호 Bookmark 조회
const selectBookingCargoBookmarkRelation = (request, response) => {
    const sql = {
		text: ` select a.user_no, b.cargo_bookmark_seq, a.cargo_goods_bookmark_seq, a.cargo_goods_bookmark_name 
 , a.cargo_goods_bookmark_seq as value, a.cargo_goods_bookmark_name as label
 , a.goods_desc1, a.goods_desc2, a.goods_desc3, a.goods_desc4, a.goods_desc5 
 , a.insert_date, a.insert_user, a.update_date, a.update_user 
 from shp_bkg_cargo_goods_bookmark a 
 ,shp_bkg_cargo_goods_bookmark_relation b 
 where a.user_no = b.user_no 
 and a.cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq 
 and a.user_no = $1 
 and b.cargo_bookmark_seq = $2 `,
		values: [request.body.user_no, request.body.cargo.cargo_bookmark_seq]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectCargoGoodsOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT user_no, bkg_no, bkg_date, cargo_seq, goods_seq 
 , goods_desc1, goods_desc2, goods_desc3 
 , goods_desc4, goods_desc5, owner_no, cargo_goods_bookmark_seq 
 FROM public.shp_bkg_cargo_goods 
 WHERE user_no = $1 
 and bkg_no = $2 
 and bkg_date = $3 
 and cargo_seq = $4
 order by user_no, cast(cargo_seq as numeric) `,
		values: [
		request.body.booking.user_no, request.body.booking.bkg_no
		, request.body.booking.bkg_date, request.body.booking.cargo_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const insertCargoOfBooking = (request, response) => {
    (async () => {
    	
		try {
			let pending = generateCargoOfBooking( request );
			pending.then(function(result) {
				response.status(200).json(result);
			});
		} catch (error) {
			console.log("[ERROR]",error); response.status(400).json(error);
	 	} finally {
			
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Cargo 입력
const generateCargoOfBooking = async ( request ) => {
	// (async () => {
		const client = await pgsqlPool.connect();
		let result = '';
    	try {
    		// const res = await client.query(sql, function(err,result){
			// 	// Cargo Goods를 입력하기 위해 삭제 한다.
			// 	booking.cargo_seq = result.rows[0].cargo_seq;
			// 	deleteCargoGoodsByCargoSeq(booking);
			// });
			let booking = request.body.cargo;
			let delBooking = request.body.booking;
			// if( !booking.user_no && !booking.bkg_no && !booking.bkg_date ) {
			// 		return false;
			// }
			let user_no = request.body.user_no;
			// 0. delte shp_bkg_cargo
			let cargoDelSeql = deleteCargoQuery( delBooking );
			await client.query(cargoDelSeql);
			// 0. delte shp_bkg_cargo
			cargoDelSeql = deleteGoodsQuery( delBooking );
			await client.query(cargoDelSeql);
			// console.log(booking)
			if( !booking.cargo_hs_code && !booking.cargo_name && !booking.cargo_pack_qty 
				&& !booking.cargo_pack_type && !booking.cargo_remark && !booking.cargo_seq
				&& !booking.cargo_total_volume && !booking.cargo_total_weight && !booking.cargo_type
				&& !booking.cargo_type_name && !booking.cargo_weight) {
					return false;
			}
			// 1. insert shp_bkg_cargo
			let sql = insertCargoQuery( booking, user_no );
			result = await client.query(sql);
			// 2. cargo_goods 정보를 삭제
			booking.cargo_seq = result.rows[0].cargo_seq;
			// let delSql = await deleteCargoGoodsByCargoSeq(booking);
			// let res = await client.query(delSql);


			// 3. Bookmark로 입력한 경우에는
			if( "Y" === booking.cargo_selected_yn ) {
				// 3.1 Bookmark 정보로 입력해야 함
				let insertSql = await insertCargoGoodsFromBookmarkRelation(booking);
				res = await client.query(insertSql);
			} else {
				// 3.2 Bookmark 입력아닌 경우엔 사용자 입력한 정보로 입력.
				let goodsRelationList = request.body.goodsRelationList;
				if(goodsRelationList.length>0){
					// 4. map 을 async 처리할 경우
					await Promise.all(
						goodsRelationList.map( async (goods, key)=>{
							// Key 입력하기
							goods.goods_seq = key+1;
							let insertGoodsSql = await insertCargoGoods(booking, goods);
							// 5. 사용자 입력 정보로 cargo 입력
							res = await client.query(insertGoodsSql);
						})
					);
				}
			}
    		return result;
    	} finally {
			client.release();
			return result;
    	}
    // })
}
const deleteCargoQuery =( booking )=> {
	const sql = {
		text: ` DELETE FROM shp_bkg_cargo
WHERE user_no=$1 AND bkg_no=$2 AND bkg_date=$3`,
		values: [
			booking.user_no, booking.bkg_no
			, booking.bkg_date
		]
	}
	console.log(sql);
	return sql;
}
const deleteGoodsQuery =( booking )=> {
	const sql = {
		text: ` DELETE FROM shp_bkg_cargo_goods
WHERE user_no=$1 AND bkg_no=$2 AND bkg_date=$3`,
		values: [
			booking.user_no, booking.bkg_no
			, booking.bkg_date
		]
	}
	console.log(sql);
	return sql;
}

const insertCargoQuery =( booking, user_no )=> {
	const sql = {
		text: ` INSERT INTO shp_bkg_cargo 
 (owner_no, bkg_no, bkg_date, user_no, cargo_seq 
 , cargo_type, cargo_name, cargo_hs_code, cargo_pack_qty 
 , cargo_pack_type, cargo_weight, cargo_total_volume 
 , cargo_remark, cargo_total_weight, cargo_bookmark_seq 
 , insert_date, insert_user) 
 VALUES($1, $2, $3, $4 
 , (select coalesce(max(cast (cargo_seq as numeric) ),0)+1 
 from shp_bkg_cargo 
 where user_no = $5 
 and bkg_no = $6 
 and bkg_date = $7) 
 , $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), $18) 
 RETURNING cargo_seq `,
		values: [
			booking.owner_no, booking.bkg_no
			, booking.bkg_date, booking.user_no
			, booking.user_no, booking.bkg_no, booking.bkg_date
			, booking.cargo_type, booking.cargo_name
			, booking.cargo_hs_code, booking.cargo_pack_qty
			, booking.cargo_pack_type, booking.cargo_weight
			, booking.cargo_total_volume, booking.cargo_remark
			, booking.cargo_total_weight, booking.cargo_bookmark_seq
			, user_no,
		]
	}
	console.log(sql);
	return sql;
}

// Cargo Pack Type 목록 조회
const selectLineCodeCargoPackType = (request, response) => {
    const sql = {
		text: ` SELECT line_code, cargo_pack_type 
 , cargo_pack_type_desc, cargo_pack_type_kr_desc
 , cargo_pack_type as value,  '['||cargo_pack_type||'] '||cargo_pack_type_desc as label
 FROM public.own_line_code_cargo_pack_type 
 where line_code = $1 `,
		values: [
			request.body.params.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Type 목록 조회
const selectLineCodeCargoType = (request, response) => {
    const sql = {
		text: ` SELECT line_code, cargo_type 
 , cargo_type_desc, cargo_type_kr_desc 
 , cargo_type as value, '['||cargo_type_kr_desc||']'||cargo_type_desc as label
 FROM public.own_line_code_cargo_type 
 where line_code = $1 `,
		values: [
			request.body.params.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Cargo 수정
const updateCargoOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_cargo 
 SET owner_no=$1, cargo_type=$2, cargo_name=$3, cargo_hs_code=$4 
 , cargo_pack_qty=$5, cargo_pack_type=$6, cargo_weight=$7 
 , cargo_total_volume=$8, cargo_remark=$9, cargo_total_weight=$10 
 , cargo_bookmark_seq=$11, update_date=now(), update_user=$12 
 WHERE user_no=$13 AND bkg_no=$14 AND bkg_date=$15 AND cargo_seq=$16 `,
		values: [
			request.body.booking.owner_no, request.body.booking.cargo_type
			, request.body.booking.cargo_name, request.body.booking.cargo_hs_code 
			, request.body.booking.cargo_pack_qty, request.body.booking.cargo_pack_type
			, request.body.booking.cargo_weight, request.body.booking.cargo_total_volume
			, request.body.booking.cargo_remark, request.body.booking.cargo_total_weight 
			, request.body.booking.cargo_bookmark_seq, request.body.user_no
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
			, request.body.booking.cargo_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			const booking = request.body.booking;
			// 1. update shp_bkg_cargo
			await client.query(sql);
			// 2. cargo_goods 정보를 삭제
			let delSql = await deleteCargoGoodsByCargoSeq(booking);
			let res = await client.query(delSql);
			// 3. Bookmark로 입력한 경우에는
			if( "Y" === booking.cargo_selected_yn ) {
				// 3.1 Bookmark 정보로 입력해야 함
				let insertSql = await insertCargoGoodsFromBookmarkRelation(booking);
				res = await client.query(insertSql);
			} else {
				// 3.2 Bookmark 입력아닌 경우엔 사용자 입력한 정보로 입력.
				let goodsRelationList = request.body.goodsRelationList;
				if(goodsRelationList.length>0){
					await Promise.all(
					// 4. map 을 async 처리할 경우
						goodsRelationList.map( async (goods, key)=>{
							// Key 입력하기
							goods.goods_seq = key+1;
							if( goods.goods_desc1 || goods.goods_desc2
								|| goods.goods_desc3 || goods.goods_desc4 || goods.goods_desc5) {
									let insertGoodsSql = await insertCargoGoods(booking, goods);
									// 5. 사용자 입력 정보로 cargo 입력
									res = await client.query(insertGoodsSql);
								}
						})
					);
				}
			}
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Cargo 조회
const selectCargoOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT a.owner_no, a.bkg_no, a.bkg_date, a.user_no 
 , a.status_cus, a.send_date, a.sc_no 
 , b.cargo_seq, b.cargo_type
 ,(select '['||c.cargo_type_kr_desc||']'||cargo_type_desc
 from own_line_code_cargo_type c
 where line_code = a.line_code
 and c.cargo_type = b.cargo_type) cargo_type_name
 ,(select cargo_pack_type_desc
 from own_line_code_cargo_pack_type c
 where line_code = a.line_code
 and c.cargo_pack_type = b.cargo_pack_type) cargo_pack_type_name
 , b.cargo_name 
 , b.cargo_hs_code, b.cargo_pack_qty, b.cargo_pack_type, b.cargo_weight, b.cargo_total_volume 
 , b.cargo_remark, b.cargo_total_weight, b.cargo_bookmark_seq, b.cargo_bookmark_seq as init_cargo_bookmark_seq
 ,(select c.cargo_bookmark_name from shp_bkg_cargo_bookmark c where c.user_no=b.user_no and c.cargo_bookmark_seq = b.cargo_bookmark_seq) cargo_bookmark_name 
 FROM shp_bkg a 
 left outer join shp_bkg_cargo b 
 on a.bkg_no = b.bkg_no and a.bkg_date = b.bkg_date and a.user_no = b.user_no 
 where a.user_no = $1 
 AND a.bkg_no = $2 
 AND a.bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Bookmark 삭제
const deleteBookingCargoBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_cargo_bookmark 
 WHERE user_no=$1 AND cargo_bookmark_seq=$2 `,
		values: [
			request.body.cargo.user_no, request.body.cargo.cargo_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			let cargo = request.body.cargo;
			let res = await client.query(sql);
			let deleteSql = await deleteCargoGoodsBookmarkRelationByRelation( cargo );
			res = await client.query(deleteSql);
			
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Cargo Bookmark 수정
const updateBookingCargoBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_cargo_bookmark
SET cargo_bookmark_name=$1, cargo_type=$2, cargo_name=$3, cargo_hs_code=$4
, cargo_pack_qty=$5, cargo_pack_type=$6, cargo_weight=$7, cargo_total_volume=$8
, cargo_remark=$9, cargo_total_weight=$10, update_date=now(), update_user=$11
WHERE user_no=$12 AND cargo_bookmark_seq=$13 `,
		values: [
			request.body.cargo.cargo_bookmark_name
			, request.body.cargo.cargo_type, request.body.cargo.cargo_name 
			, request.body.cargo.cargo_hs_code , request.body.cargo.cargo_pack_qty
			, request.body.cargo.cargo_pack_type, request.body.cargo.cargo_weight
			, request.body.cargo.cargo_total_volume, request.body.cargo.cargo_remark
			, request.body.cargo.cargo_total_weight, request.body.user_no
			, request.body.cargo.user_no, request.body.cargo.cargo_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			// 1. cargo bookmark update 수행
			let res = await client.query(sql);
			let cargo = request.body.cargo;
			let goodsRelationList = request.body.goodsRelationList;
			// 2. Bookmark Relation을 새로 입력하기 위한 delete query
			let deleteSql = await deleteCargoGoodsBookmarkRelationByRelation(cargo);
			res = await client.query(deleteSql);
			// 3. 새로운 Bookmark Relation 입력
			if( goodsRelationList.length > 0 ) {
				await Promise.all(
					goodsRelationList.map(async (element, key)=>{
						// 3.1 입력하기
						if( element.cargo_goods_bookmark_seq ) {
							let insertSql =  await insertCargoGoodsBookmarkRelationByRelation( cargo, element );
							res =  await client.query(insertSql);
						}
					})
				);
			}
			response.status(200).json(res);
    	} finally {
    		client.release();
			
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

// Cargo Bookmark 입력
const insertBookingCargoBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_cargo_bookmark 
(user_no, cargo_bookmark_seq, cargo_bookmark_name, cargo_type, cargo_name 
, cargo_hs_code, cargo_pack_qty, cargo_pack_type, cargo_weight, cargo_total_volume 
, cargo_remark, cargo_total_weight, insert_date, insert_user) 
VALUES($1 
, (select coalesce(max(cast (cargo_bookmark_seq as numeric)),0)+1 
from shp_bkg_cargo_bookmark 
where user_no = $2) 
, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), $13)
RETURNING cargo_bookmark_seq `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.cargo.cargo_bookmark_name
			, request.body.cargo.cargo_type, request.body.cargo.cargo_name 
			, request.body.cargo.cargo_hs_code, request.body.cargo.cargo_pack_qty
			, request.body.cargo.cargo_pack_type, request.body.cargo.cargo_weight
			, request.body.cargo.cargo_total_volume, request.body.cargo.cargo_remark 
			, request.body.cargo.cargo_total_weight, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			// 1. cargo bookmark update 수행
			const res = await client.query(sql);
			let cargo = request.body.cargo;
			let goodsRelationList = request.body.goodsRelationList;
			cargo.cargo_bookmark_seq = res.rows[0].cargo_bookmark_seq;
			// 2. Bookmark Relation을 새로 입력하기 위한 delete query
			let deleteSql = await deleteCargoGoodsBookmarkRelationByRelation(cargo);
			await client.query(deleteSql);
			// 3. 새로운 Bookmark Relation 입력
			if( goodsRelationList.length > 0 ) {
				await Promise.all(
					goodsRelationList.map((element, key)=>{
						// 3.1 입력하기
						if( element.cargo_goods_bookmark_seq ) {
							let insertSql = insertCargoGoodsBookmarkRelationByRelation( cargo, element );
							client.query(insertSql);
						}
					})
				);
			}
			
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}));
}

// Cargo Bookmark 조회
const selectBookingCargoBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by a.insert_date desc) seq
 , a.user_no, a.cargo_bookmark_seq, a.cargo_bookmark_name, a.cargo_type, a.cargo_name 
 , a.cargo_bookmark_seq as value, a.cargo_bookmark_name as label
 , a.cargo_hs_code
 , a.cargo_pack_qty, a.cargo_pack_type, a.cargo_weight, a.cargo_total_volume 
 , a.cargo_remark, a.cargo_total_weight, a.insert_date, a.insert_user, a.update_date, a.update_user 
 , array_to_string(array_agg( (select cargo_goods_bookmark_name 
 from shp_bkg_cargo_goods_bookmark c 
 where c.user_no = a.user_no 
 and c.cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq)),', ') relation_bookmark 
 , case when count(b.cargo_goods_bookmark_seq) > 0 then 'Y' else '' end relation_yn
 , '['||c.cargo_type_kr_desc||']'||cargo_type_desc as cargo_type_name
 , d.cargo_pack_type_desc as cargo_pack_type_name
 FROM public.shp_bkg_cargo_bookmark a
 left outer join shp_bkg_cargo_goods_bookmark_relation b
 on a.user_no = b.user_no and a.cargo_bookmark_seq = b.cargo_bookmark_seq
 left outer join own_line_code_cargo_type c
 on c.line_code = $1 and c.cargo_type = a.cargo_type
 left outer join own_line_code_cargo_pack_type d
 on d.line_code = $1 and d.cargo_pack_type = a.cargo_pack_type
 WHERE a.user_no = $2
 group by a.user_no, a.cargo_bookmark_seq, a.cargo_bookmark_name, a.cargo_type, a.cargo_name 
 , a.cargo_hs_code, a.cargo_pack_qty, a.cargo_pack_type, a.cargo_weight, a.cargo_total_volume 
 , a.cargo_remark, a.cargo_total_weight, a.insert_date, a.insert_user, a.update_date, a.update_user
 , '['||c.cargo_type_kr_desc||']'||cargo_type_desc, d.cargo_pack_type_desc
 order by a.insert_date desc `,
		values: [
			request.body.line_code, request.body.user_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Transport 수정
const updateTransportOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg
 SET update_user=$1, update_date=now(), status_cus='S0'
 , transport_bookmark_seq=$2
 , trans_self_yn=$3, trans_name1=$4, trans_name2=$5, trans_code=$6
 , trans_user_name=$7, trans_user_tel=$8, trans_user_email=$9
 , trans_user_fax=$10, trans_fac_area_name=$11, trans_fac_name=$12, trans_remark=$13
 WHERE user_no=$14 AND bkg_no=$15 AND bkg_date=$16 `,
		values: [
			request.body.user_no, request.body.booking.transport_bookmark_seq
			, request.body.booking.trans_self_yn, request.body.booking.trans_name1 
			, request.body.booking.trans_name2, request.body.booking.trans_code
			, request.body.booking.trans_user_name, request.body.booking.trans_user_tel
			, request.body.booking.trans_user_email, request.body.booking.trans_user_fax 
			, request.body.booking.trans_fac_area_name, request.body.booking.trans_fac_name
			, request.body.booking.trans_remark
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Transport 조회
const selectTransportOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no 
 , transport_bookmark_seq, transport_bookmark_seq as init_transport_bookmark_seq 
 , trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name 
 , trans_user_tel, trans_user_email, trans_user_fax, trans_fac_area_name 
 , trans_fac_name, trans_remark 
 ,(select transport_bookmark_name from shp_bkg_transport_bookmark b where a.user_no=b.user_no and b.transport_bookmark_seq = a.transport_bookmark_seq) transport_bookmark_name 
 FROM shp_bkg a 
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const deleteCargoGoodsBookmarkRelationByRelation = ( cargo ) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_cargo_goods_bookmark_relation 
 WHERE user_no=$1 AND cargo_bookmark_seq=$2 `,
		values: [
			cargo.user_no, cargo.cargo_bookmark_seq
		]
	}
    console.log(sql);
    return sql;
}

// Cargo Bookmark 입력
const insertCargoGoodsBookmarkRelationByRelation = (cargo, goods) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_cargo_goods_bookmark_relation 
(user_no, cargo_bookmark_seq, cargo_goods_bookmark_seq) 
VALUES($1, $2, $3) `,
		values: [
			cargo.user_no, cargo.cargo_bookmark_seq
			, goods.cargo_goods_bookmark_seq,
		]
	}
    console.log(sql);
	return sql
}


//Cargo Bookmark 입력
const insertCargoGoods = ( booking, goods ) => {
	// console.log(request.body);
    const sql = {
		text: ` INSERT INTO shp_bkg_cargo_goods
(user_no, bkg_no, bkg_date, cargo_seq, goods_seq
, goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5
, owner_no, cargo_goods_bookmark_seq, insert_user, insert_date) 
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now() ) `,
		values: [
			booking.user_no, booking.bkg_no,
			booking.bkg_date, booking.cargo_seq,
			goods.goods_seq, goods.goods_desc1,
			goods.goods_desc2, goods.goods_desc3,
			goods.goods_desc4, goods.goods_desc5,
			booking.owner_no, goods.cargo_goods_bookmark_seq,
			booking.user_no
		]
	}
	console.log(sql);
    return sql;
}

// Cargo Goods는 Bookmark Relation정보로 입력
const insertCargoGoodsFromBookmarkRelation = ( booking ) => {
	// console.log(request.body);
    const sql = {
		text: ` INSERT INTO shp_bkg_cargo_goods 
 (user_no, bkg_no, bkg_date, cargo_seq 
 , goods_seq, goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5 
 , owner_no, cargo_goods_bookmark_seq, insert_date, insert_user) 
 select $1, $2, $3, $4 
 ,(row_number() over()) as goods_seq 
 ,a.goods_desc1, a.goods_desc2, a.goods_desc3, a.goods_desc4, a.goods_desc5 
 ,$5, b.cargo_goods_bookmark_seq, now(), $6 
 from shp_bkg_cargo_goods_bookmark a 
 ,shp_bkg_cargo_goods_bookmark_relation b 
 where b.user_no = $7
 and b.cargo_bookmark_seq = $8 
 and a.cargo_goods_bookmark_seq = b.cargo_goods_bookmark_seq `,
		values: [
			booking.user_no, booking.bkg_no,
			booking.bkg_date, booking.cargo_seq,
			booking.owner_no, booking.user_no,
			booking.user_no, booking.cargo_bookmark_seq
		]
	}
	console.log(sql);
    return sql;
}

// Transport Bookmark 삭제
const deleteBookingTransportBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_transport_bookmark 
 WHERE user_no=$1 AND transport_bookmark_seq=$2 `,
		values: [
			request.body.transport.user_no, request.body.transport.transport_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Line 수정
const updateLineOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_user=$1, update_date=now(), status_cus='S0' 
 , line_bookmark_seq=$2 
 , line_name1=$3, line_name2=$4, line_code=$5, line_user_name=$6, line_user_tel=$7, line_user_email=$8 
 , line_address1=$9, line_address2=$10, line_address3=$11, line_address4=$12, line_address5=$13 
 , line_user_dept=$14, line_user_fax=$15 
 WHERE user_no=$16 AND bkg_no=$17 AND bkg_date=$18 `,
		values: [
			request.body.user_no, request.body.booking.line_bookmark_seq
			, request.body.booking.line_name1, request.body.booking.line_name2 
			, request.body.booking.line_code, request.body.booking.line_user_name
			, request.body.booking.line_user_tel, request.body.booking.line_user_email
			, request.body.booking.line_address1, request.body.booking.line_address2 
			, request.body.booking.line_address3, request.body.booking.line_address4, request.body.booking.line_address5
			, request.body.booking.line_user_dept, request.body.booking.line_user_fax
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Transport Bookmark 조회
const selectBookingTransportBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no, transport_bookmark_seq, transport_bookmark_name 
 , transport_bookmark_seq as value, transport_bookmark_name as label
 , trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name 
 , trans_user_tel, trans_user_email, trans_user_fax, trans_fac_area_name 
 , trans_fac_name, trans_remark, insert_date, insert_user, update_date, update_user 
 FROM public.shp_bkg_transport_bookmark 
 WHERE user_no = $1 
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Transport Bookmark 입력
const insertBookingTransportBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_transport_bookmark 
 (user_no, transport_bookmark_seq, transport_bookmark_name 
 , trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name 
 , trans_user_tel, trans_user_email, trans_user_fax, trans_fac_area_name 
 , trans_fac_name, trans_remark, insert_date, insert_user) 
 VALUES($1 
 , (select coalesce(max(cast (transport_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_transport_bookmark 
 where user_no = $2) 
 , $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), $15) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.transport.transport_bookmark_name
			, request.body.transport.trans_self_yn, request.body.transport.trans_name1 
			, request.body.transport.trans_name2, request.body.transport.trans_code
			, request.body.transport.trans_user_name, request.body.transport.trans_user_tel
			, request.body.transport.trans_user_email, request.body.transport.trans_user_fax 
			, request.body.transport.trans_fac_area_name, request.body.transport.trans_fac_name 
			, request.body.transport.trans_remark, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// Transport Bookmark 수정
const updateBookingTransportBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_transport_bookmark
 SET transport_bookmark_name=$1, trans_self_yn=$2, trans_name1=$3, trans_name2=$4
 , trans_code=$5, trans_user_name=$6, trans_user_tel=$7, trans_user_email=$8
 , trans_user_fax=$9, trans_fac_area_name=$10, trans_fac_name=$11, trans_remark=$12
 , update_date=now(), update_user=$13
 WHERE user_no=$14 AND transport_bookmark_seq=$15 `,
		values: [
			request.body.transport.transport_bookmark_name
			, request.body.transport.trans_self_yn, request.body.transport.trans_name1 
			, request.body.transport.trans_name2, request.body.transport.trans_code
			, request.body.transport.trans_user_name, request.body.transport.trans_user_tel
			, request.body.transport.trans_user_email, request.body.transport.trans_user_fax 
			, request.body.transport.trans_fac_area_name, request.body.transport.trans_fac_name 
			, request.body.transport.trans_remark, request.body.user_no
			, request.body.transport.user_no, request.body.transport.transport_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Line 조회
const selectLineOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no 
 , line_bookmark_seq, line_bookmark_seq as init_line_bookmark_seq
 , line_name1, line_name2, line_code, line_user_name, line_user_tel, line_user_email 
 , line_address1, line_address2, line_address3, line_address4, line_address5 
 , line_user_dept, line_user_fax 
 ,(select line_bookmark_name from shp_bkg_line_bookmark b where a.user_no=b.user_no and b.line_bookmark_seq = a.line_bookmark_seq) line_bookmark_name 
 FROM shp_bkg a 
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Line Bookmark 수정
const updateBookingLineBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_line_bookmark 
 SET line_bookmark_name=$1, line_name1=$2, line_name2=$3, line_code=$4, line_user_name=$5 
 , line_user_tel=$6, line_user_email=$7 
 , line_address1=$8, line_address2=$9, line_address3=$10, line_address4=$11, line_address5=$12 
 , line_user_dept=$13, line_user_fax=$14, update_date=now(), update_user=$15 
 WHERE user_no=$16 AND line_bookmark_seq=$17 `,
		values: [
			request.body.line.line_bookmark_name
			, request.body.line.line_name1, request.body.line.line_name2 
			, request.body.line.line_code, request.body.line.line_user_name
			, request.body.line.line_user_tel, request.body.line.line_user_email
			, request.body.line.line_address1, request.body.line.line_address2 
			, request.body.line.line_address3, request.body.line.line_address4, request.body.line.line_address5
			, request.body.line.line_user_dept, request.body.line.line_user_fax, request.body.user_no
			, request.body.line.user_no, request.body.line.line_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Line Bookmark 삭제
const deleteBookingLineBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_line_bookmark 
 WHERE user_no=$1 AND line_bookmark_seq=$2 `,
		values: [
			request.body.line.user_no, request.body.line.line_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Line Bookmark 조회
const selectBookingLineBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no, line_bookmark_seq, line_bookmark_name 
 , line_bookmark_seq as value, line_bookmark_name as label
 , line_name1, line_name2, line_code, line_user_name, line_user_tel, line_user_email 
 , line_address1, line_address2, line_address3, line_address4, line_address5 
 , line_user_dept, line_user_fax, insert_date, insert_user, update_date, update_user 
 FROM shp_bkg_line_bookmark 
 WHERE user_no = $1
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Line Bookmark 입력
const insertBookingLineBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_line_bookmark 
 (user_no, line_bookmark_seq, line_bookmark_name, line_name1, line_name2, line_code 
 , line_user_name, line_user_tel, line_user_email 
 , line_address1, line_address2, line_address3, line_address4, line_address5 
 , line_user_dept, line_user_fax, insert_date, insert_user) 
 VALUES($1 
 , (select coalesce(max (cast(line_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_line_bookmark 
 where user_no = $2) 
 , $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), $17) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.line.line_bookmark_name
			, request.body.line.line_name1, request.body.line.line_name2 
			, request.body.line.line_code?request.body.line.line_code: 'WDFC'
			, request.body.line.line_user_name
			, request.body.line.line_user_tel, request.body.line.line_user_email
			, request.body.line.line_address1, request.body.line.line_address2 
			, request.body.line.line_address3, request.body.line.line_address4, request.body.line.line_address5
			, request.body.line.line_user_dept, request.body.line.line_user_fax, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Consignee 수정
const updateConsigneeOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg
 SET update_user=$1, update_date=now(), status_cus='S0' 
 , consignee_bookmark_seq=$2 
 , cons_name1=$3, cons_name2=$4, cons_code=$5, cons_user_name=$6 
 , cons_user_tel=$7, cons_user_email=$8 
 , cons_address1=$9, cons_address2=$10, cons_address3=$11, cons_address4=$12, cons_address5=$13 
 , cons_user_dept=$14, cons_user_fax=$15 
 WHERE user_no=$16 AND bkg_no=$17 AND bkg_date=$18 `,
		values: [
			request.body.user_no, request.body.booking.consignee_bookmark_seq
			, request.body.booking.cons_name1, request.body.booking.cons_name2 
			, request.body.booking.cons_code, request.body.booking.cons_user_name
			, request.body.booking.cons_user_tel, request.body.booking.cons_user_email
			, request.body.booking.cons_address1, request.body.booking.cons_address2 
			, request.body.booking.cons_address3, request.body.booking.cons_address4, request.body.booking.cons_address5
			, request.body.booking.cons_user_dept, request.body.booking.cons_user_fax
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Consignee Bookmark 조회
const selectBookingConsigneeBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no, consignee_bookmark_seq, consignee_bookmark_name 
 , consignee_bookmark_seq as value, consignee_bookmark_name as label
 , cons_name1, cons_name2, cons_code, cons_user_name, cons_user_tel, cons_user_email 
 , cons_address1, cons_address2, cons_address3, cons_address4, cons_address5 
 , cons_user_dept, cons_user_fax, insert_date, insert_user, update_date, update_user 
 FROM shp_bkg_consignee_bookmark 
 WHERE user_no = $1
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ConsigneeBookmark 입력
const insertBookingConsigneeBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_consignee_bookmark 
(user_no, consignee_bookmark_seq, consignee_bookmark_name 
, cons_name1, cons_name2, cons_code, cons_user_name, cons_user_tel, cons_user_email 
, cons_address1, cons_address2, cons_address3, cons_address4, cons_address5 
, cons_user_dept, cons_user_fax, insert_date, insert_user) 
VALUES($1 
, (select coalesce(max(cast (consignee_bookmark_seq as numeric) ),0)+1 
from shp_bkg_consignee_bookmark 
where user_no = $2) 
, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), $17) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.consignee.consignee_bookmark_name
			, request.body.consignee.cons_name1, request.body.consignee.cons_name2 
			, request.body.consignee.cons_code, request.body.consignee.cons_user_name
			, request.body.consignee.cons_user_tel, request.body.consignee.cons_user_email
			, request.body.consignee.cons_address1, request.body.consignee.cons_address2 
			, request.body.consignee.cons_address3, request.body.consignee.cons_address4, request.body.consignee.cons_address5
			, request.body.consignee.cons_user_dept, request.body.consignee.cons_user_fax, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// ConsigneeBookmark 수정
const updateBookingConsigneeBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_consignee_bookmark 
 SET consignee_bookmark_name=$1, cons_name1=$2, cons_name2=$3, cons_code=$4 
 , cons_user_name=$5, cons_user_tel=$6, cons_user_email=$7 
 , cons_address1=$8, cons_address2=$9, cons_address3=$10, cons_address4=$11, cons_address5=$12 
 , cons_user_dept=$13, cons_user_fax=$14, update_date=now(), update_user=$15 
 WHERE user_no=$16 AND consignee_bookmark_seq=$17 `,
		values: [
			request.body.consignee.consignee_bookmark_name
			, request.body.consignee.cons_name1, request.body.consignee.cons_name2 
			, request.body.consignee.cons_code, request.body.consignee.cons_user_name
			, request.body.consignee.cons_user_tel, request.body.consignee.cons_user_email
			, request.body.consignee.cons_address1, request.body.consignee.cons_address2 
			, request.body.consignee.cons_address3, request.body.consignee.cons_address4, request.body.consignee.cons_address5
			, request.body.consignee.cons_user_dept, request.body.consignee.cons_user_fax, request.body.user_no
			, request.body.consignee.user_no, request.body.consignee.consignee_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// CosigneeBookmark 삭제
const deleteBookingConsigneeBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_consignee_bookmark 
 WHERE user_no=$1 AND consignee_bookmark_seq=$2 
		 `,
		values: [
			request.body.consignee.user_no, request.body.consignee.consignee_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Consignee 조회
const selectConsigneeOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no 
 , consignee_bookmark_seq, consignee_bookmark_seq as init_consignee_bookmark_seq 
 , cons_name1, cons_name2, cons_code, cons_user_name, cons_user_tel, cons_user_email 
 , cons_address1, cons_address2, cons_address3, cons_address4, cons_address5 
 , cons_user_dept, cons_user_fax 
 ,(select consignee_bookmark_name from shp_bkg_consignee_bookmark b where a.user_no=b.user_no and b.consignee_bookmark_seq = a.consignee_bookmark_seq) consignee_bookmark_name 
 FROM shp_bkg a 
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Forwarder 수정
const updateForwarderOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_user=$1, update_date=now(), status_cus='S0' 
 , forwarder_bookmark_seq=$2 
 , fwd_name1=$3, fwd_name2=$4, fwd_code=$5, fwd_user_name=$6, fwd_user_tel=$7, fwd_user_email=$8 
 , fwd_address1=$9, fwd_address2=$10, fwd_address3=$11, fwd_address4=$12, fwd_address5=$13 
 , fwd_user_dept=$14, fwd_user_fax=$15 
 WHERE user_no=$16 AND bkg_no=$17 AND bkg_date=$18 `,
		values: [
			request.body.user_no, request.body.booking.forwarder_bookmark_seq
			, request.body.booking.fwd_name1, request.body.booking.fwd_name2 
			, request.body.booking.fwd_code, request.body.booking.fwd_user_name
			, request.body.booking.fwd_user_tel, request.body.booking.fwd_user_email
			, request.body.booking.fwd_address1, request.body.booking.fwd_address2 
			, request.body.booking.fwd_address3, request.body.booking.fwd_address4, request.body.booking.fwd_address5
			, request.body.booking.fwd_user_dept, request.body.booking.fwd_user_fax
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Shipper 조회
const getShipperOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no, shipper_bookmark_seq, shipper_bookmark_seq as init_shipper_bookmark_seq
 , shp_name1, shp_name2, shp_code, shp_user_name, shp_user_tel, shp_user_email
 , shp_address1, shp_address2, shp_address3, shp_address4, shp_address5, shp_user_dept, shp_user_fax, shp_payment_type
 ,(select shipper_bookmark_name from shp_bkg_shipper_bookmark b where a.user_no=b.user_no and b.shipper_bookmark_seq = a.shipper_bookmark_seq) shipper_bookmark_name
 FROM shp_bkg a
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Shipper 수정
const updateShipperOfBooking = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg 
 SET update_user=$1, update_date=now(), status_cus='S0' 
 , shipper_bookmark_seq=$2 
 , shp_name1=$3, shp_name2=$4, shp_code=$5, shp_user_name=$6, shp_user_tel=$7, shp_user_email=$8 
 , shp_address1=$9, shp_address2=$10, shp_address3=$11, shp_address4=$12, shp_address5=$13 
 , shp_user_dept=$14, shp_user_fax=$15, shp_payment_type=$16 
 WHERE user_no=$17 AND bkg_no=$18 AND bkg_date=$19 `,
		values: [
			request.body.user_no, request.body.booking.shipper_bookmark_seq
			, request.body.booking.shp_name1, request.body.booking.shp_name2 
			, request.body.booking.shp_code, request.body.booking.shp_user_name
			, request.body.booking.shp_user_tel, request.body.booking.shp_user_email
			, request.body.booking.shp_address1, request.body.booking.shp_address2 
			, request.body.booking.shp_address3, request.body.booking.shp_address4, request.body.booking.shp_address5
			, request.body.booking.shp_user_dept, request.body.booking.shp_user_fax, request.body.booking.shp_payment_type
			, request.body.booking.user_no, request.body.booking.bkg_no, request.body.booking.bkg_date
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Forwarder Bookmark 조회
const selectBookingForwarderBookmark = (request, response) => {
    const sql = {
		text: ` SELECT row_number() over(order by insert_date desc) seq
 , user_no, forwarder_bookmark_seq, forwarder_bookmark_name 
 , forwarder_bookmark_seq as value, forwarder_bookmark_name as label
 , fwd_name1, fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email 
 , fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5 
 , fwd_user_dept, fwd_user_fax, insert_date, insert_user, update_date, update_user 
 FROM shp_bkg_forwarder_bookmark 
 WHERE user_no = $1
 order by insert_date desc `,
		values: [request.body.user_no,]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ForwarderBookmark 입력
const insertBookingForwarderBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_forwarder_bookmark 
 (user_no, forwarder_bookmark_seq, forwarder_bookmark_name 
 , fwd_name1, fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email 
 , fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5 
 , fwd_user_dept, fwd_user_fax, insert_date, insert_user) 
 VALUES($1
, (select coalesce(max (cast(forwarder_bookmark_seq as numeric) ),0)+1 
from shp_bkg_forwarder_bookmark
where user_no = $2)
, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), $17 ) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.forwarder.forwarder_bookmark_name
			, request.body.forwarder.fwd_name1, request.body.forwarder.fwd_name2 
			, request.body.forwarder.fwd_code, request.body.forwarder.fwd_user_name
			, request.body.forwarder.fwd_user_tel, request.body.forwarder.fwd_user_email
			, request.body.forwarder.fwd_address1, request.body.forwarder.fwd_address2 
			, request.body.forwarder.fwd_address3, request.body.forwarder.fwd_address4, request.body.forwarder.fwd_address5
			, request.body.forwarder.fwd_user_dept, request.body.forwarder.fwd_user_fax, request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// ForwarderBookmark 수정
const updateBookingForwarderBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE shp_bkg_forwarder_bookmark
SET forwarder_bookmark_name=$1, fwd_name1=$2, fwd_name2=$3 
, fwd_code=$4, fwd_user_name=$5, fwd_user_tel=$6, fwd_user_email=$7
, fwd_address1=$8, fwd_address2=$9, fwd_address3=$10, fwd_address4=$11, fwd_address5=$12
, fwd_user_dept=$13, fwd_user_fax=$14, update_date=now(), update_user=$15
WHERE user_no=$16 AND forwarder_bookmark_seq=$17 `,
		values: [
			request.body.forwarder.forwarder_bookmark_name
			, request.body.forwarder.fwd_name1, request.body.forwarder.fwd_name2 
			, request.body.forwarder.fwd_code, request.body.forwarder.fwd_user_name
			, request.body.forwarder.fwd_user_tel, request.body.forwarder.fwd_user_email
			, request.body.forwarder.fwd_address1, request.body.forwarder.fwd_address2 
			, request.body.forwarder.fwd_address3, request.body.forwarder.fwd_address4, request.body.forwarder.fwd_address5
			, request.body.forwarder.fwd_user_dept, request.body.forwarder.fwd_user_fax, request.body.user_no
			, request.body.forwarder.user_no, request.body.forwarder.forwarder_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ForwarderBookmark 삭제
const deleteBookingForwarderBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_forwarder_bookmark 
 WHERE user_no=$1 AND forwarder_bookmark_seq=$2 
		 `,
		values: [
			request.body.forwarder.user_no, request.body.forwarder.forwarder_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Forwarder 조회
const selectForwarderOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT owner_no, bkg_no, bkg_date, user_no, insert_date, update_user, update_date 
 , status_cus, send_date, sc_no 
 , forwarder_bookmark_seq, forwarder_bookmark_seq as init_forwarder_bookmark_seq 
 , fwd_name1, fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email 
 , fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5, fwd_user_dept, fwd_user_fax 
 ,(select forwarder_bookmark_name from shp_bkg_forwarder_bookmark b where a.user_no=b.user_no and b.forwarder_bookmark_seq = a.forwarder_bookmark_seq) forwarder_bookmark_name 
 FROM shp_bkg a
 WHERE user_no = $1 
 AND bkg_no = $2 
 AND bkg_date = $3 `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


/*const setUserMarkBookmark = (request, response) => {
	var sql ;
	
	if(request.body.data.cargo_mark_bookmark_seq) {
		sql = {
				text: ` update shp_sr_cargo_mark_bookmark set cargo_mark_bookmark_name = $1, mark_desc1 =$2, mark_desc2=$3,mark_desc3=$4,
				               mark_desc4=$5,mark_desc5=$6 where user_no = $7 and cargo_mark_bookmark_seq = $8`,
				values: [
					request.body.data.cargo_mark_bookmark_name,request.body.data.mark_desc1,request.body.data.mark_desc2,request.body.data.mark_desc3,request.body.data.mark_desc4,
					request.body.data.mark_desc5,request.body.user_no,request.body.data.cargo_mark_bookmark_seq
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_cargo_mark_bookmark(user_no,cargo_mark_bookmark_seq,cargo_mark_bookmark_name,mark_desc1,mark_desc2,mark_desc3,mark_desc4,mark_desc5)
				        values ($1,coalesce((select max(cargo_mark_bookmark_seq::integer) from shp_sr_cargo_mark_bookmark where user_no=$2),0)+1,$3,$4,$5,$6,$7,$8) `,
				values: [
					request.body.user_no,request.body.user_no,
					request.body.data.cargo_mark_bookmark_name,request.body.data.mark_desc1,request.body.data.mark_desc2,request.body.data.mark_desc3,request.body.data.mark_desc4,
					request.body.data.mark_desc5
				]
			}
	}
    
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}*/


/*const setUserGoodsBookmark = (request, response) => {
	var sql;
	
	if(request.body.data.cargo_goods_bookmark_seq) {
		sql = {
				text: ` update shp_sr_cargo_goods_bookmark set cargo_goods_bookmark_name=$1, goods_desc1 =$2, goods_desc2=$3, goods_desc3=$4,
				               goods_desc4=$5,goods_desc5=$6 where user_no =$7 and cargo_goods_bookmark_seq =$8`,
				values: [
					request.body.data.cargo_goods_bookmark_name,request.body.data.goods_desc1,request.body.data.goods_desc2,request.body.data.goods_desc3,request.body.data.goods_desc4,
					request.body.data.goods_desc5,request.body.user_no,request.body.data.cargo_goods_bookmark_seq
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_cargo_goods_bookmark(user_no,cargo_goods_bookmark_seq,cargo_goods_bookmark_name,goods_desc1,goods_desc2,goods_desc3,goods_desc4,goods_desc5)
				        values ($1,coalesce((select max(cargo_goods_bookmark_seq::integer) from shp_sr_cargo_goods_bookmark where user_no=$2),0)+1,$3,$4,$5,$6,$7,$8) `,
				values: [
					request.body.user_no,request.body.user_no,
					request.body.data.cargo_goods_bookmark_name,request.body.data.goods_desc1,request.body.data.goods_desc2,request.body.data.goods_desc3,request.body.data.goods_desc4,
					request.body.data.goods_desc5
				]
			}
	}
	 
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}*/

const setUserMarkBookmark = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		//const res = await client.query(sql);
    		//console.log(" 기존 데이터");
    		// 기존 데이터
    		if(request.body.data.cargo_mark_bookmark_seq) {
    			const updateHeader = await client.query(updateMarkHeader(request.body.data,request.body.user_no));
    			const deleteDetail = await client.query(deleteMarkHeader(request.body.user_no,request.body.data));
    			//console.log("updateHeader:",updateHeader);
    			//console.log("deleteDetail:",deleteDetail.rowCount);
    			if(updateHeader.rowCount > 0) {
	    			const mark_seq = request.body.data.cargo_mark_bookmark_seq;
				    setMarkDetail(request, response,mark_seq,client);
    				
    			} else {
					const insertHeader = await client.query(insertMarkHeader(request.body.user_no,request));
					const mark_seq = insertHeader.rows[0].cargo_mark_bookmark_seq;
					if(insertHeader.rows) {
						setMarkDetail(request, response,mark_seq,client);
					}
    			}
    			
    			
    			
    		} else {
    			console.log(" 신규 데이터");
	    		// 신규 데이터 
				const insertHeader = await client.query(insertMarkHeader(request.body.user_no,request));
				const mark_seq = insertHeader.rows[0].cargo_mark_bookmark_seq;
				if(insertHeader.rowCount > 0) {
					setMarkDetail(request, response,mark_seq,client);
				}
    		}
    		
    		
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const setMarkDetail =async (request, response,mark_seq,client) => {
	
	
	
		console.log("insertHeader seq:",mark_seq);
		console.log("data seq:",request.body.data);

		const markData = request.body.data.mark_desc.split('\n');
		var insertData;
		var list={};
		var count = markData.length;
		var j=0;
		var seq=1;
		
			for(var i=0 ; i<markData.length ;i++) {
				//markData.map( async(mark,key) => {	
				//console.log(">>>>",markData[i]);
                	if(j < 5 ) {
    					list = { ...list,['mark_desc'+(j+1)]:markData[i],'mark_seq':seq};
    					count --;
    				} 
                   // console.log("seq1:",seq)
                	if( (j+1) % 5 === 0 || count === 0) {
    					console.log("insert &&  init seq:",seq);
    					insertData = await client.query(insertDetailMark(request.body.user_no,list,mark_seq));
    					seq ++;
    				//console.log("seq2:",seq)
    					j = 0;
    					list = {};
                	} else {
                		j++; 
                	}

			}
		response.status(200).json(insertData.rows);
}

const deleteMarkHeader = (user_no,data) => {
	const sql =   {
				text: ` delete from shp_sr_cargo_mark_bookmark_detail where user_no =$1 and cargo_mark_bookmark_seq=$2`,
				values: [user_no,data.cargo_mark_bookmark_seq]
			}
	  // console.log("deleteMarkHeader:",sql);
		
		return sql;
	}

const updateMarkHeader = (data,user_no,seq) => {
	const sql =  {
			text: ` update shp_sr_cargo_mark_bookmark set cargo_mark_bookmark_name=$1 where user_no =$2 and cargo_mark_bookmark_seq =$3`,
			values: [data.cargo_mark_bookmark_name,user_no,data.cargo_mark_bookmark_seq]
		}
//console.log("updateMarkHeader:",sql);
	
	return sql;
}

const insertDetailMark = (user_no,data,seq) => {
	return {
			text: `insert into shp_sr_cargo_mark_bookmark_detail(user_no,cargo_mark_bookmark_seq,mark_bookmark_detail_seq,mark_desc1,mark_desc2,mark_desc3,mark_desc4,mark_desc5)
		           values($1,$2,$3,$4,$5,$6,$7,$8)`,
		values: [user_no,seq,data.mark_seq,data.mark_desc1,data.mark_desc2,data.mark_desc3,data.mark_desc4,data.mark_desc5]
	}
}
const insertMarkHeader = (user_no,request) => {
	const sql =  {
			text: ` insert into shp_sr_cargo_mark_bookmark(user_no,cargo_mark_bookmark_seq,cargo_mark_bookmark_name)
		        select $1,coalesce((select max(cargo_mark_bookmark_seq::integer) from shp_sr_cargo_mark_bookmark where user_no=$2),0)+1,$3 RETURNING cargo_mark_bookmark_seq`,
		values: [user_no,user_no,request.body.data.cargo_mark_bookmark_name]
	}
//	console.log("insertMarkHeader:",sql);
	
	return sql;
}

const setUserGoodsBookmark = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		//const res = await client.query(sql);
    		console.log(" 기존 데이터");
    		// 기존 데이터
    		if(request.body.data.cargo_goods_bookmark_seq) {
    			const updateHeader = await client.query(updateGoodsHeader(request.body.data,request.body.user_no));
    			const deleteDetail = await client.query(deleteGoodsHeader(request.body.user_no,request.body.data));
    			console.log("updateHeader:",updateHeader);
    			console.log("deleteDetail:",deleteDetail.rowCount);
    			if(updateHeader.rowCount > 0) {
	    			const goods_seq = request.body.data.cargo_goods_bookmark_seq;
					setGoodsDetail(request, response,goods_seq,client);
    				
    			} else {
					const insertHeader = await client.query(insertGoodsHeader(request.body.user_no,request));
					const goods_seq = insertHeader.rows[0].cargo_goods_bookmark_seq;
					if(insertHeader.rows) {
						setGoodsDetail(request, response,goods_seq,client);
					}
    			}
    			
    			
    			
    		} else {
    			console.log(" 신규 데이터");
	    		// 신규 데이터 
				const insertHeader = await client.query(insertGoodsHeader(request.body.user_no,request));
				const goods_seq = insertHeader.rows[0].cargo_goods_bookmark_seq;
				if(insertHeader.rowCount > 0) {
					setGoodsDetail(request, response,goods_seq,client);
				}
    		}
    		
    		
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const setGoodsDetail =async (request, response,goods_seq,client) => {
	
	
	
		//console.log("insertHeader seq:",goods_seq);

		const goodsData = request.body.data.goods_desc.split('\n');
		var insertData;
		var list={};
		var count = goodsData.length;
		var j=0;
		var seq=1;
		
			for(var i=0 ; i<goodsData.length ;i++) {
				//goodsData.map( async(goods,key) => {	
				//console.log(">>>>",goodsData[i]);
                	if(j < 5 ) {
    					list = { ...list,['goods_desc'+(j+1)]:goodsData[i],'goods_seq':seq};
    					count --;
    				} 
                   // console.log("seq1:",seq)
                	if( (j+1) % 5 === 0 || count === 0) {
    					console.log("insert &&  init seq:",seq);
    					insertData = await client.query(insertDetailGoods(request.body.user_no,list,goods_seq));
    					seq ++;
    				//console.log("seq2:",seq)
    					j = 0;
    					list = {};
                	} else {
                		j++; 
                	}

			}
		response.status(200).json(insertData.rows);
}

const deleteGoodsHeader = (user_no,data) => {
	const sql =   {
				text: ` delete from shp_sr_cargo_goods_bookmark_detail where user_no =$1 and cargo_goods_bookmark_seq=$2`,
				values: [user_no,data.cargo_goods_bookmark_seq]
			}
	  // console.log("deleteGoodsHeader:",sql);
		
		return sql;
	}

const updateGoodsHeader = (data,user_no,seq) => {
	const sql =  {
			text: ` update shp_sr_cargo_goods_bookmark set cargo_goods_bookmark_name=$1 where user_no =$2 and cargo_goods_bookmark_seq =$3`,
			values: [data.cargo_goods_bookmark_name,user_no,data.cargo_goods_bookmark_seq]
		}
//console.log("updateGoodsHeader:",sql);
	
	return sql;
}

const insertDetailGoods = (user_no,data,seq) => {
	return {
			text: `insert into shp_sr_cargo_goods_bookmark_detail(user_no,cargo_goods_bookmark_seq,goods_bookmark_detail_seq,goods_desc1,goods_desc2,goods_desc3,goods_desc4,goods_desc5)
		           values($1,$2,$3,$4,$5,$6,$7,$8)`,
		values: [user_no,seq,data.goods_seq,data.goods_desc1,data.goods_desc2,data.goods_desc3,data.goods_desc4,data.goods_desc5]
	}
}
const insertGoodsHeader = (user_no,request) => {
	const sql =  {
			text: ` insert into shp_sr_cargo_goods_bookmark(user_no,cargo_goods_bookmark_seq,cargo_goods_bookmark_name)
		        select $1,coalesce((select max(cargo_goods_bookmark_seq::integer) from shp_sr_cargo_goods_bookmark where user_no=$2),0)+1,$3 RETURNING cargo_goods_bookmark_seq`,
		values: [user_no,user_no,request.body.data.cargo_goods_bookmark_name]
	}
//	console.log("insertGoodsHeader:",sql);
	
	return sql;
}

const selectBookingContainerBookmark = (request, response) => {
    const sql = {
		text: ` SELECT (row_number() over(order by insert_date desc)) as seq
 , user_no, container_bookmark_seq, container_bookmark_name
 , container_bookmark_seq as value, container_bookmark_name as label
 , cntr_size, cntr_type 
 , cntr_qty, cntr_length, cntr_width, cntr_height, cntr_frozen_tmp, cntr_frozen_tmp_unit 
 , cntr_frozen_fc, cntr_soc_yn, cntr_seal_no, cntr_code, cntr_pick_up_cy_code 
 , cntr_pick_up_cy_address1, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3, cntr_pick_up_cy_address4, cntr_pick_up_cy_address5 
 , cntr_pick_up_cy_name1, cntr_pick_up_cy_name2, cntr_pick_up_cy_date, cntr_empty_yn 
 , cntr_special_type, cntr_vent_open, cntr_pre_cooling, insert_date, insert_user, update_date, update_user 
 ,( select cntr_code_name
 from own_line_code_cntr_sztp b
 where b.line_code = $1
 and b.cntr_code=a.cntr_code) cntr_code_name
 , cntr_door_code, cntr_door_name1, cntr_door_name2, cntr_door_date
 ,to_char(to_timestamp(cntr_door_date,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI')  as cntr_door_date_name
 , cntr_door_user_name
 , cntr_door_user_dept, cntr_door_user_fax, cntr_door_user_tel, cntr_door_user_email
 , cntr_door_address1, cntr_door_address2, cntr_door_address3, cntr_door_address4, cntr_door_address5
 , cntr_remark1, cntr_remark2, cntr_remark3, cntr_remark4, cntr_remark5
 , cntr_cfs_code, cntr_cfs_name1, cntr_cfs_name2
 , cntr_cfs_address1, cntr_cfs_address2, cntr_cfs_address3, cntr_cfs_address4, cntr_cfs_address5
 , cntr_stock_date, shor_trns_or_not, shor_name
 FROM public.shp_bkg_container_bookmark a 
 WHERE user_no = $2 
 order by insert_date desc`,
		values: [
			request.body.line_code,
			request.body.user_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Conatiner Special Bookmark 조회
const selectBookingSpecialBookmark = (request, response) => {
    const sql = {
		text: ` SELECT user_no, container_special_bookmark_seq, container_special_bookmark_name 
 , container_special_bookmark_seq as value, container_special_bookmark_name as label
 , special_undg, special_imdg, special_ignition, special_ignition_type, special_out_pack_type 
 , special_out_pack_cnt, special_out_pack_grade, special_gross_weight, special_net_weight 
 , special_pack_group, special_tech_name, special_pollutant, special_shipping_name, special_user_name 
 , special_user_dept, special_user_tel, special_user_fax, special_user_email 
 , insert_date, insert_user, update_date, update_user 
 FROM public.shp_bkg_container_special_bookmark 
 WHERE user_no = $1  `,
		values: [
			request.body.user_no,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectContainerOfBooking = (request, response) => {
    const sql = {
		text: ` SELECT a.owner_no, a.bkg_no, a.bkg_date, a.user_no 
 , a.status_cus, a.send_date, a.sc_no 
 , coalesce(b.cntr_seq,'1') cntr_seq, b.owner_no
 , b.container_bookmark_seq, b.container_bookmark_seq as init_container_bookmark_seq
 , b.cntr_size, b.cntr_type, b.cntr_qty, b.cntr_length
 , b.cntr_width, b.cntr_height, b.cntr_frozen_tmp, b.cntr_frozen_tmp_unit
 , b.cntr_frozen_fc
 , coalesce(case when a.line_code = 'WDFC' 
 then 'N'
 else b.cntr_soc_yn
 end, 'N') cntr_soc_yn, b.cntr_seal_no, b.cntr_pick_up_cy_code
 , b.cntr_pick_up_cy_address1, b.cntr_pick_up_cy_address2
 , b.cntr_pick_up_cy_address3, b.cntr_pick_up_cy_address4, b.cntr_pick_up_cy_address5
 , b.cntr_pick_up_cy_name1, b.cntr_pick_up_cy_name2
 , b.cntr_pick_up_cy_date
 , case when length(cntr_pick_up_cy_date) = 8
        then to_char(to_timestamp(b.cntr_pick_up_cy_date,'YYYYMMDD'),'YYYY-MM-DD') 
        else cntr_pick_up_cy_date
   end as cntr_pick_up_cy_date_name
 , b.cntr_empty_yn
 , b.cntr_special_type, b.cntr_code, b.cntr_pick_up_cy_user_name, b.cntr_pick_up_cy_user_fax
 , b.cntr_pick_up_cy_user_tel, b.cntr_pick_up_cy_user_email, b.cntr_vent_open, b.cntr_pre_cooling
 , b.insert_date, b.insert_user, b.update_date, b.update_user
 ,(select c.container_bookmark_name from shp_bkg_container_bookmark c where c.user_no=b.user_no and c.container_bookmark_seq = b.container_bookmark_seq) container_bookmark_name 
 ,'Y' as cntr_yn
 , cntr_door_code, cntr_door_name1, cntr_door_name2, cntr_door_date
 ,substring(b.cntr_door_date,0,9) as cntr_door_date_yyyy
 ,coalesce(substring(b.cntr_door_date,9,2),'00') as cntr_door_date_time
 ,coalesce(substring(b.cntr_door_date,11,2),'00') as cntr_door_date_min
 ,case when length(cntr_door_date) = 12 
       then to_char(to_timestamp(b.cntr_door_date,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI')
       else cntr_door_date
  end as cntr_door_date_name
 , cntr_door_user_name
 , cntr_door_user_dept, cntr_door_user_fax, cntr_door_user_tel, cntr_door_user_email
 , cntr_door_address1, cntr_door_address2, cntr_door_address3, cntr_door_address4, cntr_door_address5
 , cntr_remark1, cntr_remark2, cntr_remark3, cntr_remark4, cntr_remark5
 , cntr_cfs_code, cntr_cfs_name1, cntr_cfs_name2
 , cntr_cfs_address1, cntr_cfs_address2, cntr_cfs_address3, cntr_cfs_address4, cntr_cfs_address5
 , cntr_drop_off_cy_code, cntr_drop_off_cy_name1, cntr_drop_off_cy_name2
 , cntr_drop_off_cy_address1, cntr_drop_off_cy_address2, cntr_drop_off_cy_address3, cntr_drop_off_cy_address4, cntr_drop_off_cy_address5
 , cntr_stock_date, shor_trns_or_not, shor_name
 FROM shp_bkg a 
 left outer join shp_bkg_cntr b 
 on a.bkg_no = b.bkg_no and a.bkg_date = b.bkg_date and a.user_no = b.user_no
 where a.user_no = $1 
 AND a.bkg_no = $2 
 AND a.bkg_date = $3
 ORDER BY cast(b.cntr_seq as numeric) `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			const res = await client.query(sql);
			
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking의 Container Special 조회
const selectContainerSpecialOfBooking = (request, response) => {
    const sql = {
		text: ` select a.owner_no, a.bkg_no, a.bkg_date, a.user_no 
, a.status_cus, a.send_date, a.sc_no
, c.special_seq, b.cntr_seq, c.container_special_bookmark_seq
, c.special_undg, c.special_imdg, c.special_ignition, c.special_ignition_type
, c.special_out_pack_type, c.special_out_pack_cnt, c.special_out_pack_grade
, c.special_gross_weight, c.special_net_weight, c.special_pack_group, c.special_tech_name
, c.special_pollutant, c.special_shipping_name, c.special_user_name, c.special_user_dept
, c.special_user_tel, c.special_user_fax, c.special_user_email
, c.insert_date, c.insert_user, c.update_date, c.update_user
,(select d.container_special_bookmark_name from shp_bkg_container_special_bookmark d 
 where d.user_no=a.user_no and d.container_special_bookmark_seq = c.container_special_bookmark_seq) container_special_bookmark_name
 from shp_bkg a
 inner join shp_bkg_cntr b
 on a.user_no = b.user_no and a.bkg_no= b.bkg_no and a.bkg_date = b.bkg_date
 left outer join shp_bkg_cntr_special c
 on c.user_no = b.user_no and c.bkg_no= b.bkg_no and c.bkg_date = b.bkg_date and b.cntr_seq = c.cntr_seq
 where a.user_no = $1 
 AND a.bkg_no = $2 
 AND a.bkg_date = $3
 order by cast(b.cntr_seq as numeric), cast(c.special_seq as numeric) `,
		values: [
			request.body.booking.user_no,
			request.body.booking.bkg_no,
			request.body.booking.bkg_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			const res = await client.query(sql);
			
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// ContainerBookmark 입력
const insertBoookingContainerBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_container_bookmark
 (user_no
 , container_bookmark_seq
 , container_bookmark_name
 , cntr_qty, cntr_length, cntr_width, cntr_height
 , cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc
 , cntr_soc_yn, cntr_seal_no, cntr_code, cntr_pick_up_cy_code
 , cntr_pick_up_cy_address1, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3
 , cntr_pick_up_cy_address4, cntr_pick_up_cy_address5
 , cntr_pick_up_cy_name1, cntr_pick_up_cy_name2
 , cntr_pick_up_cy_date, cntr_empty_yn, cntr_special_type
 , cntr_vent_open, cntr_pre_cooling
 , insert_date, insert_user
 , cntr_door_code, cntr_door_name1, cntr_door_name2, cntr_door_date, cntr_door_user_name
 , cntr_door_user_dept, cntr_door_user_fax, cntr_door_user_tel, cntr_door_user_email
 , cntr_door_address1, cntr_door_address2, cntr_door_address3, cntr_door_address4, cntr_door_address5
 , cntr_remark1, cntr_remark2, cntr_remark3, cntr_remark4, cntr_remark5
 , cntr_cfs_code, cntr_cfs_name1, cntr_cfs_name2
 , cntr_cfs_address1, cntr_cfs_address2, cntr_cfs_address3, cntr_cfs_address4, cntr_cfs_address5)
 VALUES($1
 , (select coalesce(max (cast(container_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_container_bookmark
 where user_no = $2)
 , $3, $4, $5, $6, $7, $8, $9
 , $10, $11, $12, $13, $14, $15, $16
 , $17, $18, $19, $20, $21
 , $22, $23, $24, $25, $26
 , now(), $27
 , $28, $29, $30, $31, $32
 , $33, $34, $35, $36
 , $37, $38, $39, $40, $41
 , $42, $43, $44, $45, $46
 , $47, $48, $49
 , $50, $51, $52, $53, $54)
 RETURNING container_bookmark_seq`,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.container.container_bookmark_name
			, request.body.container.cntr_qty, request.body.container.cntr_length
			, request.body.container.cntr_width, request.body.container.cntr_height
			, request.body.container.cntr_frozen_tmp, request.body.container.cntr_frozen_tmp_unit 
			, request.body.container.cntr_frozen_fc, request.body.container.cntr_soc_yn
			, request.body.container.cntr_seal_no, request.body.container.cntr_code, request.body.container.cntr_pick_up_cy_code
			, request.body.container.cntr_pick_up_cy_address1, request.body.container.cntr_pick_up_cy_address2
			, request.body.container.cntr_pick_up_cy_address3, request.body.container.cntr_pick_up_cy_address4
			, request.body.container.cntr_pick_up_cy_address5, request.body.container.cntr_pick_up_cy_name1
			, request.body.container.cntr_pick_up_cy_name2, request.body.container.cntr_pick_up_cy_date
			, request.body.container.cntr_empty_yn, request.body.container.cntr_special_type
			, request.body.container.cntr_vent_open, request.body.container.cntr_pre_cooling, request.body.user_no
			, request.body.container.cntr_door_code, request.body.container.cntr_door_name1, request.body.container.cntr_door_name2
			, request.body.container.cntr_door_date, request.body.container.cntr_door_user_name
			, request.body.container.cntr_door_user_dept, request.body.container.cntr_door_user_fax, request.body.container.cntr_door_user_tel
			, request.body.container.cntr_door_user_email, request.body.container.cntr_door_address1, request.body.container.cntr_door_address2
			, request.body.container.cntr_door_address3, request.body.container.cntr_door_address4, request.body.container.cntr_door_address5
			, request.body.container.cntr_remark1, request.body.container.cntr_remark2, request.body.container.cntr_remark3, request.body.container.cntr_remark4
			, request.body.container.cntr_remark5
			, request.body.container.cntr_cfs_code, request.body.container.cntr_cfs_name1, request.body.container.cntr_cfs_name2
			, request.body.container.cntr_cfs_address1, request.body.container.cntr_cfs_address2, request.body.container.cntr_cfs_address3, request.body.container.cntr_cfs_address4, request.body.container.cntr_cfs_address5
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			// 1. Container bookmark update 수행
			const res = await client.query(sql);
			let container = request.body.container;
			let specialBookmarkRelationList = request.body.specialBookmarkRelationList;
			container.container_bookmark_seq = res.rows[0].container_bookmark_seq;
			// 2. Bookmark Relation을 새로 입력하기 위한 delete query
			let deleteSql = await deleteContainerSpecialRelation(container);
			await client.query(deleteSql);
			// 3. 새로운 Bookmark Relation 입력
			if( specialBookmarkRelationList.length > 0 ) {
				await Promise.all(
					specialBookmarkRelationList.map((element, key)=>{
						// 3.1 입력하기
						if( element.container_bookmark_seq ) {
							let insertSql = insertContainerSpecialRelation( container, element, request.body.user_no );
							client.query(insertSql);
						}
					})
				);
			}
			
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const deleteContainerSpecialRelation=(container)=>{
	const sql = {
		text: ` DELETE FROM shp_bkg_container_special_bookmark_relation
 WHERE user_no=$1 AND container_bookmark_seq=$2 `,
		values: [
			container.user_no, container.container_bookmark_seq
		]
	}
	console.log(sql);
	return sql;
}
const insertContainerSpecialRelation=(container, special, user_no)=>{
	const sql = {
		text: ` INSERT INTO public.shp_bkg_container_special_bookmark_relation
 (user_no, container_bookmark_seq, container_special_bookmark_seq, insert_date, insert_user)
 VALUES($1, $2, $3, now(), $4) `,
		values: [
			container.user_no
			, container.container_bookmark_seq
			, special.container_special_bookmark_seq
			, user_no
		]
	}
	console.log(sql);
	return sql;
}

// ContainerBookmark 수정
const updateBoookingContainerBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE public.shp_bkg_container_bookmark
 SET container_bookmark_name=$1, cntr_size=$2, cntr_type=$3
 , cntr_qty=$4, cntr_length=$5, cntr_width=$6, cntr_height=$7
 , cntr_frozen_tmp=$8, cntr_frozen_tmp_unit=$9, cntr_frozen_fc=$10
 , cntr_soc_yn=$11, cntr_seal_no=$12, cntr_code=$13, cntr_pick_up_cy_code=$14
 , cntr_pick_up_cy_address1=$15, cntr_pick_up_cy_address2=$16
 , cntr_pick_up_cy_address3=$17, cntr_pick_up_cy_address4=$18, cntr_pick_up_cy_address5=$19
 , cntr_pick_up_cy_name1=$20, cntr_pick_up_cy_name2=$21, cntr_pick_up_cy_date=$22
 , cntr_empty_yn=$23, cntr_special_type=$24, cntr_vent_open=$25, cntr_pre_cooling=$26
 , update_date=now(), update_user=$27
 , cntr_door_code=$28, cntr_door_name1=$29, cntr_door_name2=$30, cntr_door_date=$31, cntr_door_user_name=$32
 , cntr_door_user_dept=$33, cntr_door_user_fax=$34, cntr_door_user_tel=$35, cntr_door_user_email=$36
 , cntr_door_address1=$37, cntr_door_address2=$38, cntr_door_address3=$39, cntr_door_address4=$40, cntr_door_address5=$41
 , cntr_remark1=$42, cntr_remark2=$43, cntr_remark3=$44, cntr_remark4=$45, cntr_remark5=$46
 WHERE user_no=$47 AND container_bookmark_seq=$48 `,
		values: [
			request.body.container.container_bookmark_name
			, request.body.container.cntr_size, request.body.container.cntr_type 
			, request.body.container.cntr_qty, request.body.container.cntr_length
			, request.body.container.cntr_width, request.body.container.cntr_height
			, request.body.container.cntr_frozen_tmp, request.body.container.cntr_frozen_tmp_unit 
			, request.body.container.cntr_frozen_fc, request.body.container.cntr_soc_yn
			, request.body.container.cntr_seal_no, request.body.container.cntr_code, request.body.container.cntr_pick_up_cy_code
			, request.body.container.cntr_pick_up_cy_address1, request.body.container.cntr_pick_up_cy_address2
			, request.body.container.cntr_pick_up_cy_address3, request.body.container.cntr_pick_up_cy_address4
			, request.body.container.cntr_pick_up_cy_address5, request.body.container.cntr_pick_up_cy_name1
			, request.body.container.cntr_pick_up_cy_name2, request.body.container.cntr_pick_up_cy_date
			, request.body.container.cntr_empty_yn, request.body.container.cntr_special_type
			, request.body.container.cntr_vent_open, request.body.container.cntr_pre_cooling, request.body.user_no
			, request.body.container.cntr_door_code, request.body.container.cntr_door_name1, request.body.container.cntr_door_name2, request.body.container.cntr_door_date, request.body.container.cntr_door_user_name
			, request.body.container.cntr_door_user_dept, request.body.container.cntr_door_user_fax, request.body.container.cntr_door_user_tel, request.body.container.cntr_door_user_email
			, request.body.container.cntr_door_address1, request.body.container.cntr_door_address2, request.body.container.cntr_door_address3, request.body.container.cntr_door_address4, request.body.container.cntr_door_address5
			, request.body.container.cntr_remark1, request.body.container.cntr_remark2, request.body.container.cntr_remark3, request.body.container.cntr_remark4, request.body.container.cntr_remark5
			, request.body.container.user_no, request.body.container.container_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			// 1. Container bookmark update 수행
			const res = await client.query(sql);
			let container = request.body.container;
			let specialBookmarkRelationList = request.body.specialBookmarkRelationList;
			// container.container_bookmark_seq = res.rows[0].container_bookmark_seq;
			// 2. Bookmark Relation을 새로 입력하기 위한 delete query
			let deleteSql = await deleteContainerSpecialRelation(container);
			await client.query(deleteSql);
			// 3. 새로운 Bookmark Relation 입력
			if( specialBookmarkRelationList.length > 0 ) {
				await Promise.all(
					specialBookmarkRelationList.map((element, key)=>{
						// 3.1 입력하기
						if( element.container_special_bookmark_seq ) {
							let insertSql = insertContainerSpecialRelation( container, element, request.body.user_no );
							client.query(insertSql);
						}
					})
				);
			}
			
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// ContainerBookmark 삭제
const deleteBookingContainerBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM public.shp_bkg_container_bookmark
 WHERE user_no=$1 AND container_bookmark_seq=$2 `,
		values: [
			request.body.container.user_no, request.body.container.container_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// SpecialBookmark 입력
const insertBookingSpecialBookmark = (request, response) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_container_special_bookmark
 (user_no, container_special_bookmark_seq, container_special_bookmark_name
 , special_undg, special_imdg, special_ignition, special_ignition_type
 , special_out_pack_type, special_out_pack_cnt, special_out_pack_grade
 , special_gross_weight, special_net_weight, special_pack_group
 , special_tech_name, special_pollutant, special_shipping_name
 , special_user_name, special_user_dept, special_user_tel
 , special_user_fax, special_user_email, insert_date, insert_user)
 VALUES($1
 , (select coalesce(max (cast(container_special_bookmark_seq as numeric) ),0)+1 
 from shp_bkg_container_special_bookmark
 where user_no = $2), $3
 , $4, $5, $6, $7
 , $8, $9, $10
 , $11, $12, $13, $14, $15, $16
 , $17, $18, $19, $20, $21, now(), $22) `,
		values: [
			request.body.user_no, request.body.user_no
			, request.body.special.container_special_bookmark_name
			, request.body.special.special_undg, request.body.special.special_imdg , request.body.special.special_ignition, request.body.special.special_ignition_type
			, request.body.special.special_out_pack_type, request.body.special.special_out_pack_cnt, request.body.special.special_out_pack_grade
			, request.body.special.special_gross_weight, request.body.special.special_net_weight, request.body.special.special_pack_group
			, request.body.special.special_tech_name, request.body.special.special_pollutant, request.body.special.special_shipping_name
			, request.body.special.special_user_name, request.body.special.special_user_dept, request.body.special.special_user_tel
			, request.body.special.special_user_fax, request.body.special.special_user_email
			, request.body.user_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking SpecialBookmark 수정
const updateBookingSpecialBookmark = (request, response) => {
    const sql = {
		text: ` UPDATE public.shp_bkg_container_special_bookmark
 SET container_special_bookmark_name=$1, special_undg=$2, special_imdg=$3
 , special_ignition=$4, special_ignition_type=$5, special_out_pack_type=$6
 , special_out_pack_cnt=$7, special_out_pack_grade=$8, special_gross_weight=$9
 , special_net_weight=$10, special_pack_group=$11, special_tech_name=$12
 , special_pollutant=$13, special_shipping_name=$14, special_user_name=$15
 , special_user_dept=$16, special_user_tel=$17, special_user_fax=$18
 , special_user_email=$19, update_date=now(), update_user=$20
 WHERE user_no=$21 AND container_special_bookmark_seq=$22 `,
		values: [
			request.body.special.container_special_bookmark_name
			, request.body.special.special_undg, request.body.special.special_imdg 
			, request.body.special.special_ignition, request.body.special.special_ignition_type
			, request.body.special.special_out_pack_type, request.body.special.special_out_pack_cnt
			, request.body.special.special_out_pack_grade, request.body.special.special_gross_weight 
			, request.body.special.special_net_weight, request.body.special.special_pack_group
			, request.body.special.special_tech_name, request.body.special.special_pollutant
			, request.body.special.special_shipping_name, request.body.special.special_user_name
			, request.body.special.special_user_dept, request.body.special.special_user_tel
			, request.body.special.special_user_fax, request.body.special.special_user_email
			, request.body.user_no, request.body.special.user_no, request.body.special.container_special_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// SpecialBookmark 삭제
const deleteBookingSpecialBookmark = (request, response) => {
    const sql = {
		text: ` DELETE FROM public.shp_bkg_container_special_bookmark
 WHERE user_no=$1 AND container_special_bookmark_seq=$2 `,
		values: [
			request.body.special.user_no, request.body.special.container_special_bookmark_seq
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// 업무로직 : vessel 명으로 조회 했을 경우 관련된 pickup 정보 조회
// vessel 명으로 조회 했을 경우 아무것도나오지 않았다면
// vessel 명 제외 후 다시 조회 한다
const selectLineCodeVesselPickup = (request, response) => {

	let params = [];
	let query = ` SELECT a.line_code
 , a.pickup_cy_code, a.pickup_cy_name, a.pickup_cy_addr, a.terminal
 , a.pickup_cy_code as value, a.pickup_cy_name as label
 ,substring(pickup_cy_name, 0, 35) as pickup_cy_name1
,substring(pickup_cy_name, 35) as pickup_cy_name2
,substring(pickup_cy_addr, 0, 35) as pickup_cy_address1
,substring(pickup_cy_addr, 35, 35) as pickup_cy_address2
,substring(pickup_cy_addr, 70, 35) as pickup_cy_address3
 FROM own_line_code_vessel_pickup a
 ,own_line_code_vessel_name b
 WHERE a.line_code = $1
 and a.vessel_code = b.vessel_code `
	if( request.body.params.sch_vessel_name ) {
		query += ' and b.vessel_name = $2';
		params = [
			request.body.params.line_code,
			request.body.params.sch_vessel_name,
		];
	} else {
		params = [
			request.body.params.line_code,
		];
	}
query += ` group by a.line_code
, a.pickup_cy_code, a.pickup_cy_name, a.pickup_cy_addr, a.terminal `
    let sql = {
		text: query,
		values: params
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			let res = await client.query(sql);
			if( res.rows.length < 1 && request.body.params.sch_vessel_name ) {
				sql = {
					text: ` SELECT a.line_code
 , a.pickup_cy_code, a.pickup_cy_name, a.pickup_cy_addr, a.terminal
 , a.pickup_cy_code as value, a.pickup_cy_name as label
 ,substring(pickup_cy_name, 0, 35) as pickup_cy_name1
,substring(pickup_cy_name, 35) as pickup_cy_name2
,substring(pickup_cy_addr, 0, 35) as pickup_cy_address1
,substring(pickup_cy_addr, 35, 35) as pickup_cy_address2
,substring(pickup_cy_addr, 70, 35) as pickup_cy_address3
 FROM own_line_code_vessel_pickup a
 ,own_line_code_vessel_name b
 WHERE a.line_code = $1
 and a.vessel_code = b.vessel_code
 group by a.line_code
 , a.pickup_cy_code, a.pickup_cy_name, a.pickup_cy_addr, a.terminal `,
					values: params = [
						request.body.params.line_code,
					]
				}
				res = await client.query(sql);
			}
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}



const selectLineCodeSztpPickup = (request, response) => {
	const sql = {
		text: ` SELECT line_code, cntr_code
,pickup_cy_code, pickup_cy_name, pickup_cy_addr, terminal
,a.pickup_cy_code as value, a.pickup_cy_name as label
,substring(pickup_cy_name, 0, 35) as pickup_cy_name1
,substring(pickup_cy_name, 35) as pickup_cy_name2
,substring(pickup_cy_addr, 0, 35) as pickup_cy_address1
,substring(pickup_cy_addr, 35, 35) as pickup_cy_address2
,substring(pickup_cy_addr, 70, 35) as pickup_cy_address3
 FROM public.own_line_code_cntr_sztp_pickup a
 where line_code = $1
 and cntr_code = $2 `,
		values: [
			request.body.params.line_code,
			request.body.params.cntr_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))

}


/**
 * serviceCode CFS->CY 인 경우
 * Vessel명, POL, POD, 페리선, 화물선 종류에 따라 CFS 반입지 조회
 * @param {*} request 
 * @param {*} response 
 */
const selectLineCodeVesselPortCfs = (request, response) => {
    const sql = {
		text: ` select b.cfs_code as value, b.cfs_name as label, b.cfs_address, b.cfs_code, b.cfs_name
 from own_line_code_vessel a
 ,own_line_code_vessel_route_cfs b
 where a.vessel_code = b.vessel_code
 and a.line_code = b.line_code
 and a.line_code = $1
 and a.vessel_name = $2
 and b.start_port_code = $3
 and b.end_port_code = $4
 union
 select c.cfs_code as value, c.cfs_name as label, c.cfs_address, c.cfs_code, c.cfs_name
 from own_line_code_vessel_route_cfs c
 where vessel_code='*'
 and start_port_code = '*'
 and end_port_code = '*'
 and not exists(
 select 'x'
 from own_line_code_vessel a
 ,own_line_code_vessel_route_cfs b
 where a.vessel_code = b.vessel_code
 and a.line_code = b.line_code
 and a.line_code = $1
 and a.vessel_name = $2
 and b.start_port_code = $3
 and b.end_port_code = $4
 and b.line_code = c.line_code
 and b.vessel_code = b.vessel_code) `,
		values: [
			request.body.params.line_code,
			request.body.params.sch_vessel_name,
			request.body.params.sch_pol,
			request.body.params.sch_pod,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}




// Booking의 Special 조회
const selectLineCodeCntrSztp = (request, response) => {
    const sql = {
		text: ` SELECT line_code, cntr_code, iso_code, cntr_code_name
 , type_code, size_code, cmt_length, cmt_width, cmt_height
 , cntr_code as value, cntr_code_name as label
 FROM own_line_code_cntr_sztp
 WHERE line_code=$1
 order by cntr_code `,
		values: [
			request.body.params.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Conatainer 와 Special Bookmark Relation 조회
const selectBookingContainerSpecialBookmarkRelation = (request, response) => {
    const sql = {
		text: ` SELECT a.user_no, container_bookmark_seq
, a.container_special_bookmark_seq, b.container_special_bookmark_name
, a.container_special_bookmark_seq as value, b.container_special_bookmark_name as label
, a.insert_date, a.insert_user
, b.special_imdg, b.special_undg
, b.special_ignition, b.special_ignition_type
 FROM public.shp_bkg_container_special_bookmark_relation a
 left outer join shp_bkg_container_special_bookmark b
 on a.user_no = b.user_no and a.container_special_bookmark_seq = b.container_special_bookmark_seq
 WHERE a.user_no=$1
 AND a.container_bookmark_seq=$2 `,
		values: [
			request.body.user_no, request.body.container.container_bookmark_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Booking Container 입력
const saveContainerOfBooking = (request, response) => {
	
    (async () => {

		try {
			let pending = generateContainerOfBooking(request);
			pending.then(function(result) {
				response.status(200).json(result);
			});
		} catch (error) {
			console.log("[ERROR]",error); response.status(400).json(error);
		 } finally {
			
		}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const generateContainerOfBooking = async (request)=>{
	const client = await pgsqlPool.connect();
	try {
		// Booking 정보
		let booking = request.body.booking;
		// Container 목록
		let containerList = request.body.containerList;
		// 위험물 여부
		let dangerTrue = request.body.dangerTrue;
		// door 정보
		let door = request.body.door;

		// Special 목록
		let specialList = request.body.containerSpecialList;
		// 1. Container Special Booking 정보 삭제
		let sql = await deleteContainerSpecialOfBooking(booking);
		let res = await client.query(sql);
		// 2. Container Booking 정보 삭제
		sql = await deleteContainerOfBooking(booking);
		res = await client.query(sql);

		// CNTR CODE 없으면 입력하지 말자
		let cntrCode = false;
		containerList.map((row, i)=>{
			if( !row.cntr_code ) cntrCode = true;
		});
		if( cntrCode ) return false;
		// containerList 목록에서 combobox로 선택한게 있는지 체크
		// if( "Y" === booking.cntr_selected_yn ) {
		// 	// 3.1 Bookmark 정보로 입력해야 함
		// 	sql = await insertContainerForBookmark(booking, request.body.user_no);
		// 	res = await client.query(sql);
		// 	sql = await insertContainerSpecialForBookmark(booking, request.body.user_no);
		// 	res = await client.query(sql);
		// }  else {
			// 3.2 Container Special 입력
			if( containerList.length > 0 ) {
				await Promise.all(
					containerList.map((element, key)=>{
						// 3.1 입력하기
						// 라인운송인 경우(N) Door 입력 
						// 자가운송인 경우(Y) Door 입력 부분 삭제처리
						if( "Y" === booking.trans_self_yn && "WDFC" === booking.line_code ) {
							door.cntr_door_code = null;
							door.cntr_door_name1 = null;
							door.cntr_door_name2 = null;
							door.cntr_door_date = null;
							door.cntr_door_user_name = null;
							door.cntr_door_user_dept = null;
							door.cntr_door_user_fax = null;
							door.cntr_door_user_tel = null;
							door.cntr_door_user_email = null;
							door.cntr_door_address1 = null;
							door.cntr_door_address2 = null;
							door.cntr_door_address3 = null;
							door.cntr_door_address4 = null;
							door.cntr_door_address5 = null;
							// element.cntr_remark1 = null;
							// element.cntr_remark2 = null;
							// element.cntr_remark3 = null;
							// element.cntr_remark4 = null;
							// element.cntr_remark5 = null;
						}
						if( element.cntr_seq ) {
							sql = insertContainerOfBooking( booking, element, request.body.user_no, door );
							res = client.query(sql);
						}
					})
				);
			}
			// console.log("specialList length ",containerList.length)
			// console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>dangerTrue', dangerTrue, true===dangerTrue, 'true'===dangerTrue)
			// Speical 입력 조건 위험물 True
			if( true === dangerTrue ) {
				if( specialList.length > 0 ) {
					await Promise.all(
						specialList.map((element, key)=>{
							// 3.1 입력하기
							if( element.cntr_seq && ( element.special_undg || element.special_imdg ) ) {
								sql = insertContainerSpecialOfBooking( booking, element, request.body.user_no );
								res = client.query(sql);
							}
						})
					);
				}
			}
		// }
	} finally {
		client.release();
	}
}
const deleteContainerSpecialOfBooking=(booking)=>{
	const sql = {
		text: ` DELETE FROM public.shp_bkg_cntr_special
 WHERE user_no=$1 AND bkg_no=$2 AND bkg_date=$3 `,
		values: [
			booking.user_no, booking.bkg_no, booking.bkg_date
		]
	}
	console.log(sql);
	return sql;
}
const deleteContainerOfBooking=(booking)=>{
	const sql = {
		text: ` DELETE FROM public.shp_bkg_cntr
 WHERE user_no=$1 AND bkg_no=$2 AND bkg_date=$3 `,
		values: [
			booking.user_no, booking.bkg_no, booking.bkg_date
		]
	}
	console.log(sql);
	return sql;
}
const insertContainerOfBooking=(booking, container, user_no, door )=>{
	// 	(select coalesce(max (cast(cntr_seq as numeric) ),0)+1 
	//  from shp_bkg_cntr
	//  where user_no=$4 AND bkg_no=$5 AND bkg_date=$6 )
		const sql = {
			text: ` INSERT INTO shp_bkg_cntr
	 (user_no, bkg_no, bkg_date, cntr_seq, container_bookmark_seq
	 , cntr_size, cntr_type, cntr_qty, cntr_length, cntr_width
	 , cntr_height, cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc, cntr_soc_yn
	 , cntr_seal_no, cntr_pick_up_cy_code, cntr_pick_up_cy_address1, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3
	 , cntr_pick_up_cy_address4, cntr_pick_up_cy_address5, cntr_pick_up_cy_name1, cntr_pick_up_cy_name2, cntr_pick_up_cy_date
	 , cntr_empty_yn, cntr_special_type, cntr_code, cntr_pick_up_cy_user_name, cntr_pick_up_cy_user_fax
	 , cntr_pick_up_cy_user_tel, cntr_pick_up_cy_user_email, cntr_vent_open, cntr_pre_cooling, insert_date
	 , insert_user, owner_no, cntr_door_code, cntr_door_name1, cntr_door_name2
	 , cntr_door_date, cntr_door_user_name, cntr_door_user_dept, cntr_door_user_fax, cntr_door_user_tel
	 , cntr_door_user_email, cntr_door_address1, cntr_door_address2, cntr_door_address3, cntr_door_address4
	 , cntr_door_address5, cntr_remark1, cntr_remark2, cntr_remark3, cntr_remark4
	 , cntr_remark5, cntr_cfs_code, cntr_cfs_name1, cntr_cfs_name2, cntr_cfs_address1
	 , cntr_cfs_address2, cntr_cfs_address3, cntr_cfs_address4, cntr_cfs_address5
	 , cntr_drop_off_cy_code, cntr_drop_off_cy_name1, cntr_drop_off_cy_name2
	 , cntr_drop_off_cy_address1, cntr_drop_off_cy_address2, cntr_drop_off_cy_address3, cntr_drop_off_cy_address4, cntr_drop_off_cy_address5
	 , cntr_stock_date, shor_trns_or_not, shor_name)
	 VALUES($1, $2, $3, $4, $5
	 , $6, $7, $8, $9, $10
	 , $11, $12, $13, $14, $15
	 , $16, $17, $18, $19, $20
	 , $21, $22, $23, $24, $25
	 , $26, $27, $28, $29, $30
	 , $31, $32, $33, $34, now()
	 , $35, $36, $37, $38, $39
	 , $40, $41, $42, $43, $44
	 , $45, $46, $47, $48, $49
	 , $50, $51, $52, $53, $54
	 , $55, $56, $57, $58, $59
	 , $60, $61, $62, $63
	 , $64, $65, $66
	 , $67, $68, $69, $70, $71
	 , $72, $73, $74) `,
			values: [
				booking.user_no, booking.bkg_no, booking.bkg_date, container.cntr_seq, container.container_bookmark_seq
				, container.cntr_size, container.cntr_type, container.cntr_qty, container.cntr_length, container.cntr_width
				, container.cntr_height, container.cntr_frozen_tmp, container.cntr_frozen_tmp?'CEL':null, container.cntr_frozen_fc, container.cntr_soc_yn
				, container.cntr_seal_no, container.cntr_pick_up_cy_code, container.cntr_pick_up_cy_address1, container.cntr_pick_up_cy_address2, container.cntr_pick_up_cy_address3
				, container.cntr_pick_up_cy_address4, container.cntr_pick_up_cy_address5, container.cntr_pick_up_cy_name1, container.cntr_pick_up_cy_name2, container.cntr_pick_up_cy_date
				, container.cntr_empty_yn, container.cntr_special_type, container.cntr_code, container.cntr_pick_up_cy_user_name, container.cntr_pick_up_cy_user_fax
				, container.cntr_pick_up_cy_user_tel, container.cntr_pick_up_cy_user_email, container.cntr_vent_open, container.cntr_pre_cooling
				, user_no, container.owner_no, door.cntr_door_code?door.cntr_door_code:container.cntr_door_code, door.cntr_door_name1?door.cntr_door_name1:container.cntr_door_name1, door.cntr_door_name2?door.cntr_door_name2:container.cntr_door_name2
				, door.cntr_door_date?door.cntr_door_date:container.cntr_door_date, door.cntr_door_user_name?door.cntr_door_user_name:container.cntr_door_user_name, door.cntr_door_user_dept?door.cntr_door_user_dept:container.cntr_door_user_dept, door.cntr_door_user_fax?door.cntr_door_user_fax:container.cntr_door_user_fax, door.cntr_door_user_tel?door.cntr_door_user_tel:container.cntr_door_user_tel
				, door.cntr_door_user_email?door.cntr_door_user_email:container.cntr_door_user_email
				, door.cntr_door_address1?door.cntr_door_address1:container.cntr_door_address1
				, door.cntr_door_address2?door.cntr_door_address2:container.cntr_door_address2
				, door.cntr_door_address3?door.cntr_door_address3:container.cntr_door_address3
				, door.cntr_door_address4?door.cntr_door_address4:container.cntr_door_address4
				, door.cntr_door_address5?door.cntr_door_address5:container.cntr_door_address5
				, door.cntr_remark1?door.cntr_remark1:container.cntr_remark1
				, door.cntr_remark2?door.cntr_remark2:container.cntr_remark2
				, door.cntr_remark3?door.cntr_remark3:container.cntr_remark3
				, door.cntr_remark4?door.cntr_remark4:container.cntr_remark4
				, door.cntr_remark5?door.cntr_remark5:container.cntr_remark5
				, door.cntr_cfs_code?door.cntr_cfs_code:container.cntr_cfs_code
				, door.cntr_cfs_name1?door.cntr_cfs_name1:container.cntr_cfs_name1
				, door.cntr_cfs_name2?door.cntr_cfs_name2:container.cntr_cfs_name2
				, door.cntr_cfs_address1?door.cntr_cfs_address1:container.cntr_cfs_address1
				, door.cntr_cfs_address2?door.cntr_cfs_address2:container.cntr_cfs_address2
				, door.cntr_cfs_address3?door.cntr_cfs_address3:container.cntr_cfs_address3
				, door.cntr_cfs_address4?door.cntr_cfs_address4:container.cntr_cfs_address4
				, door.cntr_cfs_address5?door.cntr_cfs_address5:container.cntr_cfs_address5
				, container.cntr_drop_off_cy_code, container.cntr_drop_off_cy_name1, container.cntr_drop_off_cy_name2
				, container.cntr_drop_off_cy_address1, container.cntr_drop_off_cy_address2, container.cntr_drop_off_cy_address3, container.cntr_drop_off_cy_address4, container.cntr_drop_off_cy_address5
				, container.cntr_stock_date, container.shor_trns_or_not, container.shor_name
			]
		}
		console.log(sql);
		return sql;
	}
	const insertContainerSpecialOfBooking=(booking, speical, user_no )=>{
		const sql = {
			text: ` INSERT INTO shp_bkg_cntr_special
	 (user_no, bkg_no, bkg_date, cntr_seq, special_seq, container_special_bookmark_seq
	 , special_undg, special_imdg, special_ignition, special_ignition_type, special_out_pack_type
	 , special_out_pack_cnt, special_out_pack_grade, special_gross_weight, special_net_weight
	 , special_pack_group, special_tech_name, special_pollutant, special_shipping_name
	 , special_user_name, special_user_dept, special_user_tel, special_user_fax, special_user_email
	 , insert_date, insert_user, owner_no)
	 VALUES($1, $2, $3, $4
	 , 1
	 , $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
	 , $15, $16, $17, $18, $19, $20, $21, $22, $23, now(), $24, $25) `,
			values: [
				booking.user_no, booking.bkg_no, booking.bkg_date, speical.cntr_seq
				, speical.container_special_bookmark_seq
				, speical.special_undg, speical.special_imdg, speical.special_ignition, speical.special_ignition_type, speical.special_out_pack_type
				, speical.special_out_pack_cnt, speical.special_out_pack_grade, speical.special_gross_weight, speical.special_net_weight
				, speical.special_pack_group, speical.special_tech_name, speical.special_pollutant, speical.special_shipping_name
				, speical.special_user_name, speical.special_user_dept, speical.special_user_tel, speical.special_user_fax, speical.special_user_email
				, user_no, speical.owner_no
			]
		}
		console.log(sql);
		return sql;
	}
const insertContainerForBookmark=(booking, user_no )=>{
	const sql = {
		text: ` INSERT INTO shp_bkg_cntr
 (cntr_seq, owner_no, bkg_no, bkg_date, user_no, container_bookmark_seq
, cntr_size, cntr_type, cntr_qty, cntr_length, cntr_width, cntr_height
, cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc, cntr_soc_yn
, cntr_seal_no, cntr_pick_up_cy_code, cntr_pick_up_cy_address1
, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3, cntr_pick_up_cy_address4
, cntr_pick_up_cy_address5, cntr_pick_up_cy_name1, cntr_pick_up_cy_name2
, cntr_pick_up_cy_date, cntr_empty_yn, cntr_special_type, cntr_code
, cntr_vent_open, cntr_pre_cooling, insert_date, insert_user)
 SELECT (row_number() over()) 
 , $1, $2, $3, $4, container_bookmark_seq
, cntr_size, cntr_type, cntr_qty, cntr_length, cntr_width, cntr_height
, cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc, cntr_soc_yn
, cntr_seal_no, cntr_pick_up_cy_code, cntr_pick_up_cy_address1
, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3, cntr_pick_up_cy_address4
, cntr_pick_up_cy_address5, cntr_pick_up_cy_name1, cntr_pick_up_cy_name2
, cntr_pick_up_cy_date, cntr_empty_yn, cntr_special_type, cntr_code
, cntr_vent_open, cntr_pre_cooling, now(), $5
 from shp_bkg_container_bookmark
 where user_no=$6
 and container_bookmark_seq = $7 `,
		values: [
			booking.owner_no, booking.bkg_no, booking.bkg_date, booking.user_no
			, user_no, booking.user_no, booking.container_bookmark_seq,
		]
	}
	console.log(sql);
	return sql;
}
const insertContainerSpecialForBookmark=(booking, user_no )=>{
	const sql = {
		text: ` INSERT INTO public.shp_bkg_cntr_special
 (user_no, bkg_no, bkg_date, cntr_seq, special_seq, container_special_bookmark_seq
 , special_undg, special_imdg, special_ignition, special_ignition_type
 , special_out_pack_type, special_out_pack_cnt, special_out_pack_grade
 , special_gross_weight, special_net_weight, special_pack_group, special_tech_name
 , special_pollutant, special_shipping_name, special_user_name, special_user_dept
 , special_user_tel, special_user_fax, special_user_email, insert_date, insert_user)
 SELECT $1, $2, $3, '1', (row_number() over()), a.container_special_bookmark_seq
 , special_undg, special_imdg, special_ignition, special_ignition_type
 , special_out_pack_type, special_out_pack_cnt, special_out_pack_grade
 , special_gross_weight, special_net_weight, special_pack_group, special_tech_name
 , special_pollutant, special_shipping_name, special_user_name, special_user_dept
 , special_user_tel, special_user_fax, special_user_email, now(), $4
 from shp_bkg_container_special_bookmark_relation a
 ,shp_bkg_container_special_bookmark b
 where a.user_no = b.user_no
 and a.container_special_bookmark_seq = b.container_special_bookmark_seq
 and a.user_no = $5
 and a.container_bookmark_seq = $6 `,
		values: [
			booking.user_no, booking.bkg_no, booking.bkg_date, booking.user_no
			, user_no, booking.container_bookmark_seq,
		]
	}
	console.log(sql);
	return sql;
}

    
const getUserOtherBookmark = (request, response) => {

  // console.log(sql);
   (async () => {
   	const client = await pgsqlPool.connect();
   	try {
   		const res = await client.query(selectOtherBookmark(request.body.user_no,request.body.seq));
   		response.status(200).json(res.rows);
   	} finally {
   		client.release();
   	}
   })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const selectOtherBookmark = (user,seq) => {
	 
	 let sqltext = "select a.*,a.other_bookmark_seq as value, a.other_bookmark_name as label from shp_sr_other_bookmark a WHERE a.user_no = $1";
		if(seq) {
			sqltext += " and a.other_bookmark_seq = '"+seq+"'";
		}
		sqltext += " order by a.other_bookmark_seq::integer";

	const sql = {
		text: sqltext,
		values: [user]
	}

  console.log(sql);
  return sql;
}

const setUserOthersBookmark = (request, response) => {
	 
	 /*let sqltext = "insert into shp_sr_other_bookmark(user_no,other_bookmark_seq, a.user_no = $1";
		if(request.body.seq) {
			sqltext += " and a.other_bookmark_seq = '"+request.body.seq+"'";
		}
		sqltext += " order by a.other_bookmark_seq::integer";*/
    var sql;
    if(request.body.data.other_bookmark_seq) {
    	sql = {
    			text: `update shp_sr_other_bookmark set other_bookmark_name=$1 ,sc_no=$2,document_no=$3,trans_service_code=$4,bl_type=$5,hbl_yn=$6,line_payment_type=$7 
    			       where user_no=$8 and other_bookmark_seq=$9`,
    			values: [request.body.data.other_bookmark_name,request.body.data.sc_no ,request.body.data.document_no ,request.body.data.trans_service_code ,request.body.data.bl_type ,
    				     request.body.data.hbl_yn,request.body.data.line_payment_type,request.body.user_no,request.body.data.other_bookmark_seq]
    		}
    } else {
		 sql = {
			text: `insert into shp_sr_other_bookmark(user_no,other_bookmark_seq,other_bookmark_name,sc_no,document_no,trans_service_code,bl_type,hbl_yn,line_payment_type) values
			       ($1,(select coalesce(max(cast (other_bookmark_seq as numeric) ),0)+1 from shp_sr_other_bookmark where user_no = $2),$3,$4,$5,$6,$7,$8,$9)`,
			values: [request.body.user_no,request.body.user_no,request.body.data.other_bookmark_name
				,request.body.data.sc_no ,request.body.data.document_no ,request.body.data.trans_service_code ,request.body.data.bl_type ,request.body.data.hbl_yn,request.body.data.line_payment_type]
		}
    }

  console.log(sql);
  (async () => {
  	const client = await pgsqlPool.connect();
  	try {
  		const res = await client.query(sql);
  		response.status(200).json(res.rows);
  	} finally {
  		client.release();
  	}
  })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const getUserSrDocNew = (request)=>{

	let query = " insert into shp_sr(user_no,sr_no,sr_date,owner_no,insert_date,status_cus,line_code,sch_srd,klnet_id) values ($1::varchar, \n";
	if(request.body.sr_no) {
		query += "'"+request.body.sr_no+"',";
	} else {
		query += "(public.sf_get_work_ids($2, 'SR')),";
	}
	query += " to_char(now(),'YYYYMMDD'),(select own_code from own_user_owner_mapping b where b.user_no = $1 limit 1), now(),'NO', $3 ,'',$2) \n";
	query += " RETURNING user_no,sr_no,sr_date,owner_no,insert_date,status_cus,line_code,sch_srd,klnet_id ";
	const sql = {
			text:query,
			values: [request.body.user_no,request.body.klnet_id, request.body.lineCode]
			
		}
	console.log(sql);
	return sql;
}

const getUserSrDocInit = (request, response) => {

 (async () => {
 	const client = await pgsqlPool.connect();
 	try {
 		const res = await client.query(getUserSrDocNew(request));
 		//console.log("data:",res);
 		if(res.rowCount >0) {
 			response.status(200).json(res.rows[0]);
 		} else {
 			response.status(400).json({});
 		}
 		
 	} finally {
 		client.release();
 	}
 })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const setUserSRDataList = (request, response) => {
	// 문서상태 체크
	var sqText = `update shp_sr set sr_date = case when $1::char is not null then $2 else to_char(now(),'YYYYMMDD') end,update_date = now(), shp_user_name = $3, shp_user_dept = $4,
				shp_user_tel = $5, shp_user_email = $6, shp_user_fax =$7, shp_address1=$8, shp_address2 = $9,shp_address3=$10, shp_address4=$11,
				shp_address5 = $12,shp_name1=$13, shp_name2=$14, shp_force=$15,cons_code=$16, cons_address1=$17,cons_address2=$18,cons_address3=$19,
				cons_address4=$20,cons_address5=$21,cons_name1=$22, cons_name2=$23, shp_un_code=$24,noti_address1=$25,noti_address2=$26,noti_address3=$27,
				noti_address4=$28,noti_address5=$29,noti_name1=$30,noti_name2=$31,line_payment_type=$32,line_payment_area_name=$33,
				sch_vessel_name=$34,sch_vessel_voyage=$35,sch_barge_onboard_date=$36,sch_pol=$37,sch_pod=$38,sch_pol_name=$39,sch_pod_name=$40,
				sch_fdp=$41,sch_fdp_name=$42,sch_por=$43,sch_por_name=$44,sch_pld=$45,sch_pld_name=$46,sch_bl_issue_name=$47,res_bkg_no=$48,sc_no=$49,
				document_no=$50,trans_service_code=$51,bl_type=$52,hbl_yn=$53,sch_srd=$54,hs_code=$55,consignee_bookmark_seq=$56,notify_bookmark_seq=$57,
				schedule_bookmark_seq=$58,shipper_bookmark_seq=$59,other_bookmark_seq=$60,line_bookmark_seq=$61,line_name1=$62, line_name2=$63, 
				line_address1=$64, line_address2=$65,line_address3=$66,line_address4=$67,line_address5=$68, cargo_bookmark_seq= $69 , bookmark_seq= $70, line_code=$109 ,
				c_consignee_bookmark_seq=$110 , c_notify_bookmark_seq=$111, c_shipper_bookmark_seq=$112`;
	if("S9" !== request.body.data.status_cus || "S4" !== request.body.data.status_cus || "FA" !== request.body.data.status_cus) {
		sqText += `,status_cus='S0'`;
	}  
	sqText += `,sch_eta=$71, 
				c_shp_name1=$72,c_shp_name2=$73,c_shp_user_name=$74,c_shp_user_tel=$75,c_shp_code=$76,c_shp_country_code=$77,c_shp_address1=$78,c_shp_address2=$79,
				c_shp_address3=$80,c_shp_address4=$81,c_shp_address5=$82,c_cons_name1=$83,c_cons_name2=$84,c_cons_user_name=$85,c_cons_user_tel=$86,c_cons_code=$87,
				c_cons_country_code=$88,c_cons_address1=$89,c_cons_address2=$90,c_cons_address3=$91,c_cons_address4=$92,c_cons_address5=$93,c_noti_name1=$94,c_noti_name2=$95,
				c_noti_user_name=$96,c_noti_user_tel=$97,c_noti_code=$98,c_noti_country_code=$99,c_noti_address1=$100,c_noti_address2=$101,c_noti_address3=$102,c_noti_address4=$103,
				c_noti_address5=$104,shp_code =$105
				where user_no = $106 and sr_no = $107 and sr_date=$108`;

	const sql = {
			text: sqText,
			values: [request.body.data.sr_date,request.body.data.sr_date,request.body.data.shp_user_name,request.body.data.shp_user_dept,request.body.data.shp_user_tel,request.body.data.shp_user_email,request.body.data.shp_user_fax,
				request.body.data.shp_address1, request.body.data.shp_address2, request.body.data.shp_address3, request.body.data.shp_address4, request.body.data.shp_address5,
				request.body.data.shp_name1, request.body.data.shp_name2, request.body.data.shp_force, request.body.data.cons_code, request.body.data.cons_address1,
				request.body.data.cons_address2, request.body.data.cons_address3, request.body.data.cons_address4, request.body.data.cons_address5, request.body.data.cons_name1,
				request.body.data.cons_name2, request.body.data.shp_un_code, request.body.data.noti_address1, request.body.data.noti_address2, request.body.data.noti_address3,
				request.body.data.noti_address4, request.body.data.noti_address5, request.body.data.noti_name1, request.body.data.noti_name2, request.body.data.line_payment_type,
				request.body.data.line_payment_area_name, request.body.data.sch_vessel_name, request.body.data.sch_vessel_voyage, request.body.data.sch_barge_onboard_date, request.body.data.sch_pol,
				request.body.data.sch_pod,request.body.data.sch_pol_name,request.body.data.sch_pod_name,request.body.data.sch_fdp,request.body.data.sch_fdp_name,
				request.body.data.sch_por,request.body.data.sch_por_name,request.body.data.sch_pld,request.body.data.sch_pld_name,request.body.data.sch_bl_issue_name,
				request.body.data.res_bkg_no,request.body.data.sc_no,request.body.data.document_no,request.body.data.trans_service_code,request.body.data.bl_type,
				request.body.data.hbl_yn,request.body.data.sch_srd,request.body.data.cargo_hs_code,request.body.data.consignee_bookmark_seq,request.body.data.notify_bookmark_seq,
				request.body.data.schedule_bookmark_seq,request.body.data.shipper_bookmark_seq,request.body.data.other_bookmark_seq,request.body.data.line_bookmark_seq,
				request.body.data.line_name1,request.body.data.line_name2,request.body.data.line_address1,request.body.data.line_address2,request.body.data.line_address3,
				request.body.data.line_address4,request.body.data.line_address5,request.body.data.cargo_bookmark_seq,request.body.data.bookmark_seq,request.body.data.sch_eta,
				request.body.data.c_shp_name1,request.body.data.c_shp_name2,request.body.data.c_shp_user_name,request.body.data.c_shp_user_tel,request.body.data.c_shp_code,request.body.data.c_shp_country_code,
				request.body.data.c_shp_address1,request.body.data.c_shp_address2,request.body.data.c_shp_address3,request.body.data.c_shp_address4,request.body.data.c_shp_address5,
				request.body.data.c_cons_name1,request.body.data.c_cons_name2,request.body.data.c_cons_user_name,request.body.data.c_cons_user_tel,request.body.data.c_cons_code,
				request.body.data.c_cons_country_code,request.body.data.c_cons_address1,request.body.data.c_cons_address2,request.body.data.c_cons_address3,request.body.data.c_cons_address4,request.body.data.c_cons_address5,
				request.body.data.c_noti_name1,request.body.data.c_noti_name2,request.body.data.c_noti_user_name,request.body.data.c_noti_user_tel,request.body.data.c_noti_code,
				request.body.data.c_noti_country_code,request.body.data.c_noti_address1,request.body.data.c_noti_address2,request.body.data.c_noti_address3,request.body.data.c_noti_address4,request.body.data.c_noti_address5,
				request.body.data.shp_code,request.body.user_no,request.body.data.sr_no,request.body.data.sr_date, request.body.data.line_code,
				request.body.data.c_consignee_bookmark_seq, request.body.data.c_notify_bookmark_seq, request.body.data.c_shipper_bookmark_seq
			]
	};


	const checkSql = {
		text: `	select status_cus from shp_sr 
			where 1=1 
			and user_no = $1
			and sr_no = $2
			and sr_date = $3 `,
		values:[request.body.data.user_no,request.body.data.sr_no,request.body.data.sr_date]
	};
	
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const checkResult = await client.query(checkSql);
				console.log('checkResult.rows===',checkResult.rows)
			if(checkResult.rows.length > 0 ) {

				if(checkResult.rows[0].status_cus === "FA") {
					response.status(200).send({code:'E',data:'BL 확정으로 SR을 전송 하실 수 없습니다.'})	
				}else if(checkResult.rows[0].status_cus === "SF") {
					response.status(200).send({code:'E',data:'마감 전송된 SR문서이므로 전송 하실 수 없습니다.'})	
				}
				else {
					let bkgList = request.body.data.bkglist;
					let markList = request.body.data.mark_desc;
					let goodList = request.body.data.goods_desc;
					let cntrList = request.body.data.cntrlist;
					let declareList = request.body.data.declarelist;

					if(bkgList && bkgList.length > 0 ) {
						const deleteQuery = await client.query(deleteBkgNo(request));
						await Promise.all(
								bkgList.map( async (bkg, key)=>{
								// Key 입력하기
								bkg.bkg_seq = key+1;
								const insertData = await client.query(insertBkg(request,bkg));
							})
						);
						console.log("data set bkg");
					}
					//cargo check
					if(request.body.data.cargo_hs_code ||request.body.data.cargo_pack_qty || request.body.data.cargo_pack_type || request.body.data.cargo_total_colume || request.body.data.cargp_total_weight ) {
						await client.query(insertCargoData(request));
						console.log("data set cargo");
					}
					if(markList) {

						const deleteQuery = await client.query(deleteMark(request));
						const markData = markList.split('\n');
						//console.log("mark length:",markData);
						var list={};
						var count = markData.length;
						var j=0;
						var seq=1;
			
				
						for(var i=0 ; i<markData.length ;i++) {
							if(j < 10 ) { 
										//list = { ...list,['mark_desc'+(j+1)]:markData[i],'mark_seq':seq};
								list = Object.assign(list,{['mark_desc'+(j+1)]:markData[i],'mark_seq':seq});
								count --;
							} 
							if( (j+1) % 10 === 0 || count === 0) {
								list.cargo_mark_bookmark_seq = request.body.data.cargo_mark_bookmark_seq;
								await client.query(insertMark(request.body.data,list));
								seq ++;
								j = 0;
								list = {};
							} else {
								j++; 
							}
						}
						console.log("data set mark");
					}else {
						const deleteQuery = await client.query(deleteMark(request));
					}
					
					if(goodList) {
			
						const deleteQuery = await client.query(deleteGoods(request));
						const goodsData = goodList.split('\n');
						var list={};
						var count = goodsData.length;
						var j=0;
						var seq=1;
				
							for(var i=0 ; i<goodsData.length ;i++) {
									if(j < 5 ) {
										//list = { ...list,['goods_desc'+(j+1)]:goodsData[i],'goods_seq':seq};
										list = Object.assign(list,{['goods_desc'+(j+1)]:goodsData[i],'goods_seq':seq});
										count --;
									} 
									if( (j+1) % 5 === 0 || count === 0) {
										list.cargo_goods_bookmark_seq = request.body.data.cargo_goods_bookmark_seq;
										await client.query(insertGoods(request.body.data,list));
										seq ++;
										//console.log("seq2:",seq)
										j = 0;
										list = {};
									} else {
										j++; 
									}
							}
							console.log("data set goods");
					}else {
						const deleteQuery = await client.query(deleteGoods(request));
					}
			
					if(cntrList && cntrList.length>0){
						const deleteCntr = await client.query(deleteUserCntr(request));
						const deleteCntrSpc = await client.query(deleteUserCntrSpc(request));
						// 4. map 을 async 처리할 경우
						await Promise.all(
								cntrList.map( async (cntr, key)=>{
								// Key 입력하기
								cntr.cntr_seq = key+1;
								let insertCntrSql = await insertCntr(request.body.data, cntr);
								const cntrInsert = await client.query(insertCntrSql);
								if(cntr.special_imdg || cntr.special_undg) {
									const insertCntrSqlSpc = await insertCntrSpc(request.body.data, cntr);
									await client.query(insertCntrSqlSpc);
								}
							})
						);
						console.log("data set cntr");
					}else {
						const deleteCntr = await client.query(deleteUserCntr(request));
						const deleteCntrSpc = await client.query(deleteUserCntrSpc(request));
					}
			
					if(declareList && declareList.length>0){
						const deleteDecr = await client.query(deleteUserDecr(request));
						var deletefileList = deleteDecr.rows;
						console.log("declare insert log:");
						
						// 4. map 을 async 처리할 경우
						await Promise.all(
								declareList.map( async (dcr, key)=>{
								// Key 입력하기
								dcr.declare_seq = key+1;
								const dcrInsert = await client.query(insertDcrSql(request, dcr));				
								const itemfind = deletefileList.findIndex((item) => {return item.declare_file_seq === dcr.declare_file_seq});
								deletefileList.splice(itemfind,1);
							})
						);
						
						// 5. 파일 삭제
						if(deletefileList.length > 0) {
							console.log("file delete count:",deletefileList.length);
							await Promise.all(
									deletefileList.map( async(data) => {
										
										const selectData = await client.query(selectFileInfo(data));
										
										var path = selectData.rows[0].real_file_path;
										  var filename = selectData.rows[0].file_name
										  var filePath=path+filename;
										  
										  console.log("filePath:",filePath);
										  
										fs.unlink(filePath,async(err)=>{
											  if(err){ console.log(">>>>>>error")}
											  await client.query(deleteFiles(data.declare_file_seq));
										  });
									})
								);
						}
						console.log("data set declare");
				
					}
					console.log("data set header");
					const res = await client.query(sql);
					
					response.status(200).send({code:'S',data:res.rows});
				}

			}else {
				response.status(200).send({code:'E',data:'알 수 없는 SR문서입니다. SR Number : ' + request.body.data.sr_no + ' Date : '+ request.body.data.sr_date})
			}

			
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {
		console.log("[ERROR]",err);
		response.status(400).send({code:'E',data:err});
	}))
}


const insertDcrSql = ( request,dcr) => {
	const sql = {
			text: ` insert into shp_sr_declare (user_no,sr_no,sr_date,declare_seq,declare_num,declare_div_load_yn,declare_pack_set_code,declare_div_load_no,
			                                    declare_goods_desc,declare_pack_num,declare_pack_type,declare_weight,declare_pack_set_num,declare_pack_set_type,
			                                    declare_customs_date,declare_file_seq) values (
			                                    $1,$2,$3,$4,$5,$6,$7,$8,
			                                    $9,$10,$11,$12,$13,$14,
			                                    $15,$16)  ` ,
			values: [request.body.user_no, request.body.data.sr_no, request.body.data.sr_date,dcr.declare_seq,dcr.declare_num,dcr.declare_div_load_yn,dcr.declare_pack_set_code,dcr.declare_div_load_no,
				     dcr.declare_goods_desc,dcr.declare_pack_num,dcr.declare_pack_type,dcr.declare_weight,dcr.declare_pack_set_num,dcr.declare_pack_set_type,
				     dcr.declare_customs_date,dcr.declare_file_seq]
		}
    console.log("insert Sql:",sql);
    return sql;
}
const insertDcrSqlPart = ( srList ) => {
	const sql = {
			text: ` insert into shp_sr_declare 
						(user_no,sr_no,sr_date,declare_seq,declare_num,declare_div_load_yn,declare_pack_set_code,declare_div_load_no,
						declare_goods_desc,declare_pack_num,declare_pack_type,declare_weight,declare_pack_set_num,declare_pack_set_type,
						declare_customs_date,declare_file_seq)
					select 	user_no,$1 as sr_no , to_char(now(),'YYYYMMDD') as sr_date,declare_seq,declare_num,declare_div_load_yn,declare_pack_set_code,declare_div_load_no,
							declare_goods_desc,declare_pack_num,declare_pack_type,declare_weight,declare_pack_set_num,declare_pack_set_type,
							declare_customs_date,declare_file_seq
					from shp_sr_declare
					where user_no = $2
					and sr_no = $3
					and sr_date = $4
					` ,
			values: [srList.sr_no_new, srList.user_no, srList.sr_no, srList.sr_date ]
	}
    console.log("insert Sql:",sql);
    return sql;
}
const deleteUserDecr = ( request ) => {
	const sql = {
			text: ` delete from shp_sr_declare where user_no = $1 and sr_no = $2 and sr_date=$3 RETURNING declare_file_seq` ,
			values: [request.body.user_no ,request.body.data.sr_no ,request.body.data.sr_date]
		}
    console.log("delete Sql:",sql);
    return sql;
}

const insertBkg = ( request,bkg) => {
	const sql = {
		text: ` insert into shp_sr_bkg (user_no,sr_no,sr_date,bkg_seq,res_bkg_no) values ($1,$2,$3,$4,$5)  ` ,
		values: [request.body.user_no, request.body.data.sr_no, request.body.data.sr_date,
					bkg.bkg_seq,bkg.value]
	}
    console.log("SR Booking insert Sql:",sql);
    return sql;
}
const insertBkgPart = (srList) => {
	const sql = {
		text: ` insert into shp_sr_bkg (user_no,sr_no,sr_date,bkg_seq,res_bkg_no) 
				select user_no as user_no , $1 as sr_no, to_char(now(),'YYYYMMDD') as sr_date , bkg_seq as bkg_seq, res_bkg_no as res_bkg_no
				from shp_sr_bkg
				where user_no = $2 
				and sr_no = $3 
				and sr_date = $4 ` ,
		values: [srList.sr_no_new, srList.user_no, srList.sr_no, srList.sr_date ]
	}
	console.log("SR Booking insert Sql:",sql);
	return sql;
}


const deleteBkgNo = ( request ) => {
	const sql = {
			text: ` delete from shp_sr_bkg where user_no = $1 and sr_no = $2 and sr_date=$3 ` ,
			values: [request.body.user_no ,request.body.data.sr_no ,request.body.data.sr_date]
		}
    console.log("delete Sql:",sql);
    return sql;
}

const setUserCargoData = (request, response) => {

	 const sql = {
				text: ` with upsert as (update shp_sr_cargo set sr_date=$1, cargo_pack_qty=$2, cargo_pack_type=$3, cargo_total_weight=$4,
						           cargo_total_volume = $5, cargo_bookmark_seq=$6, cargo_hs_code=$7 where user_no=$8 and sr_no=$9 and cargo_seq='1' returning * )
				                insert into shp_sr_cargo (user_no,sr_no,sr_date,cargo_seq,cargo_pack_qty,cargo_pack_type, cargo_total_weight,cargo_total_volume,cargo_bookmark_seq,cargo_hs_code)
						select $10,$11,to_char(now(),'YYYYMMDD'),'1',$12,$13,$14,$15,$16,$17  where not exists (select * from upsert) ` ,
				values: [request.body.data.sr_date,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,request.body.data.cargo_total_weight,
					request.body.data.cargo_total_volume,request.body.data.cargo_bookmark_seq,request.body.data.cargo_hs_code,
					request.body.user_no,request.body.data.sr_no,
					request.body.user_no,request.body.data.sr_no,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,
					request.body.data.cargo_total_weight,request.body.data.cargo_total_volume,request.body.data.cargo_bookmark_seq,request.body.data.cargo_hs_code]
			}

console.log(sql);
(async () => {
	const client = await pgsqlPool.connect();
	try {
		let markList = request.body.data.marklist;
		let goodList = request.body.data.goodlist;
		
		if(markList && markList.length > 0) {
			const deleteQuery = await client.query(deleteMark(request));
				await Promise.all(
						markList.map( async (mark, key)=>{
						// Key 입력하기
						mark.mark_seq = key+1;
						mark.cargo_mark_bookmark_seq = request.body.data.cargo_mark_bookmark_seq;
						const insertData = await client.query(insertMark(request.body.data,mark));
					})
				);
		}
		
		if(goodList && goodList.length > 0) {
			const deleteQuery = await client.query(deleteGoods(request));
				await Promise.all(
						goodList.map( async (goods, key)=>{
						// Key 입력하기
						goods.goods_seq = key+1;
						goods.cargo_goods_bookmark_seq = request.body.data.cargo_goods_bookmark_seq;
						const insertData = await client.query(insertGoods(request.body.data,goods));
					})
				);
		}
		
		const res = await client.query(sql);

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const insertCargoData = ( request ) => {
	const sql = {
			text: ` with upsert as (update shp_sr_cargo set sr_date=$1, cargo_pack_qty=$2, cargo_pack_type=$3, cargo_total_weight=$4,
					           cargo_total_volume = $5, cargo_bookmark_seq=$6, cargo_hs_code=$7 where user_no=$8 and sr_no=$9 and cargo_seq='1' returning * )
			                insert into shp_sr_cargo (user_no,sr_no,sr_date,cargo_seq,cargo_pack_qty,cargo_pack_type, cargo_total_weight,cargo_total_volume,cargo_bookmark_seq,cargo_hs_code)
					select $10,$11,to_char(now(),'YYYYMMDD'),'1',$12,$13,$14,$15,$16,$17  where not exists (select * from upsert) ` ,
			values: [request.body.data.sr_date,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,request.body.data.cargo_total_weight,
				request.body.data.cargo_total_volume,request.body.data.cargo_bookmark_seq,request.body.data.cargo_hs_code,
				request.body.user_no,request.body.data.sr_no,
				request.body.user_no,request.body.data.sr_no,request.body.data.cargo_pack_qty,request.body.data.cargo_pack_type,
				request.body.data.cargo_total_weight,request.body.data.cargo_total_volume,request.body.data.cargo_bookmark_seq,request.body.data.cargo_hs_code]
		}
   // console.log("delete Sql:",sql);
    return sql;
}

const insertCargoDataPart = (srList) => {
	const sql = {
		text: ` with upsert as (update shp_sr_cargo set sr_date=$1, cargo_pack_qty=$2, cargo_pack_type=$3, cargo_total_weight=$4,
				cargo_total_volume = $5, cargo_bookmark_seq=$6, cargo_hs_code=$7 where user_no=$8 and sr_no=$9 and cargo_seq='1' returning * )
				insert into shp_sr_cargo 
					(sr_no,user_no,sr_date,cargo_seq,cargo_pack_qty,cargo_pack_type, cargo_total_weight,cargo_total_volume,cargo_bookmark_seq,cargo_hs_code)
				select 
					 $10 as sr_no, user_no, to_char(now(),'YYYYMMDD') as sr_date ,'1' as cargo_seq,cargo_pack_qty as cargo_pack_qty,cargo_pack_type as cargo_pack_type,
					 cargo_total_weight as cargo_total_weight ,cargo_total_volume as cargo_total_volume,cargo_bookmark_seq as cargo_bookmark_seq,cargo_hs_code as cargo_hs_code
					 from shp_sr_cargo
					where sr_no = $11
					and sr_date = $12
					and user_no = $13
					and	not exists (select * from upsert) ` ,
		values: [
			srList.sr_date,srList.cargo_pack_qty,srList.cargo_pack_type,srList.cargo_total_weight,
			srList.cargo_total_volume,srList.cargo_bookmark_seq,srList.cargo_hs_code,srList.user_no,srList.sr_no,
			srList.sr_no_new, srList.sr_no,srList.sr_date,srList.user_no]
	}
	return sql;
}


const deleteMark = ( request ) => {
    const sql = {
		text: ` delete from shp_sr_cargo_mark where user_no= $1 and sr_no=$2 and sr_date=$3`,
		values: [request.body.user_no,request.body.data.sr_no,request.body.data.sr_date]
	}
    //console.log("delete Sql:",sql);
    return sql;
}

const insertMark = ( data, marklist ) => {
    const sql = {
		text: ` insert into shp_sr_cargo_mark(user_no,sr_no,sr_date,cargo_seq,mark_seq,mark_desc1,mark_desc2,mark_desc3,mark_desc4,mark_desc5,
			    mark_desc6,mark_desc7,mark_desc8,mark_desc9,mark_desc10,cargo_mark_bookmark_seq)
		        values($1,$2,$3,$4,$5,upper($6),upper($7),upper($8),upper($9),upper($10),
						upper($11),upper($12),upper($13),upper($14),upper($15),$16)`,
		values: [data.user_no,data.sr_no,data.sr_date,'1',marklist.mark_seq,marklist.mark_desc1,marklist.mark_desc2,marklist.mark_desc3,marklist.mark_desc4,marklist.mark_desc5,
				marklist.mark_desc6,marklist.mark_desc7,marklist.mark_desc8,marklist.mark_desc9,marklist.mark_desc10,marklist.cargo_mark_bookmark_seq
			     ]
	}
    console.log("insertMark Sql:",sql);
    return sql;
}

const insertMarkPart = ( srList ) => {
    const sql = {
		text: ` insert into shp_sr_cargo_mark(
					user_no,sr_no,sr_date,cargo_seq,mark_seq,mark_desc1,mark_desc2,mark_desc3,mark_desc4,mark_desc5,
					mark_desc6,mark_desc7,mark_desc8,mark_desc9,mark_desc10,cargo_mark_bookmark_seq)
		        select 
					user_no as user_no, $1 as sr_no, to_char(now(),'YYYYMMDD') as sr_date, cargo_seq as cargo_seq, mark_seq as mark_seq,mark_desc1 as mark_desc1,mark_desc2 as mark_desc2,mark_desc3 as mark_desc3,
					mark_desc4 as mark_desc4,mark_desc5 as mark_desc5,
					mark_desc6 as mark_desc6,mark_desc7 as mark_desc7,mark_desc8 as mark_desc8,mark_desc9 as mark_desc9,mark_desc10 as mark_desc10,cargo_mark_bookmark_seq as cargo_mark_bookmark_seq
				from shp_sr_cargo_mark
				where user_no = $2
				and sr_no = $3
				and sr_date = $4 `,
		values: [srList.sr_no_new, srList.user_no, srList.sr_no, srList.sr_date]
	}
    console.log("insertMark Sql:",sql);
    return sql;
}

const deleteGoods = ( request ) => {
    const sql = {
		text: ` delete from shp_sr_cargo_goods where user_no= $1 and sr_no=$2 and sr_date=$3`,
		values: [request.body.user_no,request.body.data.sr_no,request.body.data.sr_date]
	}
    //console.log("delete Sql:",sql);
    return sql;
}

const insertGoods = ( data, goodslist ) => {  //console.log("goodslist:",goodslist);
    const sql = {
		text: ` insert into shp_sr_cargo_goods(user_no,sr_no,sr_date,cargo_seq,goods_seq,goods_desc1,goods_desc2,goods_desc3,goods_desc4,goods_desc5,cargo_goods_bookmark_seq)
		        values($1,$2,$3,$4,$5,upper($6),upper($7),upper($8),upper($9),upper($10),$11)`,
		values: [data.user_no,data.sr_no,data.sr_date,'1',goodslist.goods_seq,goodslist.goods_desc1,goodslist.goods_desc2,goodslist.goods_desc3,
			goodslist.goods_desc4,goodslist.goods_desc5,goodslist.cargo_goods_bookmark_seq
			     ]
	}
    console.log("insertGoods Sql:",sql);
    return sql;
}




const insertGoodsPart = ( srList ) => {  //console.log("goodslist:",goodslist);
    const sql = {
		text: ` insert into shp_sr_cargo_goods(
					user_no,sr_no,sr_date,cargo_seq,goods_seq,goods_desc1,goods_desc2,goods_desc3,
					goods_desc4,goods_desc5,cargo_goods_bookmark_seq)
		        select 
					user_no as user_no,$1 as sr_no,to_char(now(),'YYYYMMDD') as sr_date,cargo_seq as cargo_seq,goods_seq as goods_seq,goods_desc1 as goods_desc1,goods_desc2 as goods_desc2,
					goods_desc3 as goods_desc3, goods_desc4 as goods_desc4, goods_desc5 as goods_desc5, cargo_goods_bookmark_seq as cargo_goods_bookmark_seq
				from shp_sr_cargo_goods 
				where user_no = $2
				and sr_no = $3
				and sr_date = $4 `,
		values: [srList.sr_no_new, srList.user_no, srList.sr_no, srList.sr_date]
	}
    console.log("insertGoods Sql:",sql);
    return sql;
}


const setUserCntrData = (request, response) => {

	
(async () => {
	const client = await pgsqlPool.connect();
	try {
		
		
		let res;
		const deleteCntr = await client.query(deleteUserCntr(request));
		const deleteCntrSpc = await client.query(deleteUserCntrSpc(request));
		let cntrList = request.body.cntr;
		if(cntrList.length>0){
			// 4. map 을 async 처리할 경우
			await Promise.all(
					cntrList.map( async (cntr, key)=>{
					// Key 입력하기
					cntr.cntr_seq = key+1;
					let insertCntrSql = await insertCntr(request.body.data, cntr);
					res = await client.query(insertCntrSql);
					if(cntr.special_imdg || cntr.special_undg) {
						let insertCntrSqlSpc = await insertCntrSpc(request.body.data, cntr);
						await client.query(insertCntrSqlSpc);
					}
				})
			);
		}
		
		//const res = await client.query(sql);
		//if(res.rows[0].)

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const deleteUserCntrSpc = (request, response) => {

	 const sql = {
				text: `delete from shp_sr_cntr_special where user_no=$1 and sr_no=$2` ,
				values: [request.body.user_no,request.body.data.sr_no]
			}

	console.log(sql);
	return sql
}
const deleteUserCntr = (request, response) => {

	 const sql = {
				text: `delete from shp_sr_cntr where user_no=$1 and sr_no=$2` ,
				values: [request.body.user_no,request.body.data.sr_no]
			}

	console.log(sql);
	return sql
}

const insertCntr = ( srlist, cntrlist ) => {
    const sql = {
		text: ` insert into shp_sr_cntr(user_no,sr_no,sr_date,cntr_seq,cntr_no,cntr_code,cntr_total_weight,cntr_total_volume,cntr_carton_code,cntr_carton_qty,
		               cntr_weight,cntr_auth_user_name,cntr_res_bkg_no,cntr_truck_no,cntr_seal,cntr_consolidated_yn,cntr_verifying_type)
		        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
		values: [srlist.user_no,srlist.sr_no,srlist.sr_date,cntrlist.cntr_seq,cntrlist.cntr_no,
			     cntrlist.cntr_code,cntrlist.cntr_total_weight,cntrlist.cntr_total_volume,cntrlist.cntr_carton_code,cntrlist.cntr_carton_qty,cntrlist.cntr_weight,cntrlist.cntr_auth_user_name,cntrlist.cntr_res_bkg_no,cntrlist.cntr_truck_no,cntrlist.cntr_seal,cntrlist.cntr_consolidated_yn,
			     cntrlist.cntr_verifying_type]
	}
    console.log("cntr sql:",sql);
    return sql;
}

const insertCntrPart = ( srList ) => {
    const sql = {
		text: ` insert into shp_sr_cntr(
					user_no,sr_no,sr_date,cntr_seq,cntr_no,cntr_code,cntr_total_weight,cntr_total_volume,cntr_carton_code,cntr_carton_qty,
					cntr_weight,cntr_auth_user_name,cntr_res_bkg_no,cntr_truck_no,cntr_seal,cntr_consolidated_yn,cntr_verifying_type)
		        select 
					user_no,$1 as sr_no,to_char(now(),'YYYYMMDD') as sr_date,cntr_seq,cntr_no,cntr_code,cntr_total_weight,cntr_total_volume,cntr_carton_code,cntr_carton_qty,
					cntr_weight,cntr_auth_user_name,cntr_res_bkg_no,cntr_truck_no,cntr_seal,cntr_consolidated_yn,cntr_verifying_type
				from shp_sr_cntr 
				where user_no = $2
				and sr_no = $3
				and sr_date = $4
				`,
		values: [srList.sr_no_new,srList.user_no,srList.sr_no, srList.sr_date]
	}
    console.log("cntr sql:",sql);
    return sql;
}

const insertCntrSpc = ( srlist, cntrlist ) => {
    const sql = {
		text: ` insert into shp_sr_cntr_special(user_no,sr_no,sr_date,cntr_seq,special_seq,special_undg,special_imdg)
		        values($1,$2,$3,$4,$5,$6,$7)`,
		values: [srlist.user_no,srlist.sr_no,srlist.sr_date,cntrlist.cntr_seq,1,cntrlist.special_undg,cntrlist.special_imdg]
	}
    return sql;
}
const insertCntrSpcPart = ( srList ) => {
    const sql = {
		text: ` insert into shp_sr_cntr_special
						(user_no,sr_no,sr_date,cntr_seq,special_seq,special_undg,special_imdg)
		        select 
						user_no, $1 as sr_no,to_char(now(),'YYYYMMDD') as sr_date,cntr_seq,special_seq,special_undg,special_imdg
				from shp_sr_cntr_special
				where user_no = $2
				and sr_date = $3
				and sr_no = $4
				`,
		values: [srList.sr_no_new,srList.user_no,srList.sr_date,srList.sr_no]
	}
    return sql;
}

const getUserCntrData = (request, response) => {

	 const sql = {
				text: `select a.*,b.special_undg,b.special_imdg from shp_sr_cntr a
						left outer join 
						shp_sr_cntr_special b 
						on a.user_no =  b.user_no  and a.sr_no = b.sr_no
						and a.cntr_seq = b.cntr_seq
						 where a.user_no=$1 and a.sr_no=$2 order by a.cntr_seq ::integer` ,
				values: [request.body.user_no,request.body.data.sr_no]
			}

console.log(sql);
(async () => {
	const client = await pgsqlPool.connect();
	try {
		const res = await client.query(sql);
		
		//if(res.rows[0].)

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const getUserCntrCount = (request, response) => {

	 const sql = {
				text: `select cntr_code,count(*)as cntr_cnt from shp_sr_cntr where user_no=$1 and sr_no=$2 group by cntr_code order by cntr_code` ,
				values: [request.body.user_no,request.body.data.sr_no]
			}

console.log(sql);
(async () => {
	const client = await pgsqlPool.connect();
	try {
		const res = await client.query(sql);
		
		//if(res.rows[0].)

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const getUserCntrBookmark = (request, response) => {
     let query = "select  a.*,a.container_bookmark_seq as value,a.container_bookmark_name as label from shp_sr_container_bookmark a \n";
         query += " where a.user_no=$1 \n";
     if(request.body.seq) {
    	 query += " and a.container_bookmark_seq = '"+request.body.seq+"' \n";
     }
     query += "order by a.container_bookmark_seq :: integer ";
	 const sql = {
				text: query ,
				values: [request.body.user_no]
			}

console.log(sql);
(async () => {
	const client = await pgsqlPool.connect();
	try {
		const res = await client.query(sql);
		
		//if(res.rows[0].)

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const setUserCntrBookmark = (request, response) => {
    var sql;
    if(request.body.data.container_bookmark_seq) {
    	sql = {
    			text: `update shp_sr_container_bookmark set container_bookmark_name=$1,cntr_seal=$2,cntr_carton_code=$3,cntr_carton_qty=$4,cntr_total_weight=$5,
    			              cntr_total_volume=$6,cntr_export_license=$7,cntr_imdg=$8,cntr_undg=$9,cntr_code=$10,cntr_truck_no=$11,cntr_consolidated_yn=$12,cntr_weight=$13,
    			              cntr_auth_user_name=$14, cntr_verifying_type=$15,cntr_res_bkg_no=$16
    			       where user_no= $17 and container_bookmark_seq=$18`,
    			values: [request.body.data.container_bookmark_name
    				,request.body.data.cntr_seal ,request.body.data.cntr_carton_code ,request.body.data.cntr_carton_qty ,request.body.data.cntr_total_weight ,request.body.data.cntr_total_volume,
    				request.body.data.cntr_export_license,request.body.data.special_imdg,request.body.data.special_undg,request.body.data.cntr_code,request.body.data.cntr_truck_no,request.body.data.cntr_consolidated_yn,
    				request.body.data.cntr_weight,request.body.data.cntr_auth_user_name,request.body.data.cntr_verifying_type,request.body.data.cntr_res_bkg_no,request.body.user_no,request.body.data.container_bookmark_seq]
    		}
    } else {
    	sql = {
    			text: `insert into shp_sr_container_bookmark(user_no,container_bookmark_seq,container_bookmark_name,
            cntr_seal,cntr_carton_code,cntr_carton_qty,cntr_total_weight,cntr_total_volume,cntr_export_license,
            cntr_imdg,cntr_undg,cntr_code,cntr_truck_no,cntr_consolidated_yn,cntr_weight,cntr_auth_user_name,cntr_verifying_type,cntr_res_bkg_no) values
    			       ($1,(select coalesce(max(cast (container_bookmark_seq as numeric) ),0)+1 from shp_sr_container_bookmark where user_no = $2),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    			values: [request.body.user_no,request.body.user_no,request.body.data.container_bookmark_name
    				,request.body.data.cntr_seal ,request.body.data.cntr_carton_code ,request.body.data.cntr_carton_qty ,request.body.data.cntr_total_weight ,request.body.data.cntr_total_volume,
    				request.body.data.cntr_export_license,request.body.data.special_imdg,request.body.data.special_undg,request.body.data.cntr_code,request.body.data.cntr_truck_no,request.body.data.cntr_consolidated_yn,
    				request.body.data.cntr_weight,request.body.data.cntr_auth_user_name,request.body.data.cntr_verifying_type,request.body.data.cntr_res_bkg_no]
    		}
    }
console.log(sql);
(async () => {
	const client = await pgsqlPool.connect();
	try {
		const res = await client.query(sql);
		
		//if(res.rows[0].)

		response.status(200).json(res.rows);
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}



const fncCheckSR =async(checkResult, sr)=>{
	console.log("1. check")
	if( checkResult ) {
		let chk = false;
		let obj = Object();
	
		console.log( "checkResult:",checkResult );
		console.log("2. check")
		if( sr.trans_service_code && "N" === checkResult.service_code ) {
			chk = true;
			obj.service_code = "Term 정보를 올바르게 선택하세요.";
		}
		
		if( sr.sch_vessel_name && "N" === checkResult.vessel_name ) {
			chk = true;
			obj.vessel_name = "Vessel 정보를 올바르게 입력하세요.";
		}
	
		if( sr.sch_pol && sr.sch_pod && "N" === checkResult.route ) {
			chk = true;
			obj.route  = "운행 구간을 다시 확인하세요.";
		}
	
		if( sr.cargo_pack_type && "N" === checkResult.cargo_pack_type ) {
			chk = true;
			obj.cargo_pack_type  = "Cargo Pack Type을 올바르게 선택하세요.";
		}
		if( checkResult.sr_compute_condition && "N" === checkResult.sr_compute_condition) {
			chk = true;
			obj.originator  = "SR전송이 불가능 합니다.";
		}
		// if(sr.vsl_type === "41") {
		// 	const container = sr.cntrlist;
		// 	await Promise.all(
		// 			container.map(async(element, key)=> {
		// 				if(!element.cntr_res_bkg_no || !element.cntr_auth_user_name || !element.cntr_total_weight) {
		// 					chk = true;
		// 					obj.vgm  = "VGM 정보를 올바르게 입력해주세요.";
		// 				}
		// 			}));
		// }
		console.log("3. check")
		if(sr.hbl_yn && "N" === sr.hbl_yn) {
			const declare = sr.declarelist;
			await Promise.all(
					declare.map(async(element, key)=> {
						if(!element.declare_num) {
							chk = true;
							obj.declare  = "수출 면장 정보를 올바르게 입력해주세요.";
						}
					}));
		}
		return {chk: chk, obj: obj}
	} else {
		return {chk: true, obj: "사용자 정보를 정확하게 입력 하시기 바랍니다."}
	}
}


const setSendDocSr = (request, response) => {

	
	
	(async () => {
		const sql = {
				text: `select public.sf_send_sr($1, $2, $3,$4,$5) `,
				values: [request.body.klnet_id,request.body.user_no,request.body.data.sr_no,request.body.data.sr_date,request.body.status]
			}
	const client = await pgsqlPool.connect();
	try {
		//데이터 조회
		//const res = await client.query(sql);
		//response.status(200).json(res.rows);
		
	    
		let sr = request.body.data;
	
		if( "WDFC" === sr.line_code && "SEND" === request.body.status ) {
			console.log("weidong iftmin sr doc send");
			let checkSql = await fncWeidongCheckSend( sr, request.body.data, 'SR' );
			const checkRlts = await client.query(checkSql);
	
			// const checkResult = checkRlts.rows[0];
			
			

			const chk = await fncCheckSR(checkRlts.rows[0], sr)
				
			if( chk.chk ) {
				console.log("weidong error:",chk.obj);
				response.status(400).send(chk.obj);
			} else {
				console.log("weidong success:");
				console.log(sql);
				const res = await client.query(sql);
				console.log("weidong res:",res);
				let result = res.rows;
				
				console.log("result : ",result)
				if( result.length > 0 ) {
					let row = result[0];
					console.log("row : ",row);
					if( 'success' === row.sf_send_sr ) {
						response.status(200).json(row.sf_send_sr);
					} else {
						response.status(400).json(row.sf_send_sr);
					}
				}
			}
		} else {
		
			const res = await client.query(sql);
			let result = res.rows;
			console.log("result : ",result)
			if( result.length > 0 ) {
				let row = result[0];
				console.log("row : ",row);
				if( 'success' === row.sf_send_sr ) {
					response.status(200).json(row.sf_send_sr);
			    } else {
					response.status(400).json(row.sf_send_sr);
				}
			}
		}
		
	} finally {
		client.release();
	}
})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const getUserLineBookmark = (request, response) => {

    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(selectLineBookmark(request.body.user_no,request.body.seq));
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const selectLineBookmark = (user, seq) => {

	let sql_text = "select a.*, a.line_bookmark_seq as value,a.line_bookmark_name as label from shp_sr_line_bookmark a where a.user_no = $1 \n";
    if(seq) {
    	sql_text += "and a.line_bookmark_seq='"+seq+"' limit 1 \n";
    } else {
    	sql_text += "order by a.line_bookmark_seq::integer";
    }
    
    
    const sql = {
		text: sql_text,
		values: [user]
	}
    console.log(sql);
   return sql;
}

/*
 * name: SR Shipper Bookmark insert 
 * gb: insert
 */ 
const setUserLineBookmark = (request, response) => {
    const sql = {
		text: ` insert into shp_sr_line_bookmark(user_no,line_bookmark_seq,line_bookmark_name,line_name1,line_name2,line_address1,line_address2,line_address3,line_address4,line_address5,line_payment_type)
		        select $1,coalesce((select max(line_bookmark_seq::integer) from shp_sr_line_bookmark where user_no=$2),0)+1 as line_bookmark_seq,
		        $3,$4,$5,$6,$7,$8,$9,$10,$11
		        `,
		values: [
			request.body.user_no,request.body.user_no, request.body.data.line_bookmark_name, request.body.data.line_name1, request.body.data.line_name2,
			request.body.data.line_address1, request.body.data.line_address2,request.body.data.line_address3, request.body.data.line_address4,request.body.data.line_address5,request.body.data.line_payment_type
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
/*
 * name: SR Shipper Bookmark delete 
 * delete
 */ 
const setUserLineBookmarkDel = (request, response) => {
    const sql = {
		text: ` delete from shp_sr_line_bookmark where user_no = $1 and line_bookmark_seq= $2 
		        `,
		values: [
			request.body.user_no, request.body.data.line_bookmark_seq]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


/*
 * name: SR Schedule Bookmark insert 
 * delete
 */ 
const setUserSchBookmark = (request, response) => {
	var sql;
	if(request.body.data.schedule_bookmark_seq) {
		sql = {
				text: `update shp_sr_schedule_bookmark set schedule_bookmark_name = $1,sch_pol=$2,sch_pol_name=$3,sch_pod=$4,sch_pod_name=$5,sch_fdp=$6,
				              sch_fdp_name=$7,sch_por=$8,sch_por_name=$9,sch_pld=$10,sch_pld_name=$11,sch_bl_issue_name=$12,sch_etd=$13,sch_eta=$14,sch_line_code='WDFC',
				              sch_vessel_code=$15,sch_vessel_name=$16
				       where user_no =$17  and schedule_bookmark_seq =$18`,
				values: [
					 request.body.data.schedule_bookmark_name,request.body.data.sch_pol,request.body.data.sch_pol_name,
					request.body.data.sch_pod, request.body.data.sch_pod_name, request.body.data.sch_fdp, request.body.data.sch_fdp_name, request.body.data.sch_por, request.body.data.sch_por_name, 
					request.body.data.sch_pld, request.body.data.sch_pld_name, request.body.data.sch_bl_issue_name, request.body.data.sch_etd, request.body.data.sch_eta, request.body.data.sch_vessel_code,request.body.data.sch_vessel_name,
					request.body.user_no,request.body.data.schedule_bookmark_seq]
			}
	} else {
		 sql = {
					text: `insert into shp_sr_schedule_bookmark (user_no,schedule_bookmark_seq,schedule_bookmark_name,sch_pol,sch_pol_name,sch_pod,sch_pod_name,sch_fdp,sch_fdp_name,sch_por,sch_por_name,
					       sch_pld,sch_pld_name,sch_bl_issue_name,sch_etd,sch_eta,sch_line_code,sch_vessel_code,sch_vessel_name) values(
					       $1,(select coalesce(max(schedule_bookmark_seq::integer),0)+1 from shp_sr_schedule_bookmark where user_no=$2),$3,$4,$5,$6,$7,$8,$9,$10,$11,
					       $12,$13,$14,$15,$16,$17,$18,$19)
					        `,
					values: [
						request.body.user_no, request.body.user_no, request.body.data.schedule_bookmark_name,request.body.data.sch_pol,request.body.data.sch_pol_name,
						request.body.data.sch_pod, request.body.data.sch_pod_name, request.body.data.sch_fdp, request.body.data.sch_fdp_name, request.body.data.sch_por, request.body.data.sch_por_name, 
						request.body.data.sch_pld, request.body.data.sch_pld_name, request.body.data.sch_bl_issue_name, request.body.data.sch_etd, request.body.data.sch_eta, 'WDFC', request.body.data.sch_vessel_code,request.body.data.sch_vessel_name ]
				}
	}
   
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const getUserSchBookmark = (request, response) => {

        //console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(selectSchBookmark(request.body.user_no,request.body.seq));
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const selectSchBookmark = (user, seq) => {
	
	let sql_text = "select a.*, a.schedule_bookmark_seq as value,a.schedule_bookmark_name as label from shp_sr_schedule_bookmark a where a.user_no = $1 \n";
    if(seq) {
    	sql_text += "and a.schedule_bookmark_seq='"+seq+"' limit 1 \n";
    } else {
    	sql_text += "order by a.schedule_bookmark_seq::integer";
    }
    
    const sql = {
    		text: sql_text,
    		values: [user ]
    	}
        console.log(sql);
      return sql;
}

const setUserSchBookmarkDel = (request, response) => {

    const sql = {
    		text: `delete from shp_sr_schedule_bookmark where user_no=$1 and schedule_bookmark_seq=$2 `,
    		values: [request.body.user_no,request.body.data.schedule_bookmark_seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


//Service Type 조회
const selectLineCodeServiceType = (request, response) => {
    const sql = {
		text: ` select line_code, service_code, service_type
 , service_code as value, service_type as label
 from own_line_code_service_type
 where line_code = $1 `,
		values: [
			request.body.params.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const fncCheckData= async(checkResult, booking, cargo, dangerTrue, containerList, containerSpecialList)=>{
	// 결과로 최종 점검 한다.
	console.log("내부 메소드 1")
	if( checkResult ) {
		let chk = false;
		let obj = Object();
		// Term 체크
		console.log( checkResult );
		console.log("내부 메소드 2")
		if( booking.trans_service_code && "N" === checkResult.service_code ) {
			chk = true;
			obj.service_code = "Term 정보를 올바르게 선택하세요.";
		}
		// Vessel Name 체크
		if( booking.sch_vessel_name && "N" === checkResult.vessel_name ) {
			chk = true;
			obj.vessel_name = "Vessel 정보를 올바르게 입력하세요.";
		}
		// Router 체크
		if( booking.sch_pol && booking.sch_pod && "N" === checkResult.route ) {
			chk = true;
			obj.route  = "운행 구간을 다시 확인하세요.";
		}
		// Cargo Pack Type 체크
		if( booking.cargo_pack_type && "N" === checkResult.cargo_pack_type ) {
			chk = true;
			obj.cargo_pack_type  = "Cargo Pack Type을 올바르게 선택하세요.";
		}
		// trans_service_code CFS to CY 인 경우
		if( "3" === booking.trans_service_code ) {
			if( !(cargo && cargo.cargo_pack_qty &&  cargo.cargo_pack_type) ) {
				chk = true;
				obj.cargo_pack_type  = "CFS to CY 인경우 Cargo 정보를 정확히 입력하세요.";
			}
		}
		if( "Y" === booking.trans_self_yn) {
			if( !(booking.trans_name1 && booking.trans_user_name && booking.trans_user_tel)) {
				chk = true;
				obj.transport  = "자가 운송의 경우 담당자 정보를 입력하세요.";
			}
		}
		// Orginator
		if( checkResult.originator && "N" === checkResult.originator ) {
			chk = true;
			obj.originator  = "문서 전송 EDI 계정을 확인하세요.(Originator) 관리자에게 문의 바랍니다.";
		}
		// Recipient
		if( checkResult.recipient && "N" === checkResult.recipient ) {
			chk = true;
			obj.originator  = "문서 전송 EDI 계정을 확인하세요.(Recipient) 관리자에게 문의 바랍니다.";
		}
		// schedule Check
		if( checkResult.compute_condition && "N" === checkResult.compute_condition) {
			chk = true;
			obj.originator  = "선택하신 선박은 예약 불가합니다";
		}
		// container는 다건 존재 for문처리
		// Container Sztp 체크
		// if( booking.cntr_code && "N" === checkResult.cntr_sztp ) {
		// 	chk = true;
		// 	obj.cntr_sztp  = "컨테이너 Size Type을 올바르게 선택하세요.";
		// }
		// // Pickup CY 체크
		// if( booking.vessel_name && "N" === checkResult.pick_up ) {
		// 	chk = true;
		// 	obj.pick_up  = "컨테이너 Pick Up CY 올바르게 선택하세요.";
		// }
		// // undg, imdg 체크
		// if( booking.special_undg && booking.special_imdg && "N" === checkResult.danger ) {
		// 	chk = true;
		// 	obj.special  = "컨테이너 Special(CLASS, UNDG) 올바르게 선택하세요.";
		// }

		// const containerList = request.body.containerList;
		console.log("3. LENGTH ",containerList.length);
		if( containerList.length > 0 ) {
			// await Promise.all(
			// 	containerList.map(async(element, key)=>{
			// 		// 라인운송인 경우(N) Door 입력 
			// 		// 자가운송인 경우(Y) Door 입력 부분 삭제처리
			// 		if( "Y" === booking.trans_self_yn ) {
			// 			element.cntr_door_code = null;
			// 			element.cntr_door_name1 = null;
			// 			element.cntr_door_name2 = null;
			// 			element.cntr_door_date = null;
			// 			element.cntr_door_user_name = null;
			// 			element.cntr_door_user_dept = null;
			// 			element.cntr_door_user_fax = null;
			// 			element.cntr_door_user_tel = null;
			// 			element.cntr_door_user_email = null;
			// 			element.cntr_door_address1 = null;
			// 			element.cntr_door_address2 = null;
			// 			element.cntr_door_address3 = null;
			// 			element.cntr_door_address4 = null;
			// 			element.cntr_door_address5 = null;
			// 			// element.cntr_remark1 = null;
			// 			// element.cntr_remark2 = null;
			// 			// element.cntr_remark3 = null;
			// 			// element.cntr_remark4 = null;
			// 			// element.cntr_remark5 = null;
			// 		}
			// 		console.log("2. element ",element, (element.special_imdg && element.special_undg));
			// 		if( element.cntr_code || element.cntr_pick_up_cy_code ) {
			// 			let sql = await fncWeidongCheckSendCotainer( booking, element );
			// 			let cntrResults = await client.query(sql);
			// 			let cntrRst = cntrResults.rows[0];
			// 			console.log("3. element ",cntrRst);
			// 			if ( "N" === cntrRst.cntr_sztp ) {
			// 				chk = true;
			// 				obj.special  = "컨테이너 Size Type 올바르게 입력하세요.";
			// 			}
			// 			if ( "N" === cntrRst.pick_up ) {
			// 				chk = true;
			// 				obj.special  = "컨테이너 Pick up CY 올바르게 입력하세요.";
			// 			}
			// 		} else if ( !element.cntr_code ){
			// 			chk = true;
			// 			obj.special  = "컨테이너 Type  올바르게 입력하세요.";
			// 		} else if ( !element.cntr_pick_up_cy_code ){
			// 			chk = true;
			// 			obj.special  = "컨테이너 Pick up CY 올바르게 입력하세요.";
			// 		}
			// 	})
			// );
			// Special 체크
			console.log("내부 메소드 4")
			
			await Promise.all(
				containerSpecialList.map(async(element, key)=>{
					// 1. 위험물인 경우이여야 한다.
					if( true === dangerTrue ) {
						if( element.special_imdg && element.special_undg ) {
							let sql = await fncWeidongCheckSendSpecail( booking, element );
							let cntrResults = await client.query(sql);
							let cntrRst = cntrResults.rows[0];
							console.log("3. element ",cntrRst);
							if ( "N" === cntrRst.danger ) {
								chk = true;
								obj.danger  = "컨테이너 Special(CLASS, UNDG) 올바르게 입력하세요.";
							}
						} else if( element.special_imdg || element.special_undg ) {
							chk = true;
							obj.danger  = "컨테이너 Special(CLASS, UNDG) 올바르게 입력하세요.";
						}
					}
				})
			);
		}
		// await client.query(sql);
		// // Relation 정보입력
		// if( relationList.length > 0 ) {
		// 	await Promise.all(
		// 		relationList.map((element, key)=>{
		// 			// 3.1 입력하기
		// 			if( element.reference_seq ) {
		// 				element.relation_seq = key+1;
		// 				sql = insertBookingBkgBookmarkRelation( bookmark, element, request.body.user_no );
		// 				res = client.query(sql);
		// 			}
		// 		})
		// 	);
		// }
		console.log("내부 메소드 5")
		return {chk:chk, obj: obj};
	} else {
		return {chk:true, obj: "사용자 정보 확인 바랍니다."};
	}
}
/**
 * 부킹 SEND
 */
const sendBooking = (request, response) => {
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			// 위동전용 체크로직
			let booking = request.body.booking;
			let cargo = request.body.cargo;
			let dangerTrue = request.body.dangerTrue;
			const containerList = request.body.containerList;
			const containerSpecialList = request.body.containerSpecialList;
			if( "WDFC" === booking.line_code && "SEND" === request.body.status ) {
				let checkSql = await fncWeidongCheckSend( booking, cargo, 'BOOKING' );
				const checkRlts = await client.query(checkSql);
				// const checkResult = checkRlts.rows[0];

				const chk = await fncCheckData(checkRlts.rows[0], booking, cargo, dangerTrue, containerList, containerSpecialList)
				console.log("최종메소드")
					if( chk.chk ) {
						response.status(400).json(chk.obj);
					} else {
						const sql = {
							text: ` select public.sf_send_booking($1, $2, $3, $4, $5) `,
							values: [
								request.body.klnet_id
								, request.body.booking.user_no
								, request.body.booking.bkg_no
								, request.body.booking.bkg_date
								, request.body.status
							]
						}
						console.log(sql);
				
				
						const res = await client.query(sql);
						let result = res.rows;
						console.log("result : ",result)
						if( result.length > 0 ) {
							let row = result[0];
							console.log("row : ",row)
							if( 'success' === row.sf_send_booking ) {
								response.status(200).json(row.sf_send_booking);
							} else {
								response.status(400).json(row.sf_send_booking)
							}
						}
					}
			} else {
				// 위동이 아닌 경우
				const sql = {
					text: ` select public.sf_send_booking($1, $2, $3, $4, $5) `,
					values: [
						request.body.klnet_id
						, request.body.user_no
						, request.body.booking.bkg_no
						, request.body.booking.bkg_date
						, request.body.status
					]
				}
				console.log(sql);
		
		
				const res = await client.query(sql);
				let result = res.rows;
				console.log("result : ",result)
				if( result.length > 0 ) {
					let row = result[0];
					console.log("row : ",row)
					if( 'success' === row.sf_send_booking ) {
						response.status(200).json(row.sf_send_booking);
					} else {
						response.status(400).json(row.sf_send_booking)
					}
				}
			}
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


const fncWeidongCheckSend = async(booking, cargo, dv_cd)=> {
    const sql = {
		text: ` select coalesce((select  case when count(service_code) > 0 then 'Y' else 'N' end
        from own_line_code_service_type 
        where line_code=$1
        and service_code = $2), 'N') service_code
    ,coalesce((select case when count(vessel_name)>0 then 'Y' else 'N' end
        from own_line_code_vessel_name
        where line_code = $1
        and vessel_name = $3), 'N') vessel_name
    ,coalesce((select case when count(line_code) > 0 then 'Y' else 'N' end 
        from own_line_service_route_manage
        where line_code = $1
        and start_port_code = $4
        and end_port_code = $5), 'N') route
    ,coalesce((select case when count(line_code) > 0 then 'Y' else 'N' end
        from own_line_code_cargo_pack_type
        where line_code = $1
        and cargo_pack_type = $6), 'N') cargo_pack_type
    ,coalesce((select case when count(recipient) >0 then 'Y' else 'N' end
        from own_line_work_originator
        where line_code = $1
        and work_code = $7),'N') recipient
	,coalesce((select case when count(originator) >0 then 'Y' else 'N' end
        from own_line_work_originator
        where line_code = $1
		and work_code = $7),'N') originator
	,coalesce((select case when public.sf_compute_booking_condition($1, $8, $3, $4, $5) = '1' 
        then 'Y' else 'N' end),'N') compute_condition 
	,coalesce((select case when public.sf_compute_sr_condition($1, $3, $9, $4, $5) = '1' 
        then 'Y' else 'N' end),'N') sr_compute_condition 
		
	`,
		values: [
			booking.line_code
			, booking.trans_service_code
			, booking.sch_vessel_name
			, booking.sch_pol
			, booking.sch_pod
			, cargo.cargo_pack_type
			, dv_cd // BOOKING, SR
			, booking.sch_etd?booking.sch_etd.replace(/-/gi,''):null
			, booking.sch_vessel_voyage
		]
	}
    console.log(sql);
    return sql;
}


const fncWeidongCheckSendCotainer = async( booking, container)=> {
    const sql = {
		text: ` select coalesce((select case when count(line_code) > 0 then 'Y' else 'N' end
        from own_line_code_cntr_sztp
        where line_code = $1
        and cntr_code = $2), 'N') cntr_sztp
    ,coalesce((select case when count(a.line_code) > 0 then 'Y' else 'N' end
        from own_line_code_vessel_pickup a
        ,own_line_code_vessel_name b
        where a.line_code = $1
        and b.vessel_name = $3
        and a.pickup_cy_code = $4
        and a.line_code = b.line_code
        and b.vessel_code = a.vessel_code), 'N') pick_up `,
		values: [
			booking.line_code
			, container.cntr_code
			, booking.sch_vessel_name
			, container.cntr_pick_up_cy_code
		]
	}
    console.log(sql);
    return sql;
}

const fncWeidongCheckSendSpecail = async( booking, container)=> {
    const sql = {
		text: ` select coalesce((select case when count(a.line_code) > 0 then 'Y' else 'N' end
        from own_line_code_danger a
        where line_code = $1
        and undg_code = $2
        and imdg_code = $3), 'N') danger `,
		values: [
			booking.line_code
			, container.special_undg
			, container.special_imdg
		]
	}
    console.log(sql);
    return sql;
}


const selectShpConfirm = (request, response) => {
	console.log('selectShpConfirm call......');
	// let queryString = ` SELECT user_no, res_bkg_no, res_confirm_date, res_bkg_date, res_user_no, 
	// 	res_user_name, res_confirm_recv_date, res_confirm_klnet_id, res_remark1, res_remark2, 
	// 	bkg_no, bkg_date, owner_no, insert_date, update_user, 
	// 	update_date, sc_no, docu_user_name, docu_user_tel, docu_user_phone, 
	// 	docu_user_fax, docu_user_email, docu_tax_email, sch_line_code, sch_vessel_code, 
	// 	sch_vessel_name, sch_vessel_voyage, sch_svc, sch_start_port_code, sch_end_port_code, 
	// 	sch_pol, sch_pol_name, sch_pod, sch_pod_name, sch_call_sign, 
	// 	sch_mrn, sch_por, sch_por_name, sch_pld, sch_pld_name, 
	// 	sch_etd, sch_eta, sch_fdp, sch_fdp_name, sch_srd, 
	// 	sch_led, sch_dct, sch_cct, sch_sr_closing_time, sch_ts_yn, 
	// 	shp_name1, shp_name2, shp_code, shp_user_name, shp_user_tel, 
	// 	shp_user_email, shp_address1, shp_address2, shp_address3, shp_address4, 
	// 	shp_address5, shp_user_dept, shp_user_fax, shp_payment_type, fwd_name1, 
	// 	fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email, 
	// 	fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5, 
	// 	fwd_user_dept, fwd_user_fax, cons_name1, cons_name2, cons_code, 
	// 	cons_user_name, cons_user_tel, cons_user_email, cons_address1, cons_address2, 
	// 	cons_address3, cons_address4, cons_address5, cons_user_dept, cons_user_fax, 
	// 	trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name, 
	// 	trans_user_tel, trans_user_email, trans_user_fax, trans_fac_area_name, trans_fac_name, 
	// 	trans_remark, sending_count, klnet_id, line_name1, line_name2, 
	// 	line_code, line_user_name, line_user_tel, line_user_email, line_address1, 
	// 	line_address2, line_address3, line_address4, line_address5, line_user_dept, 
	// 	line_user_fax, originator, recipient, consol_bkg_yn, bl_type, 
	// 	bl_cnt, incoterms_code, resend_yn, order_no, si_no, 
	// 	trans_service_code, remark1, remark2, load_type, xml_msg_id, 
	// 	xmldoc_seq, status_cus, 
	// 	coalesce((select x.service_type from own_line_code_service_type x where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as trans_service_name
	// FROM shp_confirm a where user_no = $1 and res_bkg_no = $2 `;
	// if(request.body.res_confirm_date) {
	// 	queryString += " and res_confirm_date = '"+request.body.res_confirm_date+"' \n";
	// }
	// queryString += " order by res_confirm_date desc limit 1";


	let queryString = ` select a.*, b.*
    from
    (
        SELECT dense_rank() over (order by user_no, res_bkg_no, res_confirm_date) as idx, 
            user_no, res_bkg_no, res_confirm_date, res_bkg_date, res_user_no, 
            res_user_name, res_confirm_recv_date, res_confirm_klnet_id, res_remark1, res_remark2, 
            (select b.bkg_no
               from shp_bkg b
              where b.res_bkg_no = a.res_bkg_no
                and b.user_no = a.user_no
                and b.res_confirm_date = a.res_confirm_date limit 1) as bkg_no, 
            (select b.bkg_date
               from shp_bkg b
              where b.res_bkg_no = a.res_bkg_no
                and b.user_no = a.user_no
                and b.res_confirm_date = a.res_confirm_date limit 1) as bkg_date, owner_no, insert_date, update_user, 
            update_date, sc_no, docu_user_name, docu_user_tel, docu_user_phone, 
            docu_user_fax, docu_user_email, docu_tax_email, sch_line_code, sch_vessel_code, 
            sch_vessel_name, sch_vessel_voyage, sch_svc, sch_start_port_code, sch_end_port_code, 
            sch_pol, sch_pol_name, sch_pod, sch_pod_name, sch_call_sign, 
            sch_mrn, sch_por, sch_por_name, sch_pld, sch_pld_name, 
			case when sch_etd is not null
            then case when length(sch_etd) = 8
                      then to_char(to_timestamp(sch_etd,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_etd) = 12
                      then to_char(to_timestamp(sch_etd,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_etd
                 end
            else sch_etd
            end sch_etd
			, case when sch_eta is not null
            then case when length(sch_eta) = 8
                      then to_char(to_timestamp(sch_eta,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_eta) = 12
                      then to_char(to_timestamp(sch_eta,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_eta
                 end
            else sch_eta
       end sch_eta
			, sch_fdp, sch_fdp_name
			, sch_srd, 
			sch_led
			, case when sch_dct is not null
            then case when length(sch_dct) = 8
                      then to_char(to_timestamp(sch_dct,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_dct) = 12
                      then to_char(to_timestamp(sch_dct,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_dct
                 end
            else sch_dct
	   end sch_dct
	   , case when sch_cct is not null
	   then case when length(sch_cct) = 8
				 then to_char(to_timestamp(sch_cct,'YYYYMMDD'),'YYYY-MM-DD')
				 when length(sch_cct) = 12
				 then to_char(to_timestamp(sch_cct,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
				 else sch_cct
			end
	   else sch_cct
  end sch_cct, sch_sr_closing_time, sch_ts_yn, 
            shp_name1, shp_name2, shp_code, shp_user_name, shp_user_tel, 
            shp_user_email, shp_address1, shp_address2, shp_address3, shp_address4, 
            shp_address5, shp_user_dept, shp_user_fax, shp_payment_type, fwd_name1, 
            fwd_name2, fwd_code, fwd_user_name, fwd_user_tel, fwd_user_email, 
            fwd_address1, fwd_address2, fwd_address3, fwd_address4, fwd_address5, 
            fwd_user_dept, fwd_user_fax, cons_name1, cons_name2, cons_code, 
            cons_user_name, cons_user_tel, cons_user_email, cons_address1, cons_address2, 
            cons_address3, cons_address4, cons_address5, cons_user_dept, cons_user_fax, 
            trans_self_yn, trans_name1, trans_name2, trans_code, trans_user_name, 
            trans_user_tel, trans_user_email, trans_user_fax, trans_fac_area_name, trans_fac_name, 
            trans_remark, sending_count, klnet_id, line_name1, line_name2, 
            line_code, line_user_name, line_user_tel, line_user_email, line_address1, 
            line_address2, line_address3, line_address4, line_address5, line_user_dept, 
            line_user_fax, originator, recipient, consol_bkg_yn, bl_type, 
            bl_cnt, incoterms_code, resend_yn, order_no, si_no, 
            trans_service_code, remark1, remark2, load_type, xml_msg_id, 
            xmldoc_seq, status_cus, 
            coalesce((select x.service_type from own_line_code_service_type x 
                where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as trans_service_name
           ,case when (select count(1)
                      from shp_bkg b
                     where b.res_bkg_no = a.res_bkg_no
                       and b.user_no = a.user_no
                       and b.res_bkg_date = a.res_bkg_date) > 0 
                 then 'Y'
                 else 'N'
            end bkg_exists_yn
        FROM shp_confirm a 
        where user_no = $1 and res_bkg_no = $2 `;
	if(request.body.res_confirm_date) {
		queryString += " and res_confirm_date = '"+request.body.res_confirm_date+"' \n";
	}
	queryString += " order by res_confirm_date desc limit 1";

	queryString += ` ) a
	left outer join 
	(
		SELECT dense_rank() over (order by user_no, bkg_no, bkg_date) as idx,
			user_no as t_user_no, bkg_no as t_bkg_no, bkg_date as t_bkg_date, owner_no as t_owner_no, klnet_id as t_klnet_id, 
			insert_date as t_insert_date, update_user as t_update_user, update_date as t_update_date, status_cus as t_status_cus, status_cud as t_status_cud, 
			send_date as t_send_date, sending_count as t_sending_count, sc_no as t_sc_no, 
			schedule_bookmark_seq as t_schedule_bookmark_seq, document_bookmark_seq as t_document_bookmark_seq, 
			shipper_bookmark_seq as t_shipper_bookmark_seq, forwarder_bookmark_seq as t_forwarder_bookmark_seq, consignee_bookmark_seq as t_consignee_bookmark_seq, 
			line_bookmark_seq as t_line_bookmark_seq, transport_bookmark_seq as t_transport_bookmark_seq, 
			other_bookmark_seq as t_other_bookmark_seq, docu_user_name as t_docu_user_name, docu_user_tel as t_docu_user_tel, 
			docu_user_phone as t_docu_user_phone, docu_user_fax as t_docu_user_fax, 
			docu_user_email as t_docu_user_email, docu_tax_email as t_docu_tax_email, sch_line_code as t_sch_line_code, 
			sch_vessel_code as t_sch_vessel_code, sch_vessel_name as t_sch_vessel_name, 
			sch_vessel_voyage as t_sch_vessel_voyage, sch_svc as t_sch_svc, sch_start_port_code as t_sch_start_port_code, 
			sch_end_port_code as t_sch_end_port_code, sch_pol as t_sch_pol, 
			sch_pol_name as t_sch_pol_name, sch_pod as t_sch_pod, sch_pod_name as t_sch_pod_name, sch_call_sign as t_sch_call_sign, sch_mrn as t_sch_mrn, 
			sch_por as t_sch_por, sch_por_name as t_sch_por_name, sch_pld as t_sch_pld, sch_pld_name as t_sch_pld_name
, case when sch_etd is not null
 then case when length(sch_etd) = 8
 then to_char(to_timestamp(sch_etd,'YYYYMMDD'),'YYYY-MM-DD')
 when length(sch_etd) = 12
 then to_char(to_timestamp(sch_etd,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
 else sch_etd
 end
 else sch_etd
 end as t_sch_etd, 
 case when sch_eta is not null
 then case when length(sch_eta) = 8
 then to_char(to_timestamp(sch_eta,'YYYYMMDD'),'YYYY-MM-DD')
 when length(sch_eta) = 12
 then to_char(to_timestamp(sch_eta,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
 else sch_eta
 end
 else sch_eta
 end as t_sch_eta, sch_fdp as t_sch_fdp, sch_fdp_name as t_sch_fdp_name, sch_srd as t_sch_srd, sch_led as t_sch_led, 
 case when sch_dct is not null
 then case when length(sch_dct) = 8
 then to_char(to_timestamp(sch_dct,'YYYYMMDD'),'YYYY-MM-DD')
 when length(sch_dct) = 12
 then to_char(to_timestamp(sch_dct,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
 else sch_dct
 end
 else sch_dct
 end as t_sch_dct
 ,case when sch_cct is not null
 then case when length(sch_cct) = 8
 then to_char(to_timestamp(sch_cct,'YYYYMMDD'),'YYYY-MM-DD')
 when length(sch_cct) = 12
 then to_char(to_timestamp(sch_cct,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
 else sch_cct
 end
 else sch_cct
 end as t_sch_cct, sch_sr_closing_time as t_sch_sr_closing_time, sch_ts_yn as t_sch_ts_yn, shp_name1 as t_shp_name1, 
			shp_name2 as t_shp_name2, shp_code as t_shp_code, shp_user_name as t_shp_user_name, shp_user_tel as t_shp_user_tel, shp_user_email as t_shp_user_email, 
			shp_address1 as t_shp_address1, shp_address2 as t_shp_address2, shp_address3 as t_shp_address3, shp_address4 as t_shp_address4, shp_address5 as t_shp_address5, 
			shp_user_dept as t_shp_user_dept, shp_user_fax as t_shp_user_fax, shp_payment_type as t_shp_payment_type, fwd_name1 as t_fwd_name1, fwd_name2 as t_fwd_name2, 
			fwd_code as t_fwd_code, fwd_user_name as t_fwd_user_name, fwd_user_tel as t_fwd_user_tel, fwd_user_email as t_fwd_user_email, fwd_address1 as t_fwd_address1, 
			fwd_address2 as t_fwd_address2, fwd_address3 as t_fwd_address3, fwd_address4 as t_fwd_address4, fwd_address5 as t_fwd_address5, fwd_user_dept as t_fwd_user_dept, 
			fwd_user_fax as t_fwd_user_fax, cons_name1 as t_cons_name1, cons_name2 as t_cons_name2, cons_code as t_cons_code, cons_user_name as t_cons_user_name, 
			cons_user_tel as t_cons_user_tel, cons_user_email as t_cons_user_email, cons_address1 as t_cons_address1, 
			cons_address2 as t_cons_address2, cons_address3 as t_cons_address3, 
			cons_address4 as t_cons_address4, cons_address5 as t_cons_address5, cons_user_dept as t_cons_user_dept, 
			cons_user_fax as t_cons_user_fax, trans_self_yn as t_trans_self_yn, 
			trans_name1 as t_trans_name1, trans_name2 as t_trans_name2, trans_code as t_trans_code, trans_user_name as t_trans_user_name, trans_user_tel as t_trans_user_tel, 
			trans_user_email as t_trans_user_email, trans_user_fax as t_trans_user_fax, trans_fac_area_name as t_trans_fac_area_name, 
			trans_fac_name as t_trans_fac_name, trans_remark as t_trans_remark, 
			line_name1 as t_line_name1, line_name2 as t_line_name2, line_code as t_line_code, 
			line_user_name as t_line_user_name, line_user_tel as t_line_user_tel, 
			line_user_email as t_line_user_email, line_address1 as t_line_address1, line_address2 as t_line_address2, 
			line_address3 as t_line_address3, line_address4 as t_line_address4, 
			line_address5 as t_line_address5, line_user_dept as t_line_user_dept, line_user_fax as t_line_user_fax, consol_bkg_yn as t_consol_bkg_yn, bl_type as t_bl_type, 
			bl_cnt as t_bl_cnt, incoterms_code as t_incoterms_code, resend_yn as t_resend_yn, order_no as t_order_no, si_no as t_si_no, 
			trans_service_code as t_trans_service_code, remark1 as t_remark1, remark2 as t_remark2, 
			load_type as t_load_type, res_bkg_no as t_res_bkg_no, 
			res_bkg_date as t_res_bkg_date, res_confirm_date as t_res_confirm_date, res_user_no as t_res_user_no, 
			res_user_name as t_res_user_name, res_confirm_recv_date as t_res_confirm_recv_date, 
			res_confirm_klnet_id as t_res_confirm_klnet_id, res_remark1 as t_res_remark1, res_remark2 as t_res_remark2, 
			xml_msg_id as t_xml_msg_id, xmldoc_seq as t_xmldoc_seq, 
			originator as t_originator, recipient as t_recipient,
			coalesce((select x.service_type from own_line_code_service_type x 
				where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as t_trans_service_name
		FROM shp_bkg a
		WHERE user_no =  $1 and res_bkg_no = $2 `;
		if(request.body.res_confirm_date) {
			queryString += " and res_confirm_date = '"+request.body.res_confirm_date+"' \n";
		}
	queryString += ` order by res_confirm_date desc, update_date desc, insert_date desc limit 1
	) b
	on (a.idx = b.idx)`;	


    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.res_bkg_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const selectShpConfirmCargo = (request, response) => {
	console.log('selectShpConfirmCargo call......');

	// let queryString = ` SELECT user_no, res_bkg_no, res_confirm_date, cargo_seq, cargo_type, 
	// 	cargo_name, cargo_hs_code, cargo_pack_qty, cargo_pack_type, cargo_weight, 
	// 	cargo_total_volume, cargo_remark, cargo_total_weight, insert_date, insert_user, 
	// 	update_date, update_user,
	// 	coalesce((select x.cargo_type_desc from own_line_code_cargo_type x where x.line_code = $4 and x.cargo_type = a.cargo_type), a.cargo_type) as cargo_type_name,
	// 	coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as cargo_pack_type_name
	// FROM shp_confirm_cargo a
	// WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3
	// ORDER BY cargo_seq `;


	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, res_bkg_no, res_confirm_date, cargo_seq) as idx, 
			user_no, res_bkg_no, res_confirm_date, cargo_seq, cargo_type, 
			cargo_name, cargo_hs_code, cargo_pack_qty, cargo_pack_type, cargo_weight, 
			cargo_total_volume, cargo_remark, cargo_total_weight, insert_date, insert_user, 
			update_date, update_user,
			coalesce((select x.cargo_type_desc from own_line_code_cargo_type x where x.line_code = $4 and x.cargo_type = a.cargo_type), a.cargo_type) as cargo_type_name,
			coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as cargo_pack_type_name
		from shp_confirm_cargo a
		where user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3 ORDER BY cargo_seq
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, bkg_no, bkg_date, cargo_seq) as idx, 
			bkg_no as t_bkg_no, bkg_date as t_bkg_date, user_no as t_user_no, cargo_seq as t_cargo_seq, cargo_type as t_cargo_type, 
			cargo_name as t_cargo_name, cargo_hs_code as t_cargo_hs_code, cargo_pack_qty as t_cargo_pack_qty, cargo_pack_type as t_cargo_pack_type, cargo_weight as t_cargo_weight, 
			cargo_total_volume as t_cargo_total_volume, cargo_remark as t_cargo_remark, cargo_total_weight as t_cargo_total_weight, cargo_bookmark_seq as t_cargo_bookmark_seq, insert_date as t_insert_date, 
			insert_user as t_insert_user, update_date as t_update_date, update_user as t_update_user, owner_no as t_owner_no,
			coalesce((select x.cargo_type_desc from own_line_code_cargo_type x where x.line_code = $4 and x.cargo_type = a.cargo_type), a.cargo_type) as t_cargo_type_name,
			coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as t_cargo_pack_type_name		
		from shp_bkg_cargo a
		WHERE (user_no, bkg_no, bkg_date) in (
			SELECT user_no, bkg_no, bkg_date 
			FROM shp_bkg b
			WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3
			order by res_confirm_date desc, update_date desc, insert_date desc limit 1
		)
	) b
	on (a.idx = b.idx)  `;


    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.res_bkg_no,
			request.body.res_confirm_date,
			request.body.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const selectShpConfirmCargoGoods = (request, response) => {
	console.log('selectShpConfirmCargo Goods');

	let queryString = ` select a.*, b.*
 from
 (
 select dense_rank() over (order by user_no, res_bkg_no, res_confirm_date, cargo_seq, goods_seq) as idx, 
 user_no, res_bkg_no, res_confirm_date, cargo_seq, goods_seq, goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5
 , owner_no, insert_date, insert_user, update_date, update_user
 from shp_confirm_cargo_goods a
 WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3 and cargo_seq = $4 ORDER BY cargo_seq, goods_seq
 ) a
 left outer join 
 (
 select dense_rank() over (order by user_no, bkg_no, bkg_date, cargo_seq, goods_seq) as idx, 
 bkg_no as t_bkg_no, bkg_date as t_bkg_date, cargo_seq as t_cargo_seq, goods_seq as t_goods_seq,
 goods_desc1 as t_goods_desc1, goods_desc2 as t_goods_desc2, goods_desc3 as t_goods_desc3, goods_desc4 as t_goods_desc4, goods_desc5 as t_goods_desc5,
 owner_no as t_owner_no        
 from shp_bkg_cargo_goods a
 WHERE (user_no, bkg_no, bkg_date) in (
 SELECT user_no, bkg_no, bkg_date 
 FROM shp_bkg b
 WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3 and cargo_seq = $4
 order by res_confirm_date desc, update_date desc, insert_date desc limit 1 )
 ) b
 on (a.idx = b.idx) `;


    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.res_bkg_no,
			request.body.res_confirm_date,
			request.body.cargo_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const selectShpConfirmCntr = (request, response) => {
	console.log('selectShpConfirmCntr call......');

	// let queryString = ` SELECT user_no, res_bkg_no, res_confirm_date, cntr_seq, cntr_size, 
	// 	cntr_type, cntr_qty, cntr_length, cntr_width, cntr_height, 
	// 	cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc, cntr_soc_yn, cntr_seal_no, 
	// 	cntr_pick_up_cy_code, cntr_pick_up_cy_address1, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3, cntr_pick_up_cy_address4, 
	// 	cntr_pick_up_cy_address5, cntr_pick_up_cy_name1, cntr_pick_up_cy_name2, cntr_pick_up_date, cntr_empty_yn, 
	// 	cntr_special_type, cntr_code, cntr_pick_up_cy_user_name, cntr_pick_up_cy_user_fax, cntr_pick_up_cy_user_tel, 
	// 	cntr_pick_up_cy_user_email, insert_date, insert_user, update_date, update_user, 
	// 	cntr_vent_open, cntr_pre_cooling, cntr_drop_off_cy_code, cntr_drop_off_cy_address1, cntr_drop_off_cy_address2, 
	// 	cntr_drop_off_cy_address3, cntr_drop_off_cy_address4, cntr_drop_off_cy_address5, cntr_drop_off_cy_name1, cntr_drop_off_cy_name2 
	// FROM shp_confirm_cntr
	// WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3
	// ORDER BY cntr_seq `;

	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, res_bkg_no, res_confirm_date, cntr_seq) as idx, 
			user_no, res_bkg_no, res_confirm_date, cntr_seq, cntr_size, 
			cntr_type, cntr_qty, cntr_length, cntr_width, cntr_height, 
			concat(cntr_frozen_tmp, ' ',cntr_frozen_tmp_unit) as cntr_frozen_tmp, cntr_frozen_tmp_unit, cntr_frozen_fc, cntr_soc_yn, cntr_seal_no, 
			cntr_pick_up_cy_code, cntr_pick_up_cy_address1, cntr_pick_up_cy_address2, cntr_pick_up_cy_address3, cntr_pick_up_cy_address4, 
			cntr_pick_up_cy_address5, cntr_pick_up_cy_name1, cntr_pick_up_cy_name2
			, case when cntr_pick_up_date is not null
            then case when length(cntr_pick_up_date) = 8
                      then to_char(to_timestamp(cntr_pick_up_date,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(cntr_pick_up_date) = 12
                      then to_char(to_timestamp(cntr_pick_up_date,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else cntr_pick_up_date
                 end
            else cntr_pick_up_date
       end as cntr_pick_up_date
			, cntr_empty_yn, 
			cntr_special_type, cntr_code, cntr_pick_up_cy_user_name, cntr_pick_up_cy_user_fax, cntr_pick_up_cy_user_tel, 
			cntr_pick_up_cy_user_email, insert_date, insert_user, update_date, update_user, 
			cntr_vent_open, cntr_pre_cooling, cntr_drop_off_cy_code, cntr_drop_off_cy_address1, cntr_drop_off_cy_address2, 
			cntr_drop_off_cy_address3, cntr_drop_off_cy_address4, cntr_drop_off_cy_address5, cntr_drop_off_cy_name1, cntr_drop_off_cy_name2,
			coalesce((SELECT pickup_cy_name 
			FROM own_line_code_vessel_pickup b
			,own_line_code_vessel_name c
			where b.line_code = $4
			and b.line_code = c.line_code
			and b.vessel_code = c.vessel_code
			and c.vessel_name = $5
			and pickup_cy_code = a.cntr_pick_up_cy_code),
			(SELECT pickup_cy_name 
			FROM own_line_code_vessel_pickup b
			where b.line_code = $4
			and pickup_cy_code = a.cntr_pick_up_cy_code limit 1)) as pickup_cy_name,
			cntr_remark,
			cntr_cfs_code,
			cntr_cfs_address1,
			cntr_cfs_address2,
			cntr_cfs_address3,
			cntr_cfs_address4,
			cntr_cfs_address5,
			cntr_cfs_name1,
			cntr_cfs_name2
		from shp_confirm_cntr a
		where user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3 ORDER BY cntr_seq
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, bkg_no, bkg_date, cntr_seq) as idx, 
			user_no as t_user_no, bkg_no as t_bkg_no, bkg_date as t_bkg_date, cntr_seq as t_cntr_seq, container_bookmark_seq as t_container_bookmark_seq, 
			cntr_size as t_cntr_size, cntr_type as t_cntr_type, cntr_qty as t_cntr_qty, cntr_length as t_cntr_length, cntr_width as t_cntr_width, 
			cntr_height as t_cntr_height
			, concat(cntr_frozen_tmp, ' ',cntr_frozen_tmp_unit) as t_cntr_frozen_tmp
			, cntr_frozen_tmp_unit as t_cntr_frozen_tmp_unit, 
			cntr_frozen_fc as t_cntr_frozen_fc, cntr_soc_yn as t_cntr_soc_yn, 
			cntr_seal_no as t_cntr_seal_no, cntr_pick_up_cy_code as t_cntr_pick_up_cy_code, cntr_pick_up_cy_address1 as t_cntr_pick_up_cy_address1, 
			cntr_pick_up_cy_address2 as t_cntr_pick_up_cy_address2, cntr_pick_up_cy_address3 as t_cntr_pick_up_cy_address3, 
			cntr_pick_up_cy_address4 as t_cntr_pick_up_cy_address4, cntr_pick_up_cy_address5 as t_cntr_pick_up_cy_address5, cntr_pick_up_cy_name1 as t_cntr_pick_up_cy_name1, 
			cntr_pick_up_cy_name2 as t_cntr_pick_up_cy_name2
			, case when cntr_pick_up_cy_date is not null
            then case when length(cntr_pick_up_cy_date) = 8
                      then to_char(to_timestamp(cntr_pick_up_cy_date,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(cntr_pick_up_cy_date) = 12
                      then to_char(to_timestamp(cntr_pick_up_cy_date,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else cntr_pick_up_cy_date
                 end
            else cntr_pick_up_cy_date
       end  as t_cntr_pick_up_date
			, 
			cntr_empty_yn as t_cntr_empty_yn, cntr_special_type as t_cntr_special_type, cntr_code as t_cntr_code, 
			cntr_pick_up_cy_user_name as t_cntr_pick_up_cy_user_name, cntr_pick_up_cy_user_fax as t_cntr_pick_up_cy_user_fax, 
			cntr_pick_up_cy_user_tel as t_cntr_pick_up_cy_user_tel, cntr_pick_up_cy_user_email as t_cntr_pick_up_cy_user_email, cntr_vent_open as t_cntr_vent_open, 
			cntr_pre_cooling as t_cntr_pre_cooling, insert_date as t_insert_date, 
			insert_user as t_insert_user, update_date as t_update_date, update_user as t_update_user, owner_no as t_owner_no,
			coalesce((SELECT pickup_cy_name 
			FROM own_line_code_vessel_pickup b
			,own_line_code_vessel_name c
			where b.line_code = $4
			and c.vessel_name = $5
			and b.line_code = c.line_code
			and b.vessel_code = c.vessel_code
			and pickup_cy_code = a.cntr_pick_up_cy_code)
			, (SELECT pickup_cy_name 
			FROM own_line_code_vessel_pickup b
			where b.line_code = $4
			and pickup_cy_code = a.cntr_pick_up_cy_code limit 1)) as t_pickup_cy_name
			,concat(cntr_remark1,' ',cntr_remark2,' ',cntr_remark3,' ',cntr_remark4,' ',cntr_remark5) as t_cntr_remark,
			cntr_cfs_code as t_cntr_cfs_code,
			cntr_cfs_address1 as t_cntr_cfs_address1,
			cntr_cfs_address2 as t_cntr_cfs_address2,
			cntr_cfs_address3 as t_cntr_cfs_address3,
			cntr_cfs_address4 as t_cntr_cfs_address4,
			cntr_cfs_address5 as t_cntr_cfs_address5,
			cntr_cfs_name1 as t_cntr_cfs_name1,
			cntr_cfs_name2 as t_cntr_cfs_name2
		from shp_bkg_cntr a
		WHERE (user_no, bkg_no, bkg_date) in (
			SELECT user_no, bkg_no, bkg_date 
			FROM shp_bkg b
			WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3
			order by res_confirm_date desc, update_date desc, insert_date desc limit 1
		)
	) b
	on (a.idx = b.idx)  `;	

    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.res_bkg_no,
			request.body.res_confirm_date,
			request.body.line_code,
			request.body.sch_vessel_name,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectShpConfirmCntrSpecial = (request, response) => {
	console.log('selectShpConfirmCntrSpecial');
	let queryString = ` select a.*, b.*
 from
(
 select dense_rank() over (order by user_no, res_bkg_no, res_confirm_date, cntr_seq, special_seq) as idx, 
 user_no, res_bkg_no, res_confirm_date, cntr_seq, special_seq, special_undg, special_imdg, special_ignition
 , special_ignition_type, special_out_pack_type, special_out_pack_cnt, special_out_pack_grade, special_gross_weight
 , special_net_weight, insert_date, insert_user, update_date, update_user, special_pack_group, special_tech_name
 , special_pullutant, special_shipping_name, special_user_name, special_user_dept
 , special_user_tel, special_user_fax, special_user_email
 from shp_confirm_cntr_special a
where user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3 ORDER BY cntr_seq
) a
left outer join 
(
 select dense_rank() over (order by user_no, bkg_no, bkg_date, cntr_seq, special_seq) as idx, 
 bkg_no as t_bkg_no, bkg_date as t_bkg_date, cntr_seq as t_cntr_seq, special_seq as t_special_seq, special_undg as t_special_undg
, special_imdg as t_special_imdg, special_ignition as t_special_ignition, special_ignition_type as t_special_ignition_type
, special_out_pack_type as t_special_out_pack_type, special_out_pack_cnt as t_special_out_pack_cnt, special_out_pack_grade as t_special_out_pack_grade
, special_gross_weight as t_special_gross_weight, special_net_weight as t_special_net_weight, special_pack_group as t_special_pack_group
, special_tech_name as t_special_tech_name, null as t_special_pullutant, special_shipping_name as t_special_shipping_name
, special_user_name as t_special_user_name, special_user_dept as t_special_user_dept
, special_user_tel as t_special_user_tel, special_user_fax as t_special_user_fax, special_user_email as t_special_user_email    
 from shp_bkg_cntr_special a
 WHERE (user_no, bkg_no, bkg_date) in (
 SELECT user_no, bkg_no, bkg_date 
 FROM shp_bkg b
 WHERE user_no = $1 and res_bkg_no = $2 and res_confirm_date = $3
 order by res_confirm_date desc, update_date desc, insert_date desc limit 1)
 ) b
 on (a.idx = b.idx)  `;	

    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.res_bkg_no,
			request.body.res_confirm_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}



const selectShpBl = (request, response) => {
	console.log('selectShpBl call......');

	


	// let queryString = ` SELECT user_no, mbl_no, issue_date, line_code, bgm_1004, 
	// 	shp_code, shp_address1, shp_address2, shp_address3, shp_address4, 
	// 	shp_address5, shp_name1, shp_name2, shp_corporation_code, shp_supplier_code, 
	// 	shp_user_name, shp_user_tel, shp_user_email, shp_user_fax, cons_code, 
	// 	cons_address1, cons_address2, cons_address3, cons_address4, cons_address5, 
	// 	cons_name1, cons_name2, noti1_code, noti1_address1, noti1_address2, 
	// 	noti1_address3, noti1_address4, noti1_address5, noti1_name1, noti1_name2, 
	// 	noti2_code, noti2_address1, noti2_address2, noti2_address3, noti2_address4, 
	// 	noti2_address5, noti2_name1, noti2_name2, line_user_name, line_user_dept, 
	// 	line_user_tel, line_user_fax, line_user_email, line2_code, line2_address1, 
	// 	line2_address2, line2_address3, line2_address4, line2_address5, line2_name1, 
	// 	line2_name2, line_payment_kind, line_payment_type, line_ca_code, fw_code, 
	// 	fw_address1, fw_address2, fw_address3, fw_address4, fw_address5, 
	// 	fw_name1, fw_name2, fw_lg_code, fw_producer_code, sch_vessel_voyage, 
	// 	sch_trans_code, sch_line_code, sch_call_sign, sch_vessel_name, sch_vessel_country, 
	// 	sch_obd, sch_eta, sch_keta, sch_etd, sch_pol, 
	// 	sch_pol_name, sch_pod, sch_pod_name, sch_fdp, sch_fdp_name, 
	// 	sch_por, sch_por_name, sch_pld, sch_pld_name, sch_last_before_port, 
	// 	sch_last_before_port_name, sch_aiw_class, currency_code, exchange_rate, total_amount, 
	// 	incoterms_code, sr_no, trans_service_code, invoice_no, lc_no, conveyance_mode, 
	// 	mrn, ams_file_no, amv_dept_code, bl_issue_code, bl_issue_name, 
	// 	pre_paid_code, pre_paid_name, deffered_payment_code, deffered_payment_name, department_dept_code, 
	// 	receiver_user_name, receiver_user_dept, receiver_user_tel, receiver_user_email, org_isuue_bl_qty, 
	// 	status_cus, status_cud, insert_date, update_date, xml_msg_id, 
	// 	xmldoc_seq, line_address1, line_address2, line_address3, line_address4, 
	// 	line_address5, line_name1, line_name2,
	// 	coalesce((select x.service_type from own_line_code_service_type x where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as trans_service_name
	// FROM shp_bl a where user_no = $1 and mbl_no = $2 `;


	let queryString = ` select a.*, b.*
	from
	(
		SELECT dense_rank() over (order by user_no, mbl_no, issue_date) as idx, 	
			user_no, mbl_no, issue_date, line_code, bgm_1004, 
			shp_code, shp_address1, shp_address2, shp_address3, shp_address4,
			shp_address5, shp_name1, shp_name2, shp_corporation_code, shp_supplier_code, 
			shp_user_name, shp_user_tel, shp_user_email, shp_user_fax, cons_code, 
			cons_address1, cons_address2, cons_address3, cons_address4, cons_address5, 
			cons_name1, cons_name2, noti1_code, noti1_address1, noti1_address2, 
			noti1_address3, noti1_address4, noti1_address5, noti1_name1, noti1_name2, 
			noti2_code, noti2_address1, noti2_address2, noti2_address3, noti2_address4, 
			noti2_address5, noti2_name1, noti2_name2, line_user_name, line_user_dept, 
			line_user_tel, line_user_fax, line_user_email, line2_code, line2_address1, 
			line2_address2, line2_address3, line2_address4, line2_address5, line2_name1, 
			line2_name2, line_payment_kind, line_payment_type, line_ca_code, fw_code, 
			fw_address1, fw_address2, fw_address3, fw_address4, fw_address5, 
			fw_name1, fw_name2, fw_lg_code, fw_producer_code, sch_vessel_voyage, 
			sch_trans_code, sch_line_code, sch_call_sign, sch_vessel_name, sch_vessel_country, 
			case when line_payment_type is not null
			then case when line_payment_type = 'P'
				then 'PREPAID'
				when line_payment_type = 'C'
				then 'COLLECT'
				else line_payment_type end else line_payment_type end as line_payment_type_name,
			case when sch_obd is not null
            then case when length(sch_obd) = 8
                      then to_char(to_timestamp(sch_obd,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_obd) = 12
                      then to_char(to_timestamp(sch_obd,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_obd
                 end
			else sch_obd
            end sch_obd, 
			case when sch_eta is not null
            then case when length(sch_eta) = 8
                      then to_char(to_timestamp(sch_eta,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_eta) = 12
                      then to_char(to_timestamp(sch_eta,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_eta
                 end
            else sch_eta
			end sch_eta,
			case when sch_keta is not null
            then case when length(sch_keta) = 8
                      then to_char(to_timestamp(sch_keta,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_keta) = 12
                      then to_char(to_timestamp(sch_keta,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_keta
                 end
            else sch_keta
			end sch_keta, 
			case when sch_etd is not null
            then case when length(sch_etd) = 8
                      then to_char(to_timestamp(sch_etd,'YYYYMMDD'),'YYYY-MM-DD')
                      when length(sch_etd) = 12
                      then to_char(to_timestamp(sch_etd,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi')
                      else sch_etd
                 end
            else sch_etd
			end sch_etd, sch_pol, 
			sch_pol_name, sch_pod, sch_pod_name, sch_fdp, sch_fdp_name, 
			sch_por, sch_por_name, sch_pld, sch_pld_name, sch_last_before_port, 
			sch_last_before_port_name, sch_aiw_class, currency_code, exchange_rate, total_amount, 
			incoterms_code, sr_no, trans_service_code, invoice_no, lc_no, conveyance_mode, 
			mrn, ams_file_no, amv_dept_code, bl_issue_code, bl_issue_name, 
			pre_paid_code, pre_paid_name, deffered_payment_code, deffered_payment_name, department_dept_code, 
			receiver_user_name, receiver_user_dept, receiver_user_tel, receiver_user_email, org_isuue_bl_qty, 
			status_cus, status_cud, insert_date, update_date, xml_msg_id, 
			xmldoc_seq, line_address1, line_address2, line_address3, line_address4, 
			line_address5, line_name1, line_name2,
			coalesce((select x.service_type from own_line_code_service_type x where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as trans_service_name,
			imagebl_path,imagebl_name
		FROM shp_bl a where user_no = $1 and mbl_no = $2 `;
	if(request.body.issue_date) {
		queryString += " and issue_date = '"+request.body.issue_date+"' \n";
	}
	queryString += " order by issue_date desc limit 1";

	queryString += ` ) a
	left outer join 
	(
		SELECT dense_rank() over (order by user_no, sr_no, sr_date) as idx,
			user_no as t_user_no, sr_no as t_sr_no, sr_date as t_sr_date, owner_no as t_owner_no, insert_date as t_insert_date,
			update_date as t_update_date, status_cus as t_status_cus, send_date as t_send_date, sending_count as t_sending_count, shp_user_name as t_shp_user_name, 
			shp_user_dept as t_shp_user_dept, shp_user_tel as t_shp_user_tel, shp_user_email as t_shp_user_email, shp_user_fax as t_shp_user_fax, shp_address1 as t_shp_address1, 
			shp_address2 as t_shp_address2, shp_address3 as t_shp_address3, shp_address4 as t_shp_address4, shp_address5 as t_shp_address5, shp_name1 as t_shp_name1, 
			shp_name2 as t_shp_name2, shp_force as t_shp_force, cons_code as t_cons_code, cons_address1 as t_cons_address1, cons_address2 as t_cons_address2, 
			cons_address3 as t_cons_address3, cons_address4 as t_cons_address4, cons_address5 as t_cons_address5, cons_name1 as t_cons_name1, cons_name2 as t_cons_name2, 
			shp_un_code as t_shp_un_code, noti_code as t_noti_code, noti_address1 as t_noti_address1, noti_address2 as t_noti_address2, noti_address3 as t_noti_address3, 
			noti_address4 as t_noti_address4, noti_address5 as t_noti_address5, noti_name1 as t_noti_name1, noti_name2 as t_noti_name2, line_code as t_line_code, 
			line_address1 as t_line_address1, line_address2 as t_line_address2, line_address3 as t_line_address3, line_address4 as t_line_address4, line_address5 as t_line_address5, 
			line_name1 as t_line_name1, line_name2 as t_line_name2, line_user_name as t_line_user_name, line_user_dept as t_line_user_dept, line_user_tel as t_line_user_tel, 
			line_user_email as t_line_user_email, line_payment_type as t_line_payment_type, line_payment_area_name as t_line_payment_area_name, 
			sch_vessel_name as t_sch_vessel_name, sch_vessel_voyage as t_sch_vessel_voyage, 
			sch_feeder_vessel_name as t_sch_feeder_vessel_name, sch_feeder_vessel_voyage as t_sch_feeder_vessel_voyage, sch_barge_onboard_date as t_sch_barge_onboard_date, 
			sch_pol as t_sch_pol, sch_pol_name as t_sch_pol_name, 
			sch_pod as t_sch_pod, sch_pod_name as t_sch_pod_name, sch_fdp as t_sch_fdp, sch_fdp_name as t_sch_fdp_name, sch_por as t_sch_por, 
			sch_por_name as t_sch_por_name, sch_pld as t_sch_pld, sch_pld_name as t_sch_pld_name, sch_bl_issue_name as t_sch_bl_issue_name, sch_tsp as t_sch_tsp, 
			sch_tsp_name as t_sch_tsp_name, res_bk_no as t_res_bk_no, sc_no as t_sc_no, document_no as t_document_no, trans_service_code as t_trans_service_code, 
			bl_type as t_bl_type, hbl_yn as t_hbl_yn, sch_srd as t_sch_srd, remark1 as t_remark1, remark2 as t_remark2, 
			remark3 as t_remark3, remark4 as t_remark4, remark5 as t_remark5, invoice_no as t_invoice_no, po_no as t_po_no, 
			lc_yn as t_lc_yn, lc_no as t_lc_no, org_bl_need_yn as t_org_bl_need_yn, sr_amount as t_sr_amount, lc_expiry_date as t_lc_expiry_date, 
			part_sr_qty as t_part_sr_qty, cargo_class as t_cargo_class, sch_scd as t_sch_scd, stuffing_date as t_stuffing_date, clearance_date as t_clearance_date, 
			shp_user_name2 as t_shp_user_name2, hs_code as t_hs_code, incoterms_code as t_incoterms_code, sea_air_kind as t_sea_air_kind, xml_msg_id as t_xml_msg_id, 
			xmldoc_seq as t_xmldoc_seq, sr_amount_currency as t_sr_amount_currency, sr_amount_remark as t_sr_amount_remark, via_usa as t_via_usa, goods_type_code as t_goods_type_code, 
			intermediate as t_intermediate, currency as t_currency, classification_code as t_classification_code, master_si_number as t_master_si_number, corp_code as t_corp_code, 
			load_type as t_load_type, docu_type as t_docu_type, conveyance_mode as t_conveyance_mode, mbl_no as t_mbl_no, port_door as t_port_door, 
			corp_yn as t_corp_yn, dept_code as t_dept_code, com_user_dept as t_com_user_dept, com_user_tel as t_com_user_tel, com_user_email as t_com_user_email, 
			noti2_address1 as t_noti2_address1, noti2_address2 as t_noti2_address2, noti2_address3 as t_noti2_address3, 
			noti2_address4 as t_noti2_address4, noti2_address5 as t_noti2_address5, 
			noti2_name1 as t_noti2_name1, noti2_name2 as t_noti2_name2, fwd_code as t_fwd_code, fwd_address1 as t_fwd_address1, fwd_address2 as t_fwd_address2, 
			fwd_address3 as t_fwd_address3, fwd_address4 as t_fwd_address4, fwd_address5 as t_fwd_address5, fwd_name1 as t_fwd_name1, fwd_name2 as t_fwd_name2, 
			line2_code as t_line2_code, line2_address1 as t_line2_address1, line2_address2 as t_line2_address2, line2_address3 as t_line2_address3, line2_address4 as t_line2_address4, 
			line2_address5 as t_line2_address5, line2_name1 as t_line2_name1, line2_name2 as t_line2_name2, 
			consignee_bookmark_seq as t_consignee_bookmark_seq, line_bookmark_seq as t_line_bookmark_seq, 
			notify_bookmark_seq as t_notify_bookmark_seq, schedule_bookmark_seq as t_schedule_bookmark_seq, shipper_bookmark_seq as t_shipper_bookmark_seq, 
			other_bookmark_seq as t_other_bookmark_seq, originator as t_originator, 
			recipient as t_recipient, com_user_name as t_com_user_name, status_cud as t_status_cud, res_mrn as t_res_mrn, res_bkg_no as t_res_bkg_no, 
			res_mbl_no as t_res_mbl_no, res_issue_date as t_res_issue_date, res_user_name as t_res_user_name, res_bl_recv_date as t_res_bl_recv_date, klnet_id as t_klnet_id, 
			res_bl_klnet_id as t_res_bl_klnet_id,
			coalesce((select x.service_type from own_line_code_service_type x where x.line_code = a.line_code and x.service_code = a.trans_service_code), a.trans_service_code) as t_trans_service_name
		FROM shp_sr a
		WHERE user_no =  $1 and res_mbl_no = $2 `;
		if(request.body.issue_date) {
			queryString += " and res_issue_date = '"+request.body.issue_date+"' \n";
		}
	queryString += ` order by res_issue_date desc, update_date desc, insert_date desc limit 1
	) b
	on (a.idx = b.idx)`;	



    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.mbl_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const selectShpBlCntr = (request, response) => {
	console.log('selectShpBlCntr call......');

	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, mbl_no, issue_date, cntr_seq) as idx, 
			user_no, mbl_no, issue_date, cntr_seq, cntr_no, 
			cntr_code, cntr_hands, cntr_consolidated_yn, cntr_full_empty, cntr_total_weight, 
			cntr_total_volume, cntr_weight, cntr_carton_qty, cntr_seal1, cntr_seal2, 
			cntr_seal3, cntr_move_code, cntr_haulage_code, cntr_length, cntr_width, 
			cntr_height, cntr_stowage_code, cntr_temp, cntr_temp_unit 
		from shp_bl_cntr a
		where user_no = $1 and mbl_no = $2 and issue_date = $3 ORDER BY cntr_seq
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, sr_no, sr_date, cntr_seq) as idx, 
			user_no as t_user_no, sr_no as t_sr_no, sr_date as t_sr_date, cntr_seq as t_cntr_seq, cntr_no as t_cntr_no, 
			cntr_code as t_cntr_code, cntr_truck_no as t_cntr_truck_no, cntr_consolidated_yn as t_cntr_consolidated_yn, 
			cntr_total_weight as t_cntr_total_weight, cntr_total_volume as t_cntr_total_volume, 
			cntr_carton_qty as t_cntr_carton_qty, cntr_weight as t_cntr_weight, cntr_seal as t_cntr_seal, 
			cntr_export_license as t_cntr_export_license, cntr_soc_yn as t_cntr_soc_yn, 
			container_bookmark_seq as t_container_bookmark_seq, cntr_carton_code as t_cntr_carton_code, cntr_seal2 as t_cntr_seal2, 
			cntr_seal3 as t_cntr_seal3, cntr_res_bkg_no as t_cntr_res_bkg_no
		from shp_sr_cntr a
		WHERE (user_no, sr_no, sr_date) in (
			SELECT user_no, sr_no, sr_date
			FROM shp_sr b
			WHERE user_no = $1 and res_mbl_no = $2 and res_issue_date = $3
			order by res_issue_date desc, update_date desc, insert_date desc limit 1
		)
	) b
	on (a.idx = b.idx)  `;	

    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.mbl_no,
			request.body.issue_date,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


async function selectShpBlCargoGoods(user_no, mbl_no, issue_date, cargo_seq) {
	console.log('selectShpBlCargoGoods call......');

	// let queryString = ` SELECT user_no, mbl_no, issue_date, cargo_seq, goods_seq, 
	// 	goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5
	// FROM shp_bl_cargo_goods
	// WHERE user_no = $1 and mbl_no = $2 and issue_date = $3 and cargo_seq = $4
	// ORDER BY goods_seq `;

	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, mbl_no, issue_date, cargo_seq, goods_seq) as idx, 
			user_no, mbl_no, issue_date, cargo_seq, goods_seq, 
			goods_desc1, goods_desc2, goods_desc3, goods_desc4, goods_desc5
		from shp_bl_cargo_goods a
		where user_no = $1 and mbl_no = $2 and issue_date = $3 and cargo_seq = $4 ORDER BY goods_seq::integer
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, sr_no, sr_date, cargo_seq, goods_seq) as idx, 
			user_no as t_user_no, sr_no as t_sr_no, sr_date as t_sr_date, cargo_seq as t_cargo_seq, goods_seq as t_goods_seq, 
			goods_desc1 as t_goods_desc1, goods_desc2 as t_goods_desc2, goods_desc3 as t_goods_desc3, 
			goods_desc4 as t_goods_desc4, goods_desc5 as t_goods_desc5, 
			cargo_goods_bookmark_seq as t_cargo_goods_bookmark_seq
		from shp_sr_cargo_goods a
		WHERE (user_no, sr_no, sr_date) in (
			SELECT user_no, sr_no, sr_date
			FROM shp_sr b
			WHERE user_no = $1 and res_mbl_no = $2 and res_issue_date = $3
			order by res_issue_date desc, update_date desc, insert_date desc limit 1
		)
		and cargo_seq = $4
	) b
	on (a.idx = b.idx)  `;	


    let sql = {
		text: queryString,
		values: [
			user_no,
			mbl_no,
			issue_date,
			cargo_seq
		]
	}

	console.log(sql);

	// const client = await pgsqlPool.connect();
	// const res = await client.query(sql);
	// return res.row;

	return new Promise(function(resolve, reject){
		(async () => {
			const client = await pgsqlPool.connect();
			try {
				const res = await client.query(sql);

				// console.log('res=', res);

				resolve(res.rows);
			} finally {
				client.release();
			}
		})().catch(err => setImmediate(() => {console.log("[ERROR]",err); reject(null);}))
	});

    // (async () => {
    // 	const client = await pgsqlPool.connect();
    // 	try {
    // 		const res = await client.query(sql);

	// 		console.log('res.rows <', res.rows.length, '> ' ,res);	

    // 		return res.rows;
    // 	} finally {
    // 		client.release();
    // 	}
    // })().catch(err => setImmediate(() => {console.log("[ERROR]",err); return null;}))

	// pgsqlPool.connect(function(err,conn,release) {
	// 	if(err){
	// 		return null;
	// 	} else {

	// 		conn.query(sql, function(err,result){
	// 			release();
	// 			if(err){
	// 				return null;
	// 			} else {
	// 				if(result != null) {
	// 					return result.rows;
	// 				} else {
	// 					return null;
	// 				}
	// 			}
	// 		});
	// 	}


	// });	
}
async function selectShpBlCargoMark(user_no, mbl_no, issue_date, cargo_seq) {
	console.log('selectShpBlCargoMark call......');

	// let queryString = ` SELECT user_no, mbl_no, issue_date, cargo_seq, mark_seq, 
	// 	mark_desc1, mark_desc2, mark_desc3, mark_desc4, mark_desc5, 
	// 	mark_desc6, mark_desc7, mark_desc8, mark_desc9, mark_desc10
	// FROM shp_bl_cargo_mark
	// WHERE user_no = $1 and mbl_no = $2 and issue_date = $3 and cargo_seq = $4
	// ORDER BY mark_seq `;

	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, mbl_no, issue_date, cargo_seq, mark_seq) as idx, 
			user_no, mbl_no, issue_date, cargo_seq, mark_seq, 
			mark_desc1, mark_desc2, mark_desc3, mark_desc4, mark_desc5, 
			mark_desc6, mark_desc7, mark_desc8, mark_desc9, mark_desc10
		from shp_bl_cargo_mark a
		where user_no = $1 and mbl_no = $2 and issue_date = $3 and cargo_seq = $4 ORDER BY mark_seq
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, sr_no, sr_date, cargo_seq, mark_seq) as idx, 
			user_no as t_user_no, sr_no as t_sr_no, sr_date as t_sr_date, cargo_seq as t_cargo_seq, mark_seq as t_mark_seq, 
			mark_desc1 as t_mark_desc1, mark_desc2 as t_mark_desc2, mark_desc3 as t_mark_desc3, 
			mark_desc4 as t_mark_desc4, mark_desc5 as t_mark_desc5, 
			mark_desc6 as t_mark_desc6, mark_desc7 as t_mark_desc7, mark_desc8 as t_mark_desc8, 
			mark_desc9 as t_mark_desc9, mark_desc10 as t_mark_desc10, 
			cargo_mark_bookmark_seq  as t_cargo_mark_bookmark_seq
		from shp_sr_cargo_mark a
		WHERE (user_no, sr_no, sr_date) in (
			SELECT user_no, sr_no, sr_date
			FROM shp_sr b
			WHERE user_no = $1 and res_mbl_no = $2 and res_issue_date = $3
			order by res_issue_date desc, update_date desc, insert_date desc limit 1
		)
		and cargo_seq = $4
	) b
	on (a.idx = b.idx)  `;	

    let sql = {
		text: queryString,
		values: [
			user_no,
			mbl_no,
			issue_date,
			cargo_seq
		]
	}

	console.log(sql);


	return new Promise(function(resolve, reject){
		(async () => {
			const client = await pgsqlPool.connect();
			try {
				const res = await client.query(sql);

				resolve(res.rows);
			} finally {
				client.release();
			}
		})().catch(err => setImmediate(() => {console.log("[ERROR]",err); reject(null);}))
	});

}
const selectShpBlCargo = (request, response) => {
	console.log('selectShpBlCargo call......');

	// let queryString = ` SELECT user_no, mbl_no, issue_date, cargo_seq, cargo_pack_qty, 
	// 	cargo_pack_type, cargo_sr_pack_qty, cargo_sr_pack_type, cargo_hs_code, cargo_bl_qty_desc, 
	// 	cargo_total_weight, cargo_total_chargeable_weight, cargo_total_volume,
	// 	coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as cargo_pack_type_name
	// FROM shp_bl_cargo a
	// WHERE user_no = $1 and mbl_no = $2 and issue_date = $3
	// ORDER BY cargo_seq `;

	let queryString = ` select a.*, b.*
	from
	(
		select dense_rank() over (order by user_no, mbl_no, issue_date, cargo_seq) as idx, 
			user_no, mbl_no, issue_date, cargo_seq, cargo_pack_qty, 
			cargo_pack_type, cargo_sr_pack_qty, cargo_sr_pack_type, cargo_hs_code, cargo_bl_qty_desc, 
			cargo_total_weight, cargo_total_chargeable_weight, cargo_total_volume,
			coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as cargo_pack_type_name
		from shp_bl_cargo a
		where user_no = $1 and mbl_no = $2 and issue_date = $3 ORDER BY cargo_seq
	) a
	left outer join 
	(
		select dense_rank() over (order by user_no, sr_no, sr_date, cargo_seq) as idx, 
			user_no as t_user_no, sr_no as t_sr_no, sr_date as t_sr_date, cargo_seq as t_cargo_seq, cargo_pack_qty as t_cargo_pack_qty, 
			cargo_pack_type as t_cargo_pack_type, cargo_handling_code as t_cargo_handling_code, cargo_temp as t_cargo_temp, 
			cargo_temp_unit as t_cargo_temp_unit, cargo_attached_yn as t_cargo_attached_yn, 
			cargo_coastal_yn as t_cargo_coastal_yn, cargo_handling_frozen as t_cargo_handling_frozen, cargo_total_weight as t_cargo_total_weight, 
			cargo_total_volume as t_cargo_total_volume, cargo_weight as t_cargo_weight, 
			cargo_bookmark_seq as t_cargo_bookmark_seq, cargo_frozen_temp as t_cargo_frozen_temp, cargo_frozen_temp_unit as t_cargo_frozen_temp_unit, 
			cargo_hs_code as t_cargo_hs_code, cargo_item_hs_code as t_cargo_item_hs_code,
			coalesce((select x.cargo_pack_type_desc from own_line_code_cargo_pack_type x where x.line_code = $4 and x.cargo_pack_type = a.cargo_pack_type), a.cargo_pack_type) as t_cargo_pack_type_name
		from shp_sr_cargo a
		WHERE (user_no, sr_no, sr_date) in (
			SELECT user_no, sr_no, sr_date
			FROM shp_sr b
			WHERE user_no = $1 and res_mbl_no = $2 and res_issue_date = $3
			order by res_issue_date desc, update_date desc, insert_date desc limit 1
		)
	) b
	on (a.idx = b.idx)  `;	

    let sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.mbl_no,
			request.body.issue_date,
			request.body.line_code,
		]
	}

    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
			// const goods = await selectShpBlCargoGoods('M000002', 'WDFCGBA03590270', '20210121', '1');

			console.log('res.rows <', res.rows.length, '> ');	
			// console.log('res.rows <', res.rows.length, '> ' ,res);	

			if (res.rows && res.rows.length > 0 ) {

				for (let idx = 0; idx < res.rows.length; idx++){
					// console.log('res.rows.length=', res.rows.length, ', idx=', idx);
					const goods = await selectShpBlCargoGoods(res.rows[idx].user_no, res.rows[idx].mbl_no, res.rows[idx].issue_date, res.rows[idx].cargo_seq);
					// console.log('goods', goods);
					// console.log('res.rows[idx]=', res.rows[idx]);					
					const mark = await selectShpBlCargoMark(res.rows[idx].user_no, res.rows[idx].mbl_no, res.rows[idx].issue_date, res.rows[idx].cargo_seq);
					res.rows[idx].goods = goods;
					res.rows[idx].mark = mark;

					// console.log('goods', goods);

				}



				// res.rows.forEach(async function (item) {
				// 	// await delay(300);
				// 	const goods = await selectShpBlCargoGoods(item.user_no, item.mbl_no, item.issue_date, item.cargo_seq);

				// 	console.log('good', goods);
				// 	item.push({'goods': goods});
				// });
			
			}

			// console.log('res.rows=', res.rows);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}


// Booking SpecialBookmark 수정
const updateAllBooking = async(request, response) => {
	
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
			// Booking
			let bkgSql = await updateAllBookingSql(request.body.booking, request.body.user_no);
			let res = await client.query(bkgSql);
			// Cargo
			let cargoPending =  generateCargoOfBooking( request );
			console.log("cargoPending",cargoPending)
			cargoPending.then(function(result) {
				res = result;
				// Container
				let cntrPending =  generateContainerOfBooking( request );
				console.log("cntrPending",cntrPending)
				cntrPending.then(function(result) {
					res = result;
				});
				response.status(200).json(res);
			});
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const updateAllBookingSql = ( bkg, user_no ) => {
    const sql = {
		text: ` UPDATE shp_bkg
 SET bl_cnt=$1 ,bl_type=$2
,cons_address1=$3 ,cons_address2=$4 ,cons_address3=$5 ,cons_address4=$6 ,cons_address5=$7
,cons_code=$8 ,cons_name1=$9 ,cons_name2=$10 ,cons_user_dept=$11 ,cons_user_email=$12
,cons_user_fax=$13 ,cons_user_name=$14 ,cons_user_tel=$15 ,consignee_bookmark_seq=$16
,consol_bkg_yn=$17 ,docu_tax_email=$18 ,docu_user_email=$19 ,docu_user_fax=$20 ,docu_user_name=$21
,docu_user_phone=$22 ,docu_user_tel=$23 ,document_bookmark_seq=$24
,forwarder_bookmark_seq=$25 ,fwd_address1=$26 ,fwd_address2=$27 ,fwd_address3=$28 ,fwd_address4=$29 ,fwd_address5=$30
,fwd_code=$31 ,fwd_name1=$32 ,fwd_name2=$33 ,fwd_user_dept=$34 ,fwd_user_email=$35 ,fwd_user_fax=$36
,fwd_user_name=$37 ,fwd_user_tel=$38 ,incoterms_code=$39 
,line_address1=$40 ,line_address2=$41 ,line_address3=$42 ,line_address4=$43 ,line_address5=$44
,line_bookmark_seq=$45 ,line_code=$46 ,line_name1=$47 ,line_name2=$48 ,line_user_dept=$49
,line_user_email=$50 ,line_user_fax=$51 ,line_user_name=$52 ,line_user_tel=$53 ,load_type=$54
,order_no=$55 ,other_bookmark_seq=$56 ,status_cud=$57 ,remark1=$58 ,remark2=$59
,sc_no=$60 ,sch_call_sign=$61 ,sch_cct=$62 ,sch_dct=$63 ,sch_end_port_code=$64
,sch_eta=$65 ,sch_etd=$66 ,sch_fdp=$67 ,sch_fdp_name=$68,sch_led=$69 ,sch_line_code=$70
,sch_mrn=$71 ,sch_pld=$72 ,sch_pld_name=$73 ,sch_pod=$74 ,sch_pod_name=$75
,sch_pol=$76 ,sch_pol_name=$77 ,sch_por=$78 ,sch_por_name=$79 ,sch_sr_closing_time=$80 ,sch_srd=$81
,sch_start_port_code=$82 ,sch_svc=$83 ,sch_ts_yn=$84 ,sch_vessel_code=$85 , sch_vessel_name=$86
,sch_vessel_voyage=$87 ,schedule_bookmark_seq=$88 ,send_date=$89 ,sending_count=$90
,shipper_bookmark_seq=$91 ,shp_address1=$92 ,shp_address2=$93 ,shp_address3=$94, shp_address4=$95
,shp_address5=$96 ,shp_code=$97 ,shp_name1=$98 ,shp_name2=$99 ,shp_payment_type=$100 ,shp_user_dept=$101
,shp_user_email=$102 ,shp_user_fax=$103 ,shp_user_name=$104 ,shp_user_tel=$105 ,si_no=$106
,trans_code=$107 ,trans_fac_area_name=$108 ,trans_fac_name=$109 ,trans_name1=$110
,trans_name2=$111 ,trans_remark=$112 ,trans_self_yn=$113 ,trans_service_code=$114 ,trans_user_email=$115
,trans_user_fax=$116 ,trans_user_name=$117 ,trans_user_tel=$118 ,transport_bookmark_seq=$119
,update_date=now() ,update_user=$120, bookmark_seq=$121
 WHERE user_no=$122 AND bkg_no=$123 AND bkg_date=$124 `,
		values: [
			bkg.bl_cnt, bkg.bl_type,
			bkg.cons_address1 ,bkg.cons_address2 ,bkg.cons_address3 ,bkg.cons_address4 ,bkg.cons_address5,
			bkg.cons_code ,bkg.cons_name1 ,bkg.cons_name2 ,bkg.cons_user_dept ,bkg.cons_user_email,
			bkg.cons_user_fax, bkg.cons_user_name ,bkg.cons_user_tel ,bkg.consignee_bookmark_seq,
			bkg.consol_bkg_yn ,bkg.docu_tax_email ,bkg.docu_user_email ,bkg.docu_user_fax ,bkg.docu_user_name,
			bkg.docu_user_phone ,bkg.docu_user_tel ,bkg.document_bookmark_seq,
			bkg.forwarder_bookmark_seq ,bkg.fwd_address1 ,bkg.fwd_address2 ,bkg.fwd_address3 ,bkg.fwd_address4 ,bkg.fwd_address5,
			bkg.fwd_code ,bkg.fwd_name1 ,bkg.fwd_name2 ,bkg.fwd_user_dept ,bkg.fwd_user_email ,bkg.fwd_user_fax,
			bkg.fwd_user_name ,bkg.fwd_user_tel ,bkg.incoterms_code,
			bkg.line_address1 ,bkg.line_address2 ,bkg.line_address3 ,bkg.line_address4 ,bkg.line_address5,
			bkg.line_bookmark_seq ,bkg.line_code,
			bkg.line_name1 ,bkg.line_name2, bkg.line_user_dept,
			bkg.line_user_email ,bkg.line_user_fax ,bkg.line_user_name ,bkg.line_user_tel ,bkg.load_type,
			bkg.order_no ,bkg.other_bookmark_seq ,'U' ,bkg.remark1 ,bkg.remark2,
			bkg.sc_no ,bkg.sch_call_sign ,
			bkg.sch_cct?bkg.sch_cct.replace(/-/gi, ''):null ,
			bkg.sch_dct?bkg.sch_dct.replace(/-/gi, ''):null ,
			bkg.sch_end_port_code,
			bkg.sch_eta?bkg.sch_eta.replace(/-/gi,''):null ,
			bkg.sch_etd?bkg.sch_etd.replace(/-/gi,''):null ,
			bkg.sch_fdp ,bkg.sch_fdp_name ,
			bkg.sch_led?bkg.sch_led.replace(/-/gi, ''):null ,
			bkg.sch_line_code,
			bkg.sch_mrn ,bkg.sch_pld ,bkg.sch_pld_name ,bkg.sch_pod ,bkg.sch_pod_name,
			bkg.sch_pol ,bkg.sch_pol_name ,bkg.sch_por ,bkg.sch_por_name ,
			bkg.sch_sr_closing_time?bkg.sch_sr_closing_time.replace(/-/gi, ''):null ,
			bkg.sch_srd?bkg.sch_srd.replace(/-/gi, ''):null,
			bkg.sch_start_port_code ,bkg.sch_svc ,bkg.sch_ts_yn ,bkg.sch_vessel_code ,bkg.sch_vessel_name,
			bkg.sch_vessel_voyage ,bkg.schedule_bookmark_seq ,bkg.send_date ,bkg.sending_count,
			bkg.shipper_bookmark_seq ,bkg.shp_address1 ,bkg.shp_address2 ,bkg.shp_address3 ,bkg.shp_address4,
			bkg.shp_address5 ,bkg.shp_code ,bkg.shp_name1 ,bkg.shp_name2 ,bkg.shp_payment_type ,bkg.shp_user_dept,
			bkg.shp_user_email ,bkg.shp_user_fax ,bkg.shp_user_name ,bkg.shp_user_tel ,bkg.si_no ,
			bkg.trans_code ,bkg.trans_fac_area_name ,bkg.trans_fac_name ,bkg.trans_name1 ,
			bkg.trans_name2 ,bkg.trans_remark ,bkg.trans_self_yn ,bkg.trans_service_code ,bkg.trans_user_email ,
			bkg.trans_user_fax ,bkg.trans_user_name ,bkg.trans_user_tel ,bkg.transport_bookmark_seq ,
			user_no , bkg.bookmark_seq,
			bkg.user_no, bkg.bkg_no, bkg.bkg_date
		]
	}
	console.log(sql);
	return sql;
}

const selectDupCheckBkgNo = (request, response) => {

	let queryString = ` select bkg_no
from shp_bkg
where user_no = $1
and bkg_no = $2
and bkg_date= to_char(now(), 'YYYYMMDD') `;

    const sql = {
		text: queryString,
		values: [
			request.body.user_no,
			request.body.newBkgNo,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const getUserCntrWeightInfo = (request, response) => {
    const sql = {
		text: ` select vgm  from  own_line_cntr_info where line_code=$1 and cntr_no=$2 limit 1`,
		values: [
			request.body.line_code,request.body.cntr_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows[0]);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}
const getUserNewSrDupCheck = (request, response) => {
    const sql = {
		text: ` select * from shp_sr where sr_no=$1`,
		values: [
			request.body.sr_no
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows[0]);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}




const selectBookingList = (request, response) => {
	let sql = "";

	sql += " select a.* from ( "
	sql += " select count(*) over()/10+1 as tot_page, floor(((row_number() over(order by a.insert_date desc, a.user_no, a.bkg_no))-1)/10+1) as curpage, "
	sql += " count(*) over() as tot_cnt, "
	sql += " floor(((row_number() over(order by a.bkg_date desc, a.user_no, a.bkg_no))-1)+1) as rownum, "
	sql += " a.bkg_no, a.bkg_date, a.status_cus, a.user_no, a.send_date, a.res_bkg_no, case when length(a.res_confirm_date)=12 then to_char(to_timestamp(a.res_confirm_date, 'yyyymmddhh24mi'), 'YYYY-MM-DD') else  to_char(to_timestamp(a.res_confirm_date, 'yyyymmdd'), 'YYYY-MM-DD') end as res_confirm_date_format, a.res_confirm_date, a.sch_vessel_voyage, a.sch_vessel_name, "
	sql += " to_char(to_timestamp(a.bkg_date,'YYYYMMDD'),'YYYY-MM-DD') as bkg_date_format, a.sch_pol_name, a.sch_pod_name, "
	sql += " to_char(to_timestamp(a.send_date,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as send_date_format,"
	sql += " (select image_yn from own_code_cuship occ where occ.id = a.line_code limit 1) as image_yn, "
	sql += " (select occ.line_code from own_code_cuship occ where occ.id = a.line_code limit 1) as carrier, "
	sql += " (select occ.nm from own_code_cuship occ where occ.id = a.line_code limit 1) as line_name, "
	sql += " case when a.status_cus = 'S0' then '저장' "
	sql += " when a.status_cus = 'S9' then '전송' "
	sql += " when a.status_cus = 'S4' then '정정전송' "
	sql += " when a.status_cus = 'S1' then '취소전송' "
	sql += " when a.status_cus = 'RA' then '승인' "
	sql += " when a.status_cus = 'EJ' then '거절' "
	sql += " when a.status_cus = 'EC' then '취소승인' "
	sql += " when a.status_cus = 'EA' then '승인취소' "
	sql += " when a.status_cus = 'NO' then '저장' "
	sql += " else '' end as status_name, "
	sql += " a.sch_pol, a.sch_pod, a.sch_etd, a.sch_eta, a.line_name1, a.line_name2, "
	sql += " (select sum(public.to_float(b.cargo_pack_qty)) as cargo_pack_qty from shp_bkg_cargo b where a.bkg_no = b.bkg_no and a.bkg_date = b.bkg_date and a.user_no = b.user_no) as cargo_pack_qty, "
	sql += " (select sum(public.to_float(b.cntr_qty)) as cargo_pack_qty from shp_bkg_cntr b where a.bkg_no = b.bkg_no and a.bkg_date = b.bkg_date and a.user_no = b.user_no) as cntr_qty, a.klnet_id from shp_bkg a "
	sql += " where 1=1 "
	sql += (request.body.lineCode!==undefined&&request.body.lineCode!=="")?" and a.line_code = '"+request.body.lineCode+"'":"";
	sql += (request.body.bkg_no !== ""&&request.body.bkg_no!==null&&request.body.bkg_no!==undefined)?" and a.bkg_no = '"+request.body.bkg_no+"'":""
	if( !request.body.bkg_no && request.body.toDate !== null && request.body.endDate !== null ) {
		sql += " and a.bkg_date between to_char(to_timestamp('"+request.body.toDate+"','YYYY-MM-DD'),'YYYYMMDD') and to_char(to_timestamp('"+request.body.endDate+"','YYYY-MM-DD')+ interval '1' DAY,'YYYYMMDD') "
	}
	sql += " and a.status_cud != 'D' "
	sql += " and a.user_no in  (select sf_get_user_no_in_company('"+request.body.userNo.user_no+"') ) order by insert_date desc  "
	sql += " )a "
	sql += " where curpage = '"+request.body.num+"'";
	console.log(sql);
	(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))

}



const selectShpConfirmList = (request,response) => {
	console.log(request.body);
	let sql ="";
	

	sql += " select a.*, (select port_name from own_code_port where port_code = a.cntr_pick_up_cy_code limit 1 ) as pick_up_cy_name, (select occ.port_name from own_code_port occ where occ.port_code = a.drop_off_cy_code limit 1 ) as drop_off_cy_name from( "
	sql += " select count(*) over()/ 10 + 1 as tot_page, floor(((row_number() over(order by a.res_confirm_date desc, a.user_no, a.res_bkg_no))-1)/ 10 + 1) as curpage, "
	sql += " count(*) over() as tot_cnt, floor(((row_number() over(order by a.res_confirm_date desc, a.user_no, a.res_bkg_no))-1)+ 1) as rownum, a.user_no, "
	sql += " a.res_bkg_no, a.res_confirm_date, to_char(to_timestamp(a.res_confirm_date,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as res_confirm_date_format, "
	sql += " a.bkg_no, a.bkg_date, to_char(to_timestamp(a.bkg_date,'YYYYMMDD'),'YYYY-MM-DD') as bkg_date_format, a.sch_vessel_name, a.sch_vessel_voyage, a.sch_pol, a.sch_pod,"
	sql += " a.sch_pol_name, a.sch_pod_name, a.shp_name1, a.shp_name2, a.sch_led, a.sch_dct, a.sch_cct, "
	sql += " to_char(to_timestamp(a.sch_led,'YYYYMMDD'),'YYYY-MM-DD') as sch_led_format, "
	sql += " to_char(to_timestamp(a.sch_dct,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as sch_dct_format, "		
	sql += " to_char(to_timestamp(a.sch_cct,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as sch_cct_format, "
	sql += " (select image_yn from own_code_cuship occ where occ.id = a.line_code limit 1) as image_yn, "
	sql += " (select occ.line_code from own_code_cuship occ where occ.id = a.line_code limit 1) as carrier, "
	sql += " (select occ.nm from own_code_cuship occ where occ.id = a.line_code limit 1) as line_name, "
	sql += " (select sum(public.to_float(b.cargo_pack_qty)) as cargo_pack_qty from shp_confirm_cargo b where a.res_bkg_no = b.res_bkg_no and a.res_confirm_date = b.res_confirm_date and a.user_no = b.user_no) as cargo_pack_qty, "
	sql += " (select sum(public.to_float(c.cntr_qty)) from shp_confirm_cntr c where a.res_bkg_no = c.res_bkg_no and a.res_confirm_date = c.res_confirm_date and a.user_no = c.user_no) as cntr_qty, "
	sql += " (select c.cntr_drop_off_cy_code from shp_confirm_cntr c where a.res_bkg_no = c.res_bkg_no and a.res_confirm_date = c.res_confirm_date and a.user_no = c.user_no limit 1) as drop_off_cy_code, "
	sql += " (select c.cntr_pick_up_cy_code from shp_confirm_cntr c where a.res_bkg_no = c.res_bkg_no and a.res_confirm_date = c.res_confirm_date and a.user_no = c.user_no limit 1) as cntr_pick_up_cy_code "
	sql += " , substring(sch_etd,1,8) sch_etd , substring(sch_eta,1,8)  sch_eta   "
	sql += " ,(select b.bkg_no from shp_bkg b where a.user_no = b.user_no and a.res_bkg_no = b.res_bkg_no and a.res_confirm_date = b.res_confirm_date) req_bkg_no "
	sql += " ,(select b.bkg_date from shp_bkg b where a.user_no = b.user_no and a.res_bkg_no = b.res_bkg_no and a.res_confirm_date = b.res_confirm_date) req_bkg_date "
	sql += " ,(select aa.sr_no from shp_sr aa, shp_sr_bkg bb where aa.user_no = a.user_no and bb.res_bkg_no =a.res_bkg_no  and  aa.sr_no = bb.sr_no and aa.sr_date = bb.sr_date and status_cud !='D' order by insert_date desc limit 1) as sr_no ";
	sql += " ,(select aa.sr_date from shp_sr aa, shp_sr_bkg bb where aa.user_no = a.user_no and bb.res_bkg_no =a.res_bkg_no  and  aa.sr_no = bb.sr_no and aa.sr_date = bb.sr_date and status_cud !='D' order by insert_date desc limit 1) as sr_date " ;			
	sql += " from shp_confirm a "
	sql += " where 1=1 "
	sql += (request.body.lineCode!==undefined&&request.body.lineCode!=="")?" and a.line_code = '"+request.body.lineCode+"'":"";
	sql += (request.body.bkg_no !== ""&&request.body.bkg_no!==null&&request.body.bkg_no!==undefined)?" and a.bkg_no = '"+request.body.bkg_no+"'":""
	if( !request.body.bkg_no && request.body.toDate !== null && request.body.endDate !== null ) {
		sql += " and a.res_confirm_date between to_char(to_timestamp('"+request.body.toDate+"','YYYY-MM-DD'),'YYYYMMDD') and to_char(to_timestamp('"+request.body.endDate+"','YYYY-MM-DD')+ interval '1' DAY,'YYYYMMDD') "
	}
	sql += " and a.user_no in (select sf_get_user_no_in_company('"+request.body.userNo.user_no+"') )  "
	sql += " order by a.res_confirm_date desc, a.user_no, a.res_bkg_no )a "
	sql += " where curpage = '"+request.body.num+"'"
	console.log(sql);
	(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	
}


const selectSrList = (request,response) => {
	let paramIndex=1;
	let param = [];
	log.info(request.body);
	let sql ="";
	sql += " select a.* from ( "
	sql += " select a.user_no,count(*) over()/ 10 + 1 as tot_page ,floor(((row_number() over(order by a.insert_date desc, a.user_no, a.sr_no))-1)/ 10 + 1) as curpage "
	sql += " ,count(*) over() as tot_cnt ,floor(((row_number() over(order by a.insert_date desc, a.user_no, a.sr_no))-1)+ 1) as rownum "
	sql += " ,sr_no ,sr_date ,to_char(to_timestamp(a.sr_date, 'YYYYMMDD'), 'YYYY-MM-DD') as sr_date_format ,status_cus "
	sql += " ,to_char(insert_date,'YYYY-MM-DD HH24:mi') as insert_date "
	sql += " ,to_char(update_date,'YYYY-MM-DD HH24:mi') as update_date "
	sql += " ,case when a.status_cus = 'S0' then '저장' when a.status_cus = 'S9' then '전송' when a.status_cus = 'S4' then '정정전송' when a.status_cus ='SF' then '확정요청' "
	sql += " when a.status_cus = 'S1' then '취소전송'  when a.status_cus = 'RA' then '승인' when a.status_cus = 'EJ' then '거절' when a.status_cus = 'EC' then '취소승인' "
	sql += " when a.status_cus = 'EA' then '승인취소' when a.status_cus = 'FA' then 'BL확정'  when a.status_cus = 'NO' then '저장'  else '' end as status_name "
	sql += " ,send_date  ,to_char(to_timestamp(a.send_date, 'YYYYMMDDHH24MI'), 'YYYY-MM-DD HH24:MI') as send_date_format ,res_mbl_no "
	sql += " ,res_issue_date  ,to_char(to_timestamp(a.res_issue_date, 'YYYYMMDD'), 'YYYY-MM-DD') as res_issue_date_format, a.sch_vessel_voyage ,sch_vessel_name  ,sch_pol  ,sch_pol_name "
	sql += " ,sch_pod  ,sch_pod_name ,sch_scd "
	sql += " ,(select sum(public.to_float(b.cargo_pack_qty)) as cargo_pack_qty from shp_sr_cargo b where a.sr_no = b.sr_no and a.sr_date = b.sr_date and a.user_no = b.user_no) as cargo_pack_qty "
	sql += " ,(select count(1) from shp_sr_cntr b where a.sr_no = b.sr_no and a.sr_date = b.sr_date and a.user_no = b.user_no) as cntr_count "
	sql += " ,to_char(to_timestamp(a.sch_scd, 'YYYYMMDD'), 'YYYY-MM-DD') as sch_scd_format "
    sql += " ,to_char(to_timestamp(a.sch_eta, 'YYYYMMDD'), 'YYYY-MM-DD') as sch_eta_format, "
	sql += " (select image_yn from own_code_cuship occ where occ.id = a.line_code limit 1) as image_yn, "
	sql += " (select occ.line_code from own_code_cuship occ where occ.id = a.line_code limit 1) as carrier, "
	sql += " (select occ.nm from own_code_cuship occ where occ.id = a.line_code limit 1) as line_name "
	sql += " from shp_sr a "
	sql += " where 1 = 1 "
	sql += " and a.user_no = $"+`${paramIndex}`
	param.push(request.body.userNo)
	paramIndex = paramIndex +1;
	if(request.body.lineCode) {
		sql += " and a.line_code = $"+`${paramIndex}`;
		param.push(request.body.lineCode);
		paramIndex = paramIndex +1;
	}
	if(request.body.sr_no) {
		sql += " and a.sr_no = $"+`${paramIndex}`;
		param.push(request.body.sr_no);
		paramIndex = paramIndex +1;
	}
	if( !request.body.sr_no && request.body.toDate && request.body.endDate ) {
		sql += " and a.sr_date between to_char(to_timestamp($"+`${paramIndex}`+",'YYYY-MM-DD'),'YYYYMMDD') "
		param.push(request.body.toDate);
		paramIndex = paramIndex +1;
		
		sql += " and to_char(to_timestamp($"+`${paramIndex}`+",'YYYY-MM-DD')+ interval '1' DAY,'YYYYMMDD') "
		param.push(request.body.endDate);
		paramIndex = paramIndex +1;
	}
	
	sql += " and status_cud !='D' ";
	//sql += " order by a.sr_date desc, a.user_no, a.sr_no ";
	sql += " order by a.insert_date desc, a.user_no, a.sr_no ";
	sql += " )a ";
	sql += " where a.curpage=$"+`${paramIndex}`
	param.push(request.body.num);

	log.info(sql);
	(async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query({text:sql, values:param});
    		response.status(200).json(res.rows);
			
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectBlList = (request,response) => {
	console.log(request.body);
	let sql ="";


	sql += " select a.* from ( "
	sql += " select (count(*) over()/10)+(case when count(*) over()%10 = 0 then 0 else 1 end) as tot_page ,floor(((row_number() over(order by a.issue_date desc, a.user_no, a.mbl_no))-1)/ 10 + 1) as curpage "
	sql += " ,count(*) over() as tot_cnt ,floor(((row_number() over(order by a.issue_date desc, a.user_no, a.mbl_no))-1)+ 1) as rownum"
	sql += " ,mbl_no ,issue_date ,to_char(to_timestamp(a.issue_date, 'YYYYMMDD'), 'YYYY-MM-DD') as issue_date_format ,mrn , sch_vessel_voyage, sch_vessel_name ,sch_pol, a.user_no "
	sql += " ,sch_pol_name ,sr_no ,sch_pod ,sch_pod_name ,sch_obd "
	sql += " , case when sch_obd is not null "
	sql += " then case when length(sch_obd) = 8 "
	sql += " 		  then to_char(to_timestamp(sch_obd,'YYYYMMDD'),'YYYY-MM-DD') "
	sql += " 		  when length(sch_obd) = 12 "
	sql += " 		  then to_char(to_timestamp(sch_obd,'YYYYMMDDHH24mi'),'YYYY-MM-DD HH24:mi') "
	sql += " 		  else sch_obd "
	sql += " 	 end "
	sql += " else sch_obd "
	sql += " end  sch_obd_format  "
	sql += " ,(select sum(public.to_float(b.cargo_pack_qty)) as cargo_pack_qty from shp_bl_cargo b where a.mbl_no = b.mbl_no and a.issue_date = b.issue_date and "
	sql += " a.user_no = b.user_no) as cargo_pack_qty "
	sql += " ,(select count(1) from shp_bl_cntr b where a.mbl_no = b.mbl_no and a.issue_date = b.issue_date and a.user_no = b.user_no) as cntr_count "
	sql += " ,(select image_yn from own_code_cuship occ where occ.id = a.line_code limit 1) as image_yn, "
	sql += " (select occ.line_code from own_code_cuship occ where occ.id = a.line_code limit 1) as carrier, "
	sql += " (select occ.nm from own_code_cuship occ where occ.id = a.line_code limit 1) as line_name, imagebl_path,imagebl_name,status_cus,"
	sql += " (select sr_date from shp_sr where user_no = a.user_no and sr_no = a.sr_no and res_mbl_no = a.mbl_no and res_issue_date =a.issue_date limit 1) as sr_date "
	sql += " from shp_bl a "
	sql += " where 1 = 1 "
	sql += (request.body.lineCode!==undefined&&request.body.lineCode!=="")?" and a.line_code = '"+request.body.lineCode+"'":"";
	sql += (request.body.bl_no !== ""&&request.body.bl_no!==null&&request.body.bl_no!==undefined)?" and a.mbl_no = '"+request.body.bl_no+"'":""
	if( !request.body.bl_no && request.body.toDate !== null && request.body.endDate !== null ) {
		sql += " and a.issue_date between to_char(to_timestamp('"+request.body.toDate+"','YYYY-MM-DD'),'YYYYMMDD') and to_char(to_timestamp('"+request.body.endDate+"','YYYY-MM-DD') + interval '1' DAY,'YYYYMMDD') "
	}
	sql += " and a.user_no = '"+request.body.userNo.user_no+"' "
	sql += " order by a.issue_date desc, a.user_no, a.mbl_no "
	sql += " )a "
	sql += " where a.curpage='"+request.body.num+"' "


	console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	
}


const getUserDeclareBookmark = (request,response) => {

	let sql = "select a.*, a.declare_bookmark_name as label,a.declare_bookmark_seq as value from shp_sr_declare_bookmark a where a.user_no = '"+request.body.user_no+"'  \n";
    if(request.body.seq) {
    	sql += "and a.declare_bookmark_seq='"+request.body.seq+"' limit 1 \n";
    } else {
    	sql += "order by a.declare_bookmark_seq::integer";
    }


	console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
	
}

const setUserDeclareBookmark = (request, response) => {
	var sql;
	if(request.body.data.declare_bookmark_seq) {
		sql = {
				text: ` update shp_sr_declare_bookmark set declare_bookmark_name=$1,declare_num=$2,declare_div_load_yn=$3,declare_pack_set_code=$4,
				        declare_div_load_no=$5,declare_goods_desc=$6,declare_pack_num=$7,declare_pack_type=$8,declare_weight=$9,declare_pack_set_num=$10,declare_pack_set_type=$11,
				        declare_customs_date=$12
				        where user_no=$13 and declare_bookmark_seq=$14`,
				values: [
					request.body.data.declare_bookmark_name, request.body.data.declare_num, request.body.data.declare_div_load_yn, request.body.data.declare_pack_set_code, 
					request.body.data.declare_div_load_no,request.body.data.declare_goods_desc, request.body.data.declare_pack_num, request.body.data.declare_pack_type, request.body.data.declare_weight, request.body.data.declare_pack_set_num,
					request.body.data.declare_pack_set_type,request.body.data.declare_customs_date,request.body.user_no,request.body.data.declare_bookmark_seq
				]
			}
	} else {
		sql = {
				text: ` insert into shp_sr_declare_bookmark(user_no,declare_bookmark_seq,declare_bookmark_name,declare_num,declare_div_load_yn,declare_pack_set_code,
				        declare_div_load_no,declare_goods_desc,declare_pack_num,declare_pack_type,declare_weight,declare_pack_set_num,declare_pack_set_type,declare_customs_date)
				        select $1,coalesce((select max(declare_bookmark_seq::integer) from shp_sr_declare_bookmark where user_no=$2),0)+1 as declare_bookmark_seq,
				        $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
				        `,
				values: [
					request.body.user_no,request.body.user_no,request.body.data.declare_bookmark_name, request.body.data.declare_num, request.body.data.declare_div_load_yn, request.body.data.declare_pack_set_code, 
					request.body.data.declare_div_load_no,request.body.data.declare_goods_desc, request.body.data.declare_pack_num, request.body.data.declare_pack_type, request.body.data.declare_weight, request.body.data.declare_pack_set_num,
					request.body.data.declare_pack_set_type,request.body.data.declare_customs_date
				]
			}
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const setUserDeclareBookmarkDel = (request, response) => {

    const sql = {
    		text: `delete from shp_sr_declare_bookmark where user_no=$1 and declare_bookmark_seq=$2 `,
    		values: [request.body.user_no,request.body.data.declare_bookmark_seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const setUserOtherBookmarkDel = (request, response) => {

    const sql = {
    		text: `delete from shp_sr_other_bookmark where user_no=$1 and other_bookmark_seq=$2 `,
    		values: [request.body.user_no,request.body.data.other_bookmark_seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


// Total Booking Bookmark 조회
const selectBookingBkgBookmark = (request, response) => {
    const sql = {
		text: ` SELECT user_no, bookmark_seq, bookmark_name
 ,bookmark_seq as value, bookmark_name as label
 ,insert_date, insert_user, update_date, update_user
 FROM public.shp_bkg_bookmark a
 where user_no = $1
 order by a.user_no, cast(a.bookmark_seq as numeric) `,
		values: [request.body.user_no]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Total Booking Bookmark SAVE
const saveBookingBkgBookmark = async (request, response) => {
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			// Bookmark 정보
			let bookmark = request.body.bookmark;
			// Relation 정보
			let relationList = request.body.relationList;
			let sql = '';
			let res = null;
			if( bookmark.bookmark_seq ) {
				sql = await updateBookingBkgBookmark( bookmark, request.body.user_no );
				await client.query(sql);
			} else {
				sql = await insertBookingBkgBookmark( bookmark, request.body.user_no );
				res = await client.query(sql);
			}
			if( !bookmark.bookmark_seq ) {
				bookmark.bookmark_seq = res.rows[0].bookmark_seq
			}
			sql = await deleteBookingBkgBookmarkRelation( bookmark );
			await client.query(sql);
			// Relation 정보입력
			if( relationList.length > 0 ) {
				await Promise.all(
					relationList.map((element, key)=>{
						// 3.1 입력하기
						if( element.reference_seq ) {
							element.relation_seq = key+1;
							sql = insertBookingBkgBookmarkRelation( bookmark, element, request.body.user_no );
							res = client.query(sql);
						}
					})
				);
			}
			response.status(200).json(res);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Total Booking Bookmark 입력
const insertBookingBkgBookmark = (bookmark, user_no) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_bookmark
(user_no, bookmark_seq, bookmark_name
, insert_date, insert_user)
VALUES($1
,(select coalesce(max (cast(bookmark_seq as numeric) ),0)+1 
 from shp_bkg_bookmark 
 where user_no = $2) 
, $3, now(), $4 )
returning bookmark_seq `,
		values: [
			user_no,
			user_no,
			bookmark.bookmark_name,
			user_no,
		]
	}
    console.log(sql);
    return sql;
}

// Total Booking Bookmark 수정
const updateBookingBkgBookmark = (bookmark, user_no) => {
    const sql = {
		text: ` UPDATE shp_bkg_bookmark
 SET bookmark_name=$1, update_date=now(), update_user=$2
 WHERE user_no=$3 AND bookmark_seq=$4 `,
		values: [
			bookmark.bookmark_name,
			user_no,
			bookmark.user_no,
			bookmark.bookmark_seq,
		]
	}
    console.log(sql);
    return sql
}

// Total Booking Bookmark 삭제
const deleteBookingBkgBookmark = (bookmark) => {
    const sql = {
		text: ` DELETE FROM shp_bkg_bookmark
 WHERE user_no=$1 AND bookmark_seq=$2 `,
		values: [
			bookmark.user_no,
			bookmark.bookmark_seq,
		]
	}
    console.log(sql);
    return sql;
}

// Total Booking Bookmark Relation 조회
const selectBookingBkgBookmarkRelation = (request, response) => {
    const sql = {
		text: ` SELECT user_no, bookmark_seq, relation_seq, reference_type, reference_seq
 , insert_date, insert_user, update_date, update_user
 , case when a.reference_type= 'BOOKING'
        then (select other_bookmark_name 
             from shp_bkg_other_bookmark b 
             where a.reference_type= 'BOOKING'
             and b.user_no = a.user_no and b.other_bookmark_seq = a.reference_seq)
        when a.reference_type= 'SCHEDULE'
        then (select schedule_bookmark_name
                from shp_bkg_schedule_bookmark b 
                where a.reference_type= 'SCHEDULE' 
                and b.user_no = a.user_no and b.schedule_bookmark_seq = a.reference_seq)
        when a.reference_type= 'CARRIER'
        then (select line_bookmark_name
                from shp_bkg_line_bookmark b 
                where a.reference_type= 'CARRIER' 
                and b.user_no = a.user_no and b.line_bookmark_seq = a.reference_seq)
        when a.reference_type= 'SHIPPER'
        then (select shipper_bookmark_name
                from shp_bkg_shipper_bookmark b 
                where a.reference_type= 'SHIPPER' 
                and b.user_no = a.user_no and b.shipper_bookmark_seq = a.reference_seq)
        when a.reference_type= 'CONSIGNEE'
        then (select consignee_bookmark_name
                from shp_bkg_consignee_bookmark b 
                where a.reference_type= 'CONSIGNEE' 
                and b.user_no = a.user_no and b.consignee_bookmark_seq = a.reference_seq)
        when a.reference_type= 'FORWARDER'
        then (select forwarder_bookmark_name
                from shp_bkg_forwarder_bookmark b 
                where a.reference_type= 'FORWARDER' 
                and b.user_no = a.user_no and b.forwarder_bookmark_seq = a.reference_seq)
        when a.reference_type= 'TRANSPORT'
        then (select transport_bookmark_name
                from shp_bkg_transport_bookmark b 
                where a.reference_type= 'TRANSPORT' 
                and b.user_no = a.user_no and b.transport_bookmark_seq = a.reference_seq)
        when a.reference_type= 'CARGO'
        then (select cargo_bookmark_name
                from shp_bkg_cargo_bookmark b 
                where a.reference_type= 'CARGO' 
                and b.user_no = a.user_no and b.cargo_bookmark_seq = a.reference_seq)
        when a.reference_type= 'CONTAINER'
        then (select container_bookmark_name
                from shp_bkg_container_bookmark b 
                where a.reference_type= 'CONTAINER' 
                and b.user_no = a.user_no and b.container_bookmark_seq = a.reference_seq)
       else '선택'
  end  bookmark_name
 FROM shp_bkg_bookmark_relation a
 where user_no=$1
 and bookmark_seq=$2 `,
		values: [
			request.body.user_no,
			request.body.bookmark.bookmark_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Total Booking Bookmark Relation 입력
const insertBookingBkgBookmarkRelation = ( bookmark, relation, user_no ) => {
    const sql = {
		text: ` INSERT INTO shp_bkg_bookmark_relation
(user_no
,bookmark_seq 
, relation_seq, reference_type
, reference_seq, insert_date, insert_user)
VALUES($1, $2, $3, $4, $5, now(), $6) `,
		values: [
			user_no,
			bookmark.bookmark_seq,
			relation.relation_seq,
			relation.reference_type,
			relation.reference_seq,
			user_no,
		]
	}
    console.log(sql);
    return sql;
}

// Total Booking Bookmark Reltaion 수정
const updateBookingBkgBookmarkRelation = (request, response) => {
    const sql = {
		text: ` UPDATE public.shp_bkg_bookmark_relation
 SET reference_type=$1, reference_seq=$2, update_date=now(), update_user=$3
 WHERE user_no=$4 AND bookmark_seq=$5 AND relation_seq=$6 `,
		values: [
			request.body.bookmark.reference_type,
			request.body.bookmark.reference_seq,
			request.body.user_no,
			request.body.bookmark.user_no,
			request.body.bookmark.bookmark_seq,
			request.body.bookmark.relation_seq,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

// Total Booking Bookmark Relation 삭제
const deleteBookingBkgBookmarkRelation = (bookmark) => {
    const sql = {
		text: ` DELETE FROM public.shp_bkg_bookmark_relation
 WHERE user_no=$1 AND bookmark_seq=$2
		 `,
		values: [
			bookmark.user_no,
			bookmark.bookmark_seq,
		]
	}
    console.log(sql);
    return sql;
}


// Total Booking Bookmark DELETE
const deleteBookmark = async (request, response) => {
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			// Bookmark 정보
			let bookmark = request.body.bookmark;
			let sql = await deleteBookingBkgBookmarkRelation( bookmark );
			await client.query(sql);
			sql = await deleteBookingBkgBookmark( bookmark );
			let res = await client.query(sql);
			response.status(200).json(res);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const getUserTitleBookmark = (request, response) => {

	let sql = "select a.*, a.bookmark_name as label,a.bookmark_seq as value from shp_sr_bookmark a where a.user_no = '"+request.body.user_no+"'  \n";
    if(request.body.seq) {
    	sql += "and a.bookmark_seq='"+request.body.seq+"' limit 1 \n";
    } else {
    	sql += "order by a.bookmark_seq::integer";
    }


	console.log(sql);
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(sql);
			response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const setUserTitleBookmark = (request, response) => {

    const sql = {
    		text: `insert into  shp_sr_bookmark (user_no,bookmark_seq,bookmark_name)
    		       select $1,coalesce((select max(bookmark_seq::integer) from shp_sr_bookmark where user_no=$2),0)+1 as bookmark_seq,$3
    		       RETURNING bookmark_seq`,
    		values: [request.body.user_no,request.body.user_no,request.body.data.bookmark_name ]
    	}
    const deleteBookmarkSql = {
    		text: `delete from shp_sr_bookmark where user_no = $1 and bookmark_seq=$2`,
    		values: [request.body.user_no,request.body.data.bookmark_name ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		if(request.body.data.bookmark_seq) {
        			const deleteSql = await client.query(setUserTitleDelete(request,request.body.data.bookmark_seq));
        		}
        		const res = await client.query(sql);
        		//console.log("res:",res.rows);
        		if(res.rows) {
        			var bookmark_seq = res.rows[0].bookmark_seq;
	        		const res_relation_del = await client.query(setUserTitleDeleteRelation(request,bookmark_seq));

	        			var rowCount =1;
	        			if(request.body.data.booking_label && request.body.data.booking_value) {
	        				await client.query(setUserTitleInsertRelation("BOOKING",request,request.body.data.booking_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.schedule_label && request.body.data.schedule_value) {
	        				await client.query(setUserTitleInsertRelation("SCHEDULE",request,request.body.data.schedule_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.carrier_label && request.body.data.carrier_value) {
	        				await client.query(setUserTitleInsertRelation("CARRIER",request,request.body.data.carrier_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.shipper_label && request.body.data.shipper_value) {
	        				await client.query(setUserTitleInsertRelation("SHIPPER",request,request.body.data.shipper_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.consignee_label && request.body.data.consignee_value) {
	        				await client.query(setUserTitleInsertRelation("CONSIGNEE",request,request.body.data.consignee_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.notify_label && request.body.data.notify_value) {
	        				await client.query(setUserTitleInsertRelation("NOTIFY",request,request.body.data.notify_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.cargo_label && request.body.data.cargo_value) {
	        				await client.query(setUserTitleInsertRelation("CARGO",request,request.body.data.cargo_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.c_shipper_label && request.body.data.c_shipper_value) {
	        				await client.query(setUserTitleInsertRelation("C_SHIPPER",request,request.body.data.c_shipper_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.c_consignee_label && request.body.data.c_consignee_value) {
	        				await client.query(setUserTitleInsertRelation("C_CONSIGNEE",request,request.body.data.c_consignee_value,rowCount,bookmark_seq));
	        				rowCount++;
	        			}
	        			if(request.body.data.c_notify_label && request.body.data.c_notify_value) {
	        				await client.query(setUserTitleInsertRelation("C_NOTIFY",request,request.body.data.c_notify_value,rowCount,bookmark_seq));
	        			}

	        		response.status(200).json(res.rows);
        		} else {
        			console.log("error");
        			response.status(201).json([]);
        		}
        		
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const setUserTitleDelete = (request,seq) => {

    const sql = {
    		text: `delete from shp_sr_bookmark where user_no=$1 and bookmark_seq=$2`,
    		values: [request.body.user_no,seq ]
    	}
        console.log(sql);
    return sql;
}

const setUserTitleDeleteRelation = (request,seq) => {

    const sql = {
    		text: `delete from shp_sr_bookmark_relation where user_no=$1 and bookmark_seq=$2`,
    		values: [request.body.user_no,seq ]
    	}
        console.log(sql);
    return sql;
}

const setUserTitleInsertRelation = (name,request,vVal,seq,bookmark_seq) => {

    const sql = {
    		text: `insert into shp_sr_bookmark_relation(user_no,bookmark_seq,relation_seq,reference_type,reference_seq)values($1,$2,$3,$4,$5)`,
    		values: [request.body.user_no,bookmark_seq,seq,name,vVal]
    	}
        console.log(sql);
    return sql;
}

const setUserTitleBookmarkDel = (request, response) => {

    const sql = {
    		text: `delete from shp_sr_bookmark where user_no=$1 and bookmark_seq=$2 `,
    		values: [request.body.user_no,request.body.seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		if(res.rowCount > 1) {
        			const res_relation_del = await client.query(setUserTitleDeleteRelation(request,request.body.seq));
        		}
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const getSRbookmarkRelation = (request, response) => {

    const sql = {
    		text: `select a.user_no,a.bookmark_name,b.bookmark_seq,b.relation_seq,b.reference_type,b.reference_seq,
					case when b.reference_type='BOOKING' then (select other_bookmark_name from shp_sr_other_bookmark where user_no = a.user_no  and other_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='SCHEDULE' then (select schedule_bookmark_name from shp_sr_schedule_bookmark  where user_no = a.user_no  and  schedule_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='CARRIER' then (select line_bookmark_name from shp_sr_line_bookmark where user_no = a.user_no  and  line_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='SHIPPER' then (select shipper_bookmark_name from shp_sr_shipper_bookmark where user_no = a.user_no  and  shipper_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='CONSIGNEE' then (select consignee_bookmark_name from shp_sr_consignee_bookmark where user_no = a.user_no  and  consignee_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='NOTIFY' then (select notify_bookmark_name from shp_sr_notify_bookmark where user_no = a.user_no  and  notify_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='CARGO' then (select cargo_bookmark_name from shp_sr_cargo_bookmark where user_no = a.user_no  and  cargo_bookmark_seq = b.reference_seq limit 1)
					      when b.reference_type='C_SHIPPER' then (select shipper_bookmark_name from shp_sr_shipper_bookmark where user_no = a.user_no  and  shipper_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='C_CONSIGNEE' then (select consignee_bookmark_name from shp_sr_consignee_bookmark where user_no = a.user_no  and  consignee_bookmark_seq = b.reference_seq limit 1)
					     when b.reference_type='C_NOTIFY' then (select notify_bookmark_name from shp_sr_notify_bookmark where user_no = a.user_no  and  notify_bookmark_seq = b.reference_seq limit 1)
					     else b.reference_seq  end as label
					     from shp_sr_bookmark a, shp_sr_bookmark_relation b
					where a.user_no = b.user_no
					  and a.bookmark_seq = b.bookmark_seq
					  and a.user_no = $1
					  and a.bookmark_seq = $2
					  order by b.relation_seq `,
    		values: [request.body.user_no,request.body.seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const setUserSrBookmarkDataList = (request, response) => {

    const sql = {
    		text: `select a.user_no,b.reference_type,b.reference_seq
						from shp_sr_bookmark a,shp_sr_bookmark_relation b 
						where a.user_no = b.user_no
						  and a.bookmark_seq = b.bookmark_seq 
						  and a.user_no= $1
						  and a.bookmark_seq= $2 `,
    		values: [request.body.user_no,request.body.seq ]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		var user = request.body.user_no;
        		var list = {'other_bookmark_seq':'','other_bookmark_name':'선택','sc_no':'','trans_service_code':'','bl_type':'','hbl_yn':'',
        				'schedule_bookmark_seq':'','schedule_bookmark_name':'선택','sch_vessel_name':'','sch_vessel_voyage':'','sch_feeder_vessel_name':'',
        				'sch_feeder_vessel_voyage':'','sch_barge_onboard_date':'','sch_pol':'','sch_pol_name':'','sch_pod':'','sch_pod_name':'','sch_fdp':'',
        				'sch_fdp_name':'','sch_por':'','sch_por_name':'','sch_pld':'','sch_pld_name':'','sch_bl_issue_name':'','line_bookmark_seq':'','line_bookmark_name':'선택',
        				'line_address1':'','line_address2':'','line_address3':'','line_address4':'','line_address5':'','line_name1':'','line_name2':'','line_user_name':'',
        				'line_user_dept':'','line_user_tel':'','line_user_email':'','line_payment_type':'','shipper_bookmark_seq':'','shipper_bookmark_name':'선택',
        				'shp_name1':'','shp_name2':'','shp_address1':'','shp_address2':'','shp_address3':'','shp_address4':'','shp_address5':'','consignee_bookmark_seq':'',
        				'consignee_bookmark_name':'선택','cons_name1':'','cons_name2':'','cons_address1':'','cons_address2':'','cons_address3':'','cons_address4':'',
        				'cons_address5':'','notify_bookmark_seq':'','notify_bookmark_name':'선택','noti_name1':'','noti_name2':'','noti_address1':'','noti_address2':'',
        				'noti_address3':'','noti_address4':'','noti_address5':'','c_shipper_bookmark_seq':'','c_shipper_bookmark_name':'선택',
        				'c_shp_name1':'','c_shp_name2':'','c_shp_address1':'','c_shp_address2':'','c_shp_address3':'','c_shp_address4':'','c_shp_address5':'',
						'c_consignee_bookmark_seq':'',
        				'c_consignee_bookmark_name':'선택','c_cons_name1':'','c_cons_name2':'','c_cons_address1':'','c_cons_address2':'','c_cons_address3':'',
						'c_cons_address4':'',
        				'c_cons_address5':'','c_notify_bookmark_seq':'','c_notify_bookmark_name':'선택','c_noti_name1':'','c_noti_name2':'','c_noti_address1':'',
						'c_noti_address2':'','c_noti_address3':'','c_noti_address4':'','c_noti_address5':'','cargo_bookmark_seq':'','cargo_bookmark_name':'선택','cargo_pack_qty':'','cargo_pack_type':'',
        				'cargo_hs_code':'','cargo_total_volume':'','cargo_total_weight':'','marklist':[],'goodlist':[]};
        		const res = await client.query(sql);
        		var data = res.rows;
        		if(res.rowCount > 0) {
        			await Promise.all(
        			data.map(async(data) => {
        				if(data.reference_type === 'BOOKING') {
        					const booking = await client.query(selectOtherBookmark(user,data.reference_seq));
        					list = {...list,...booking.rows[0]};
        				} else if(data.reference_type === 'SCHEDULE') {
        					const schedule = await client.query(selectSchBookmark(user,data.reference_seq));
        					list = {...list,...schedule.rows[0]};
        				} else if(data.reference_type === 'CARRIER') {
        					const carrier = await client.query(selectLineBookmark(user,data.reference_seq));
        					list = {...list,...carrier.rows[0]};
        				} else if(data.reference_type === 'SHIPPER') {
        					const shipper = await client.query(selectShpBookmark(user,data.reference_seq));
        					list = {...list,...shipper.rows[0]};
        				} else if(data.reference_type === 'CONSIGNEE') {
        					const consignee = await client.query(selectConsBookmark(user,data.reference_seq));
        					list = {...list,...consignee.rows[0]};
        				} else if(data.reference_type === 'NOTIFY') {
        					const notify = await client.query(selectNotiBookmark(user,data.reference_seq));
        					list = {...list,...notify.rows[0]};
        				} else if(data.reference_type === 'CARGO') {
        					const cargo = await client.query(selectCargoBookmark(user,data.reference_seq));
        					if(cargo.rowCount > 0) {
        					    var cargoSeq = cargo.rows[0].cargo_bookmark_seq;
        		        		const mark = await client.query(getUserMarkRelation(request,cargoSeq));
        		        		const goods = await client.query(getUserGoodsRelation(request,cargoSeq));
        		        		const mergeData = Object.assign(cargo.rows[0],goods.rows[0],mark.rows[0]);
        		        		list = {...list,...mergeData};
        					}
        				} else if(data.reference_type === 'C_SHIPPER') {
        					const c_shipper = await client.query(selectShpBookmark(user,data.reference_seq));
							if(c_shipper.rowCount > 0) {
        					list = {...list,'c_shipper_bookmark_seq':c_shipper.rows[0].shipper_bookmark_seq,
									'c_shipper_bookmark_name':c_shipper.rows[0].shipper_bookmark_name,
									'c_shp_code':c_shipper.rows[0].shp_code,
									'c_shp_name1':c_shipper.rows[0].shp_name1,
								    'c_shp_name2':c_shipper.rows[0].shp_name2,
								    'c_shp_address1':c_shipper.rows[0].shp_address1,
									'c_shp_address2':c_shipper.rows[0].shp_address2,
									'c_shp_address3':c_shipper.rows[0].shp_address3,
									'c_shp_address4':c_shipper.rows[0].shp_address4,
									'c_shp_address5':c_shipper.rows[0].shp_address5,
									'c_shp_user_name':c_shipper.rows[0].shp_user_name,
									'c_shp_user_tel':c_shipper.rows[0].shp_user_tel,
									'c_shp_country_code':c_shipper.rows[0].shp_country_code};
							}
        				} else if(data.reference_type === 'C_CONSIGNEE') {
        					const c_consignee = await client.query(selectConsBookmark(user,data.reference_seq));
							if(c_consignee.rowCount > 0) {
								list = {...list,'c_consignee_bookmark_seq':c_consignee.rows[0].consignee_bookmark_seq,
		    			  	  			'c_consignee_bookmark_name':c_consignee.rows[0].consignee_bookmark_name,
		    			  	  			'c_cons_code':c_consignee.rows[0].cons_code,
		    			  	  			'c_cons_name1':c_consignee.rows[0].cons_name1,
				              			'c_cons_name2':c_consignee.rows[0].cons_name2,
				              			'c_cons_address1':c_consignee.rows[0].cons_address1,
				              			'c_cons_address2':c_consignee.rows[0].cons_address2,
				              			'c_cons_address3':c_consignee.rows[0].cons_address3,
				              			'c_cons_address4':c_consignee.rows[0].cons_address4,
				              			'c_cons_address5':c_consignee.rows[0].cons_address5,
				              			'c_cons_user_name':c_consignee.rows[0].cons_user_name,
				              			'c_cons_user_tel':c_consignee.rows[0].cons_user_tel,
				             			 'c_cons_country_code':c_consignee.rows[0].cons_country_code};
							}
        				} else if(data.reference_type === 'C_NOTIFY') {
        					const c_notify = await client.query(selectNotiBookmark(user,data.reference_seq));
							if(c_notify.rowCount > 0) {
								list = {...list,'c_notify_bookmark_seq':c_notify.rows[0].notify_bookmark_seq,
		    			  	  			'c_notify_bookmark_name':c_notify.rows[0].notify_bookmark_name,
		    			  	  			'c_noti_code':c_notify.rows[0].noti_code,
		    			  	  			'c_noti_name1':c_notify.rows[0].noti_name1,
				              			'c_noti_name2':c_notify.rows[0].noti_name2,
				              			'c_noti_address1':c_notify.rows[0].noti_address1,
				              			'c_noti_address2':c_notify.rows[0].noti_address2,
				              			'c_noti_address3':c_notify.rows[0].noti_address3,
				              			'c_noti_address4':c_notify.rows[0].noti_address4,
				             			'c_noti_address5':c_notify.rows[0].noti_address5,
				             			'c_noti_user_name':c_notify.rows[0].noti_user_name,
				              			'c_noti_user_tel':c_notify.rows[0].noti_user_tel,
				              			'c_noti_country_code':c_notify.rows[0].noti_country_code};
							}	
        				}	
        			})
        			)
        			
        		}
        		console.log("data:",list);
        		response.status(200).json(list);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const getHsCodeGroupInfo = (request, response) => {

    const sql = {
    		text: `select *from own_code_hs_group order by group_code `
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const getHsCodeItemInfo = (request, response) => {

    const sql = {
    		text: `select *from own_code_hs_item where group_code = $1`,
    		values: [request.body.code]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const getLineRoute = (request, response) => {

    const sql = {
    		text: `SELECT line_code, start_port_code, end_port_code, start_port_name, start_port_kr_name, end_port_name, end_port_kr_name, special_cargo_trans_yn,
 concat(start_port_name,'->', end_port_name) as route_service
 from own_line_service_route_manage where line_code = $1`,
    		values: [request.body.line_code]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/**
 *  위동 위험물 판단 여부 (selectWeidongDangerCheck)
 * 1. 위험물 구간(own_line_service_route_manage) special_cargo_trans_yn = Y
 * -> cargo_trans_yn 컬럼
 * 2. vessel type(own_line_code_vessel)  vsl_type = 41(컨테이너선)
 * -> vsl_cntr_yn 컬럼
 * 
 * @param {*} request (line_code, start_port_code, end_port_code, vessel_name)
 * @param {*} response (cargo_trans_yn, vsl_cntr_yn) 둘다 Y 이어야 합니다.
 */
const selectWeidongDangerCheck = (request, response) => {

    const sql = {
			text: ` select coalesce((select special_cargo_trans_yn
 from own_line_service_route_manage a
 where a.line_code = $1
 and a.start_port_code = $2
 and a.end_port_code = $3), 'N') cargo_trans_yn
 ,coalesce((select case when b.vsl_type = '41'
 then 'Y'
 else 'N'
 end 
 from own_line_code_vessel_name a
 ,own_line_code_vessel b
 where a.line_code = b.line_code
 and a.vessel_code = b.vessel_code
 and a.vessel_name=$4), 'N') vsl_cntr_yn `,
    		values: [
				request.body.line_code,
				request.body.start_port_code,
				request.body.end_port_code,
				request.body.vessel_name,
			]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const getUserBookmark = (request, response) => {

	const user_no =request.body.user_no;
	
    const totalSql = {
			text: `select a.*, a.bookmark_name as label,a.bookmark_seq as value from shp_sr_bookmark a where a.user_no = $1 order by a.bookmark_seq::integer`,
    		values: [user_no]
    }
    const bookingSql = {
			text: `select a.*,a.other_bookmark_seq as value, a.other_bookmark_name as label from shp_sr_other_bookmark a WHERE a.user_no = $1 order by a.other_bookmark_seq::integer`,
    		values: [user_no]
    }
    const scheduleSql = {
			text: `select a.*, a.schedule_bookmark_seq as value,a.schedule_bookmark_name as label from shp_sr_schedule_bookmark a where a.user_no = $1 order by a.schedule_bookmark_seq::integer`,
    		values: [user_no]
    }
    const carrierSql = {
			text: `select a.*, a.line_bookmark_seq as value,a.line_bookmark_name as label from shp_sr_line_bookmark a where a.user_no = $1 order by a.line_bookmark_seq::integer`,
    		values: [user_no]
    }
    const shipperSql = {
			text: `select a.*,a.shipper_bookmark_seq as value,a.shipper_bookmark_name as label from shp_sr_shipper_bookmark a where a.user_no = $1 order by a.shipper_bookmark_seq`,
    		values: [user_no]
    }
    const consigneeSql = {
			text: `select a.*,a.consignee_bookmark_seq as value,a.consignee_bookmark_name as label from shp_sr_consignee_bookmark a where a.user_no = $1 order by a.consignee_bookmark_seq::integer`,
    		values: [user_no]
    }
    const notifySql = {
			text: `select a.*,a.notify_bookmark_seq as value,a.notify_bookmark_name as label from shp_sr_Notify_bookmark a where a.user_no = $1 order by a.notify_bookmark_seq::integer`,
    		values: [user_no]
    }
    const cargoSql = {
			text: `SELECT a.*, case when (select 1 from shp_sr_cargo_mark_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1 ) is not null then 'Y'
			 else 'N' end as mark_yn, case when (select 1 from shp_sr_cargo_goods_bookmark_relation where user_no = a.user_no and cargo_bookmark_seq = a.cargo_bookmark_seq limit 1) is not null then 'Y'
			 else 'N' end as goods_yn,a.cargo_bookmark_seq as value, a.cargo_bookmark_name as label from shp_sr_cargo_bookmark a WHERE a.user_no = $1 order by a.cargo_bookmark_seq::integer`,
    		values: [user_no]
    }  
    const containerSql = {
			text: `select  a.*,a.container_bookmark_seq as value,a.container_bookmark_name as label from shp_sr_container_bookmark a where a.user_no = $1 order by a.container_bookmark_seq::integer`,
    		values: [user_no]
    }  
    const declareSql = {
			text: `select a.*, a.declare_bookmark_name as label,a.declare_bookmark_seq as value from shp_sr_declare_bookmark a where a.user_no = $1 order by a.declare_bookmark_seq::integer`,
    		values: [user_no]
    }  
 
    const markSql = {
			text: `SELECT a.cargo_mark_bookmark_seq as value,a.cargo_mark_bookmark_name as label,a.* from shp_sr_cargo_mark_bookmark a WHERE user_no = $1 order by a.cargo_mark_bookmark_seq::integer`,
    		values: [user_no]
    } 
    
    const goodsSql = {
			text: `SELECT a.cargo_goods_bookmark_seq as value,a.cargo_goods_bookmark_name as label, a.* from shp_sr_cargo_goods_bookmark a WHERE user_no = $1 order by a.cargo_goods_bookmark_seq::integer`,
    		values: [user_no]
    } 

    	
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const total_res = await client.query(totalSql);
        		const bkg_res = await client.query(bookingSql);
        		const sch_res = await client.query(scheduleSql);
        		const carrier_res = await client.query(carrierSql);
        		const ship_res = await client.query(shipperSql);
        		const cons_res = await client.query(consigneeSql);
        		const noti_res = await client.query(notifySql);
        		const cargo_res = await client.query(cargoSql);
        		const cntr_res = await client.query(containerSql);
        		const dec_res = await client.query(declareSql);
        		const mark_res = await client.query(markSql);
        		const goods_res = await client.query(goodsSql);
        		
        		response.status(200).json({'totalList':total_res.rows,'bookingList':bkg_res.rows,'scheduleList':sch_res.rows,'carrierList':carrier_res.rows,
        			                       'shipperList':ship_res.rows,'consList':cons_res.rows,'notiList':noti_res.rows,'cargoList':cargo_res.rows,'cntrList':cntr_res.rows,
        			                       'decList':dec_res.rows,'markList':mark_res.rows,'goodsList':goods_res.rows});
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/**
 * 사용자 정보를 바탕으로 Forwarder 인 경우 Forwarder 목록을 조회
 * @param {*} request 
 * @param {*} response 
 */
const selectForwarderCompanyListByUser = (request, response) => {

    const sql = {
			text: ` select a.partner_code  , a.business_number, a.klnet_id
from own_line_company a
where a.line_code = $1
and a.klnet_id = $2
and a.forwarder_yn = 'Y' `,
    		values: [
				request.body.line_code,
				request.body.klnet_id,
			]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

/**
 * 사용자 정보를 바탕으로 Shipper 인 경우엔 본인 Shipper 정보
 * Shipper 아닌 경우엔 Shipper 목록으로 조회
 * @param {*} request 
 * @param {*} response 
 */
const selectShipperCompanyListByUser = (request, response) => {

	//     const sql = {
	// 			text: ` select b.partner_code as value , c.company_name as label, b.partner_code
	// ,b.company_id, c.company_name
	// ,c.company_ename, c.business_number, c.company_master, c.sector, c.business_type, c.address, c.address_detail, c.address_number
	// , c.status, c.phone, c.fax, c.company_email
	//  from own_company_section_user_mapping a
	// ,own_line_company b
	// ,own_company c
	//  where a.user_no = $1
	//  and a.company_id = b.company_id
	//  and c.company_id = a.company_id
	//  and exists (select 'x'
	//  from own_line_company d
	//  where d.company_id = a.company_id
	//  and d.shipper_yn ='Y')
	//  union 
	//  select a.partner_code as value , b.company_name as label, a.partner_code
	// ,a.company_id, b.company_name
	// ,b.company_ename, b.business_number, b.company_master, b.sector, b.business_type, b.address, b.address_detail, b.address_number
	// , b.status, b.phone, b.fax, b.company_email
	//  from own_line_company a
	// ,own_company b
	//  where a.company_id = b.company_id
	//  and a.shipper_yn ='Y'
	//  and not exists (
	//  select 'x'
	//  from own_company_section_user_mapping c
	// ,own_line_company d
	//  where c.user_no = $1
	//  and c.company_id = d.company_id
	//  and d.shipper_yn ='Y')
	//  union
	//  select a.partner_code as value , b.company_name as label, a.partner_code
	// ,a.company_id, b.company_name
	// ,b.company_ename, b.business_number, b.company_master, b.sector, b.business_type, b.address, b.address_detail, b.address_number
	// , b.status, b.phone, b.fax, b.company_email
	//  from own_line_company a
	// ,own_company b
	//  where a.company_id = b.company_id
	//  and a.shipper_yn ='Y'
	//  and exists (
	//  select 'x'
	//  from own_company_section_user_mapping c
	// ,own_line_company d
	//  where c.user_no = $1
	//  and c.company_id = d.company_id
	//  and d.forwarder_yn ='Y')`,
	const sql = {
		text: ` select a.partner_code, a.business_number, a.klnet_id
 from own_line_company a 
 where a.line_code = $1
 and a.klnet_id = $2
 and shipper_yn ='Y' 
 and business_number is not null
 and a.business_number != ''
 union  
 select a.partner_code, a.business_number , a.klnet_id
 from own_line_company a 
 where a.shipper_yn ='Y' 
 and a.line_code = $1
 and a.klnet_id = $2
 and a.business_number is not null
 and a.business_number != ''
 and not exists ( 
 select 'x' 
 from own_line_company d 
 where d.line_code = $1
 and d.klnet_id = $2
 and d.shipper_yn ='Y') 
 union 
 select a.partner_code, a.business_number , a.klnet_id
 from own_line_company a 
 where a.shipper_yn ='Y' 
 and a.line_code = $1
 and a.business_number is not null
 and a.business_number != ''
 and exists ( 
 select 'x' 
 from own_line_company d 
 where d.line_code = a.line_code 
 and d.line_code = $1
 and d.klnet_id = $2
 and d.forwarder_yn ='Y') `,
			values: [
				request.body.line_code,
				request.body.klnet_id,
			]
		}
		console.log(sql);
		(async () => {
			const client = await pgsqlPool.connect();
			try {
				const res = await client.query(sql);
				response.status(200).json(res.rows);
			} finally {
				client.release();
			}
		})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const declareSaveFile = (req, res, next) => {
	saveFile(req, res, function(err){
		if(err instanceof multer.MulterError){ 
		return res.status(500).json({success:0, result:err});
		} else if (req.body.returnVal){
			return res.status(200).json({success:1, result: req.body.returnVal});

		}
	})
};

const storage = multer.diskStorage({ 
    destination: function(req, file, cb){
    var rootPath;
    var newDirectory = moment(new Date()).format('YYYYMMDD');
    
   	 if(req.headers && req.headers.referer.indexOf('localhost') > 0) {
      	  rootPath = "./downLoadFile/";
      } else {
    	  rootPath = "/OWNER/uploads/sr/declare/";
      } 
 
   	
   	  if(!fs.existsSync(rootPath+newDirectory)) {
   	      fs.mkdirSync(rootPath+newDirectory);
   	  }
   	  
      cb(null, rootPath+newDirectory);
        
    },
    filename: function(req, file, cb){
        
	(async () => {
		pgsqlPool.connect(function(err,conn,release) {
			if(err){
				console.log("err" + err);
				response.status(400).send(err);
			} else {
				var savePath;
		    	 var findDir = moment(new Date()).format('YYYYMMDD');
		    	 
		      	 if(req.headers && req.headers.referer.indexOf('localhost') > 0) {
		      		   savePath = "./downLoadFile/"+findDir+"/";
		           } else {
		        	   savePath = "/OWNER/uploads/sr/declare/"+findDir+"/";
		           } 
		      	 
		        //let savePath = "uploads/sr/declare"; 
		        //console.log("originalname file Name:",file.originalname);
		        let renameFile = checkFile(savePath, file.originalname,req.body.user_no);
		        
		        // console.log("Origin File Name:",file.originalname,"re name file name:",renameFile , "save directory:",savePath);

		        // console.log("File info:",req.body,"/ info:",file);
		        // console.log(">>>:",file.originalname.lastIndexOf('.'));

		        const resultFileSql = {
		        		text: `insert into own_file_upload ( file_seq,file_seq_dtl,file_name,real_file_name,real_file_path,view_file_name,
		        		       file_extension,file_class,file_size,insert_date,insert_user)
		        		       select to_char(now(), 'yymmdd') ||upper($1)|| lpad(cast(nextval('own_file_seq') as varchar), 4, '0') as file_seq,$2,$3,$4,$5,$6 as view_file_name,$7,$8,$9,now(),$10
		        		       RETURNING file_seq,view_file_name
		        		    `,
		                values: [file.originalname.substring(file.originalname.lastIndexOf('.')+1),'1',renameFile,file.originalname,savePath,file.originalname,file.originalname.substring(file.originalname.lastIndexOf('.')+1),
		                    		file.mimetype,req.body.file_size,req.body.user_no]  
		        } 
		        
				conn.query(resultFileSql, function(err,result){
					//console.log("QUERY : ",err, result.rows)
					if(err){
						console.log("err" + err);
						cb(err, null);
					}
					
					if( result ) {
						// if (typeof cb === 'function') {
						console.log("req.body.user_no:",req.body.user_no,"req.body.sr_no:",req.body.sr_no,"req.body.sr_date:",req.body.sr_date)
						if(req.body.user_no && req.body.sr_no && req.body.sr_date) {
							console.log("result.rows[0].file_seq:",result.rows[0].file_seq);
					        const updateDeclare = {
					        		text: `update shp_sr_declare set declare_file_seq = $1 where user_no=$2 and sr_no=$3 and sr_date=$4`,
					                values: [result.rows[0].file_seq,req.body.user_no,req.body.sr_no,req.body.sr_date]  
					        } 
					        
							conn.query(updateDeclare, function(err,result_update){
								console.log("result_update:",result_update);
								if(err) {
									console.log("err" + err);
									cb(err, null);
								} else {
									 req.body.returnVal = result.rows;
									 cb(null,renameFile);
								}
							});
						} else {
							 req.body.returnVal = result.rows;
						    cb(null,renameFile);
						}
					}
					
					release();
				});
			}
			
		});
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); }))
        
    }
});

const saveFile = (multer({storage:storage}).array("file"));

const checkFile = (path, fileOriName,userno) => { 
    let chkFlag = true;
    let nameCnt = 1;
    let renameFile = moment(new Date()).format('YYYYMMDDhhmmss')+"_"+userno;
    let fileName= fileOriName.substring(0, fileOriName.lastIndexOf('.'));
    let fileType= fileOriName.substring(fileOriName.lastIndexOf('.'));
    let fileNameResult = renameFile+fileType;

    chkFlag = fs.existsSync(path + renameFile);

    while(chkFlag){
        fileNameResult = renameFile + (++nameCnt) + fileType;
        chkFlag = fs.existsSync(path + fileNameResult);
    }

    return fileNameResult;
};

const getCompanyInfo = (request, response) => {

    const sql = {
    		text: `select company_id as shp_code, company_name as shp_name1,''shp_name2,substr(address,0,35) as shp_address1,substr(address,35,70) as shp_address2,
    		''shp_address3,''shp_address4,''shp_address5 from own_company where company_id =$1 limit 1`,
    		values: [request.body.id]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const getUserMessageCheck = (request, response) => {

    const sql = {
    		text: `select count(1) from own_user_notice 
					where user_no = $1 
					and message_type='W'
					and read_yn='N' limit 1`,
    		values: [request.body.user_no]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}
const getUserMessage = (request, response) => {

	  var query = "select * from (select count(*) over()/ 11 + 1 as tot_page, (row_number() over()) as num,count(*) over() total_count, floor(((row_number() over()) -1) / 10 + 1) as curpage, \n"+
	             " message_seq,read_yn,message,(now()-message_insert_date), \n"+
	             " case when days::integer > 0 and hours::integer > 0 and mins::integer > 0 then days::integer||'day '||hours::integer||'hour '||mins::integer||'min ago ' \n"+
	             " when days::integer = 0 and hours::integer > 0 and mins::integer > 0 then hours::integer||'hour '||mins::integer||'min ago ' \n"+
                 " else mins::integer||'min ago' end as the_times,read_date from ( \n"+
                 " select message_seq,message,message_insert_date,read_yn,to_char((now()-message_insert_date),'dd') as days, \n"+
                 " to_char((now()-message_insert_date),'hh24')as hours, to_char((now()-message_insert_date),'mi')as mins,to_char(read_date,'YYYY-MM-DD hh24:mi') as read_date \n"+
                 " from own_user_notice  where user_no = $1 and message_type='W' \n";
	  if(request.body.from && request.body.to) {
		  query += " and to_char(message_insert_date,'YYYYMMDD') between '"+request.body.from+"' and '"+request.body.to+"' \n";
	  }
	  if(request.body.message) {
		  query += " and message like '%"+request.body.message+"%' \n";
	  }
	  query += " order by message_insert_date desc) a order by case when read_yn='N' and read_date is null then 0 else 1 end,the_times desc";
	  if(request.body.mini) {
		  query += " limit 5 ) a";
	  } else {
		  query += ") a where a.curpage = '"+request.body.curpage+"' ";
	  }
	  
	
	
	    const sql = {
	    		text: query,
	    		values: [request.body.user_no]
	    	}
	        console.log(sql);
	        (async () => {
	        	const client = await pgsqlPool.connect();
	        	try {
	        		const res = await client.query(sql);
	        		response.status(200).json(res.rows);
	        	} finally {
	        		client.release();
	        	}
	        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
	}

const setUserReadMeassage = (request, response) => {

	var updateSql = "update own_user_notice set read_yn='Y',read_date=now() where user_no=$1";
	if(request.body.data && request.body.data.flag === 'I' && request.body.data.seq) {
		updateSql += " and message_seq = '"+request.body.data.seq+"'";
	}
	
    const sql = {
    		text: updateSql,
    		values: [request.body.user_no]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const DeclareFileDelete = (request, response) => {
	 console.log("0. file delete start........");
	 console.log("1. file key value find:",request.body);

        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		
        		const selectData = await client.query(selectFileInfo(request.body.data));
        		var path = selectData.rows[0].real_file_path;
      			var filename = selectData.rows[0].file_name
      			var filePath=path+filename;
      			
      			console.log("filePath:",filePath);
      			
        		fs.unlink(filePath,async(err)=>{
      				if(err){return  response.status(500).send('file delete error');}
      				
      				const selectDecFiles = await client.query(selectSrDeclareFile(request.body.data));
      				
      				if(selectDecFiles.rowCount > 0 ) {
      					const forUpdateDeclare = await client.query(updateDeclareFile(request.body.data));
      				}
      				const forUpdateDeclare = await client.query(deleteFiles(request.body.data.declare_file_seq));
      				return  response.status(200).send('success');
      			});
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const deleteFiles = (seq) => {

	
    const sql = {
    		text: `delete from own_file_upload where file_Seq=$1`,
    		values: [seq]
    	}
        console.log("update set:",sql);
     return sql;
}

const updateDeclareFile = (data) => {

	
    const sql = {
    		text: `update shp_sr_declare  set declare_file_seq = null where user_no=$1 and sr_no = $2 and sr_date=$3 and declare_num = $4`,
    		values: [data.user_no,data.sr_no,data.sr_date,data.declare_num]
    	}
        console.log("update set:",sql);
     return sql;
}


const selectFileInfo = (data) => {

    const sql = {
    		text: `select * from own_file_upload where file_seq=$1`,
    		values: [data.declare_file_seq]
    	}
        console.log("declare list select:",sql);
     return sql;
}

const selectSrDeclareFile = (data) => {

	
    const sql = {
    		text: `select * from shp_sr_declare where user_no=$1 and sr_no = $2 and sr_date=$3 and declare_num = $4`,
    		values: [data.user_no,data.sr_no,data.sr_date,data.declare_num]
    	}
        console.log("declare list select:",sql);
     return sql;
}


const DeclareFileView = (request, response) => {
       (async () => {
       	const client = await pgsqlPool.connect();
       	try {
       		
       		const selectData = await client.query(selectFileInfo(request.body.data));
       		var fileData = selectData.rows;
  
     	   if(fileData[0].file_seq) { 
     		  
     		    var filePath = fileData[0].real_file_path;
    			var fileName = fileData[0].file_name;
    			
   		    fs.exists(filePath, function(exists) {
   		       
   		        if(exists) {
   		            response.writeHead(200, {
   		                "Centent-Type": "application/octet-stream",
   		                "Content-Disposition" : "attachment; filename=" + fileName
   		            });
   		           
   		            fs.createReadStream(filePath + fileName).pipe(response);
   		        } else { 
   		        	return response.status(500).send('No Search Path');
   		        }
   		    })
   	   } else {
   		   return response.status(500).send('No Search Path');
   	   }
       	} finally {
       		client.release();
       	}
       })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const confitmShpBl = (request, response) => {
	console.log(request.body)
	const checkSql = {
		text: ` select * from shp_bl 
				where 1=1
				and mbl_no = $1
				and issue_date = $2 
				and user_no = $3 `,
		values: [request.body.param.mbl_no,request.body.param.issue_date, request.body.param.user_no]
	};
	(async () => {
		const client = await pgsqlPool.connect();
		try {
			const res = await client.query(checkSql);
			if(res.rows.length > 0) {
				if(res.rows[0].status_cus ==="FA") {
					response.status(200).send({code:'E',data:'이미 확정된 BL 입니다.'});
				}else if(res.rows[0].status_cus ==="SF") {
					response.status(200).send({code:'E',data:'마감 전송된 BL 입니다.'});
				}else {
					const sql = {
						text: `select public.sf_send_final($1, $2, $3, $4, 'NEW')`,
						values: [request.body.klnet_id,request.body.param.user_no,request.body.param.mbl_no,request.body.param.issue_date]
					}
					const result = await client.query(sql);

					response.status(200).send({code:'S',data:result.rows[0].sf_send_final});
				}
				
			}else {
				response.status(200).send({code:'E',data:'알 수 없는 BL 입니다. BL : '+request.body.param.mbl_no +' DATE : ' +request.body.param.issue_date})
			}
			// response.status(200).json(res.rows);
		} finally {
			client.release();
		}
	})().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }));









    
    //     console.log(sql);
    //     (async () => {
    //     	const client = await pgsqlPool.connect();
    //     	try {
    //     		
    //     	//	console.log("res:",res.rows[0].sf_send_final);
    //     		
    //     	} finally {
    //     		client.release();
    //     	}
    //     })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}


const setUserSrParkBl = (request, response) => {
	
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		
        		var srList  = request.body.data;

        		if(srList.part_bl && srList.part_bl === 'Y') {

        			var lastNo = srList.sr_no.substring(srList.sr_no.length-1);

        			if(lastNo === 'Z') {
        				srList.sr_no_new = srList.sr_no+"A";
        			} else {
        				const getAlpSeq = await client.query(getAlphabetSeq(lastNo));
        				srList.sr_no_new = srList.sr_no.substring(0,srList.sr_no.length-1)+getAlpSeq.rows[0].returnval;
        			}
        		} else {
        			srList.sr_no_new = srList.sr_no+"A";
        		}
        		srList.part_bl = 'Y';

            	const getSRDup = await client.query(getSrDupCheck(srList.sr_no_new));
        			
        			if(getSRDup.rowCount > 0) {
        				const getSRDup = await client.query(getSrMaxSR(srList.sr_no_new.substring(0,srList.sr_no_new.length-1)));
                        var sr_no = getSRDup.rows[0].sr_no;
            			var lastNo = sr_no.substring(sr_no.length-1);
            			if(lastNo === 'Z') {
            				srList.sr_no_new = sr_no+"A";
            			} else {
            				const getAlpSeq = await client.query(getAlphabetSeq(lastNo));
            				srList.sr_no_new = sr_no.substring(0,sr_no.length-1)+getAlpSeq.rows[0].returnval;
            			}
        			} 
					srList.sr_date_new = moment(new Date()).format('YYYYMMDD');
					srList.status_cus = 'NO';
        			// Header Data insert
        			const insertShpSr = await client.query(insertSrData(srList));
        			// Detail Data insert
        			if(insertShpSr.rowCount > 0) {

						
						const insertData = await client.query(insertBkgPart(srList));
						const insertMarkData = await client.query(insertMarkPart(srList));
						const insertGoodsData = await client.query(insertGoodsPart(srList));

						const insertCntrData = await  client.query(insertCntrPart(srList));
						const insertDeclarData = await client.query(insertDcrSqlPart(srList));	
						const insertCntrSqlSpc = await client.query(insertCntrSpcPart(srList));
						// let bkgList = request.body.data.bkgList;
        				// let markList = request.body.data.mark_desc;
        				// let goodList = request.body.data.goods_desc;
        				// let cntrList = request.body.data.cntrlist;
        				// let declareList = request.body.data.declarelist;
						// if(bkgList) {
        				// 	//const deleteQuery = await client.query(deleteBkgNo(request));
        				// 	await Promise.all(
        				// 			bkgList.map( async (bkg, key)=>{
        				// 			bkg.bkg_seq = key+1;
        				// 			const insertData = await client.query(insertBkgPart(request,bkg));
        				// 		})
        				// 	);
        				// }
        				
        				//cargo check
        				// if(request.body.data.cargo_hs_code ||request.body.data.cargo_pack_qty || request.body.data.cargo_pack_type || request.body.data.cargo_total_colume || request.body.data.cargp_total_weight ) {
        				// 	const cargo = await client.query(insertCargoData(request));
        				// }
						if(srList.cargo_hs_code || srList.cargo_pack_qty || srList.cargo_pack_type || srList.cargo_total_colume || srList.cargp_total_weight ) {
        					const cargo = await client.query(insertCargoDataPart(srList));
        				}

						
        		 		// if(markList) {
        				// 	//const deleteQuery = await client.query(deleteMark(request));
        				// 	const markData = markList.split('\n');
        				// 	var list={};
        				// 	var count = markData.length;
        				// 	var j=0;
        				// 	var seq=1;
        				// 		for(var i=0 ; i<markData.length ;i++) {
        			    //             	if(j < 10 ) {
        			    // 					list = { ...list,['mark_desc'+(j+1)]:markData[i],'mark_seq':seq};
        			    // 					count --;
        			    // 				} 
        			    //             	if( (j+1) % 10 === 0 || count === 0) {
        			    // 					//console.log("insert &&  init seq:","//:",request.body.data.cargo_mark_bookmark_seq);
        			    // 					list.cargo_mark_bookmark_seq = request.body.data.cargo_mark_bookmark_seq;
        			    // 					const insertData = await client.query(insertMark(request.body.data,list));
        			    // 					seq ++;
        			    // 					j = 0;
        			    // 					list = {};
        			    //             	} else {
        			    //             		j++; 
        			    //             	}
        				// 		}

        				// }
        				// if(goodList) {
        				// 	//const deleteQuery = await client.query(deleteGoods(request));
        				// 	const goodsData = goodList.split('\n');
        				// 	var list={};
        				// 	var count = goodsData.length;
        				// 	var j=0;
        				// 	var seq=1;
        				// 		for(var i=0 ; i<goodsData.length ;i++) {
        			    //             	if(j < 5 ) {
        			    // 					list = { ...list,['goods_desc'+(j+1)]:goodsData[i],'goods_seq':seq};
        			    // 					count --;
        			    // 				} 
        			    //             	if( (j+1) % 5 === 0 || count === 0) {
        			    // 					//console.log("insert &&  init seq:",seq);
        			    // 					list.cargo_goods_bookmark_seq = request.body.data.cargo_goods_bookmark_seq;
        			    // 					const insertData = await client.query(insertGoods(request.body.data,list));
        			    // 					seq ++;
        			    // 					j = 0;
        			    // 					list = {};
        			    //             	} else {
        			    //             		j++; 
        			    //             	}
        				// 		}
        				// }

        				// if(cntrList && cntrList.length>0){
        				// 	//const deleteCntr = await client.query(deleteUserCntr(request));
        				// 	//const deleteCntrSpc = await client.query(deleteUserCntrSpc(request));
        				// 	// 4. map 을 async 처리할 경우
        				// 	await Promise.all(
        				// 			cntrList.map( async (cntr, key)=>{
        				// 			// Key 입력하기
        				// 			cntr.cntr_seq = key+1;
        				// 			let insertCntrSql = await insertCntr(request.body.data, cntr);
        				// 			const cntrInsert = await client.query(insertCntrSql);
        				// 			if(cntr.special_imdg || cntr.special_undg) {
        				// 				const insertCntrSqlSpc = await insertCntrSpc(request.body.data, cntr);
        				// 				await client.query(insertCntrSqlSpc);
        				// 			}
        				// 		})
        				// 	);
        				// }
//         				if(declareList && declareList.length>0){
//         					//const deleteDecr = await client.query(deleteUserDecr(request));
//         					//var deletefileList = deleteDecr.rows;

        					
//         					// 4. map 을 async 처리할 경우
//         					await Promise.all(
//         							declareList.map( async (dcr, key)=>{
//         							// Key 입력하기
//         							dcr.declare_seq = key+1;
//         							dcr.declare_file_seq = '';
//         							const dcrInsert = await client.query(insertDcrSql(request, dcr));				
//         							//const itemfind = deletefileList.findIndex((item) => {return item.declare_file_seq === dcr.declare_file_seq});
//         							//deletefileList.splice(itemfind,1);
//         						})
//         					);
        					
//         					// 5. 파일 삭제
// /*        					if(deletefileList.length > 0) {
//         						console.log("file delete count:",deletefileList.length);
//         						await Promise.all(
//         								deletefileList.map( async(data) => {
        									
//         									const selectData = await client.query(selectFileInfo(data));
        									
//         					        		var path = selectData.rows[0].real_file_path;
//         					      			var filename = selectData.rows[0].file_name
//         					      			var filePath=path+filename;
        					      			
//         					      			console.log("filePath:",filePath);
        					      			
//         					        		fs.unlink(filePath,async(err)=>{
//         					      				if(err){ console.log(">>>>>>error")}
//         					      				await client.query(deleteFiles(data.declare_file_seq));
//         					      			});
//         								})
//         							);
//         					}*/
//         				}
						srList.sr_no = srList.sr_no_new;
						srList.sr_date = srList.sr_date_new
        		 		response.status(200).send({code:'S',data:srList});
        			}else {
						response.status(200).send({code:'E',data:'SPLIT 할 SR문서가 존재하지 않습니다. SR Number: '+srList.sr_no});
					}
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err);response.status(200).send({code:'E',data:err})}))
}
const insertSrData = (data) => {
	console.log('data=============',data)
	// const sql = {
	// 	text: `
	// 		insert into shp_sr (
	// 			user_no,sr_no,sr_date,status_cus,insert_date,part_bl,shp_code,shp_name1,shp_name2,shp_user_name,
	// 			shp_user_dept,shp_user_tel,shp_user_email,shp_user_fax,shp_address1,shp_address2,shp_address3,shp_address4,shp_address5,cons_code,
	// 			cons_name1,cons_name2,cons_address1,cons_address2,cons_address3,cons_address4,cons_address5,noti_name1,noti_name2,noti_address1,
	// 			noti_address2,noti_address3,noti_address4,noti_address5,line_code,line_payment_type,line_payment_area_name,sch_vessel_name,sch_vessel_voyage,sch_barge_onboard_date,
	// 			sch_pol,sch_pod,sch_pol_name,sch_pod_name,sch_fdp,sch_fdp_name,sch_por,sch_por_name,sch_pld,sch_pld_name,
	// 			sch_bl_issue_name,res_bkg_no,sc_no,trans_service_code,bl_type,hbl_yn,sch_srd,sch_eta,hs_code,consignee_bookmark_seq,
	// 			notify_bookmark_seq,schedule_bookmark_seq,shipper_bookmark_seq,other_bookmark_seq,cargo_bookmark_seq,bookmark_seq,c_shp_code,c_shp_name1,c_shp_name2,c_shp_user_name,
	// 			c_shp_user_tel,c_shp_country_code,c_shp_address1,c_shp_address2,c_shp_address3,c_shp_address4,c_shp_address5,c_cons_code,c_cons_name1,c_cons_name2,
	// 			c_cons_user_name,c_cons_user_tel,c_cons_country_code,c_cons_address1,c_cons_address2,c_cons_address3,c_cons_address4,c_cons_address5,c_noti_code,c_noti_name1,
	// 			c_noti_name2,c_noti_user_name,c_noti_user_tel,c_noti_country_code,c_noti_address1,c_noti_address2,c_noti_address3,c_noti_address4,c_noti_address5)
	// 			select $1,$2,to_char(now(),'YYYYMMDD'),'S0',now(),$3,$4,$5,$6,$7,
	// 					$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
	// 					$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,
	// 					$28,$29,$30,$31,'WDFC',$32,$33,$34,$35,$36,
	// 					$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,
	// 					$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,
	// 					$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,
	// 					$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,
	// 					$77,$78,$79,$80,$81,$82,$83,$84,$85,$86,
	// 					$87,$88,$89,$90,$91,$92,$93,$94,$95`,
	// 		values: [data.user_no,data.sr_no,data.part_bl,data.shp_code,data.shp_name1,data.shp_name2,data.shp_user_name,
	// 					data.shp_user_dept,data.shp_user_tel,data.shp_user_email,data.shp_user_fax,data.shp_address1,data.shp_address2,data.shp_address3,data.shp_address4,data.shp_address5,data.cons_code,
	// 					data.cons_name1,data.cons_name2,data.cons_address1,data.cons_address2,data.cons_address3,data.cons_address4,data.cons_address5,data.noti_name1,data.noti_name2,data.noti_address1,
	// 					data.noti_address2,data.noti_address3,data.noti_address4,data.noti_address5,data.line_payment_type,data.line_payment_area_name,data.sch_vessel_name,data.sch_vessel_voyage,data.sch_barge_onboard_date,
	// 					data.sch_pol,data.sch_pod,data.sch_pol_name,data.sch_pod_name,data.sch_fdp,data.sch_fdp_name,data.sch_por,data.sch_por_name,data.sch_pld,data.sch_pld_name,
	// 					data.sch_bl_issue_name,data.res_bkg_no,data.sc_no,data.trans_service_code,data.bl_type,data.hbl_yn,data.sch_srd,data.sch_eta,data.hs_code,data.consignee_bookmark_seq,
	// 					data.notify_bookmark_seq,data.schedule_bookmark_seq,data.shipper_bookmark_seq,data.other_bookmark_seq,data.cargo_bookmark_seq,data.bookmark_seq,data.c_shp_code,data.c_shp_name1,data.c_shp_name2,data.c_shp_user_name,
	// 					data.c_shp_user_tel,data.c_shp_country_code,data.c_shp_address1,data.c_shp_address2,data.c_shp_address3,data.c_shp_address4,data.c_shp_address5,data.c_cons_code,data.c_cons_name1,data.c_cons_name2,
	// 					data.c_cons_user_name,data.c_cons_user_tel,data.c_cons_country_code,data.c_cons_address1,data.c_cons_address2,data.c_cons_address3,data.c_cons_address4,data.c_cons_address5,data.c_noti_code,data.c_noti_name1,
	// 					data.c_noti_name2,data.c_noti_user_name,data.c_noti_user_tel,data.c_noti_country_code,data.c_noti_address1,data.c_noti_address2,data.c_noti_address3,data.c_noti_address4,data.c_noti_address5]
	// 	}
	const sql = {
		text: ` insert into shp_sr (
		user_no, sr_no, sr_date, status_cus, insert_date, part_bl, shp_code, shp_name1, shp_name2, shp_user_name,
		shp_user_dept,shp_user_tel,shp_user_email,shp_user_fax,shp_address1,shp_address2,shp_address3,shp_address4,shp_address5,cons_code,
		cons_name1,cons_name2,cons_address1,cons_address2,cons_address3,cons_address4,cons_address5,noti_name1,noti_name2,noti_address1,
		noti_address2,noti_address3,noti_address4,noti_address5,line_code,line_payment_type,line_payment_area_name,sch_vessel_name,sch_vessel_voyage,sch_barge_onboard_date,
		sch_pol,sch_pod,sch_pol_name,sch_pod_name,sch_fdp,sch_fdp_name,sch_por,sch_por_name,sch_pld,sch_pld_name,
		sch_bl_issue_name,res_bkg_no,sc_no,trans_service_code,bl_type,hbl_yn,sch_srd,sch_eta,hs_code,consignee_bookmark_seq,
		notify_bookmark_seq,schedule_bookmark_seq,shipper_bookmark_seq,other_bookmark_seq,cargo_bookmark_seq,bookmark_seq,c_shp_code,c_shp_name1,c_shp_name2,c_shp_user_name,
		c_shp_user_tel,c_shp_country_code,c_shp_address1,c_shp_address2,c_shp_address3,c_shp_address4,c_shp_address5,c_cons_code,c_cons_name1,c_cons_name2,
		c_cons_user_name,c_cons_user_tel,c_cons_country_code,c_cons_address1,c_cons_address2,c_cons_address3,c_cons_address4,c_cons_address5,c_noti_code,c_noti_name1,
		c_noti_name2,c_noti_user_name,c_noti_user_tel,c_noti_country_code,c_noti_address1,c_noti_address2,c_noti_address3,c_noti_address4,c_noti_address5)
		select 
		user_no , $1 as sr_no , to_char(now(),'YYYYMMDD') as sr_date , 'NO', now(), $2 as part_bl , shp_code, shp_name1, shp_name2, shp_user_name, 
		shp_user_dept, shp_user_tel, shp_user_email, shp_user_fax, shp_address1, shp_address2, shp_address3, shp_address4, shp_address5, cons_code,
		cons_name1, cons_name2, cons_address1, cons_address2, cons_address3, cons_address4, cons_address5, noti_name1, noti_name2, noti_address1,
		noti_address2, noti_address3, noti_address4, noti_address5, line_code, line_payment_type, line_payment_area_name, sch_vessel_name, sch_vessel_voyage, sch_barge_onboard_date,
		sch_pol,sch_pod,sch_pol_name,sch_pod_name,sch_fdp,sch_fdp_name,sch_por,sch_por_name,sch_pld,sch_pld_name,
		sch_bl_issue_name,res_bkg_no,sc_no,trans_service_code,bl_type,hbl_yn,sch_srd,sch_eta,hs_code,consignee_bookmark_seq,
		notify_bookmark_seq,schedule_bookmark_seq,shipper_bookmark_seq,other_bookmark_seq,cargo_bookmark_seq,bookmark_seq,c_shp_code,c_shp_name1,c_shp_name2,c_shp_user_name,
		c_shp_user_tel,c_shp_country_code,c_shp_address1,c_shp_address2,c_shp_address3,c_shp_address4,c_shp_address5,c_cons_code,c_cons_name1,c_cons_name2,
		c_cons_user_name,c_cons_user_tel,c_cons_country_code,c_cons_address1,c_cons_address2,c_cons_address3,c_cons_address4,c_cons_address5,c_noti_code,c_noti_name1,
		c_noti_name2,c_noti_user_name,c_noti_user_tel,c_noti_country_code,c_noti_address1,c_noti_address2,c_noti_address3,c_noti_address4,c_noti_address5
		from shp_sr 
		where sr_no = $3
		and sr_date = $4
		and user_no = $5`,
		values:[data.sr_no_new, data.part_bl,data.sr_no, data.sr_date, data.user_no]
	}
	console.log("insert sgp sr:",sql);
	return sql;
}
const getSrDupCheck = (srNo) => {

    const sql = {
    		text: `select sr_no from shp_sr where sr_no = $1 `,
    		values: [srNo]
    	}
        console.log(sql);
       return sql;
}

const getSrMaxSR = (srNo) => {

/*    const sql = {
    		text: `select max(sr_no) as sr_no from shp_sr where sr_no like  $1% `,
    		values: [srNo]
    	}*/
     //   console.log(sql);
       return "select max(sr_no) as sr_no from shp_sr where sr_no like '"+srNo+"%'";
}

const getAlphabetSeq = (data) => {

    const sql = {
    		text: `select chr(ascii($1)+1) as returnVal`,
    		values: [data]
    	}
        console.log(sql);
       return sql;
}



const setUserSrBkgInit = (request, response) => {

	 (async () => {
	 	const client = await pgsqlPool.connect();
	 	try {
	 		const res_confirm_booking = await client.query(getUserBookingSql(request));

	 		if(res_confirm_booking.rowCount > 0) {

	 			const res = await client.query(setUserSrBkgNew(request,res_confirm_booking.rows[0]));
	 			const insertBkg = await client.query(insertBkgConfirm(res.rows[0]));
	 			const vsl_type = await client.query(vslTypeSelect(res.rows[0].sch_vessel_name));
		 		//console.log("data:",res.rows[0].sch_srd);
	    		    	
		 		response.status(200).json({...res.rows[0],sch_etd:res_confirm_booking.rows[0].sch_etd,
		 								sch_srd:res_confirm_booking.rows[0].sch_etd,
		 								bkglist:[{value:res.rows[0].res_bkg_no,'label':res.rows[0].res_bkg_no}],
		 								bk_link:'Y',vsl_type:vsl_type.rowCount>0?vsl_type.rows[0].vsl_type:null});
	 		} else {
	 			response.status(400).json({});
	 		}
		
	 	} finally {
	 		client.release();
	 	}
	 })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const insertBkgConfirm = (bkg) => {
	const sql = {
			text: ` insert into shp_sr_bkg (user_no,sr_no,sr_date,bkg_seq,res_bkg_no) values ($1,$2,$3,$4,$5)  ` ,
			values: [bkg.user_no, bkg.sr_no, bkg.sr_date,'1',bkg.res_bkg_no]
		}
    console.log("insertBkgConfirm Sql:",sql);
    return sql;
}

const vslTypeSelect = ( vslName) => {
	const sql = {
			text: ` select vsl_type from own_line_code_vessel where line_code = 'WDFC' and vessel_name = trim($1) limit 1 ` ,
			values: [vslName]
		}
    console.log("vslTypeSelect Sql:",sql);
    return sql;
}

const setUserSrBkgNew = (request,bkg)=>{

	let query = "insert into shp_sr(user_no,sr_no,sr_date,owner_no,insert_date,status_cus,line_code,sch_srd,res_bkg_no,sc_no, \n";
		query += "sch_vessel_name,sch_vessel_voyage,sch_pol,sch_pol_name,sch_pod,sch_pod_name,sch_por,sch_por_name,sch_pld,sch_pld_name, \n";
	query += " sch_eta,sch_fdp,sch_fdp_name,shp_name1,shp_name2,shp_address1,shp_address2,shp_address3,shp_address4, \n";
	query += " shp_address5,cons_name1,cons_name2,cons_address1,cons_address2,cons_address3,cons_address4,cons_address5,line_name1,line_name2, \n";
	query += " line_address1,line_address2,line_address3,line_address4,line_address5,line_payment_type,trans_service_code, klnet_id) \n";
	query += " SELECT $1,(public.sf_get_work_ids(a.klnet_id, 'SR')) as sr_no, \n";
	query += " to_char(now(),'YYYYMMDD') as sr_date, $2, now() insert_date,'NO','WDFC' as line_code,substring($3,1,8),$4, \n";
	query += " $5,$6,$7,$8,$9,$10,$11,$12,$13,$14, \n";
	query += " $15,substring($16,1,8),$17,$18,$19,$20,$21,$22,$23, \n";
	query += " $24,$25,$26,$27,$28,$29,$30,$31,$32,$33, \n";
	query += " $34,$35,$36,$37,$38,$39,$40,$41, a.klnet_id \n";
	query += " FROM own_company_identify a \n";
	query += " WHERE a.work_code = 'SR'  \n";
	query += " AND a.klnet_id = $42 limit 1  \n";
	query += " RETURNING *  \n";

	const sql = {
			text:query,
			values: [bkg.user_no,bkg.owner_no,bkg.sch_etd,bkg.res_bkg_no,bkg.sc_no,
				bkg.sch_vessel_name,bkg.sch_vessel_voyage,bkg.sch_pol,bkg.sch_pol_name,bkg.sch_pod,bkg.sch_pod_name,bkg.sch_por,bkg.sch_por_name,bkg.sch_pld,bkg.sch_pld_name,
				bkg.sch_eta,bkg.sch_fdp,bkg.sch_fdp_name,bkg.shp_name1,bkg.shp_name2,bkg.shp_address1,bkg.shp_address2,bkg.shp_address3,bkg.shp_address4,
				bkg.shp_address5,bkg.cons_name1,bkg.cons_name2,bkg.cons_address1,bkg.cons_address2,bkg.cons_address3,bkg.cons_address4,bkg.cons_address5,bkg.line_name1,bkg.line_name2,
				bkg.line_address1,bkg.line_address2,bkg.line_address3,bkg.line_address4,bkg.line_address5,bkg.shp_payment_type,bkg.trans_service_code,request.body.klnet_id]
		}
	console.log(sql);
	return sql;
}


const deleteSrList = (request, response) => {
	
	const selectSql ={
		text: `update shp_sr set status_cud='D', update_date=now(), update_user=$1 where user_no=$2 and sr_no=$3 and sr_date=$4 `,
			values: [request.body.user_no,request.body.user_no,request.body.data.sr_no,request.body.data.sr_date]
	};

	console.log("delete SR:",selectSql);

	 (async () => {
	 	const client = await pgsqlPool.connect();
	 	try {
	 		const res = await client.query(selectSql);			
	 		response.status(200).json(res);
	 			 		
	 	} finally {
	 		client.release();
	 	}
	 })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))

/*	const sql = {
			text: `delete from shp_sr where user_no=$1 and sr_no=$2 and sr_date=$3 `,
			values: [request.body.user_no,request.body.data.sr_no,request.body.data.sr_date]
		}
	console.log("sql:",sql);
	 (async () => {
	 	const client = await pgsqlPool.connect();
	 	try {
	 		const res = await client.query(sql);
	 		const deleteBkg = await client.query(deleteBkgNo(request));
	 		const deleteCargo = await client.query(deleteSrCargo(request));
	 		const deleteCargoMarks = await client.query(deleteMark(request));
	 		const deleteCargoGoods = await client.query(deleteGoods(request));
	 		const deleteCntr = await client.query(deleteUserCntr(request));
	 		const deleteDeclare = await client.query(deleteUserDecr(request));
	 		
	 		response.status(200).json(res.rows);
	 	} finally {
	 		client.release();
	 	}
	 })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))*/
}

const deleteSrCargo = ( request) => {
	const sql = {
			text: ` delete from shp_sr_cargo where user_no = $1 and sr_no=$2 and sr_date=$3 ` ,
			values: [request.body.user_no,request.body.data.sr_no,request.body.data.sr_date]
		}
    console.log("deleteSrCargo Sql:",sql);
    return sql;
}


// 위동전용. 부킹전송시 이용약관 체크 이력
const insertServiceTermsHistory = (request, response) => {
    const sql = {
		text: ` INSERT INTO public.shp_service_terms_history 
(history_seq, klnet_id, user_no, dv_cd, status_cus, send_no, line_code, insert_date) 
VALUES(to_char(now(), 'YYYYMMDDHH24MISS') || lpad(cast(nextval('service_terms_history_seq') as varchar), 4, '0') 
,$1, $2, $3, $4, $5, $6, now()) `,
		values: [
			request.body.klnet_id,
			request.body.user_no,
			request.body.dv_cd,
			request.body.status_cus,
			request.body.send_no,
			request.body.line_code,
		]
	}
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

const selectLineWorkOriginator = (request, response) => {

    const sql = {
    		text: ` select line_code, work_code, originator, recipient
 from own_line_work_originator
 where work_code = $1 `,
    		values: [request.body.work_code]
    	}
        console.log(sql);
        (async () => {
        	const client = await pgsqlPool.connect();
        	try {
        		const res = await client.query(sql);
        		response.status(200).json(res.rows);
        	} finally {
        		client.release();
        	}
        })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err); }))
}

const selectFdpCodePortList = (request, response) => {
	let query = ` select port_code as value,
 port_code as label,
 port_name as port_kr_name,
 port_ename as port_name,
 port_code
 from own_code_port
 where 1=1 `
 if( request.body.params.port_code ) query += ` and port_code like upper('%'|| $1 ||'%')`
 query += ` limit 10 `;

    const sql = {
		text: query,
	}
	if( request.body.params.port_code )
		sql['values']= [request.body.params.port_code]
    console.log(sql);
    (async () => {
    	const client = await pgsqlPool.connect();
    	try {
    		const res = await client.query(sql);
    		response.status(200).json(res.rows);
    	} finally {
    		client.release();
    	}
    })().catch(err => setImmediate(() => {console.log("[ERROR]",err); response.status(400).json(err);}))
}

module.exports = {
	DeclareFileView,
	DeclareFileDelete,
	getScheduleCal,
	getWdSchList,
	getShipSearch,
	selectBookingDocumentBookmark,
	insertBookingDocumentBookmark,
	updateBookingDocumentBookmark,
	deleteBookingDocumentBookmark,
	selectDocumentOfBooking,
	updateDocumentOfBooking,
	selectBookingOtherBookmark,
	insertBookingOtherBookmark,
	updateBookingOtherBookmark,
	deleteBookingOtherBookmark,
	selectLineCodeIncoterms,
	selectBooking,
	selectBookingList,
	selectBookingBookmarkOfBooking,
	insertBooking,
	updateBooking,
	deleteBooking,
	getUserBookingInfo,
	setUserShpBookmark,
	getUserShpBookmark,
	setUserConsBookmark,
	getUserConsBookmark,
	setUserNotiBookmark,
	getUserNotiBookmark,
	updateOtherofBooking,
	selectBookingScheduleBookmark,
	insertBookingScheduleBookmark,
	updateBookingScheduleBookmark,
	deleteBookingScheduleBookmark,
	selectScheduleOfBooking,
	updateScheduleBookmarkOfBooking,
	updateScheduleOfBooking,
	selectLinePort,
	selectLineCodePort,
	selectBookingShipperBookmark,
	insertBookingShipperBookmark,
	updateBookingShipperBookmark,
	deleteBookingShipperBookmark,
	getUserSrDataList,
	getLinePortCode,
	getUserMarkBookmark,
	getUserDesBookmark,
	getUserCargoBookmark,
	setUserCargoBookmark,
	selectBookingCargoBookmarkRelation,
	deleteBoookingCargoGoodsBookmark,
	updateBoookingCargoGoodsBookmark,
	insertBookingCargoGoodsBookmark,
	selectBookingCargoGoodsBookmark,
	updateCargoGoods,
	selectCargoGoodsOfBooking,
	insertCargoOfBooking,
	selectLineCodeCargoPackType,
	selectLineCodeCargoType,
	updateCargoOfBooking,
	selectCargoOfBooking,
	deleteBookingCargoBookmark,
	updateBookingCargoBookmark,
	insertBookingCargoBookmark,
	selectBookingCargoBookmark,
	updateTransportOfBooking,
	selectTransportOfBooking,
	deleteBookingTransportBookmark,
	selectBookingTransportBookmark,
	insertBookingTransportBookmark,
	updateBookingTransportBookmark,
	updateLineOfBooking,
	selectLineOfBooking,
	deleteBookingLineBookmark,	
	insertBookingLineBookmark,
	updateBookingLineBookmark,
	selectBookingLineBookmark,
	updateConsigneeOfBooking,
	selectBookingConsigneeBookmark,
	insertBookingConsigneeBookmark,
	updateBookingConsigneeBookmark,
	deleteBookingConsigneeBookmark,
	selectConsigneeOfBooking,
	updateForwarderOfBooking,
	getShipperOfBooking,
	updateShipperOfBooking,
	selectBookingForwarderBookmark,
	insertBookingForwarderBookmark,
	updateBookingForwarderBookmark,
	deleteBookingForwarderBookmark,
	selectForwarderOfBooking,
	getUserCargoRelation,
	setUserShpBookmarkDel,
	setUserConsBookmarkDel,
	setUserNotiBookmarkDel,
	setUserCargoBookmarkDel,
	setUserMarkBookmarkDel,
	setUserGoodsBookmarkDel,
	setUserMarkBookmark,
	setUserGoodsBookmark,
	selectDashboard,
	selectGroupBkg,
	selectBookingContainerBookmark,
	selectBookingSpecialBookmark,
	selectContainerOfBooking,
	insertBoookingContainerBookmark,
	updateBoookingContainerBookmark,
	deleteBookingContainerBookmark,
	insertBookingSpecialBookmark,
	updateBookingSpecialBookmark,
	deleteBookingSpecialBookmark,
	selectLineCodeVesselPickup,
	selectLineCodeCntrSztp,
	selectBookingContainerSpecialBookmarkRelation,
	selectContainerSpecialOfBooking,
	saveContainerOfBooking,
	getUserOtherBookmark,
	setUserOthersBookmark,
	getUserSrDocInit,
	setUserSRDataList,
	setUserCargoData,
	setUserCntrData,
	getUserCntrData,
	getUserCntrCount,	
	getUserCntrBookmark,
	setUserCntrBookmark,
	setSendDocSr,
	getUserLineBookmark,
	setUserLineBookmark,
	setUserLineBookmarkDel,
	selectLineCodeServiceType,
	setUserSchBookmark,
	getUserSchBookmark,
	setUserSchBookmarkDel,
	sendBooking,
	selectShpConfirm,
	selectShpConfirmList,
	selectShpConfirmCargo,
	selectShpConfirmCargoGoods,
	selectShpConfirmCntr,
	selectShpConfirmCntrSpecial,
	selectShpBl,
	selectShpBlCargo,
	selectShpBlCntr,
	updateAllBooking,
	selectDupCheckBkgNo,
	getUserCntrWeightInfo,
	setUserCntrBookmarkDel,
	getUserNewSrDupCheck,
	selectSrList,
	selectBlList,
	getUserDeclareBookmark,
	setUserDeclareBookmark,
	setUserDeclareBookmarkDel,
	setUserOtherBookmarkDel,
	selectBookingBkgBookmark,
	insertBookingBkgBookmark,
	updateBookingBkgBookmark,
	deleteBookingBkgBookmark,
	selectBookingBkgBookmarkRelation,
	insertBookingBkgBookmarkRelation,
	updateBookingBkgBookmarkRelation,
	deleteBookingBkgBookmarkRelation,
	saveBookingBkgBookmark,
	deleteBookmark,
    getUserTitleBookmark,
	setUserTitleBookmark,
	setUserTitleBookmarkDel,
	getSRbookmarkRelation,
	setUserSrBookmarkDataList,
	getHsCodeGroupInfo,
	getHsCodeItemInfo,
	selectLineCodeVesselName,
	getLineRoute,
	selectWeidongDangerCheck,
	getUserBookmark,
	selectForwarderCompanyListByUser,
	selectShipperCompanyListByUser,
	declareSaveFile,
	getCompanyInfo,
	getUserMessageCheck,
	getUserMessage,
	setUserReadMeassage,
	confitmShpBl,
	setUserSrParkBl,
	setUserSrBkgInit,
	deleteSrList,
	insertServiceTermsHistory,
	selectLineWorkOriginator,
	selectLineCodeVesselPortCfs,
	selectLineCodeSztpPickup,
	selectFdpCodePortList,
}



//SR 삭제부분 status_cud 'D' 반영

//SR 스플릿 부분 수정