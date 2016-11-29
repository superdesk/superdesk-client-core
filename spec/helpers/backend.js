'use strict';

var request = require('request');
var bt = require('btoa');

var constructUrl = require('./utils').constructUrl;

exports.getBackendUrl = getBackendUrl;
exports.backendRequest = backendRequest;
exports.backendRequestAuth = backendRequestAuth;

function getBackendUrl(uri) {
    return constructUrl(browser.params.baseBackendUrl, uri);
}

function backendRequest(params, callback) {
    let cb = callback || function() { /* no-op */ };

    if (params.uri) {
        params.url = getBackendUrl(params.uri);
        delete params.uri;
    }

    function isErrorResponse(response) {
        return response.statusCode < 200 || response.statusCode >= 300;
    }

    // how many times it will try to request before throwing error
    var ttl = 5;

    function responseHandler(error, response, body) {
        if (!error && !isErrorResponse(response)) {
            return cb(error, response, body);
        }

        if (error) {
            console.error('request error', JSON.stringify(error), JSON.stringify(params));
        }

        if (ttl) {
            ttl -= 1;
            params.timeout *= 2;
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
    params.timeout = 8000;
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
            url: getBackendUrl('/auth'),
            json: {
                username: browser.params.username,
                password: browser.params.password
            }
        }, function(error, response, json) {
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
    withToken(function() {
        var token = browser.params.token;

        params.headers = params.headers || {};
        params.headers.authorization = 'Basic ' + bt(token + ':');
        backendRequest(params, callback || function() { /* no-op */ });
    });
}
