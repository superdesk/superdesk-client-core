import {IBaseRestApiResponse, ILockInfo} from 'superdesk-api';
import {httpRequestJsonLocal} from './network';
import ng from 'core/services/ng';

export function tryLocking<T extends ILockInfo & IBaseRestApiResponse>(
    endpoint: string,
    entityId: string,
    force: boolean = false,
): Promise<{success: boolean; latestEntity: T}> {
    const currentSessionId = ng.get('session').sessionId;

    return httpRequestJsonLocal<T>({
        method: 'GET',
        path: `${endpoint}/${entityId}`,
    }).then((entity) => {
        const locked = entity._lock === true;
        const lockedInCurrentSession =
            locked && entity._lock_session === currentSessionId;
        const lockedInAnotherSession =
            locked && entity._lock_session !== currentSessionId;

        const doLock = (_force: boolean) => {
            const payload: Partial<ILockInfo> = {
                _lock_action: _force ? 'force-lock' : 'lock',
            };

            return httpRequestJsonLocal<T>({
                method: 'PATCH',
                path: `${endpoint}/${entityId}`,
                payload,
                headers: {
                    'If-Match': entity._etag,
                },
            });
        };

        if (lockedInCurrentSession) {
            return {success: true, latestEntity: entity};
        } else if (lockedInAnotherSession) {
            if (force) {
                return doLock(true).then((res) => {
                    return {success: true, latestEntity: res};
                });
            } else {
                return {success: false, latestEntity: entity};
            }
        } else if (locked !== true) {
            return doLock(false).then((res) => {
                return {success: true, latestEntity: res};
            });
        } else {
            throw new Error('invalid state');
        }
    });
}

export function tryUnlocking<T extends ILockInfo & IBaseRestApiResponse>(
    endpoint: string,
    entityId: string,
): Promise<void> {
    const currentSessionId = ng.get('session').sessionId;

    return httpRequestJsonLocal<T>({
        method: 'GET',
        path: `${endpoint}/${entityId}`,
    }).then((entity) => {
        const locked = entity._lock === true;
        const lockedInCurrentSession =
            locked && entity._lock_session === currentSessionId;

        if (lockedInCurrentSession) {
            const payload: Partial<ILockInfo> = {
                _lock_action: 'unlock',
            };

            return httpRequestJsonLocal<T>({
                method: 'PATCH',
                path: `${endpoint}/${entityId}`,
                payload,
                headers: {
                    'If-Match': entity._etag,
                },
            });
        } else {
            return Promise.resolve(undefined);
        }
    });
}
