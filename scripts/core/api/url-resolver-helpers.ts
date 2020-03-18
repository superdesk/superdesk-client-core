import {appConfig} from 'appConfig';

export function basejoin(path: string) {
    const baseUrl = appConfig.server.url;

    return baseUrl + (path.indexOf('/') === 0 ? path : '/' + path);
}
