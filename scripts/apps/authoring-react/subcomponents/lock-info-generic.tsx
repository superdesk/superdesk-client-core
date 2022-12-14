/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser, ILockInfo, IPropsLockInfoHttp, IBaseRestApiResponse, IPropsLockInfo} from 'superdesk-api';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {store} from 'core/data';
import {httpRequestJsonLocal} from 'core/helpers/network';

export function isLockedInCurrentSession<T extends ILockInfo>(entity: T): boolean {
    if (entity._lock !== true) {
        return false;
    }

    const currentSessionId = ng.get('session').sessionId;

    return entity._lock_session === currentSessionId;
}

export function isLockedInOtherSession<T extends ILockInfo>(entity: T): boolean {
    if (entity._lock !== true) {
        return false;
    }

    const currentSessionId = ng.get('session').sessionId;

    return entity._lock_session !== currentSessionId;
}

export class LockInfo<T extends ILockInfo & IBaseRestApiResponse> extends React.PureComponent<IPropsLockInfo<T>> {
    render() {
        const lockedInOtherSession = isLockedInOtherSession(this.props.entity);

        if (lockedInOtherSession !== true) {
            return null;
        }

        const lockOwner: IUser = store.getState().entities.users[this.props.entity._lock_user];

        return (
            <div className="locked-info">
                <div className="locked-info__avatar">
                    <UserAvatar user={lockOwner} size="medium" />
                </div>

                <div className="locked-info__label">{gettext('Locked by')}</div>

                <div className="locked-info__name">{lockOwner.display_name}</div>

                {(() => {
                    if (this.props.allowUnlocking) {
                        const {forceUnlock} = this.props;

                        return (
                            <button
                                className="locked-info__button"
                                onClick={() => {
                                    forceUnlock();
                                }}
                            >
                                {gettext('Unlock')}
                            </button>
                        );
                    } else {
                        return null;
                    }
                })()}
            </div>
        );
    }
}

export class LockInfoHttp<T extends ILockInfo & IBaseRestApiResponse>
    extends React.PureComponent<IPropsLockInfoHttp<T>> {
    render() {
        return (
            <LockInfo
                allowUnlocking={true}
                entity={this.props.entity}
                forceUnlock={() => {
                    const payload: Partial<ILockInfo> = {
                        _lock_action: 'force-lock',
                    };

                    httpRequestJsonLocal({
                        method: 'PATCH',
                        path: this.props.endpoint,
                        payload,
                        headers: {
                            'If-Match': this.props.entity._etag,
                        },
                    });
                }}
            />
        );
    }
}
