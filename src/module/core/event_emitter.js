const
    Event_Emitter = require('events'),
    event_emitter = new Event_Emitter(),

    E_EMIT        = 'event.emit',
    E_ADD_LSTNR   = 'event.add.listener',
    E_DEL_LSTNR   = 'event.remove.listener'
;

function emit(type, ...args) {
    event_emitter.emit.apply(event_emitter, [E_EMIT, { type: type, args: args }]);
    args.unshift(type);

    return event_emitter.emit.apply(event_emitter, args);
}

function on(type, listener) {
    return addListener(type, listener);
}

function addListener(type, listener) {
    event_emitter.emit(E_ADD_LSTNR, { type: type, listener: listener });

    return event_emitter.addListener(type, listener);
}

function removeListener(type, listener) {
    event_emitter.emit.call(event_emitter, E_DEL_LSTNR, { type: type, listener: listener});

    return event_emitter.removeListener(type, listener);
}


module.exports = {
    E_EMIT:             E_EMIT,
    E_ADD_LSTNR:        E_ADD_LSTNR,
    E_DEL_LSTNR:        E_DEL_LSTNR,

    emit:               emit,
    on:                 on,
    addListener:        addListener,
    removeListener:     removeListener
};