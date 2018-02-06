const

    Events          = require('../core/event_emitter'),

    connections     = {},

    E_CONN_APPEND   = 'conn.user.append',
    E_CONN_SEND     = 'conn.user.send',
    E_CONN_ERR      = 'conn.user.error',
    E_CONN_CLOSE    = 'conn.user.close',
    E_CONN_NONE     = 'conn.user.none'
;

function append(conn) {
    const user_id = conn.user_id;
    if(!connections[user_id]) {
        connections[user_id] = {};
    }

    _conn_evt_listeners(conn);
    connections[user_id][conn.id] = conn;

    Events.emit(E_CONN_APPEND, {
        connection_id: conn.id,
        user_id: user_id,
        user_connections: connections.length
    });
}

function get_connections(user_id) {
    return connections[user_id];
}

function send(user_id, data) {
    const
        conns = get_connections(user_id);
    let
        csize,
        conn_ids
    ;

    if(!conns) {

        Events.emit(E_CONN_NONE, {
            user_id: user_id
        });

        return false;
    }

    conn_ids = Object.keys(conns);
    csize = conn_ids.length;

    if(typeof data === 'object') {
        data = JSON.stringify(data);
    }

    for(let i = 0; i < csize; i++) {
        const
            tmp_c_id = conn_ids[i],
            tmp_conn = conns[tmp_c_id]
        ;

        try {
            Events.emit(E_CONN_SEND, {
                connection_id: tmp_conn.id,
                user_id: user_id,
                recipients_count: csize
            });

            tmp_conn.send(data);
        } catch(e) {
            Events.emit(E_CONN_ERR, {
                connection_id: tmp_conn.id,
                user_id: user_id,
                message: e.message
            });
        }
    }

    return true;
}

function _conn_evt_listeners(conn) {
    conn.on('close', () => {
        const
            user_id = conn.user_id,
            connid = conn.id,
            conns = get_connections(user_id),
            ckeys = Object.keys(conns),
            ckey_length = ckeys.length
        ;

        delete conns[connid];

        if(ckeys.length === 0) {
            delete connections[user_id]
        }

        Events.emit(E_CONN_CLOSE, {
            connection_id: connid,
            user_id: user_id,
            user_connections: ckey_length
        });
    });
}


module.exports = {
    'append': append,
    'send': send,
    'get_connections': get_connections
};
