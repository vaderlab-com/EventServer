const
    Events = require('../core/event_emitter'),
    actions = {},
    params_format = ['action'],

    E_EXECUTE = 'router.execute',
    E_EXECUTE_ERR = 'route.execute.error_format',
    E_EXECUTE_R_NONE = 'router.execute.route.none',
    E_EXECUTE_R_EXC  = 'router.execute.route.exception'
;

function execute_msg(message, ws) {
    if(!message) {
        return null;
    }

    try {
        return _on_action(JSON.parse(message), ws);
    } catch (e) {
        Events.emit(E_EXECUTE_R_EXC, { error_msg: e.message, wsid: ws.id, executor: ws.user_id  });
    }

    return null;
}

function append_action(path, callable) {
    actions[path] = callable;
}

function _on_action(req, ws) {
    for(let i = 0; i < params_format.length; i++) {
        const tmp_format = params_format[i];
        if(!req[tmp_format]) {
            Events.emit(E_EXECUTE_ERR, { no_arg:  tmp_format, wsid: ws.id, executor: ws.user_id  });

            return false;
        }
    }

    const
        req_action = req.action,
        action = actions[req_action],
        data = req.data
    ;

    if(!action) {
        Events.emit(E_EXECUTE_R_NONE, { route: req_action, data: data, wsid: ws.id, executor: ws.user_id   });

        return false;
    }

    Events.emit(E_EXECUTE, { route: req_action, data: data, wsid: ws.id, executor: ws.user_id  });
    action.call(null, req.data || {}, ws);

    return true;
}

module.exports = {
    execute_msg: execute_msg,
    append_action: append_action
};