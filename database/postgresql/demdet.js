'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
// const sUser = require('../../models/sessionUser');

const getImportDemDetList = (request, response) => {
	console.log( request.body );
    let sql_string = "";
    let params = [];

    sql_string = "select * from ("+
        "select x.*, floor(((row_number() over()) -1) / 10 + 1) as curpage from ( "+
        "select  "+
        "  a.req_seq, coalesce(b.line_code,a.carrier_code) as line_code, a.ie_type, a.bl_bkg, coalesce(a.cntr_no,b.cntr_no) as cntr_no, b.type_size "+
        ", a.mbl_no, a.hbl_no, b.bkg_no, b.vsl_code, b.vsl_name, b.voyage, b.ter_ref_no, b.pol, b.pod "+
        ", to_char(to_date(b.eta,'YYYYMMDD'), 'YYYY-MM-DD') as eta, eta_time "+
        ", to_char(to_date(b.etd,'YYYYMMDD'), 'YYYY-MM-DD') as etd, etd_time "+
        ", to_char(to_timestamp(b.ata||b.ata_time,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as ata, b.ata_time "+
        ", to_char(to_date(b.atd,'YYYYMMDD'), 'YYYY-MM-DD') as atd, b.atd_time "+
        ", to_char(to_timestamp(b.unload_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as unloading_date "+
        ", to_char(to_timestamp(b.load_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as loading_date "+
        ", to_char(to_timestamp(b.full_outgate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as full_outgate_date "+
        ", to_char(to_timestamp(b.full_ingate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as full_ingate_date "+
        ", to_char(to_timestamp(b.mt_outgate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as mt_outgate_date "+
        ", to_char(to_timestamp(b.mt_ingate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as mt_ingate_date "+
        ", b.ret_date, b.dem_date, b.osc_date "+
        ", to_char(to_date(b.ret_date, 'YYYYMMDD'), 'YYYY-MM-DD') as ret_date "+
		", to_char(to_date(b.dem_date, 'YYYYMMDD'), 'YYYY-MM-DD') as dem_date "+
		", to_char(to_date(b.osc_date, 'YYYYMMDD'), 'YYYY-MM-DD') as osc_date "+
        ", trim(to_char(coalesce(b.dem_amount,0),'999,999,999,999')) as dem_amount "+
        ", trim(to_char(b.dem_vat,'999,999,999,999')) as dem_vat "+
        ", b.dem_unit "+
        ", trim(to_char(coalesce(b.det_amount,0),'999,999,999,999')) as det_amount "+
        ", trim(to_char(b.det_vat,'999,999,999,999')) as det_vat "+
        ", b.det_unit "+
        ", trim(to_char(coalesce(b.combin_amount,0),'999,999,999,999')) as combin_amount "+
        ", trim(to_char(b.combin_vat,'999,999,999,999')) as combin_vat "+
        ", b.combin_unit  "+
        ", trim(to_char(coalesce(b.osc_amount,0),'999,999,999,999')) as osc_amount "+
        ", trim(to_char(b.osc_vat,'999,999,999,999')) as osc_vat "+
        ", b.osc_unit "+
        ", a.tracking_remark, a.tracking_yn, a.dem_det_remark, a.dem_det_yn "+
        ", b.dem_tariff "+
        ", b.det_tariff "+
        //", replace(b.det_tariff,'/n','</br>') as det_tariff "+
        ", b.osc_tariff "+
        ", c.line_code as img_line_code, c.image_yn, c.url as line_url "+
        ", b.unload_terminal, d.terminal_kname "+
        ", case when b.mt_ingate_date is not null then 'GATE IN' "+
		"	       when b.mt_ingate_date is null and coalesce(b.det_amount,0) > 0 then 'DET'  "+
		"	       when b.full_outgate_date is not null then 'GATE OUT' "+
		"	       when b.mt_ingate_date is null and coalesce(b.dem_amount,0) > 0 then 'DEM' "+
		"	       when b.unload_date is not null then 'UNLOAD' "+
        "	       else '미확인' end cntr_status "+
        ", e.voyage as tracking_voyage "+
        ",coalesce(b.dem_over_day,'0') as dem_over_day "+
		",coalesce(b.det_over_day,'0') as det_over_day "+
        ",coalesce(b.osc_over_day,'0') as osc_over_day "+
        ",c.do_url, c.do_yn "+
        " from own_user_request a "+
        " left outer join own_dem_det b "+
        "   on a.req_seq = b.req_seq  "+
        " left outer join own_code_cuship c on "+
        "  	coalesce(b.line_code, a.carrier_code) = c.id "+
        " left outer join own_terminal_info d on "+
        "	b.unload_terminal = d.terminal "+
        " left outer join own_tracking_bl_new e on "+
		"   a.req_seq = e.req_seq ";

        sql_string += "where a.user_no = $1 ";
        sql_string += "  and a.ie_type = $2 ";
        sql_string += "  and b.del_yn = 'N' ";
        sql_string += "  and a.dem_det_yn = 'Y' ";

        if( '' != request.body.lineCode) {
            sql_string += " and a.carrier_code = '"+ request.body.lineCode +"' ";
        }

        if( '' != request.body.mblNo) {
            sql_string += " and a.mbl_no = '"+ request.body.mblNo +"' ";
        }

        if( '' != request.body.cntrNo) {
            sql_string += " and a.cntr_no = '"+ request.body.cntrNo +"' ";
        }        
        
        if( request.body.onlyChecked) {
            sql_string += " and ((coalesce(b.dem_amount,0) > 0 and b.full_outgate_date is null)  or (coalesce(b.det_amount,0) > 0 and b.mt_ingate_date is null) or (coalesce(b.osc_amount,0) > 0 and b.full_outgate_date is null))"; 
        }
        
        //console.log("> sUser.userno :"+sUser.userno );
        console.log("> request.body.onlyChecked :"+ request.body.onlyChecked );
        sql_string += "order by cast(b.dem_amount as float), cast(b.det_amount as float), cast(b.osc_amount as float), a.carrier_code, a.bl_bkg, a.cntr_no, a.insert_date desc ";
        sql_string += ") X ";
        sql_string += ") Z where Z.curpage = $3 ";

        

        params.push( request.localUser.userno );
        params.push( request.body.ieType );
        params.push( request.body.num );

    const sql = {
        text: sql_string,
        values: params,
    }

    
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
    pgsqlPool.connect(function(err,conn,release) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {

            console.log("sql : " + sql.text);
            conn.query(sql, function(err,result){
            	
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
                    
                    //response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
                    //response.status(200).json(result.rows);
                    // console.log(result.fields.map(f => f.name));
                    
                    if(result != null) {
                        response.status(200).json(result.rows);
                    } else {
                        response.status(200).json([]);
                    }

                }
    
            });
        }

        // conn.
    });*/
}

const getExportDemDetList = (request, response) => {
    console.log( request.body );
    let sql_string = "";
    let params = [];

    sql_string = "select * from ("+
        "select x.*, floor(((row_number() over()) -1) / 10 + 1) as curpage from ( "+
        "select  "+
        "  a.req_seq, coalesce(b.line_code,a.carrier_code) as line_code, a.ie_type, a.bl_bkg, coalesce(a.cntr_no,b.cntr_no) as cntr_no, b.type_size "+
        ", a.mbl_no, a.hbl_no, b.bkg_no, b.vsl_code, b.vsl_name, b.voyage, b.ter_ref_no, b.pol, b.pod "+
        ", to_char(to_date(b.eta,'YYYYMMDD'), 'YYYY-MM-DD') as eta, eta_time "+
        ", to_char(to_date(b.etd,'YYYYMMDD'), 'YYYY-MM-DD') as etd, etd_time "+
        ", to_char(to_timestamp(b.ata||b.ata_time,'YYYYMMDDHH24MI'),'YYYY-MM-DD HH24:MI') as ata, b.ata_time "+
        ", to_char(to_date(b.atd,'YYYYMMDD'), 'YYYY-MM-DD') as atd, b.atd_time "+
        ", to_char(to_timestamp(b.unload_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as unloading_date "+
        ", to_char(to_timestamp(b.load_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as loading_date "+
        ", to_char(to_timestamp(b.full_outgate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as full_outgate_date "+
        ", to_char(to_timestamp(b.full_ingate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as full_ingate_date "+
        ", to_char(to_timestamp(b.mt_outgate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as mt_outgate_date "+
        ", to_char(to_timestamp(b.mt_ingate_date,'YYYYMMDDHH24MI'), 'YYYY-MM-DD') as mt_ingate_date "+
        ", b.ret_date, b.dem_date, b.osc_date "+
        ", to_char(to_date(b.ret_date, 'YYYYMMDD'), 'YYYY-MM-DD') as ret_date "+
		", to_char(to_date(b.dem_date, 'YYYYMMDD'), 'YYYY-MM-DD') as dem_date "+
		", to_char(to_date(b.osc_date, 'YYYYMMDD'), 'YYYY-MM-DD') as osc_date "+
        ", trim(to_char(coalesce(b.dem_amount,0),'999,999,999,999')) as dem_amount "+
        ", trim(to_char(b.dem_vat,'999,999,999,999')) as dem_vat "+
        ", b.dem_unit "+
        ", trim(to_char(coalesce(b.det_amount,0),'999,999,999,999')) as det_amount "+
        ", trim(to_char(b.det_vat,'999,999,999,999')) as det_vat "+
        ", b.det_unit "+
        ", trim(to_char(coalesce(b.combin_amount,0),'999,999,999,999')) as combin_amount "+
        ", trim(to_char(b.combin_vat,'999,999,999,999')) as combin_vat "+
        ", b.combin_unit  "+
        ", trim(to_char(coalesce(b.osc_amount,0),'999,999,999,999')) as osc_amount "+
        ", trim(to_char(b.osc_vat,'999,999,999,999')) as osc_vat "+
        ", b.osc_unit "+
        ", a.tracking_remark, a.tracking_yn, a.dem_det_remark, a.dem_det_yn "+
        ", b.dem_tariff "+
        ", b.det_tariff "+
        //", replace(b.det_tariff,'/n','</br>') as det_tariff "+
        ", b.osc_tariff "+
        ", c.line_code as img_line_code, c.image_yn, c.url as line_url "+
        ", b.unload_terminal, d.terminal_kname "+
        ", case when b.load_date is not null then 'LOAD' "+
        "	 when b.full_ingate_date is not null then 'GATE IN' "+
        "	 when b.full_ingate_date is null and coalesce(b.dem_amount, 0) > 0 then 'DEM' "+
        "	 when b.mt_outgate_date is not null then 'GATE OUT' "+
		"	 when b.mt_outgate_date is null and coalesce(b.det_amount, 0) > 0 then 'DET' "+
		"	 else '미확인' end cntr_status "+
        ", e.voyage as tracking_voyage "+
        ",coalesce(b.dem_over_day,'0') as dem_over_day "+
		",coalesce(b.det_over_day,'0') as det_over_day "+
        ",coalesce(b.osc_over_day,'0') as osc_over_day "+
        ",b.load_date "+
		",b.full_ingate_terminal "+
        ",b.mt_outgate_terminal "+
		",b.full_ingate_terminal "+
		",d.terminal_kname as load_terminal_name  "+
		",f.terminal_kname as mt_outgate_terminal_name  "+
        ",g.terminal_kname as full_ingate_terminal_name  "+
        ",case when b.load_date is not null then d.terminal_kname "+
		"	     when b.full_ingate_date is not null then g.terminal_kname "+
		"	     when b.mt_outgate_date is not null then f.terminal_kname "+
		"	     end current_terminal "+
        ",c.do_url, c.do_yn "+
        " from own_user_request a "+
        " left outer join own_dem_det b "+
        "   on a.req_seq = b.req_seq  "+
        " left outer join own_code_cuship c on "+
        "  	coalesce(b.line_code, a.carrier_code) = c.id "+
        " left outer join own_terminal_info d on "+
        "	b.load_terminal = d.terminal "+
        " left outer join own_tracking_bl_new e on "+
        "   a.req_seq = e.req_seq  "+
        " left outer join own_terminal_info f on "+
		"   b.mt_outgate_terminal = f.terminal "+
		" left outer join own_terminal_info g on "+
		" 	b.full_ingate_terminal = g.terminal ";

        sql_string += "where a.user_no = $1 ";
        sql_string += "  and a.ie_type = $2 ";
        sql_string += "  and b.del_yn = 'N' ";
        sql_string += "  and a.dem_det_yn = 'Y' ";

        if( '' != request.body.lineCode) {
            sql_string += " and a.carrier_code = '"+ request.body.lineCode +"' ";
        }

        if( '' != request.body.mblNo) {
            sql_string += " and a.mbl_no = '"+ request.body.mblNo +"' ";
        }

        if( '' != request.body.cntrNo) {
            sql_string += " and a.cntr_no = '"+ request.body.cntrNo +"' ";
        }        
        
        if( request.body.onlyChecked) {
            sql_string += " and ((coalesce(b.dem_amount,0) > 0 and b.full_outgate_date is null)  or (coalesce(b.det_amount,0) > 0 and b.mt_ingate_date is null) or (coalesce(b.osc_amount,0) > 0 and b.full_outgate_date is null))"; 
        }
        
        //console.log("> sUser.userno :"+sUser.userno );
        console.log("> request.body.onlyChecked :"+ request.body.onlyChecked );
        sql_string += "order by cast(b.dem_amount as float), cast(b.det_amount as float), cast(b.osc_amount as float), a.carrier_code, a.bl_bkg, a.cntr_no, a.insert_date desc ";
        sql_string += ") X ";
        sql_string += ") Z where Z.curpage = $3 ";

        

        params.push( request.localUser.userno );
        params.push( request.body.ieType );
        params.push( request.body.num );

    const sql = {
        text: sql_string,
        values: params,
    }

    
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
    pgsqlPool.connect(function(err,conn,release) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            console.log("sql : " + sql.text);
            conn.query(sql, function(err,result){
            	release();
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
        
                    //response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
                    //response.status(200).json(result.rows);
                    // console.log(result.fields.map(f => f.name));
                    
                    if(result != null) {
                        response.status(200).json(result.rows);
                    } else {
                        response.status(200).json([]);
                    }

                }
    
            });

        }

        // conn.
    });*/
}

const getTarrifList = (request, response) => { 
    //console.log(">> request.body :"+request.body);
    const sql = {
        text: "select bound, cntr_type, cntr_size, date1, date2, "+
              "       case when m_gubun = '1' then 'KRW' "+
              "            when m_gubun = '2' then 'USD' end m_gubun "+
              ", trim(to_char(cast(charge as float),'999,999,999,999'))  as charge "+
              ", to_char(to_date(begin_date,'YYYYMMDD'), 'YYYY-MM-DD') as begin_date "+
              ", to_char(to_date(expire_date,'YYYYMMDD'), 'YYYY-MM-DD') as expire_date "+
              "from mfedi_tcs_do_charge  "+
              "where line_code is not null  "+
              "and line_code = $1 "+
              "and dem_det_type = '1' "+  
            //   "and cntr_type = $2 "+
            //   "and cntr_size = $3 "+
              "order by line_code, bound, dem_det_type, cntr_type, cntr_size, date1, date2, begin_date, expire_date ",
              //values: [request.body.lineCode, request.body.cntrType, request.body.cntrSize],
              values: [request.body.lineCode],
        rowMode: 'array',
    }

    
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
    pgsqlPool.connect(function(err,conn,release) { 
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            console.log("sql : " + sql.text);
            conn.query(sql, function(err,result){
            	release();
                if(err){
                    console.log(err);
                    response.status(400).send(err);
                } else {
                    //response.status(200).send({'record':result.rows, 'field':result.fields.map(f => f.name)});
                    response.status(200).json(result.rows);
                    // console.log(result.fields.map(f => f.name));
                }
            });
        }

        // conn.
    });*/
}
  
const getDemDetPort = (request, response) => {

    let sql ="";
    
    sql+= " select y.port, sum(y.cnt), ";
    sql+= " (select float8(wgs84_x) from own_code_port a where a.port_code = y.port) as wgs84_x, ";
    sql+= " (select float8(wgs84_y) from own_code_port a where a.port_code = y.port) as wgs84_y, ";
    sql+= " (select port_kname from own_code_port a where a.port_code = y.port) as port_kname ";
    sql+= " from( ";
    sql+= " select z.port, sum(z.cnt)as cnt from( ";
    sql+= " select pod as port, sum(dem_cnt) + sum(det_cnt) + sum(osc_cnt) + sum(combin_cnt) as cnt ";
    sql+= " from ( ";
    sql+= " select pod, (case when dem_amount > 0 and full_outgate_date is null then 1 else 0 end) as dem_cnt ";
    sql+= " ,  (case when det_amount > 0 and mt_ingate_date is null then 1 else 0 end) as det_cnt ";
    sql+= " ,  (case when osc_amount > 0 and full_outgate_date is null then 1 else 0 end) as osc_cnt ";
    sql+= " ,  (case when combin_amount > 0 then 1 else 0 end) as combin_cnt ";
    sql+= " ,  (case when dem_amount > 0 and full_outgate_date is null then full_outgate_terminal else '' end) as dem_terminal ";
    sql+= " ,  (case when det_amount > 0 and mt_ingate_date is null then mt_ingate_terminal else '' end) as det_terminal ";
    sql+= " ,  (case when osc_amount > 0 and full_outgate_date is null then full_outgate_terminal else '' end) as osc_terminal ";
    sql+= " ,  (case when combin_amount > 0 then mt_ingate_terminal else '' end) as combin_terminal ";
    sql+= " from own_dem_det odd ";
    sql+= " where ie_type = 'I' ";
    sql+= " and user_no ='"+request.localUser.userno+"' ";
    sql+= " and ((unload_date is not null and mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd')) ";
    sql+= " or (unload_date < to_char(now(), 'yyyymmdd') and mt_ingate_date is null) ";
    sql+= " or (unload_date < to_char(now(), 'yyyymmdd') and mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd'))) ";
    sql+= " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql+= " and del_yn ='N' "
    sql+= " ) x ";
    sql+= " group by pod ";
    sql+= " union ";
    sql+= " select (case when port not in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') then 'OTHER' else port end) as port, sum(dem_cnt) + sum(det_cnt) + sum(osc_cnt) as cnt ";
    sql+= " from ( ";
    sql+= " select   (case when dem_amount > 0 then 1 else 0 end) as dem_cnt ";
    sql+= " ,  (case when det_amount > 0 then 1 else 0 end) as det_cnt ";
    sql+= " ,  (case when osc_amount > 0 then 1 else 0 end) as osc_cnt ";
    sql+= " ,  (case when combin_amount > 0 then 1 else 0 end) as combin_cnt ";
    sql+= " ,  coalesce(load_terminal, coalesce(full_ingate_terminal, mt_outgate_terminal)) as terminal ";
    sql+= " ,  (select 'KR' || location_code from own_terminal_info where terminal =  coalesce(load_terminal, coalesce(full_ingate_terminal, mt_outgate_terminal))) as port ";
    sql+= " from own_dem_det odd ";
    sql+= " where ie_type = 'E' ";
    sql+= " and (load_terminal is not null or full_ingate_terminal is not null or mt_outgate_terminal is not null) ";
    sql+= " and user_no ='"+request.localUser.userno+"' ";
    sql+= " and ((mt_outgate_date < to_char(now(),'yyyymmdd') and load_date is null) or (load_date < to_char(now() + interval '8 day','yyyymmdd')  )) ";
    sql+= " and ((unload_date is not null and mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd')) or (unload_date > to_char(now(),'yyyymmdd') and mt_ingate_date is null) or (unload_date > to_char(now(),'yyyymmdd') and mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd'))) ";
    //sql+= " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql+= " ) x ";
    sql+= " group by (case when port not in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') then 'OTHER' else port end) "; 
    sql+= " )z group by z.port ";
    sql+= " union ";
    sql+= " select port_code as port_code, 0 as cnt ";
    sql+= " from own_code_port ocp where port_code in('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql+= " )y ";
    sql+= " where 1=1 "
    if(request.body.portCode != null) {
        sql+= " and y.port = '"+ request.body.portCode +"' "
    }
    sql+= " group by port ";
          
              
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
    /*
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
                    //console
                	
                    response.status(200).send(result.rows);
                }
            });

        }
  
    });*/
  }


  

  const getDemDetInTerminal = (request, response) => {


    let sql ="";
	sql += " select port, terminal, sum(dem_cnt) as dem_cnt, sum(det_cnt) as det_cnt, sum(osc_cnt) as osc_cnt, sum(combin_cnt) as combin_cnt, user_no from ";
    sql += " (select pod as port, terminal, sum(dem_cnt) as dem_cnt, sum(det_cnt) as det_cnt, sum(osc_cnt) as osc_cnt, sum(combin_cnt) as combin_cnt, unload_date, mt_ingate_date, user_no ";
    sql += " from ( ";
    sql += " select pod, sum(case when dem_amount > 0 and full_outgate_date is null then 1 else 0 end) as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    //sql += " , full_outgate_terminal as terminal ";
    sql += " , unload_terminal as terminal ";
    sql += " , unload_date ";
    sql += " , mt_ingate_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd ";   
    sql += " where ie_type = 'I' ";
    sql += " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql += " and dem_amount > 0  ";
    sql += " and del_yn = 'N' ";
    //sql += " group by pod, full_outgate_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " group by pod, unload_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " union all ";
    sql += " select pod, 0 as dem_cnt ";
    sql += " , sum(case when det_amount > 0 and mt_ingate_date is null then 1 else 0 end) as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    //sql += " , mt_ingate_terminal as terminal ";
    sql += " , unload_terminal as terminal ";
    sql += " , unload_date ";
    sql += " , mt_ingate_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd  ";
    sql += " where ie_type = 'I' ";
    sql += " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql += " and det_amount > 0 ";
    sql += " and del_yn = 'N'"
    //sql += " group by pod, mt_ingate_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " group by pod, unload_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " union all ";
    sql += " select pod, 0 as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , sum(case when osc_amount > 0 and full_outgate_date is null then 1 else 0 end) as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    sql += " , unload_terminal as terminal ";
    //sql += " , full_outgate_terminal as terminal ";
    sql += " , unload_date ";
    sql += " , mt_ingate_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd "; 
    sql += " where ie_type = 'I' ";
    sql += " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql += " and osc_amount > 0  ";
    sql += " and del_yn = 'N'";
    //sql += " group by pod, full_outgate_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " group by pod, unload_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " union all ";
    sql += " select pod, 0 as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , sum(case when combin_amount > 0 then 1 else 0 end) as combin_cnt ";
    //sql += " , mt_ingate_terminal as terminal";
    sql += " , unload_terminal as terminal ";
    sql += " , unload_date ";
    sql += " , mt_ingate_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd ";
    sql += " where ie_type = 'I' ";
    sql += " and pod in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') ";
    sql += " and combin_amount > 0 ";
    sql += " and del_yn = 'N'";
    // sql += " group by pod, mt_ingate_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " group by pod, unload_terminal, unload_date, mt_ingate_date, user_no ";
    sql += " ) x ";
    sql += " where ((x.unload_date is not null and x.mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd')) or (x.unload_date < to_char(now(),'yyyymmdd') and x.mt_ingate_date is null) or (x.unload_date < to_char(now(),'yyyymmdd') and x.mt_ingate_date < to_char(now() + interval '8 day','yyyymmdd'))) ";
    sql += " group by pod, terminal, unload_date, mt_ingate_date,user_no ";
    sql += " )y ";
    sql += " where port = '"+request.body.portCode+"' ";
    sql += " and user_no ='"+request.localUser.userno+"' ";
    sql += " group by port, terminal,user_no ";
  
    
        
    console.log("query == ",sql);   
    
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
    pgsqlPool.connect(function(err,client,release) {
      if(err){
        console.log("err" + err);
        
        response.status(400).send(err);
      } else {
          client.query(sql, function(err,result){
            release();
            if(err){
              console.log(err);
              
              response.status(400).send(err);
            } else {
            	
                response.status(200).send(result.rows);
            }
          });

      }
    });*/
  
  }

  const getDemDetOutTerminal = (request, response) => {


    let sql ="";
	sql += " select (case when port not in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') then 'OTHER' else port end), terminal, sum(dem_cnt) as dem_cnt, sum(det_cnt) as det_cnt, sum(osc_cnt) as osc_cnt, sum(combin_cnt) as combin_cnt ";
    sql += " from ( ";
    sql += " select (select 'KR' || location_code from own_terminal_info where terminal = x.terminal) as port, terminal, sum(dem_cnt) as dem_cnt, sum(det_cnt) as det_cnt, sum(osc_cnt) as osc_cnt, sum(combin_cnt) as combin_cnt, mt_outgate_date, load_date, user_no ";
	sql += " from ( ";
    sql += "select sum(case when dem_amount > 0 then 1 else 0 end) as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    sql += " , full_ingate_terminal as terminal ";
    sql += " , mt_outgate_date ";
    sql += " , load_date ";
    sql += " , user_no ";
	sql += " from own_dem_det odd ";  
    sql += " where ie_type = 'E' ";
    sql += " and (load_terminal is not null or full_ingate_terminal is not null or mt_outgate_terminal is not null) ";
    sql += " group by full_ingate_terminal, mt_outgate_date, load_date, user_no ";
    sql += " union all ";
    sql += " select 0 as dem_cnt ";
    sql += " , sum(case when det_amount > 0 then 1 else 0 end) as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    sql += " , mt_outgate_terminal as terminal ";
    sql += " , mt_outgate_date ";
    sql += " , load_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd ";  
    sql += " where ie_type = 'E' ";
    sql += " and (load_terminal is not null or full_ingate_terminal is not null or mt_outgate_terminal is not null) ";
    sql += " group by mt_outgate_terminal, mt_outgate_date, load_date, user_no ";
    sql += " union all ";
    sql += " select 0 as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , sum(case when osc_amount > 0 then 1 else 0 end) as osc_cnt ";
    sql += " , 0 as combin_cnt ";
    sql += " , full_ingate_terminal as terminal ";
    sql += " , mt_outgate_date ";
    sql += " , load_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd ";
    sql += " where ie_type = 'E' ";
    sql += " and (load_terminal is not null or full_ingate_terminal is not null or mt_outgate_terminal is not null) ";
    sql += " group by full_ingate_terminal, mt_outgate_date, load_date, user_no ";
    sql += " union all ";
    sql += " select 0 as dem_cnt ";
    sql += " , 0 as det_cnt ";
    sql += " , 0 as osc_cnt ";
    sql += " , sum(case when combin_amount > 0 then 1 else 0 end) as combin_cnt ";
    sql += " , full_ingate_terminal as terminal ";
    sql += " , mt_outgate_date ";
    sql += " , load_date ";
    sql += " , user_no ";
    sql += " from own_dem_det odd ";
    sql += " where ie_type = 'E' ";
    sql += " and (load_terminal is not null or full_ingate_terminal is not null or mt_outgate_terminal is not null) ";
    sql += " group by full_ingate_terminal, mt_outgate_date, load_date, user_no ";
	sql += " ) x ";
	sql += " where ((mt_outgate_date < to_char(now(),'yyyymmdd') and load_date is null) or (load_date < to_char(now() + interval '8 day','yyyymmdd'))) ";
	sql += " group by (select 'KR' || location_code from own_terminal_info where terminal = x.terminal), terminal, mt_outgate_date, load_date, user_no ";
    sql += " ) x where x.port = '" +request.body.portCode+"' ";
    sql += " and x.user_no = '"+request.localUser.userno+"' ";
    sql += " group by (case when port not in ('KRPUS','KRINC','KRPTK','KRKAN','KRUSN','KRKPO') then 'OTHER' else port end), terminal ";
  
    console.log("query == ",sql);   
    
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
    pgsqlPool.connect(function(err,client,release) {
      if(err){
        console.log("err" + err);
        
        response.status(400).send(err);
      } else {
          client.query(sql, function(err,result){
            release();
            if(err){
              console.log(err);
              
              response.status(400).send(err);
            } else {
            	
                response.status(200).send(result.rows);
            }
          });    

      }
    });*/
  
  } 



module.exports = {
    getImportDemDetList,
    getExportDemDetList,
    getTarrifList,
    getDemDetPort,
    getDemDetInTerminal,
    getDemDetOutTerminal,
}