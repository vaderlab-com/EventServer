const
    winston = require('winston'),
    Config  = require('../../configuration'),
    Events  = require('../core/event_emitter'),

    log_level = Config.get_configuration('log_level')
;

function getTransports() {
    const console = new winston.transports.Console();
    return [
        console
    ];
}

winston.configure({
    transports: getTransports()
});


winston.level = 'debug';

Events.addListener(Events.E_EMIT, (data) => {

    const msg = {
        EVENT: data.type,
        ARGS: data.args
    };

    winston.log('debug', JSON.stringify(msg));
});

module.exports = winston;