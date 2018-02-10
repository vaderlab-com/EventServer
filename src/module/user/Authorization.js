const
    Events          = require('../core/event_emitter'),
    configuration   = require('../../configuration.js'),
    URL             = require('url'),
    Http            = require('http'),
    Https           = require('https'),
    Request         = require('request'),
    E_REQ_INIT      = 'auth.request.init',
    E_REQ           = 'auth.request',
    E_REQ_ERR       = 'auth.request.error';

let vaderlab_config;

function _create_request(auth_key, bearer) {
    const
        method = 'GET',
        query = {},
        headers = {}
        ;
    let url = create_url('user/current.json');

    const parsedUrl = URL.parse(url);

    if(auth_key) {
        url += '?api_key=' + auth_key;
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
        port: parsedUrl.port,
        query: parsedUrl.query,
        url: url
    };

    Events.emit(E_REQ_INIT, opts);

    const transport = parsedUrl.protocol === 'https' ? Https : Http;

    return new Promise((success, reject) => {


        Request({
            url: opts.url,
            headers: opts.headers,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                try {
                    const tmp = JSON.parse(body);
                    Events.emit(E_REQ, tmp);
                    success(tmp);
                } catch (e) {
                    Events.emit(E_REQ_ERR, e, body);
                    reject(e.message);
                }
            } else {
                Events.emit(E_REQ_ERR, error, body);
                reject(error);
            }
        });


        /*
        const req = transport.request(opts, (res) => {

            console.log(res);

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
                    Events.emit(E_REQ_ERR, e, reqData);
                    console.log(e.message);
                    reject(e.message);
                }
            });

            req.on('error', (e) => {
                Events.emit(E_REQ_ERR, e);
                console.log(e.message);
                reject('problem with request: ${e.message}');
            });
        });
        */

        //req.end();
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