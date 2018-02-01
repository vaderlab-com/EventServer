const
    Path            = require('path'),
    Uuid            = require('uuid/v1'),
    Wss             = require('ws'),
    Https           = require('https'),
    Fs              = require('fs'),
    Events          = require('../core/event_emitter'),
    Config          = require('../../configuration.js'),
    User_Module     = require('../user/Authorization.js'),
    User_Collection = require('../user/UserConnections'),
    routing         = require('./Routing'),
    config          = Config.get_configuration().event_server,
    wss             = create_server(),

    E_CONN          = 'websocket.connection',
    E_DISCONN       = 'websocket.disconnect',
    E_MSG           = 'websocket.message',
    E_ERR           = 'websocket.msg_err'
;



function create_server() {
    return config.ssl ?
        create_ssl_server():
        create_no_ssl_server()
        ;
}

function create_ssl_server() {
    const
        p_key_dist  = Path.resolve(config.ssl_key),
        p_cert_dist = Path.resolve(config.cert),
        privateKey  = fs.readFileSync(p_key_dist, 'utf8'),
        certificate = fs.readFileSync(p_cert_dist, 'utf8'),

        credentials = { key: privateKey, cert: certificate },
        httpsServer = https.createServer(credentials)
    ;

    httpsServer.listen(config.port);

    return new Wss.Server({
        server: httpsServer
    });
}

function create_no_ssl_server() {
    return new Wss.Server({
        port: config.port
    })
}

wss.on('connection', (ws, req) => {
    const id = Uuid();
    let approved = false;

    ws.id = id;
    ws.on('close', () => {
        _event_conn_emit(E_DISCONN, ws, req);
    });

    _event_conn_emit(E_CONN, ws, req);

    ws.on('message', (message) => {
        if(!message) {
            _event_conn_emit(E_MSG, ws, req);
            return;
        }

        if(!approved) {
            User_Module.auth_user(message).then((user) => {
                ws.user_id = user.id;
                ws.user = user;
                User_Collection.append(ws);
                approved = true;
            }).catch((err) => {
                _event_conn_emit(E_ERR, ws, req, {
                    message: message,
                    err_message: err.message
                });
                ws.close();
            });

            return;
        }

        if(!routing.execute_msg(message, ws)) {
            _event_conn_emit(E_ERR, ws, req, {
                message: 'Error execute message "' + message + '"'
            });
        }

    });

    setTimeout( () => {
        if(!approved) {
            ws.close();
        }
    }, config.auth_timeout );
});

function _event_conn_emit(type, ws, req, err) {
    const
        id          = ws.id,
        user_id     = ws['user_id'],
        config      = {
            ip: req.connection.remoteAddress || req.headers['x-forwarded-for']
        };

    if(user_id) {
        config['user_id'] = user_id;
    }

    if(err) {
        !err['message'] || (config.message = err.message);
        !err['err_message'] || (config.err_message =  err.err_message);
    }

    Events.emit(type, {
        id: ws.id,
        ip: req.connection.remoteAddress || req.headers['x-forwarded-for']
    });
}