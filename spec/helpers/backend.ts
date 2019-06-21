

var request = require('request');
var bt = require('btoa');

var constructUrl = require('./utils').constructUrl;

exports.getBackendUrl = getBackendUrl;
exports.backendRequest = backendRequest;
exports.backendRequestAuth = backendRequestAuth;

function getBackendUrl(uri) {
    return constructUrl(browser.params.baseBackendUrl, uri);
}

/**
 * Do request to backend with retry on error
 *
 * @param {Object} params
 * @param {function} callback
 * @param {Integer} retry - how many times it will try to request before throwing error
 */
function backendRequest(params, callback, retry = 3) {
    let cb = callback || function() { /* no-op */ };
    let ttl = retry || 0;

    if (params.uri) {
        params.url = getBackendUrl(params.uri);
        delete params.uri;
    }

    function isErrorResponse(response) {
        return response.statusCode < 200 || response.statusCode >= 300;
    }

    function responseHandler(error, response, body) {
        if (!error && !isErrorResponse(response)) {
            return cb(error, response, body);
        }

        if (error) {
            console.error('request error', JSON.stringify(error), JSON.stringify(params));
        }

        if (ttl) {
            ttl -= 1;
            return request(params, responseHandler);
        }

        if (!error) {
            console.error('response err', response.statusCode, body);
            console.error('request', params);
        } else {
            console.error('Request error=' + JSON.stringify(error) + ' params=' + JSON.stringify(params));
        }

        throw new Error('stop tests');
    }

    params.rejectUnauthorized = false;
    params.timeout = params.timeout || 10000;
    request(params, responseHandler);
}

/**
 * Run given callback once there is a token in place
 *
 * @param {function} callback
 */
function withToken(callback) {
    if (browser.params.token) {
        callback();
    } else {
        request.post({
            rejectUnauthorized: false,
            url: getBackendUrl('/auth_db'),
            json: {
                username: browser.params.username,
                password: browser.params.password,
            },
        }, (error, response, json) => {
            if (error) {
                throw new Error(error);
            }
            if (!json.token) {
                console.error(json);
                throw new Error('Auth failed');
            }
            browser.params.token = json.token;
            callback(error, response, json);
        });
    }
}

/**
 * Perform backend request with auth info
 *
 * @param {Object} params
 * @param {function} callback
 */
function backendRequestAuth(params, callback) {
    withToken(() => {
        var token = browser.params.token;

        params.headers = params.headers || {};
        params.headers.authorization = 'Basic ' + bt(token + ':');
        backendRequest(params, callback || function noop() { /* no-op */ });
    });
}
