const Access_Denied_Exception = require('./access_denied_exception');

function has_access(user, role_to_access) {
    if(!user) {
        return false;
    }

    let user_roles = user.roles;

    if(!user_roles || !user_roles.length || !role_to_access) {
        return false;
    }

    return user_roles.indexOf(role_to_access) !== -1;
}

function check_access(user, role_to_access) {
    const roles = user.roles;

    if(!has_access(roles, role_to_access)) {
        throw new Access_Denied_Exception('Access dienied (user_id:' + user.id +') -> role: ' + role_to_access);
    }
}

module.exports = {
    'has_access': has_access,
    'check_access': check_access
};