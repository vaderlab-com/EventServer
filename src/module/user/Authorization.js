const
    Events          = require('../core/event_emitter'),
    request         = require('request-promise'),
    configuration   = require('../../configuration.js'),

    E_REQ_INIT      = 'auth.request.init',
    E_REQ           = 'auth.request',
    E_REQ_ERR       = 'auth.request.error'
;

let vaderlab_config;

function _create_request(auth_key, bearer) {
    const
        opts        = {}
    ;

    opts.url = create_url('user/current.json');
    opts.method = 'GET';
    opts.json = true;

    if(auth_key) {
        opts.qs = {
            api_key: auth_key
        }
    }

    if(bearer) {
        opts.headers = {
            'Authorization': bearer
        };
    }

    Events.emit(E_REQ_INIT, opts);

    return request(opts)
        .then(data => {
            Events.emit(E_REQ, data);
            return data;
        })
        .catch(e => {
            Events.emit(E_REQ_ERR, e);

            throw e;
        })
    ;

}

function get_user_by_bearer(bearer) {
    return _create_request(null, bearer);
}

function get_user_by_api_key(key) {
    return _create_request(key);
}

function auth_user(key_or_bearer) {
    if(typeof key_or_bearer !== 'string') {
        return false;
    }

    if(key_or_bearer.toLowerCase().indexOf('bearer') === 0) {
        return get_user_by_bearer(key_or_bearer);
    }

    return get_user_by_api_key(key_or_bearer);
}

function get_parameter(key, def, reset) {
    if(!vaderlab_config || reset) {
        vaderlab_config = configuration.get_configuration().vaderlab;
    }

    return vaderlab_config[key] ? vaderlab_config[key] : def;
}

function create_url(path) {
    let burl = get_parameter('base_api_url');
    if(burl.slice(-1) !== '/') {
        burl += '/';
    }

    return burl + path;
}

module.exports = {
    'auth_user': auth_user
};