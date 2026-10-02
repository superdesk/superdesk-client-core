import React from 'react';
import {IArticle, IContentProfile} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Spacer} from 'superdesk-ui-framework/react';
import {sdApi} from 'api';

interface IProps<T> {
    item: T;
    reinitialize: (itemWithChanges: T) => void;
}

interface IState {
    profiles: Array<IContentProfile>;
    selectedProfileId: string;
}

export class ContentProfileDropdown<T> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        const allProfiles = sdApi.contentProfiles.getAll().filter((x) => x.enabled === true && x.type === 'text');

        this.state = {
            profiles: allProfiles,
            selectedProfileId: allProfiles.find((x) => x._id === (this.props.item as IArticle)?.profile)?._id ?? '',
        };
    }

    render() {
        const item = this.props.item as IArticle;

        // Kill and takedown templates have no profile. Picture, audio and video items are on a profile
        // of their own type and cannot be moved onto a text one. Neither has anything to switch to.
        const canSwitchProfile = item?.type === 'text'
            || item?.type === 'preformatted'
            || this.state.profiles.some((profile) => profile._id === item?.profile);

        if (item?.profile == null || !canSwitchProfile) {
            return null;
        }

        return (
            <Spacer gap="4" h noGrow noWrap>
                <span className="authoring-header__label">{gettext('PROFILE')}</span>
                <div className="authoring-header__value">
                    <select
                        data-test-id="content-profile-select"
                        data-test-value={this.state.selectedProfileId}
                        style={{height: 16}}
                        value={this.state.selectedProfileId}
                        onChange={(e) => {
                            e.preventDefault();
                            const profileId = e.target.value;

                            this.setState({
                                selectedProfileId: profileId,
                            }, () => {
                                this.props.reinitialize({
                                    ...this.props.item,
                                    profile: profileId,
                                });
                            });
                        }}
                    >
                        <option value="" />
                        {this.state.profiles.map((profile) => (
                            <option key={profile._id} value={profile._id}>
                                {profile.label}
                            </option>
                        ))}
                    </select>
                </div>
            </Spacer>
        );
    }
}
