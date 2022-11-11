/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser, IArticle} from 'superdesk-api';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {store} from 'core/data';

interface IProps {
    article: IArticle;
    unlock(): void;
}

interface IState {
    lockOwner: IUser;
}

class LockInfoComponent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            lockOwner: null,
        };
    }

    componentDidMount() {
        const lockOwner = store.getState().entities.users[this.props.article.lock_user];

        this.setState({lockOwner});
    }

    render() {
        const user = this.state.lockOwner;

        if (user == null) { // loading
            return null;
        }

        return (
            <div className="locked-info">
                <div className="locked-info__avatar">
                    <UserAvatar user={user} size="medium" />
                </div>
                {/* TODO: REMOVE */}
                <div>
                    {this.props.article._etag}
                </div>

                <div>
                    {this.props.article.lock_session}
                </div>

                <div className="locked-info__label">{gettext('Locked by')}</div>

                <div className="locked-info__name">{user.display_name}</div>

                <button
                    className="locked-info__button"
                    onClick={() => {
                        this.props.unlock();
                    }}
                >
                    {gettext('Unlock')}
                </button>
            </div>
        );
    }
}

export class LockInfo extends React.PureComponent<IProps> {
    render() {
        if (sdApi.article.isLockedInOtherSession(this.props.article) !== true) {
            return null;
        }

        return (
            <LockInfoComponent {...this.props} key={this.props.article.lock_user} />
        );
    }
}
