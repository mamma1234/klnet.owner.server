'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
const multer = require('multer');
const fs = require('fs');
// const sUser = require('../../models/sessionUser');

  const getStatInfo = (request, response) => {

	    const sql = {
          text: "select case when b.stat_month ='01' then 'JAN' \n"+
                "            when b.stat_month ='02' then 'FEB' \n"+
                "            when b.stat_month ='03' then 'MAR' \n"+
                "            when b.stat_month ='04' then 'APR' \n"+
                "            when b.stat_month ='05' then 'MAY' \n"+
                "            when b.stat_month ='06' then 'JUN' \n"+
                "            when b.stat_month ='07' then 'JUL' \n"+
                "            when b.stat_month ='08' then 'AUG' \n"+
                "            when b.stat_month ='09' then 'SEP' \n"+
                "            when b.stat_month ='10' then 'OCT' \n"+
                "            when b.stat_month ='11' then 'NOV' \n"+
                "           else 'DEC' end as stat_month, \n"+
                " b.carrier,coalesce(sum(a.tot_bl_qty),0)as tot_bl_qty from own_stat_user a \n"+
                " right outer join ( \n"+
                " select  * from ( \n"+
                "    select distinct carrier,0 as tot_bl_qty from own_stat_user where stat_year= to_char(now(),'YYYY') and user_no= $1) a \n"+
                "    ,(select '01' as stat_month  union all \n"+
                "      select '02' as stat_month union all \n"+
                " 	   select '03' as stat_month union all \n"+
                "      select '04' as stat_month union all \n"+
                "      select '05' as stat_month union all \n"+
                "      select '06' as stat_month union all \n"+
                "      select '07' as stat_month union all \n"+
                "      select '08' as stat_month union all \n"+
                "      select '09' as stat_month union all \n"+
                "      select '10' as stat_month union all \n"+
                "      select '11' as stat_month union all \n"+
                "     select '12' as stat_month )b)b \n"+
                "  on a.carrier = b.carrier \n"+
                "   and a.stat_month = b.stat_month \n"+
                "   and a.stat_year = to_char(now(),'YYYY') \n"+
                "   and a.user_no = $1 \n"+
                "   group by b.stat_month,b.carrier \n"+
                " order by b.stat_month; \n",
                values: [request.localUser.userno],
	        // rowMode: 'array',
        }
        console.log( sql )
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							
							response.status(200).json(result.rows);
						} else {
							// response.status(200).json([]);
							
							response.status(200).json({error:"No Found Data"});
						}
					}
				});

			}


	    });
  }
  const getDemdetStatInfo = (request, response) => {

	    const sql = {
        text: "select sum(case when dem_date is not null then \n"+
        	  "     case when to_char(to_timestamp(dem_date,'YYYYMMDD')+'-3 days','YYYYMMDD') = to_char(now(),'YYYYMMDD') then 1 else 0 end \n"+
        	  "else 0 end) as within_dem, \n"+
        	  "sum(case when dem_date is not null then \n"+
        	  "		case when to_date(dem_date,'YYYYMMDD') < now() then 1 else 0 end \n"+
        	  "else 0 end) as occuring_dem, \n"+
        	  "sum(case when ret_date is not null then \n"+
        	  "     case when to_char(to_timestamp(ret_date,'YYYYMMDD')+'-3 days','YYYYMMDD') = to_char(now(),'YYYYMMDD') then 1 else 0 end \n"+
        	  "else 0 end) as within_det, \n"+
        	  "sum(case when ret_date is not null then \n"+
        	  "		case when to_date(dem_date,'YYYYMMDD') < now() then 1 else 0 end \n"+
        	  "else 0 end) as occuring_det, \n"+
        	  "sum(case when ret_date is not null then \n"+
        	  "     case when to_char(to_timestamp(ret_date,'YYYYMMDD')+'-3 days','YYYYMMDD') = to_char(now(),'YYYYMMDD') then 1 else 0 end \n"+
        	  "else 0 end) as within_det, \n"+
        	  "sum(case when (osc_date is not null and trim(osc_date) != '') then \n"+
        	  "		case when to_date(osc_date,'YYYYMMDD') < now() then 1 else 0 end \n"+
        	  "else 0 end) as occuring_osc \n"+
        	  "from own_dem_det \n"+
        	  "where user_no=$1 \n"+
        	  " and to_char(insert_date,'MM') = to_char(now(),'MM') \n"+
        	  " and ie_Type= $2 \n",
              values: [request.localUser.userno,request.body.ietype],
	          rowMode: 'array',
      }
      console.log( sql )
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							
							response.status(200).json(result.rows);
						} else {
							
							response.status(200).json([]);
						}
					}
				});

			}


	    });
}

  const getImportStatInfo = (request, response) => {

	    const sql = {
      text: " select case when a.stat_month ='01' then 'JAN' when a.stat_month ='02' then 'FEB' \n"+
      		"        when a.stat_month ='03' then 'MAR' when a.stat_month ='04' then 'APR' \n"+
      		"        when a.stat_month ='05' then 'MAY' when a.stat_month ='06' then 'JUN' \n"+
      		"        when a.stat_month ='07' then 'JUL' when a.stat_month ='08' then 'AUG' \n"+
      		"        when a.stat_month ='09' then 'SEP' when a.stat_month ='10' then 'OCT' \n"+
      		"        when a.stat_month ='11' then 'NOV' else 'DEC' end as month, \n"+
      		"     coalesce(unload_cntr_qty,0) as unload,coalesce(dem_cntr_qty,0) as dem, \n"+
      		"     coalesce(det_cntr_qty,0) as det,coalesce(osc_cntr_qty,0) as osc, \n"+
      		"     coalesce(dem_cntr_qty+det_cntr_qty+osc_cntr_qty,0) as total from (select '01' as stat_month  union all \n"+
      		"     select '02' as stat_month union all select '03' as stat_month union all \n"+
      		"     select '04' as stat_month union all select '05' as stat_month union all \n"+
      		"     select '06' as stat_month union all select '07' as stat_month union all \n"+
      		"     select '08' as stat_month union all select '09' as stat_month union all \n"+
      		"     select '10' as stat_month union all select '11' as stat_month union all \n"+
      		"     select '12' as stat_month )a left outer join \n"+
      		"   (select stat_month,sum(coalesce(unload_cntr_qty,0)) as unload_cntr_qty,sum(dem_cntr_qty) as dem_cntr_qty, \n"+
      		"   sum(det_cntr_qty) as det_cntr_qty,sum(osc_cntr_qty) as osc_cntr_qty \n"+
      		" from own_stat_user \n"+
      		" where stat_year= to_char(now(),'YYYY') \n"+
      		" and user_no= $1 \n"+
      		" and ie_type='I' \n"+
      		" group by stat_month)b \n"+
      		" on a.stat_month = b.stat_month \n",
            values: [request.localUser.userno],
	          //rowMode: 'array',
    }
    console.log( sql )
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							
							response.status(200).json(result.rows);
						} else {
							
							response.status(200).json([]);
						}

					}
				});
			}


	    });
}
  
  
  const getExportStatInfo = (request, response) => {

	    const sql = {
    text: " select case when a.stat_month ='01' then 'JAN' when a.stat_month ='02' then 'FEB' \n"+
    		"        when a.stat_month ='03' then 'MAR' when a.stat_month ='04' then 'APR' \n"+
    		"        when a.stat_month ='05' then 'MAY' when a.stat_month ='06' then 'JUN' \n"+
    		"        when a.stat_month ='07' then 'JUL' when a.stat_month ='08' then 'AUG' \n"+
    		"        when a.stat_month ='09' then 'SEP' when a.stat_month ='10' then 'OCT' \n"+
    		"        when a.stat_month ='11' then 'NOV' else 'DEC' end as month, \n"+
    		"     coalesce(load_cntr_qty,0) as load,coalesce(dem_cntr_qty,0) as dem, \n"+
    		"     coalesce(det_cntr_qty,0) as det,coalesce(osc_cntr_qty,0) as osc, \n"+
    		"     coalesce(dem_cntr_qty+det_cntr_qty+osc_cntr_qty,0) as total from (select '01' as stat_month  union all \n"+
    		"     select '02' as stat_month union all select '03' as stat_month union all \n"+
    		"     select '04' as stat_month union all select '05' as stat_month union all \n"+
    		"     select '06' as stat_month union all select '07' as stat_month union all \n"+
    		"     select '08' as stat_month union all select '09' as stat_month union all \n"+
    		"     select '10' as stat_month union all select '11' as stat_month union all \n"+
    		"     select '12' as stat_month )a left outer join \n"+
    		"   (select stat_month,sum(coalesce(load_cntr_qty,0)) as load_cntr_qty,sum(dem_cntr_qty) as dem_cntr_qty, \n"+
    		"   sum(det_cntr_qty) as det_cntr_qty,sum(osc_cntr_qty) as osc_cntr_qty \n"+
    		" from own_stat_user \n"+
    		" where stat_year= to_char(now(),'YYYY') \n"+
    		" and user_no= $1 \n"+
    		" and ie_type='E' \n"+
    		" group by stat_month)b \n"+
    		" on a.stat_month = b.stat_month \n",
          values: [request.localUser.userno],
	          //rowMode: 'array',
  }
  console.log( sql )
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							
							response.status(200).json(result.rows);
						} else {
							
							response.status(200).json([]);
						}
					}
				});

			}


	    });
}
  
  const getCarrierStatList = (request, response) => {

	  
	    const sql = {
		  text: " select car_rank,(select nm_kor from own_code_cuship occ where occ.id = a.carrier limit 1) as k_name from (  \n"+
		  		"  select carrier,rank() over( order by sum(tot_bl_qty) desc ) as  car_rank   \n"+
		  		"   from own_stat_user a \n" +
		  		"   where stat_year= to_char(now(),'YYYY') \n" +
		  		"     and user_no= $1 \n" +
		  		"   group by carrier \n" +
		  		"   ) a where car_rank < 6 union all \n" +
		  		"   select '6' as car_rank,'기타'as k_name \n",
		  values: [request.localUser.userno],
	          //rowMode: 'array',
	    }
console.log("getCarrierStatList SQL:",sql);
	    pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							
							response.status(200).json(result.rows);
						} else {
							
							response.status(200).json([]);
						}

					}
				});

			}


	    });
}
 
  
  const getCarrierStatInfo = (request, response) => {
    const user_no = request.localUser.userno;
	let sql = "select case when b.stat_month ='01' then 'JAN' when b.stat_month ='02' then 'FEB' when b.stat_month ='03' then 'MAR' \n";
	sql += " when b.stat_month ='04' then 'APR' when b.stat_month ='05' then 'MAY' when b.stat_month ='06' then 'JUN' \n";
	sql += " when b.stat_month ='07' then 'JUL' when b.stat_month ='08' then 'AUG' when b.stat_month ='09' then 'SEP' \n";
	sql += " when b.stat_month ='10' then 'OCT' when b.stat_month ='11' then 'NOV' else 'DEC' end as stat_month, \n";
	sql += " coalesce(carrier1,0)as carrier1,coalesce(carrier2,0)as carrier2, \n";
	sql +=  		"        coalesce(carrier3,0)as carrier3,coalesce(carrier4,0)as carrier4,coalesce(carrier5,0)as carrier5,  \n";
	sql +=  		"        coalesce(carrier6,0)as carrier6 from (   \n";
	sql +=  		"      select * from crosstab (  \n";
	sql +=  		"        $$select stat_month::text, coalesce(b.carrier,'ETC') as carrier, sum(bl_cnt)::bigint as bl_cnt from  \n";
	sql +=  		"     	(select stat_month, carrier, coalesce(sum(a.tot_bl_qty),0) as bl_cnt from own_stat_user  a  where stat_year=to_char(now(),'YYYY') \n";
	sql +=  		"         and user_no = '"+user_no+"' group by stat_month, carrier ) a \n";
	sql +=  		"         left outer join (select carrier from (select carrier, rank() over(order by bl_cnt desc)  \n" ;
	sql +=  		"                                                from (select carrier,  coalesce(sum(a.tot_bl_qty),0) as bl_cnt from own_stat_user  a \n";
	sql +=  		"         where stat_year= to_char(now(),'YYYY') and user_no = '"+user_no+"' group by carrier) x ) z \n";
	sql +=  		"        where rank < 6) b \n";
	sql +=  		"  on a.carrier = b.carrier \n";
	sql +=  		"  group by stat_month, coalesce(b.carrier,'ETC') \n";
	sql +=  		"  order by stat_month, bl_cnt desc$$, \n";
	sql +=  		"  $$select carrier from ( select carrier from (select carrier, rank() over(order by bl_cnt desc) \n";
	sql +=  		"  from (select carrier,  coalesce(sum(a.tot_bl_qty),0) as bl_cnt from own_stat_user  a \n";
	sql +=  		"  where stat_year=to_char(now(),'YYYY') and user_no = '"+user_no+"' group by carrier) x ) z where rank < 6 union all \n";
	sql +=  		"  	select 'ETC' as carrier) cc $$ \n";
	sql +=  		"  	) as rs (stat_month text,  \n";
	sql +=  		"  carrier1 bigint,carrier2 bigint,carrier3 bigint,carrier4 bigint,carrier5 bigint, carrier6 bigint))a \n";
	sql += 		"  right outer join (select '01' as stat_month  union all select '02' as stat_month union all select '03' as stat_month union all \n";
	sql +=  		"  		select '04' as stat_month union all select '05' as stat_month union all select '06' as stat_month union all \n";
	sql +=  		"  	    select '07' as stat_month union all select '08' as stat_month union all select '09' as stat_month union all \n";
	sql +=  		"       select '10' as stat_month union all select '11' as stat_month union all select '12' as stat_month )b \n";
	sql +=  		"  on a.stat_month = b.stat_month \n";
	sql +=  		"   order by b.stat_month \n";
    //values: [sUser.userno],
    //rowMode: 'array',
    //}
    console.log("getCarrierStatInfo SQL:", sql);
    
    
    ;(async () => {
		const client = await pgsqlPool.connect();
		try {
			const result = await client.query(sql);
			response.status(200).json(result.rows);
		} finally {
			client.release();
		}
	})().catch(err => console.log(err))
    
    /*
    pgsqlPool.connect(function(err, conn, release) {
	//   console.log("getCarrierStatInfo conn");
	
		if (err) {
			console.log("getCarrierStatInfo err" + err);
			
			response.status(400).send(err);
		} else {
			// console.log("getCarrierStatInfo query");
			conn.query(sql, function(err, result) {
		release();
				if (err) {
					console.log(err);
					
					response.status(400).send(err);
				} else {
					console.log("getCarrierStatInfo result", result);

					if (result != null) {
						console.log("getCarrierStatInfo 200");
						
						response.status(200).json(result.rows);
					} else {
					//   response.status(200).json([]);
						
						response.status(200).json({ status: "error", error: "No Found Data" });
					}
				}
			});

	  	}

    });*/
  };
  
  const getImportingList = (request, response) => {
console.log("sql>>>>getImportingList");
	    const sql = {
		  text: " select (select count(distinct b.bl_bkg) from own_user_request a, own_tracking_bl_new b \n"+
		  		"  			where a.req_seq = b.req_seq   \n"+
		  		"             and a.user_no= $1   \n"+
		  		"   		  and b.ie_Type= $2 \n" +
		  		"             and to_date(b.pol_etd,'YYYYMMDD') > now()) as estimated, \n" +
		  		"         (select count(distinct b.bl_bkg) from own_user_request a,own_tracking_bl_new b \n" +
		  		"          where a.req_seq = b.req_seq \n" +
		  		"            and a.user_no= $1 \n" +
		  		"            and b.ie_Type= $2 \n"+
		  		"            and (to_date(b.pol_etd,'YYYYMMDD') = to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD') or  \n"+
		  		"                 to_date(b.pod_eta,'YYYYMMDD') = to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD'))) as shipping, \n"+
		  		"  			(select count(distinct b.bl_bkg) from own_user_request a,own_tracking_bl_new b \n"+
		  		"    			where a.req_seq = b.req_seq \n"+
		  		"      			and a.user_no= $1 \n"+
		  		"      			and b.ie_Type= $2 \n"+
		  		"      			and to_date(b.pol_etd,'YYYYMMDD')-1 = to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')) as eta, \n"+
		  		"  			(select count(distinct b.cntr_no) from own_user_request a, own_dem_det b \n"+
		  		"  				where a.req_seq = b.req_seq \n"+
		  		"  				and a.user_no= $1 \n"+
		  		"         		and b.ie_type = $2 \n"+
		  		"  				and b.full_outgate_date is null ) as unload, \n"+
		  		"   		(select count(distinct b.cntr_no) from own_user_request a, own_dem_det b \n"+
		  		"   			where a.req_seq = b.req_seq \n"+
		  		"   			and b.user_no= $1 \n"+
		  		"   			and b.ie_type = $2 \n"+
		  		"   			and b.full_outgate_date is not null \n"+
		  		"   			and b.full_outgate_date between to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')-7,'YYYYMMDD') \n"+
		  		"   			and to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD'),'YYYYMMDD'))||'/'|| \n"+
		  		"   		(select count(distinct b.cntr_no) from own_user_request a, own_dem_det b \n"+
		  		"   			where a.req_seq = b.req_seq \n"+
		  		"  			 	and b.user_no= $1 \n"+
		  		"   			and b.ie_type = $2 \n"+
		  		"   			and b.mt_ingate_date is not null \n"+
		  		"   			and b.mt_ingate_date between to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')-7,'YYYYMMDD') \n"+
		  		"  				and to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD'),'YYYYMMDD')) as gate \n",
		  values: [request.localUser.userno, request.body.ietype],
	          //rowMode: 'array',
	    }
	  console.log("getImportingList sql:",sql)
	    
        ;(async () => {
    		const client = await pgsqlPool.connect();
    		try {
    			const result = await client.query(sql);
    			response.status(200).json(result.rows[0]);
    		} finally {
    			client.release();
    		}
    	})().catch(err => console.log("getImportingList ERROR:",err))
        
	    /*pgsqlPool.connect(function(err,conn,release) {
	        if(err){
	            console.log("err" + err);
	            
	            response.status(400).send(err);
	        } else {
				conn.query(sql, function(err,result){
					release();
					if(err){
						console.log(err);
						
						response.status(400).send(err);
					} else {
						if(result != null) {
							console.log("data::",result.rows);
							
							response.status(200).json(result.rows[0]);
						} else {
							
							response.status(200).json([]);
						}

					}
				});

			}


	    });*/
}
  
  
  const getExportingList = (request, response) => {
	  console.log("sql>>>>getExportingList");
	  	    const sql = {
	  		  text: " select (select  count(distinct b.cntr_no) from own_user_request a, own_dem_det b \n"+
	  		  		"  			where a.req_seq = b.req_seq   \n"+
	  		  		"             and b.ie_type='E' and b.mt_outgate_date is not null   \n"+
	  		  		"             and (b.full_ingate_date is null or  b.full_ingate_date ='') \n"+
	  		  		"             and a.user_no= $1) as empty_out, \n" +
	  		  		"         (select  count(distinct b.cntr_no) from own_user_request a, own_dem_det b \n" +
	  		  		"          where a.req_seq = b.req_seq \n" +
	  		  		"            and a.user_no= $1 \n" +
	  		  		"            and b.ie_Type= 'E' \n"+
	  		  		"            and b.full_ingate_date is not null and (b.load_date is null or  b.load_date ='')  \n"+
	  		  		"                 and a.user_no=$1) as full_in, \n"+
	  		  		"  			(select count(distinct b.cntr_no)  from own_user_request a, own_dem_det b \n"+
	  		  		"    			where a.req_seq = b.req_seq \n"+
	  		  		"      			and a.user_no= $1 \n"+
	  		  		"      			and b.ie_Type= 'E' \n"+
	  		  		"      			and b.etd is not null and to_date(b.etd,'YYYYMMDD') > to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')  \n"+
	  		  		"               and b.load_date is not null ) as load_cnt, \n"+
	  		  		"  			(select  count(distinct b.bl_bkg) from own_user_request a, own_tracking_bl_new b \n"+
	  		  		"  				where a.req_seq = b.req_seq \n"+
	  		  		"  				and a.user_no= $1 \n"+
	  		  		"         		and b.ie_type = 'E' \n"+
	  		  		"  				and b.pol_etd != 'null' \n"+
	  		  		"               and (to_date(b.pol_etd,'YYYYMMDD') = to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD') or \n"+
	  		  		"                    to_date(b.pod_eta,'YYYYMMDD') = to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')) \n"+
	  		  		"               and a.user_no = $1) as shipping, \n"+
	  		  		"   		(select count(distinct b.bl_bkg) from own_user_request a, own_dem_det b \n"+
	  		  		"   			where a.req_seq = b.req_seq \n"+
	  		  		"   			and b.user_no= $1 \n"+
	  		  		"   			and b.ie_type = 'E' \n"+
	  		  		"   			and b.eta is not null \n"+
	  		  		"   			and b.eta between to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD')-7,'YYYYMMDD') \n"+
	  		  		"   			and to_char(to_date(to_char(now(),'YYYYMMDD'),'YYYYMMDD'),'YYYYMMDD')) as pod_arrival \n",
	  		  values: [request.localUser.userno],
	  	          //rowMode: 'array',
	  	    }
	  	    console.log("sql>>>>",sql);
	  	    
	           ;(async () => {
	       		const client = await pgsqlPool.connect();
	       		try {
	       			const result = await client.query(sql);
	       			response.status(200).json(result.rows[0]);
	       		} finally {
	       			client.release();
	       		}
	       	})().catch(err => console.log("getExportingList:",err))
	  }

  const getChainportal = (request, response) => {
	  	    const sql = {
	  		  text: " select replace(terminal_alias,'HKT','HKT(1)') as terminal_alias,inout_status, \n"+
	  		  		"  			case when (inout_status_str like '%양호%' or inout_status_str is null) then 'primary'   \n"+
	  		  		"                when inout_status_str like '%대기%' then 'warning'   \n"+
	  		  		"                else inout_status_str end as inout_status_str,to_char(insert_date,'YYYY-MM-DD hh24:mi') as insert_date, \n"+
	  		  		"         (select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n" +
	  		  		"          where terminal_alias=a.terminal_alias \n" +
	  		  		"            and substring(con_size,1,1)='2') as empty_20_cnt, \n" +
	  		  		"            (select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"            where terminal_alias=a.terminal_alias  \n"+
	  		  		"                 and substring(con_size,1,1)='4') as empty_40_cnt, \n"+
	  		  		"  			(select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"    			 where terminal_alias=a.terminal_alias \n"+
	  		  		"      			and substring(con_size,1,2)='45' and con_type='00') as empty_45_cnt, \n"+
	  		  		"      			(select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"      			where terminal_alias=a.terminal_alias  \n"+
	  		  		"               and substring(con_size,1,2)='45' and con_type!='00') as empty_etc_cnt \n"+
	  		  		"  			from own_port_terminal_congestion a    union all \n" +
	  	  		    " select   'HKT(2)' as terminal_alias,inout_status, \n"+
	  		  		"  			case when (inout_status_str like '%양호%' or inout_status_str is null) then 'primary'   \n"+
	  		  		"                when inout_status_str like '%대기%' then 'warning'   \n"+
	  		  		"                else inout_status_str end as inout_status_str,to_char(insert_date,'YYYY-MM-DD hh24:mi') as insert_date, \n"+
	  		  		"         (select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n" +
	  		  		"          where terminal_alias='HKT' \n" +
	  		  		"            and substring(con_size,1,1)='2') as empty_20_cnt, \n" +
	  		  		"            (select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"            where terminal_alias='HKT'  \n"+
	  		  		"                 and substring(con_size,1,1)='4') as empty_40_cnt, \n"+
	  		  		"  			(select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"    			 where terminal_alias='HKT' \n"+
	  		  		"      			and substring(con_size,1,2)='45' and con_type='00') as empty_45_cnt, \n"+
	  		  		"      			(select coalesce(sum(con_count::numeric),0)as con_count  from own_port_empty_container \n"+
	  		  		"      			where terminal_alias='HKT'  \n"+
	  		  		"               and substring(con_size,1,2)='45' and con_type!='00') as empty_etc_cnt \n"+
	  		  		"  			from own_port_terminal_congestion a where terminal_alias='HKT' order by terminal_alias \n",

	  	    }
	           ;(async () => {
	       		const client = await pgsqlPool.connect();
	       		try {
	       			const result = await client.query(sql);
	       			if(result.rowCount > 0) {
	       				var list = result.rows;
	       				await Promise.all(list.map(async(data,key) =>{
	       					if(data.terminal_alias) {
	       						let terminal = await client.query(getChainportalDetail(data.terminal_alias));
	       						list[key] = {...data,port_data:terminal.rows};
	       					} else {
	       						list[key] = {...data,port_data:[]};
	       					}
	       					//console.log("list:",list);
	       					
	       				}));
	       				
	       				response.status(200).json(list);
	       			} else {
	       				response.status(200).json([]);
	       			}
	       			
	       		} finally {
	       			client.release();
	       		}
	       	})().catch(err => console.log(err))
	  }
  
  const getChainportalDetail = (terminal) => {

	    		 const sql = {
	    		  text : "select b.terminal_alias,b.berth_code,a.terminal_ship_name,a.terminal_ship_voyage_no,a.shipping_code,a.rd_cnt from ( \n"+		
	    		         " select * from (select case when terminal_alias='HKT' and berth_code in ('4A','4B','5A','5B') then 'HKT(2)' \n"+
	    		 	    " when terminal_alias='HKT' and berth_code in ('1A','1B','2A','2B','1A','2B') then 'HKT(1)' \n"+
	    		 	    " else terminal_alias end as terminal_alias,berth_code,terminal_ship_name,terminal_ship_voyage_no, \n"+
	    		 	    " shipping_code, \n"+
	    		 	    " case when (coalesce(a.discharge_completed::numeric,0) + coalesce(a.loading_completed::numeric,0)) * 100 = 0 then '0' \n"+
	    		         " else round((coalesce(a.discharge_completed::numeric,0) + coalesce(a.loading_completed::numeric,0)) * 100 / \n"+
	    		 	    " (coalesce(a.discharge_total::numeric,0)+coalesce(a.loading_total::numeric,0))) end as rd_cnt from ( \n"+
	    		 	    " select  rank()over (partition by terminal_alias,berth_code order by etb::timestamp <= now(),etb desc) , * \n"+
	    		 	    " from own_port_crane_work \n"+
	    		         " ) a where rank = 1 )a where terminal_alias= $1)a  right outer join \n"+
	    		         " (select * from own_port_terminal_berth_code where terminal_alias= $1) b \n"+
	    		         " on a.terminal_alias = b.terminal_alias \n"+
	    		         " and a.berth_code=b.berth_code \n"+
	    		         " order by b.terminal_alias \n",

	    		 	 values:[terminal]  
	    		 }
		  /**0416수정 */
			/*	const sql = {
					text : "select  b.* from( select case when terminal_alias = 'HKT' and berth_code in ('4A','4B','5A','5B') \n"+		
	    		         " then 'HKT(2)'  when terminal_alias = 'HKT' and berth_code in ('1A','1B','2A','2B','3A','3B') then 'HKT(1)' else terminal_alias  \n"+		
	    		         "  end as terminal_alias, berth_code,terminal_ship_name,terminal_ship_voyage_no, shipping_code, \n"+		
	    		         "  case  when (coalesce(a.discharge_completed::numeric, 0) + coalesce(a.loading_completed::numeric, 0)) * 100 = 0 then '0' \n"+		
	    		         "  else round((coalesce(a.discharge_completed::numeric, 0) + coalesce(a.loading_completed::numeric, 0)) * 100 \n"+		
	    		         " / (coalesce(a.discharge_total::numeric, 0)+ coalesce(a.loading_total::numeric, 0)))\n"+		
	    		         "  end as rd_cnt from own_port_crane_work a ) b where terminal_alias = $1",
   
						values:[request.body.terminal]  
				   }*/
	    		 //console.log(">>>getChainportalDetail SQL",sql);
	    		 return sql; 

}
  
  
    
module.exports = {
	getStatInfo,
	getDemdetStatInfo,
	getImportStatInfo,
	getExportStatInfo,
	getCarrierStatList,
	getCarrierStatInfo,
	getImportingList,
	getExportingList,
	getChainportal,
	getChainportalDetail
}