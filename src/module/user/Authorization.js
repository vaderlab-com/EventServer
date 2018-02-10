const
    Events          = require('../core/event_emitter'),
    configuration   = require('../../configuration.js'),
    URL             = require('url'),
    Http            = require('http'),
    Https           = require('https'),
    E_REQ_INIT      = 'auth.request.init',
    E_REQ           = 'auth.request',
    E_REQ_ERR       = 'auth.request.error';

let vaderlab_config;

function _create_request(auth_key, bearer) {
    const
        url = create_url('user/current.json'),
        method = 'GET',
        query = {},
        headers = {}
        ;

    const parsedUrl = URL.parse(url);

    if(auth_key) {
        parsedUrl.path += '?api_key=' + auth_key;
    }

    if(bearer) {
        headers.Authorization = bearer;
    }

    const opts = {
        protocol: parsedUrl.protocol,
        host: parsedUrl.hostname,
        path: parsedUrl.path,
        method: method.toLowerCase(),
        headers: headers,
        searchParams: query,
        port: parsedUrl.port
    };

    Events.emit(E_REQ_INIT, opts);

    return new Promise((success, reject) => {
        const req = Http.request(opts, (res) => {
            let reqData = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                reqData += chunk;
            });

            res.on('end', () => {
                try {
                    const tmp = JSON.parse(reqData);
                    Events.emit(E_REQ, tmp);
                    success(tmp);
                } catch (e) {
                    reject('problem with request: ${e.message}');
                }
            });

            req.on('error', (e) => {
                Events.emit(E_REQ_ERR, e);
                reject('problem with request: ${e.message}');
            });
        });

        req.end();
    });
}

function get_user_by_bearer(bearer) {
    return _create_request(null, bearer);
}

function get_user_by_api_key(key) {
    return _create_request(key);
}

function auth_user(key_or_bearer) {
    if(typeof key_or_bearer !== 'string') {
        return;
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