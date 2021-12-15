'use strict';

const oraclePool = require("../pool.js").oraclePool
// const oracledb = require('oracledb');


const getCarrierInfo = (request, response) => {
	const sql = "SELECT A.line_code ,'['||A.LINE_CODE||'] '||B.CNAME_KR AS line_name "
        +" FROM TCS_ESHIP_CONFIG A,TCS_COMP_HEADER_TBL B"
	      +" WHERE A.KLNET_ID = B.KLNET_ID(+)"
        +" ORDER BY A.LINE_CODE ASC";

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

const getScheduleList = (request, response) => {
	console.log(">>>>>>log");
	console.log (">>PARAM1:"+request.body.carrierCode);
	console.log (">>PARAM2:"+request.body.startPort);
	console.log (">>PARAM3:"+request.body.endPort);
	console.log (">>PARAM4:"+request.body.startDate);
	console.log (">>PARAM5:"+request.body.endDate);
	console.log (">>PARAM6:"+request.body.vesselName);
	
	let sql = "SELECT SCH.VESSEL_NAME,SCH.VOYAGE_SID,SCH.VOYAGE_NO,SCH.LINE_CODE,SCH.PORT_CODE as START_PORT,PORT.PORT_CODE as END_PORT "
            + ",TO_CHAR(TO_DATE(SCH.ETD||SCH.ETD_TIME,'YYYYMMDDHH24MI'),'YYYY-MM-DD')AS START_DAY"
            + ",TO_CHAR(TO_DATE(PORT.ETA,'YYYYMMDDHH24MI'),'YYYY-MM-DD') AS END_DAY "
            + "FROM MFEDI.TCS_VSL_SCH@mfedi_real SCH,MFEDI.TCS_VSL_SCH_PORT@mfedi_real PORT"
            + " WHERE SCH.VOYAGE_SID = PORT.VOYAGE_SID "
	        + " AND SCH.LINE_CODE NOT IN ('CKC','DIF') ";
            if(request.body.carrierCode != "") {
            	sql= sql + "AND SCH.LINE_CODE ='"+request.body.carrierCode+"'";	
            }
            
            sql = sql+" AND SCH.ETD >= '"+request.body.startDate+"' "
            + "AND PORT.ETA <= '"+request.body.endDate+"'"
            + "AND SCH.PORT_CODE ='"+request.body.startPort+"' "
            + "AND PORT.PORT_CODE = '"+request.body.endPort+"' "
            + "AND PORT.ROUTE_SEQ = (SELECT MIN(X.ROUTE_SEQ) FROM MFEDI.TCS_VSL_SCH_PORT X WHERE X.VOYAGE_SID = SCH.VOYAGE_SID AND SCH.ETD <= X.ETA AND X.PORT_CODE=  '"+request.body.endPort+"') ";
            if(request.body.vesselName != "") {
            	sql = sql + "AND SCH.VESSEL_NAME LIKE '%"+request.body.vesselName+"%' ";	
            }
            sql = sql+ "AND SCH.IO_FLAG = 'O' "
            + "ORDER BY SCH.ETD";
            
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


const getScheduleDetailList = (request, response) => {
	
	console.log (">>PARAM1:"+request.body.carrierCode);
	
	let sql = "select 'LOC: '||b.port_code "
		    + ",TO_CHAR(TO_DATE(b.ETD),'YYYY-MM-DD')||' ['||TO_CHAR(TO_DATE(b.ETD,'YYYYMMDD'),'DY','NLS_DATE_LANGUAGE=KOREAN')||']' AS WEEKDAY "
		    + ",'T/T: '||NVL(to_date(b.etd) - to_Date((select max(eta) from TCS_VSL_SCH_PORT where  VOYAGE_SID = a.VOYAGE_SID and ROUTE_SEQ < b.ROUTE_SEQ)),0)||' Day' as LIST_TT "
		    + ",CASE WHEN TO_CHAR(SYSDATE,'YYYYMMDD') >= b.ETD  THEN 'Y' ELSE 'N' END AS PASS"
            + " from TCS_VSL_SCH@mfedi_real a, TCS_VSL_SCH_PORT@mfedi_real b "
            + "where a.VOYAGE_SID = b.VOYAGE_SID "
            + "and a.line_code='"+request.body.carrierCode+"' "
            + "AND a.VESSEL_NAME LIKE '%"+request.body.vesselName+"%' "
            + "and a.voyage_no='"+request.body.voyage+"' "
            + "AND a.port_code='"+request.body.startPort+"' "
            + "AND b.ROUTE_SEQ <= (SELECT MIN(X.ROUTE_SEQ) FROM MFEDI.TCS_VSL_SCH_PORT X WHERE X.VOYAGE_SID = a.VOYAGE_SID AND a.ETD <= X.ETA AND X.PORT_CODE= '"+request.body.endPort+"') "
            + "order by b.route_seq "
            
            console.log ("query:" +sql);

    oraclePool.getConnection(function(err,conn,done) {
        if(err){
            console.log("err" + err);
            response.status(400).send(err);
        } else {
            conn.execute(sql,{},(error, results) => {
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

const getPortCodeInfo = (request, response) => {
	  let sql = "";
	  const portCode=request.body.portCode.substr(0,3);
	console.log("입력Keyword:"+portCode);

	    sql = "SELECT P.PORT_CODE,P.PORT_NAME FROM MFEDI.CODE_PORT P"
		      +",MFEDI. TCS_CODE_PORT A "
		      +" WHERE P.PORT_CODE = A.ISO_PORT"
		      +" AND (P.PORT_CODE LIKE '%"+portCode+"%' or P.PORT_NAME LIKE '%"+portCode+"%')"
		      +" AND NVL(P.PORT_TYPE,' ') LIKE (CASE WHEN P.NATION_CODE = 'KR' THEN 'P' ELSE '%%' END)"
		      +" AND P.PORT_NAME IS NOT NULL"
		      +" AND A.LINE_CODE IN ( SELECT LINE_CODE FROM MFEDI.TCS_ESHIP_CONFIG)"
		      +" GROUP BY P.PORT_CODE,P.PORT_NAME";
	    
	    console.log("쿼리:"+sql);

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
                    // console.log(results.rows);
                    // response.send(results.rows);
            
                    response.status(200).json(results.rows);
                }
    
                conn.close();
                
            });
            // conn.release();
        }

    });
}

const getTerminalCodeList = async(request, response)=>{

    console.log(">>>>>> getTerminalCodeList log >>PARAM1:"+request.body.area);
	
    const sql = `select distinct b.terminal as "code", nvl(b.toc_name, b.terminal) as "name"
                from terminal_code_tbl a, code_berth b  
                where a.terminal = b.terminal 
                and location_code = :1 
                and b.terminal not like 'BS%'  
                and b.wharf_code not like 'W%'         
                order by "name", "code"`
   
    const binds = {1: request.body.area}
    let conn;
    try{
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql, binds, {outFormat:oraclePool.OBJECT});
        console.log(' result: ', result);
        response.status(200).json(result.rows);
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}
const getTerminalScheduleList = async(request, response)=>{

    const vesselName = request.body.vesselName;
    const start = request.body.startDate;
    const end = request.body.endDate;
    const terminal = request.body.terminal;
    const working = request.body.working;
    const area = request.body.area; 
    console.log(">>>>>> getTerminalScheduleList log >>:"+vesselName +'//'+ start+'//' + end+'//' + terminal+'//' + working+'//' + area);

    const sql = `
    SELECT
        DISTINCT b.port_krname AS port_name,
        D.TERMINAL AS terminal_name,
        D.TOC_NAME || '(' || D.TERMINAL || ')' AS f_terminal_name,
        a.vessel_name,
    CASE
            WHEN (a.im_voy IS NULL
            OR a.im_voy = '1')
            AND (a.ex_voy IS NULL
            OR a.ex_voy = '1') THEN ''
            ELSE COALESCE((
                CASE WHEN a.im_voy = '1' THEN NULL
                ELSE a.im_voy
        END),
            ' ') || ' / ' || COALESCE((
                CASE WHEN a.ex_voy = '1' THEN NULL
                ELSE a.ex_voy
        END),
            ' ')
    END AS voyage_no,
        TO_CHAR(TO_TIMESTAMP(a.load_begin_date, 'YYYYMMDDHH24'), 'YYYY-MM-DD HH24:MI') AS atb,
        (
        SELECT
            url
        FROM
            terminal_code_tbl x
        WHERE
            x.terminal = d.terminal ) AS terminal_url,
    CASE
            WHEN LENGTH(a.closing_time) = 6
            AND a.closing_time != '000000' THEN SUBSTR(load_begin_date, 1, 4) || '-' || SUBSTR(closing_time, 1, 2) || '-' || SUBSTR(closing_time, 3, 2) || ' ' || SUBSTR(closing_time, 5, 2) || ':00'
            ELSE ''
    END AS CLOSING_TIME,
        TO_CHAR(TO_TIMESTAMP(a.load_end_date, 'YYYYMMDDHH24'), 'YYYY-MM-DD HH24:MI') atd,
        a.carrier_code,
        TO_CHAR(a.unload_container, '9,999') unload_container,
        TO_CHAR(a.load_container, '9,999') load_container,
        TO_CHAR(a.shifting_container, '9,999') shifting_container,
        (
            CASE WHEN SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - a.load_begin_date) = -1 THEN (
                CASE WHEN SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - (SUBSTR (load_begin_date, 1, 4) || closing_time)) = -1 THEN '예정'
                ELSE '마감'
        END)
            ELSE (
                CASE WHEN SIGN(TO_CHAR (SYSDATE, 'YYYYMMDDHH24') - a.load_end_date) =- 1 THEN '작업중'
                ELSE '완료'
        END)
    END) AS STATUS,
        NVL((SELECT NVL(x.carrier_hname, x.carrier_name ) FROM mfedi.code_carrier x WHERE x.terminal = a.terminal AND x.carrier_code = a.carrier_code), a.carrier_name) AS line_nm ,
        SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - a.load_begin_date) ,
        load_begin_date ,
        SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - a.load_end_date),
        load_end_date
        , TO_CHAR(min(CALSCH_DATE) over (order by in_date) , 'YYYY-MM-DD HH24:MI')   as CALSCH_DATE
    FROM
        MFEDI.CALSCH A,
        MFEDI.CODE_PORT B,
        CODE_BERTH D
    WHERE
        1 = 1
        AND b.nation_code = 'KR'
        AND a.terminal = d.terminal
        AND d.terminal NOT LIKE 'BS%'
        AND d.wharf_code NOT LIKE 'W%'
        AND (
            CASE WHEN D.LOC = 'ONS' THEN 'USN'
            WHEN d.loc IN ('YMH',
            'SHG') THEN 'KPO'
            ELSE d.loc
    END) = SUBSTR (B.PORT_CODE,
        3)
        AND a.load_begin_date >= :1 || '00'
        AND a.load_begin_date <= :2 || '23'
        AND a.vessel_name LIKE '%' ||
    CASE
            WHEN :3 IS NOT NULL THEN :3
            ELSE ''
    END || '%'
    --|| '%'
    AND  a.terminal IN (${terminal} '' )
    AND
    CASE
            WHEN :5 = 'true' THEN SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - a.load_begin_date)
            ELSE 1
    END != -1
        AND
    CASE
            WHEN :5 = 'true' THEN SIGN(TO_CHAR(SYSDATE, 'YYYYMMDDHH24') - a.load_end_date)
            ELSE -1
    END = -1
    order BY  TERMINAL_NAME, atb`
   
    const binds = {1:start,2:end,3:vesselName,5:String(working)}
        console.log(sql)
    let conn;
    try{
        conn = await oraclePool.getConnection();
        const result = await conn.execute(sql, binds, {outFormat:oraclePool.OBJECT});
        // console.log(' result: ', result.rows);
        response.status(200).json(result.rows);
    }catch(err){
        console.log("[ERROR]",err); response.status(400).json(err); 
    }finally{
        if(conn){
            try{
                console.log('Connection closed');
                await conn.close();
            }catch(err){
                console.error(err)
            }
        }
    }
}


module.exports = {
    getCarrierInfo,
    getScheduleList,
    getPortCodeInfo,
    getScheduleDetailList,
    getTerminalCodeList,
    getTerminalScheduleList,
}