const winston = require('winston');
const moment = require('moment');
require('moment-timezone')
const fs = require('fs')
const directory =  process.env.LOG_PATH
moment.tz.setDefault('Asia/Seoul');



const error = (text) => {

    const logger = winston.createLogger({
        level:'debug',
        transports:[
            new winston.transports.File({
                filename:`${process.env.LOG_PATH}/${moment().format('YYYY-MM-DD')}.log`,
                zippedArchive:false,
                format: winston.format.printf(
                    info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] - ${info.message}`
                )
            })
        ],
    })
    if(!process.env.LOG_PATH) {
        logger.add(new winston.transports.Console({
            format:winston.format.simple()
        }))
    }
    logger.error(text)
}
const info = (text) => {

    const logger = winston.createLogger({
        level:'debug',
        transports:[
            new winston.transports.File({
                filename:`${process.env.LOG_PATH}/${moment().format('YYYY-MM-DD')}.log`,
                zippedArchive:false,
                format: winston.format.printf(
                    info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] - ${info.message}`
                )
            })
        ],
    })
    if(!process.env.LOG_PATH) {
        logger.add(new winston.transports.Console({
            format:winston.format.simple()
        }))
    }
    logger.info(text)
}
const warning = (text) => {

    const logger = winston.createLogger({
        level:'debug',
        transports:[
            new winston.transports.File({
                filename:`${process.env.LOG_PATH}/${moment().format('YYYY-MM-DD')}.log`,
                zippedArchive:false,
                format: winston.format.printf(
                    info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] - ${info.message}`
                )
            })
        ],
    });
    if(!process.env.LOG_PATH) {
        logger.add(new winston.transports.Console({
            format:winston.format.simple()
        }))
    }
    logger.warn(text);

}
const debug = (text) => {

    const logger = winston.createLogger({
        level:'debug',
        transports:[
            new winston.transports.File({
                filename:`${process.env.LOG_PATH}/${moment().format('YYYY-MM-DD')}.log`,
                zippedArchive:false,
                format: winston.format.printf(
                    info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] - ${info.message}`
                )
            })
        ],
    })
    if(!process.env.LOG_PATH) {
        logger.add(new winston.transports.Console({
            format:winston.format.simple()
        }))
    }
    logger.debug(text)
}
module.exports ={
    error,
    info,
    warning,
    debug
}
