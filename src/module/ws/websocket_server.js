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
    E_ERR_CONN      = 'websocket.err_conn',
    E_DISCONN       = 'websocket.disconnect',
    E_MSG           = 'websocket.message',
    E_ERR           = 'websocket.msg_err'
;



function create_server() {
    const listen_conf = {
        port: config.port
    };

    if(config.host) {
        listen_conf.host = config.host
    }

    return config.ssl ?
        create_ssl_server(listen_conf):
        create_no_ssl_server(listen_conf)
        ;
}

function create_ssl_server(listen_conf) {
    const
        p_key_dist  = Path.resolve(config.ssl_key),
        p_cert_dist = Path.resolve(config.ssl_cert),
        privateKey  = Fs.readFileSync(p_key_dist, 'utf8'),
        certificate = Fs.readFileSync(p_cert_dist, 'utf8'),

        credentials = { key: privateKey, cert: certificate },
        httpsServer = Https.createServer(credentials)
    ;

    httpsServer.listen(listen_conf);

    return new Wss.Server({
        server: httpsServer
    });
}

function create_no_ssl_server(listen_conf) {
    return new Wss.Server(listen_conf)
}


function terminate(conn) {
    const status = WebSocket.OPEN !== conn.OPEN;
    if (status) {
        conn.terminate();
        ws.close()
    }

    return status;
}

wss.on('connection', (ws, req) => {
    const id = Uuid();
    let approved = false;
    let waiting_auth = false;

    ws.id = id;
    ws.on('close', () => {
        _event_conn_emit(E_DISCONN, ws, req);
    });

    ws.on('error', function(err) {
        _event_conn_emit(E_ERR_CONN, ws, req, err);
    });

    _event_conn_emit(E_CONN, ws, req);


    if(terminate(ws)) {
        return;
    }

    ws.on('message', (message) => {
        if(!message) {
            _event_conn_emit(E_MSG, ws, req);
            return;
        }

        if(terminate(ws)) {
            return;
        }

        if(!approved) {

            if(waiting_auth) {
                return;
            }

            waiting_auth = true;

            User_Module.auth_user(message).then((user) => {
                ws.user_id = user.id;
                ws.user = user;
                User_Collection.append(ws);
                approved = true;
                ws.send('OK');
            }).catch((err) => {
                _event_conn_emit(E_ERR, ws, req, {
                    message: message,
                    err_message: err.message
                });
                //ws.send(err.message);
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