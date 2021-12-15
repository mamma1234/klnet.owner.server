'use strict';

const oraclePool = require("../pool.js").oraclePool
// const oracledb = require('oracledb');


const getTrackingList = (request, response) => {
	
	console.log (">>SEARCH:");
	
	let sql = "select BL_BKG,'' AS HOT,IE_TYPE,CARRIER_CODE,VSL_NAME,VOYAGE,CURRENT_STATUS,POL,POL_ETD,POD,POD_ETA from CNEDI.OWN_TRACKING_HEADER"
            
    console.log ("query:" +sql);

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
                if (error) {
                    response.status(400).json({ "error": error.message });
                    return;
                } else {
                    // console.log(results.json);
                    // console.log(results);
                    // response.send(results.rows);
                    response.status(200).json(results.rows);
                }
    
                conn.close();
            });
            // conn.release();

        }

    });
}


const getHotInfo = (request, response) => {
	  let sql = "";
	  //const portCode=request.body.portCode.substr(0,3);
	  //console.log("입력Keyword:"+portCode);

	    sql = "select SEQ,VESSEL_NAME,IE_TYPE,POL,POD from CNEDI.OWN_HOT_VESSEL_SET ";
	    
	    console.log("쿼리:"+sql);

  oraclePool.getConnection(function(err,conn,done) {
      if(err){
          console.log("err" + err);
          response.status(400).send(err);
      }

      conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
          if (error) {
              response.status(400).json({ "error": error.message });
              return;
          }

          // console.log(results.json);
          // console.log(results.rows);
          // response.send(results.rows);
  
          response.status(200).json(results.rows);
          conn.close();
          
      });
      // conn.release();
  });
}

const getCustomLineCode = (request, response) => {
    const sql = " SELECT B.CUSTOMS_CODE as LINE_CODE, '['||B.CUSTOMS_CODE||']'||A.CNAME_KR AS LINE_NAME "
        +" FROM MFEDI.TCS_COMP_HEADER_TBL A ,MFEDI.TCS_COMP_DETAIL_TBL B "
        +" WHERE A.KLNET_ID = B.KLNET_ID "
        +" AND A.KLNET_ID <> 'KLTEST01' "
        +" GROUP BY CUSTOMS_CODE, A.CNAME_KR ";
    console.log(sql);
    console.log(request.body);
    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        }

        conn.execute(sql,{},{outFormat:oraclePool.OBJECT},(error, results) => {
            if (error) {
                response.status(400).json({ "error": error.message });
                return;
            }

            // console.log(results.json);
            // console.log(results);
            // response.send(results.rows);
            response.status(200).json(results.rows);
            conn.close();
            
        });
        // conn.release();
    });
}
const getInlandDriveList = async (request, response) => {
    let conn;
    try{
    console.log(request.body);
    // let sql= `

    // select a.*, 
    // b.*, c.*, d.*, e.*, f.*, g.*, h.*, i.*, j.*, k.*, l.*,m.*
    //     from mfedi.TMS_CNTR_KEY_HIS a,
    //         mfedi.CODE_USER b,
    //         mfedi.TMS_CNTR_KEY_HIS c,
    //         MFEDI.TERMINAL_CODE_TBL d,
    //         MFEDI.TMS_CODE_CENTER e,

    //         MFEDI.TMS_CODE_CENTER f,

    //         MFEDI.TCS_CODE_INFO g,

    //         mfedi.TCS_MOBILE_EVENT h,
    //         MFEDI.TCS_BKG_CNTR_SEAL_EMPTY i,
    //         mfedi.TCS_BKG_CNTR_SEAL_EMPTY j,
    //         MFEDI.TCS_BKG_CNTR_SEAL k ,
    //         mfedi.TCS_BKG_CNTR_SEAL l,
    //         MFEDI.TERMINAL_CODE_TBL m
        
    
    // `
    let sql = `     
                SELECT :page_index AS page_index , CEIL(total / :page_size) AS tot_page, max(rnum) over () as view_count, w.*  
                FROM  (
                        with tck as ( 
                                select a.*, 
                                    (case  
                                        when a.OUTGATE_TIME IS NOT NULL  
                                            then a.OUTGATE_TIME 
                                        when a.OUTGATE_TIME IS NULL and a.INGATE_TIME IS NOT NULL 
                                            then 
                                                (SELECT MAX (D.IN_OUT_TIME) 
                                                FROM MFEDI.CODECO_TBL D 
                                                WHERE D.CONTAINER_NO = a.CNTR_NO 
                                                    AND D.IN_OUT_TIME <= a.INGATE_TIME 
                                                    AND D.inout = 'O') 
                                    end) AS CODECO_OUTGATE_TIME, 
                                    (CASE 
                                        when a.INGATE_TIME IS NOT NULL 
                                            then a.INGATE_TIME 
                                        when a.OUTGATE_TIME IS NOT NULL and a.INGATE_TIME IS NULL 
                                            then 
                                                (SELECT MIN (D.IN_OUT_TIME) 
                                                FROM MFEDI.CODECO_TBL D 
                                                WHERE D.CONTAINER_NO = a.CNTR_NO 
                                                    AND D.IN_OUT_TIME >= a.OUTGATE_TIME 
                                                    AND D.inout = 'I') 
                                    end) AS CODECO_INGATE_TIME         
                                from MFEDI.TMS_CNTR_KEY a 
                                where 1=1
                                `
    request.body.carrierCode?     sql += ` and a.carrier_code = '${request.body.carrierCode}'`: '';                                                        
    request.body.forwarderID?     sql += `AND a.CNTR_SEQ in (SELECT CNTR_SEQ FROM MFEDI.TMS_CNTR_KEY_OWNER x WHERE x.CNTR_SEQ = a.CNTR_SEQ AND x.MANDATOR_GB = 'F' AND x.KLNET_ID = '${request.body.forwarderID}')`: ''; 
    request.body.blNo?           sql += `AND a.BL_NO ='${request.body.blNo}'`: '';                    
    request.body.bkgNo?          sql += `AND a.BKG_NO  = '${request.body.bkgNo}'`: '';                       
    request.body.cntrNo?         sql += `AND a.CNTR_NO = '${request.body.cntrNo}'`: '';                         
    sql +=`         )
                    select
                    rownum AS rnum, count(*) OVER () AS total, z.*
                    FROM (
                            SELECT x.*, y.*, 
                                (select tci.code_name_kr from MFEDI.TCS_CODE_INFO tci where tci.CODE_GROUP_ID = 'EVENT' and tci.CODE_ID = x.cntr_status) as cntr_status_name,
                                (select tme.addr from mfedi.TCS_MOBILE_EVENT tme where tme.SEQ = x.ETRANS_DRIVING_SEQ) as addr, 
                                (SELECT s.SEAL_NO || '~' || s.ADD_PATH1 ||'~' || s.SEAL_ADD_FILE1 FROM MFEDI.TCS_BKG_CNTR_SEAL_EMPTY S WHERE s.CNTR_PID =  
                                    (select max(tbcse.CNTR_PID) from mfedi.TCS_BKG_CNTR_SEAL_EMPTY tbcse where tbcse.CNTR_NO = x.CNTR_NO and TO_CHAR(NVL(tbcse.UP_DATE,tbcse.REG_DATE),'yyyymmdd') BETWEEN x.OUTGATE_TIME AND x.INGATE_TIME)) as SEAL_EMPTY,
                                (SELECT s.SEAL_NO || '~' || s.ADD_PATH1 ||'~' || s.SEAL_ADD_FILE1 FROM MFEDI.TCS_BKG_CNTR_SEAL S WHERE s.CNTR_PID =  
                                    (select max(tbcse.CNTR_PID) from mfedi.TCS_BKG_CNTR_SEAL tbcse where tbcse.CNTR_NO = x.CNTR_NO and TO_CHAR(NVL(tbcse.UP_DATE,tbcse.REG_DATE),'yyyymmdd') BETWEEN x.OUTGATE_TIME AND x.INGATE_TIME)) as SEAL_FULL 
                            FROM  ( 
                                select *  
                                from ( 
                                        SELECT
                                            tck.cntr_seq,
                                            tck.carrier_code,
                                            tck.ie_type,
                                            tck.cntr_no,
                                            tck.bkg_no,
                                            tck.bl_no,
                                            tck.car_code,
                                            tck.mobile_no,
                                            tck.posi_addr,
                                            tck.OUT_DUE_DATE,
                                            tck.RET_DUE_DATE,
                                            tck.seal_no,
                                            tck.cntr_status,
                                            ROW_NUMBER() OVER  (PARTITION BY tckh.cntr_seq
                                                                ORDER BY
                                                                    (
                                                                        CASE WHEN tckh.cntr_status IN ('41',
                                                                        '59') THEN NVL(tckh.outgate_time, tckh.flow_id)
                                                                        WHEN tckh.cntr_status IN ('73',
                                                                        '78') THEN NVL(tckh.ingate_time, tckh.flow_id)
                                                                        ELSE tckh.flow_id
                                                                END) DESC ) AS rnk,
                                            tckh.flow_id,
                                            tckh.route,
                                            tckh.ETRANS_DRIVING_SEQ,
                                            tck.CODECO_OUTGATE_TIME AS OUTGATE_TIME,
                                            tck.OUTGATE_CY,
                                            otct.TERMINAL_NAME AS OUTGATE_NAME,
                                            otcc.WGS84_X AS outgate_wgs84_x,
                                            otcc.wgs84_y AS outgate_wgs84_y,
                                            tck.CODECO_INGATE_TIME AS INGATE_TIME,
                                            tck.INGATE_CY,
                                            itct.TERMINAL_NAME AS INGATE_NAME,
                                            itcc.WGS84_X AS ingate_wgs84_x,
                                            itcc.wgs84_y AS ingate_wgs84_y,
                                            tck.DOOR_WGS84_X,
                                            tck.DOOR_WGS84_Y,
                                            tck.WGS84_X,
                                            tck.WGS84_Y
                                        FROM
                                            tck,
                                            mfedi.TMS_CNTR_KEY_HIS tckh,
                                            mfedi.TERMINAL_CODE_TBL otct,
                                            mfedi.TMS_CODE_CENTER otcc,
                                            mfedi.TERMINAL_CODE_TBL itct,
                                            mfedi.TMS_CODE_CENTER itcc
                                        WHERE
                                            tck.CNTR_SEQ = tckh.CNTR_SEQ
                                            AND tck.OUTGATE_CY = otct.TERMINAL(+)
                                            AND tck.OUTGATE_CY = otcc.CENTER_CD(+)
                                            AND tck.INGATE_CY = itct.TERMINAL(+)
                                            AND tck.INGATE_CY = itcc.CENTER_CD(+)
                                ) 
                                where rnk = 1 
                                ) x
                                ,( 
                                        select *  
                                        from ( 
                                            SELECT
                                            tck.cntr_seq AS cntr_seq_y,
                                                tckh.flow_id AS flow_id_y,
                                                tckh.route route_y,
                                                tckh.sender_id sender_id_y,
                                                cu.COM_NAME,
                                                cu.COM_PHONE, 
                                                ROW_NUMBER() OVER (partition by tckh.cntr_seq order by tckh.cntr_seq, tckh.flow_id desc) as rnk_y 
                                            FROM
                                                tck,
                                                mfedi.TMS_CNTR_KEY_HIS tckh,
                                                mfedi.CODE_USER cu
                                            WHERE
                                                tck.CNTR_SEQ = tckh.CNTR_SEQ
                                                AND tckh.route = 'COPINO'
                                                AND tckh.cntr_status IN ('41')
                                                AND tckh.SENDER_ID = cu.KLNET_ID(+)      
                                        ) 
                                        where rnk_y = 1 
                                    ) y 
                            where x.cntr_seq = y.cntr_seq_Y(+) 
                            order by x.cntr_seq desc
                        ) z
                        where 1=1
                      AND z.OUTGATE_TIME > '${request.body.outgateTime}'
                      AND z.INGATE_TIME < '${request.body.ingateTime}'
                )	w  
                WHERE 1=1   
                AND rnum <= :page_index * :page_size
                AND rnum > ((:page_index-1) * :page_size)
                `
    let binds ={page_index:request.body.page_index, page_size:request.body.page_size}
        console.log(sql)
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql.toUpperCase(),binds,{outFormat:oraclePool.OBJECT});
        console.log(result.rows.length)
        if (result.rows.length > 0) {
            // console.log('result>>>' ,result)
            response.status(200).send(result.rows);	
        } else {
            return response.status(200).send({msg:'조회된 데이터가 존재 하지 않습니다.'});  
        }            
    }catch(err){
        console.log(err)
        response.status(400).send("[ERROR]"+ err);
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.log(err)
                response.status(400).send("Execute Error " + err);
            }
        }
    }
}
const getInlandDriveDetail = async (request, response) => {
    let conn;
    try{
    console.log(request.body);
    
 
    let sql = ` 
                select  
                case when nvl(b.outgate_cy, b.ingate_cy) is not null 
                        then (select terminal_name from MFEDI.TERMINAL_CODE_TBL where terminal = nvl(b.outgate_cy, b.ingate_cy))
                    else ( case when b.route =  'ETRANS_DRIVE' then '드라이빙'  
                                when b.route = 'COARRI_EXPORT' then '적하' 
                                when b.route = 'COARRI_IMPORT' then '양하' 
                                else '기타' end ) 
                end as main_kind, 
                case when d.code_name_kr is not null  
                        then d.code_name_kr 
                    else ( case when b.route =  'ETRANS_DRIVE' then '드라이빙'  
                                when b.route = 'COARRI_EXPORT' then '적하' 
                                when b.route = 'COARRI_IMPORT' then '양하' 
                                else '기타' end ) 
                end as detail_kind,  
                TO_CHAR(TO_DATE(substr(case  
                    when b.cntr_status in ('41', '59') then nvl(b.outgate_time, b.flow_id) 
                    when b.cntr_status in ('73', '78') then nvl(b.ingate_time, b.flow_id) 
                    end, 1, 12),'YYYYMMDDHH24MI'),'YYYY/MM/DD HH24:MI') as base_date,    
                c.addr, b.car_code, b.car_no, b.mobile_no, e.COM_NAME, e.COM_NO, e.COM_PHONE ,
                c.wgs84_x, c.wgs84_y 
                from mfedi.TMS_CNTR_KEY a, mfedi.TMS_CNTR_KEY_HIS b, mfedi.TCS_MOBILE_EVENT c, MFEDI.TCS_CODE_INFO d, MFEDI.CODE_USER e
                where a.cntR_seq = :cntr_seq
                and a.cntr_seq = b.cntr_seq  
                and b.ETRANS_DRIVING_SEQ = c.SEQ(+) 
                AND b.cntr_status = d.CODE_ID(+) 
                and d.CODE_GROUP_ID(+) = 'EVENT' 
                and b.SENDER_ID = e.KLNET_ID(+) 
                order by a.cntr_seq, base_date
                `
    let binds ={cntr_seq:request.body.cntr_seq}
        console.log(sql)
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql.toUpperCase(),binds,{outFormat:oraclePool.OBJECT});
        console.log(result.rows.length)
        if (result.rows.length > 0) {
            console.log('result>>>' ,result)
            response.status(200).send(result.rows);	
        } else {
            return response.status(200).send({msg:'조회된 데이터가 존재 하지 않습니다.'});  
        }            
    }catch(err){
        console.log(err)
        response.status(400).send("[ERROR]"+ err);
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.log(err)
                response.status(400).send("Execute Error " + err);
            }
        }
    }
}


module.exports = {
	    getHotInfo,
        getTrackingList,
        getCustomLineCode,
        getInlandDriveList,
        getInlandDriveDetail,
	}