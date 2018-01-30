const
    Uuid            = require('uuid/v1'),
    Wss             = require('ws'),
    Events          = require('../core/event_emitter'),
    Config          = require('../../configuration.js'),
    User_Module     = require('../user/Authorization.js'),
    User_Collection = require('../user/UserConnections'),
    routing         = require('./Routing'),
    config          = Config.get_configuration().event_server,
    wss             = new Wss.Server(config),


    E_CONN          = 'websocket.connection',
    E_DISCONN       = 'websocket.disconnect',
    E_MSG           = 'websocket.message',
    E_ERR           = 'websocket.msg_err'
;


wss.on('connection', (ws) => {
    const id = Uuid();
    let approved = false;

    ws.id = id;
    ws.on('close', () => {
        Events.emit(E_DISCONN, ws.id);
    });

    ws.on('message', (message) => {
        if(!message) {
            Events.emit(E_MSG, ws.id);
            return;
        }

        if(!approved) {
            User_Module.auth_user(message).then((user) => {
                ws.user_id = user.id;
                ws.user = user;
                User_Collection.append(ws);
                approved = true;
            }).catch((err) => {
                Events.emit(E_ERR, {
                    conn_id: ws.id,
                    err_message: err.message,
                    message: message
                });
                ws.close();
            });

            return;
        }

        if(!routing.execute_msg(message, ws)) {
            Events.emit(E_ERR, {
                conn_id: ws.id,
                user_id: ws.user_id,
                message: message
            });
        }

    });

    setTimeout(() => {
        if(!approved) {
            ws.close();
        }
    }, 200000);
});