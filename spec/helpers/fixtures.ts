import {browser} from 'protractor';
import {backendRequest, backendRequestAuth} from './backend';

export function resetApp(profile, callback) {
    backendRequest({
        uri: '/prepopulate',
        method: 'POST',
        timeout: 30000,
        json: {profile: profile},
    }, (e, r, j) => {
        browser.params.token = null;
        callback(e, r, j);
    }, 1);
}

export function post(params, callback) {
    params.method = 'POST';
    backendRequestAuth(params, callback);
}
