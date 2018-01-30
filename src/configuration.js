const
    path = require('path'),
    fs = require('fs'),
    example_config_file = path.resolve('./config/parameters.json.dist'),
    config_file = path.resolve('./config/parameters.json');

let configuration;

function init() {
    if(fs.existsSync(config_file)) {
        return true;
    }

    fs.writeFileSync(config_file, fs.readFileSync(example_config_file));

    return true;
}

function get_configuration(flush) {
    if(!configuration || flush === true) {
        configuration = JSON.parse(fs.readFileSync(config_file));
    }

    return configuration;
}



module.exports = {
    'init': init,
    'get_configuration': get_configuration
};