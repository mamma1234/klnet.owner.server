'use strict';

const pgsqlPool = require("../pool.js").pgsqlPool
const basicauth = require("basic-auth");
const multer = require('multer');
const fs = require('fs');
// const sUser = require('../../models/sessionUser');
const moment = require('moment');
const requestIp = require('request-ip');
const log = require('../../log/log');
moment.tz.setDefault('Asia/Seoul');
        
    const notice = (request, response) => {
        console.log(request.body)
    
        let sql = " select z.* from ( ";
            sql += " select (row_number() over(order by a.insert_date desc)) as num, a.board_id, a.user_no,a.author_name, "
            sql += " a.title, (select count(*) from own_board_hit where board_id = a.board_id) as hit_count,to_char(a.insert_date, 'YYYY-MM-DD hh24:mi') as insert_date, a.content, "
            sql += " case when a.insert_date between current_timestamp + '-7days' and now() then 'Y' else 'N'  end as new_notice, "
            sql += " (select array_to_json(array_agg(b)) from own_board_attach b where b.board_id = a.board_id) as attach_files ,"
            sql += " case when a.plism_yn = 'Y' and a.pan_yn = 'Y' and a.weidong_yn = 'Y' then 'ALL' else "
            sql += " case when a.plism_yn = 'Y' and a.pan_yn = 'N' and a.weidong_yn = 'N' then 'PLISM' else "
            sql += " case when a.plism_yn = 'N' and a.pan_yn = 'N' and a.weidong_yn = 'Y' then 'WEIDONG' else "
            sql += " case when a.plism_yn = 'N' and a.pan_yn = 'Y' and a.weidong_yn = 'N' then 'PAN' else "
            sql += " case when a.plism_yn = 'Y' and a.pan_yn = 'Y' and a.weidong_yn = 'N' then 'PLISM PAN' else "
            sql += " case when a.plism_yn = 'Y' and a.pan_yn = 'N' and a.weidong_yn = 'Y' then 'PLISM WEIDONG' else "
            sql += " case when a.plism_yn = 'N' and a.pan_yn = 'Y' and a.weidong_yn = 'Y' then 'PAN WEIDONG' end end end end end end end as service, "
            sql += " floor(count(*) over()/10+1) as tot_page,count(*) over() as tot_cnt,floor(((row_number() over()) -1) /10 +1) as curpage, to_char(board_to,'YYYY-MM-DD') as board_to " 
            sql += " from own_board a "
            sql += " where 1=1 "

            if(request.body.url) {
                sql += " and now() between board_from and board_to "
            }
        
            if(request.body.service ==="plismplus") {
                sql += " and plism_yn = 'Y' "
            }else if(request.body.service ==="pan") {
                sql += " and pan_yn = 'Y'"
            }else if(request.body.service ==="weidong") {
                sql += " and weidong_yn ='Y' "
            }
            if(request.body.gubun) {
                if(request.body.gubun === "0") {
                    sql += " and (title like '%"+request.body.keyword+"%' or content like '%"+request.body.keyword+"%' or author_name like '%"+request.body.keyword+ "%') "
                }else if(request.body.gubun === "1") {
                    sql += " and (title like '%"+request.body.keyword+"%' or content like '%"+request.body.keyword+"%') "
                }else if(request.body.gubun === "2") {
                    sql += " and author_name like '%"+request.body.keyword+"%' ";
                }
            }
            sql += " order by insert_date desc "
            if(request.body.count) {
                sql += " limit " + request.body.count
            }
            sql += " )z  "
            if(request.body.num) {
              sql += " where curpage='"+request.body.num+"'"
            }
            
        console.log(sql)
        log.info( sql );
        ;(async () => {
            const client = await pgsqlPool.connect();
            try {
                const result = await client.query(sql);
                response.status(200).json(result.rows);
            } finally {
                client.release();
            }
        })().catch(err =>  response.status(400).json(err));
    }



    const saveNotice = (request, response) => {
        let sql = {}


        if(request.body.boardId) {
            sql = {
                text : ` UPDATE public.own_board SET 
                        title=$1, 
                        content=$2, 
                        board_to=$3,
                        plism_yn=$4,
                        pan_yn=$5, 
                        weidong_yn=$6 
                        where board_id = $7 
                        returning board_id `,
                values:[request.body.title, request.body.content, request.body.boardEnd, request.body.plism?'Y':'N',request.body.pan?'Y':'N',request.body.weidong?'Y':'N',request.body.boardId]
            }
        }else {
            sql = {
                text: ` INSERT INTO public.own_board (user_no, title, content,  author_name, board_to,plism_yn, pan_yn, weidong_yn )
                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8) returning board_id
                `,
                values:[request.body.userno, request.body.title, request.body.content, request.body.username, request.body.boardEnd, request.body.plism?'Y':'N',request.body.pan?'Y':'N',request.body.weidong?'Y':'N']
            }
        }
        
        console.log(sql);
        log.info(sql)
        ;(async () => {
            const client = await pgsqlPool.connect();
            try {
                const result = await client.query(sql);
                response.status(200).json(result.rows[0]);
            } finally {
                client.release();
            }
        })().catch(err => {console.log(err);response.status(400).send(err)})
    }


    const saveNoticeFiles = (request, response) => {
        saveFile(request, response, function(err){
            if(err){ 
                return response.status(200).json({success:0, result:err});
            } else {
                return response.status(200).json({success:1});

            }
        })
    }
    const storage = multer.diskStorage({ 
        destination: function(req, file, cb){
            var rootPath;
                

            if(req.headers && req.headers.referer.indexOf('localhost') > 0) {
                rootPath = "./files/";
            } else {
                rootPath = "/OWNER/uploads/notice/";
            } 
        
        
            if(!fs.existsSync(rootPath)) {
                fs.mkdirSync(rootPath);
            }
                
            cb(null, rootPath);
            
        },
        filename: function(req, file, cb){
            (async () => {
                pgsqlPool.connect(function(err,conn,release) {
                    if(err){
                        cb('연결 할 수 없습니다.', null);
                    } else {
                        var sequense = "";
                        var savePath;
                        let fileName = file.originalname;
                        if(req.headers && req.headers.referer.indexOf('localhost') > 0) {
                            savePath = "./downLoadFile/";
                        } else {
                            savePath = "/OWNER/uploads/notice/";
                        }

                        ;(async () => {
                            const client = await pgsqlPool.connect();
                            try {
                                const result = await client.query(" select * from own_board_attach where board_id = "+ req.body.boardId + " and board_file_seq ='2'");
                                
                                if(result) {
                                    if(result.rows.length > 0) {
                                        sequense = '1';
                                    }else {
                                        sequense = '2';
                                    }
                                    let renameFile = checkFile(savePath, file.originalname,req.body.userno,sequense);
                    
                                    if(req.body.boardId === undefined || fileName === undefined || savePath === undefined){
                                        cb('저장 할 수 없습니다.', null);
                                    } else {
                                        let sql = "";
                                        sql += " INSERT INTO public.own_board_attach "
                                        sql += " (board_id, file_name, file_path, board_file_seq, real_file_name) "
                                        sql += " VALUES( "
                                        sql += " '"+req.body.boardId+"', ";
                                        sql += " '"+renameFile+"', ";
                                        sql += " '"+savePath+"', ";
                                        sql += " '"+sequense+"', ";
                                        sql += " '"+fileName+"')";
                                        
                                        log.info( sql )
                                        
                                        conn.query(sql, function(err,result){
                                            if(err){
                                                log.error("err" + err);
                                                if(err.code ==="23505") {
                                                    cb('PK 중복 오류.', null);
                                                }else {
                                                    cb('오류로 인하여 실행 할 수 없습니다.', null);
                                                }
                                                
                                            }
                                            
                                            if( result ) {
                                                cb(null,renameFile);
                                            }
                                            release();
                                        });
                                    }
                                }
                            } finally {
                                client.release();
                            }
                        })().catch(err => {log.error(err);})
                        
                    }
                });
            })().catch(err => setImmediate(() => {cb('오류가 발생했습니다.', null); }))
            
        }
    });

    const saveFile = (multer({storage:storage}).fields([{name:'file1',maxCount:1},{name:'file2',maxCount:1}]));

    const deleteBoardWithFile = (request,response) => {
        log.info(request.body);

        if(request.body.param.attach_files) {
            request.body.param.attach_files.forEach((value,index)=> {
                fs.access(value.file_path+value.file_name, fs.constants.F_OK, (err) => {
                    if(err) {
                        log.error(value.file_path+value.file_name+' 해당 파일이 경로에 없음. ')
                    }
                    fs.unlink(value.file_path+value.file_name,err => {
                        if(err) {
                            log.error(value.file_path+value.file_name+'삭제 할 수 없음');
                        }
                    })
                })
            })
            if(request.body.param.board_id) {
                let sql ="";
                sql += " DELETE FROM public.own_board WHERE board_id= " + request.body.param.board_id + " ;"
                sql += " DELETE FROM public.own_board_attach WHERE board_id="+request.body.param.board_id + " ;"
                sql += " DELETE FROM public.own_board_hit WHERE board_id="+request.body.param.board_id + " ;"
                log.info(sql);
                ;(async () => {
                    const client = await pgsqlPool.connect();
                    try {
                        const result = await client.query(sql);
                        
                        if(result) {
                            response.status(200).send('success');
                        }
                    } finally {
                        client.release();
                    }
                })().catch(err => {log.error(err);response.status(400).send(err)})
            }else {
                response.status(400).send('error')
            }
        }else {
            if(request.body.param.board_id) {
                let sql ="";
                sql += " DELETE FROM public.own_board WHERE board_id= " + request.body.param.board_id + " ;"
                sql += " DELETE FROM public.own_board_attach WHERE board_id="+request.body.param.board_id + " ;"
                sql += " DELETE FROM public.own_board_hit WHERE board_id="+request.body.param.board_id + " ;"
                log.info(sql);
                ;(async () => {
                    const client = await pgsqlPool.connect();
                    try {
                        const result = await client.query(sql);
                        
                        if(result) {
                            response.status(200).send('success');
                        }
                    } finally {
                        client.release();
                    }
                })().catch(err => {log.error(err);response.status(400).send(err)})
            }else {
                response.status(400).send('error')
            }
        }


    }

    const boardFileDelete = (request, response) => {
        log.info(request.body)

        fs.access(request.body.param.path+request.body.param.rename, fs.constants.F_OK, (err) => {
            log.info('path===',request.body.param.path+request.body.param.rename)
            if(err) {
                response.status(200).send('삭제 할 수 없는 파일입니다.');
                return;
            }
            fs.unlink(request.body.param.path+request.body.param.rename,err => {
                if(err) {
                    response.status(200).send('삭제 할 수 없는 파일 입니다.');
                    return;
                }
                let sql = ""
                sql += " DELETE FROM public.own_board_attach WHERE board_id= "+request.body.param.boardId
                sql += " AND board_file_seq='"+request.body.param.seq+"' "
                log.info(sql);
                ;(async () => {
                    const client = await pgsqlPool.connect();
                    try {
                        const result = await client.query(sql);
                        if(result.rowCount === 1) {
                            response.status(200).send('success');
                        } 
                    } finally {
                        client.release();
                    }
                })().catch(err => {log.error(err);response.status(400).send(err)})

            })

            
            
        })
        // fs.unlink(path.join(__dirname,request.body.file_path,fileName))

        


    }


    const getBoardMainList = (request, response) => {
        //순번","제목", "작성자", "조회수", "작성일"
        log.info(request.body);
            const sql = {
            text: "select * from (select board_id, title, content, author_name, (select count(*) from own_board_hit where board_id = z.board_id) as hit_count, to_char(insert_date, 'YYYY-MM-DD hh24:mi') as insert_date,to_char(insert_date, 'YYYY-MM-DD') as insert_date2, "
            +" floor(count(*) over()/6) as tot_page,count(*) over() as tot_cnt,floor(((row_number() over()) -1) /5 +1) as curpage from own_board z "
            +" order by insert_date desc) a where curpage=$1",
            values: [request.body.num]
                // rowMode: 'array',
            }
            log.info( sql )
            ;(async () => {
                const client = await pgsqlPool.connect();
                try {
                    const result = await client.query(sql);
                    
                    if(result) {
                        response.status(200).send(result.rows);
                    }
                } finally {
                    client.release();
                }
            })().catch(err => {log.error(err);response.status(400).send(err)})
    }
        
    
    const getBoardDetail = (request, response) => {
        const ipaddr = request.headers['x-forwarded-for'] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
        
        let sql = "";
        sql += " insert into own_board_hit (board_id, ip) values( "
        sql += request.body.board_id +", "
        sql += "'"+ipaddr+"') on conflict on constraint own_board_hit_pk do nothing ;" 
        sql += " select board_id, user_no, title, content, author_name, (select count(*) from own_board_hit where board_id = a.board_id) as hit_count, to_char(insert_date, 'YYYY-MM-DD hh24:mi') as insert_date ",
        sql += " from own_board a "
        sql += " where board_id = "+request.body.board_id
        // }
        log.info( sql )
        pgsqlPool.connect(function(err,conn,release) {
            if(err){
                log.error("err" + err);
                response.status(400).send(err);
            } else {

                conn.query(sql, function(err,result){
                    release();
                    if(err){
                        log.error(err);
                        response.status(400).send(err);
                    } else {
                        if(result[1] !== null) {
                            
                            response.status(200).json(result[1].rows);
                        } else {
                            response.status(200).json([]);
                        }
                    }
                });
            }


        });
    }

    
    const updateBoardHits = (request, response) => {
        const ipaddr = request.headers['x-forwarded-for'] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
        let sql ="";
        sql += " insert into own_board_hit (board_id, ip) values( "
        sql += request.body.board_id +", "
        sql += "'"+ipaddr+"') on conflict on constraint own_board_hit_pk do nothing returning *  " 
            
        log.info( sql )
        ;(async () => {
            const client = await pgsqlPool.connect();
            try {
                const result = await client.query(sql);
                
                response.status(200).json(result.rowCount);
            } finally {
                client.release();
            }
        })().catch(err => {
            log.error(err)
            response.status(400).json(err)
        })
    }

    const saveBoard = (request, response) => {

        let sql = {};
        if(request.localUser == undefined){
            response.status(400).send("error");
        } else{
            if(request.body.board_id != null && request.body.board_id != undefined && request.body.board_id != ""){
                sql = {
                    text: " update own_board  "
                    +" set title = $1,"
                    +"     content = $2,"
                    +"     author_name = $3"
                    +" where board_id = $4"
                    +"  returning board_id ",
                    values: [request.body.title,
                            request.body.content,
                            request.body.author_name,
                            request.body.board_id],
                }
            } else{
                sql = {
                text: " insert into own_board  "
                +" (user_no, title, content, author_name, insert_date) "
                +" values ( $1, $2, $3, $4, now() )"
                + " returning board_id ",
                values: [request.localUser.userno,
                        request.body.title,
                        request.body.content,
                        request.body.author_name],
                }
            }
            log.info( sql )
            pgsqlPool.connect(function(err,conn,release) {
                if(err){
                    log.error("err" + err);
                    response.status(400).send(err);
                } else {

                    conn.query(sql, function(err,result){
                    	release();
                        if(err){
                            log.error(err);
                            response.status(400).send(err);
                        } else {
                            if(result != null) {
                                if( request.body.fileStateList != undefined && request.body.fileStateList != null ) {
                                    deleteAttach( request, response, result.rows );
                                }else {
                                    response.status(200).json(result.rows);
                                }
        
                            } else {
                                response.status(200).json([]);
                            }
                        }
                    });
                }
        
            });
        }
    }

    const deleteBoard = (request, response) => {

        const sql = {
            text: " delete from own_board  "
            +" where board_id = $1",
            values: [request.body.board_id],
        }
        log.info( sql )
        ;(async () => {
            const client = await pgsqlPool.connect();
            try {
                const result = await client.query(sql);
                response.status(200).json(result.rows);
            } finally {
                client.release();
            }
        })().catch(err =>  response.status(400).json(err));
    }

    const getBoardDataList = (request, response) => { //regexp_replace(content, '\n', '<br/>', 'g') as content
        //순번","제목", "작성자", "조회수", "작성일"
          var sql = "select * from (SELECT count(*) over()/10+1 as tot_page,floor(((row_number() over()) -1) /10 +1) as curpage, \n"
            + "board_id, title, content, author_name, , to_char(insert_date, 'YYYY-MM-DD hh24:mi') as insert_date \n"
            +" from (select * from own_board where 1=1" ;

            if(request.body.boardId !="" && request.body.boardId != undefined) {
                sql +=" and board_id = '"+request.body.boardId+"' \n";
            }
            if(request.body.title != "" && request.body.title != undefined) {
                sql +=" and title like '%"+request.body.title+"%' \n";
            }
            if(request.body.authorName !="" && request.body.authorName != undefined) {
                sql +=" and author_name = '"+request.body.authorName+"' \n";
            }
            sql += "order by board_id desc) b ) a \n"
                  +" where curpage ='"+request.body.num+"' \n";
              // rowMode: 'array',
          
          log.info( sql )
          ;(async () => {
            const client = await pgsqlPool.connect();
            try {
                const result = await client.query(sql);
                response.status(200).json(result.rows);
            } finally {
                client.release();
            }
        })().catch(err =>  response.status(400).json(err));
    }

    const saveAttach = (req, res, next) => {
        saveAttachFile(req, res, function(err){
          if(err instanceof multer.MulterError){
            return next(err);
          }else if (err){
            return next(err);
          }
          return res.json({success:1});
        })
    };
      
    const oldStorage = multer.diskStorage({
        destination: function(req, file, cb){
            let savePath = "uploads";
            if(req.body.menuType != undefined){
              if(req.body.menuType == "main"){
                savePath += "/notice";
              }
            }
            cb(null, "/OWNER/" + savePath);
        },
        filename: function(req, file, cb){
            let savePath = "uploads";
            let fileName = file.originalname;
            if(req.body.menuType != undefined){
              if(req.body.menuType == "main"){
                savePath += "/notice";
              }
            }
            
            let chkUpdate = true;

            JSON.parse(req.body.fileStateList).map(fileState => {
                if(fileState.file_name == file.originalname && fileState.state == "UPDATE"){
                    chkUpdate = false;
                }
            })
            if(chkUpdate) {
                fileName = checkFile("/OWNER/" + savePath, file.originalname);
                insertAttach(req.body.boardId, fileName, savePath);
            }
            cb(null, fileName);
        }
    });
    
    // const checkFile = (path, fileOriName) => {
    //     let chkFlag = true;
    //     let nameCnt = 1;
    //     let fileName= fileOriName.substring(0, fileOriName.lastIndexOf('.'));
    //     let fileType= fileOriName.substring(fileOriName.lastIndexOf('.'));
    //     let fileNameResult = fileOriName;

    //     console.log("파일명 : " + fileName);
    //     console.log("확장자 : " + fileType);
        
    //     chkFlag = fs.existsSync(path + '/' + fileOriName);

    //     while(chkFlag){
    //         fileNameResult = fileName + (++nameCnt) + fileType;
    //         chkFlag = fs.existsSync(path + '/' + fileNameResult);
    //     }
    //     console.log("변경된 파일명 : " + fileNameResult);

    //     return fileNameResult;
    // };
    const checkFile = (path, fileOriName,userno,seq) => { 
        let chkFlag = true;
        let nameCnt = 1;
        let renameFile = moment(new Date()).format('YYYYMMDDhhmmss')+"_"+userno+seq;
        let fileType= fileOriName.substring(fileOriName.lastIndexOf('.'));
        let fileNameResult = renameFile+fileType;
    
        chkFlag = fs.existsSync(path + renameFile);
    
        while(chkFlag){
            fileNameResult = renameFile + (++nameCnt) + fileType;
            chkFlag = fs.existsSync(path + fileNameResult);
        }
    
        return fileNameResult;
    };
    
    
    const insertAttach = (boardId, fileName, filePath) => {

        let sql = {};
        if(boardId == undefined || fileName == undefined || filePath == undefined){
            return false;
        } else{
            sql = {
            text: " insert into own_board_attach  "
            +" (board_id, file_name, file_path) "
            +" values ( $1, $2, $3)",
            values: [boardId,
                    fileName,
                    filePath],
            }
            log.info( sql )
            pgsqlPool.connect(function(err,conn,release) {
                if(err){
                    log.error("err" + err);
                    response.status(400).send(err);
                } else {
                    conn.query(sql, function(err,result){
                    	release();
                        if(err){
                            log.error("err" + err);
                            response.status(400).send(err);
                        }
                    });
                }
            });
        }
    }

    const saveAttachFile = (multer({storage: oldStorage}).array("files"));

    const getBoardAttach = (request, response) => {
        const sql = {
          text: "select board_id, file_name, file_path "
          +" from own_board_attach "
          +" where board_id = $1",
          values: [request.body.board_id]
            // rowMode: 'array',
        }
        log.info( sql )
        pgsqlPool.connect(function(err,conn,release) {
            if(err){
                log.error("err" + err);
                response.status(400).send(err);
            } else {
                conn.query(sql, function(err,result){
                	release();
                    if(err){
                        log.error(err);
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

    const deleteAttach = ( request, response, rows) => {

        let delFile = [];
        let delFileStr = "";

        request.body.fileStateList.map(file => {
            if(file.state == "DELETE"){
                const obj = {
                    file_name : file.file_name,
                    file_path : file.file_path
                }
                delFile.push(obj);
                delFileStr += (delFileStr == ""?"":",") + "'" + file.file_name +"'";
            }
        })
        if(delFile != [] && delFileStr != ""){
            const sql = " delete from own_board_attach "
                +" where board_id = '" + request.body.board_id + "' and file_name in (" + delFileStr + ")";
            log.info( sql )
            pgsqlPool.connect(function(err,conn,release) {
                if(err){
                    log.error("err" + err);
                    response.status(400).send(err);
                } else {
                    conn.query(sql, function(err,result){
                    	release();
                        if(err){
                            log.error(err);
                            response.status(400).send(err);
                        } else {
                            if(result != null) {
                                /*delFile.map(file => {
                                    fs.unlinkSync( file.file_path + "/" + file.file_name, function (err){
                                        console.log(err);
                                        response.status(400).send(error);
                                    });
                                });*/
                                response.status(200).json(rows);
                            } else {
                                response.status(200).json(rows);
                            }
                        }
                    });
                }
        
            });
        } else{
            response.status(200).json(rows);
        }
    }
module.exports = {
    notice,
    saveNotice,
    saveNoticeFiles,
    boardFileDelete,
    deleteBoardWithFile,
    getBoardMainList,
    getBoardDetail,
    saveBoard,
    deleteBoard,
    getBoardDataList,
    saveAttach,
    getBoardAttach,
    updateBoardHits,
}