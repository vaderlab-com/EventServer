const
    user_collection_conn = require('../../module/user/UserConnections'),
    event_emitter        = require('../../module/core/event_emitter'),
    permissions          = require('../../module/permission/permission'),

    E_ACT_NOTIFY         = 'action.notify',
    E_ACT_NOTIFY_ERR     = 'action.notify.error'
;

function notification_action(message_data, sender_socket) {
    const
        rec_id      = message_data.user_id,
        rec_message = message_data.message,
        s_s_id      = sender_socket.id,
        s_u_id      = sender_socket.user_id,
        sender      = sender_socket.user,
        sender_r    = sender.roles
    ;

    if(!permissions.check_access(sender, 'ROLE_USER_NOTIFIER')) {
        return
    }

    event_emitter.emit(E_ACT_NOTIFY, {
        message: rec_message,
        user_id: rec_id,
        sender_socket: {
            id: s_s_id,
            user_id: s_u_id,
        }
    });

    return user_collection_conn.send(rec_id, rec_message, sender_socket);
}


module.exports = notification_action;