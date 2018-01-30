const
    routing = require('../../module/ws/Routing'),
    notification_action = require('./notification.js')
;


function init() {
    init_routes();
}


function init_routes() {
    routing.append_action('notify', notification_action);
}


module.exports = init;