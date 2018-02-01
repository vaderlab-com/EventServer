const
    { createLogger, format, transports } = require('winston'),
    { combine, timestamp, printf } = format,
    Path    = require('path'),
    Config  = require('../../configuration'),
    Events  = require('../core/event_emitter'),

    log_config = Config.get_configuration().logs
;

/**
 *
 * @param type
 * @param config
 * @returns {*}
 * @private
 */
function _create_transport(type, config) {
    let transport;
    if(!config['level']) {
        config['level'] = log_config.level;
    }

    switch (type.toLowerCase()) {
        case 'console':
            transport = new transports.Console(config);
            break;
        case 'file':
            const log_file = Path.resolve(config.filename);
            config.filename = log_file;
            transport = new transports.File(config);
            break;
        default:
            throw new Error('Transport type "' + type + '"for logger is not supported');
    }

    return transport;
}

/**
 *
 * @returns {Array}
 */
function get_transports() {
    const
        transports_configs  = log_config.transports,
        transports_enabled  = log_config.transports_enabled,
        transports = []
    ;

    for(let i = 0; i < transports_enabled.length; i++) {
        const tmp_type  = transports_enabled[i];
        const tmp_cnf   = transports_configs[tmp_type];

        transports.push(_create_transport(tmp_type, tmp_cnf));
    }

    return transports;
}


const get_format = printf(info => {
    return `${info.timestamp} [${info.level}] ${info.message}`;
});

let logger = createLogger({
    transports: get_transports(),
    format: combine(
        timestamp(),
        get_format
    ),

});



Events.addListener(Events.E_EMIT, (data) => {
    const msg = {
        EVENT: data.type,
        ARGS: data.args
    };

    logger.log('debug', JSON.stringify(msg));
});


module.exports = logger;