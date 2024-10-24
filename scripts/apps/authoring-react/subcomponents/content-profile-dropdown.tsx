import React from 'react';
import {IArticle, IContentProfile} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Select, Option, Text} from 'superdesk-ui-framework/react';
import {sdApi} from 'api';

interface IProps {
    article: IArticle;
    onChange: (itemWithChanges: IArticle) => void;
}

interface IState {
    profilesList: Array<IContentProfile>;
    selectedProfileId: string;
}

export class ContentProfileDropdown extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const allProfiles = sdApi.contentProfiles.getAll().filter((x) => x.enabled === true && x.type === 'text');

        this.state = {
            profilesList: allProfiles,
            selectedProfileId: allProfiles.find((x) => x._id === this.props.article.profile)._id ?? '',
        };
    }

    render() {
        return (
            <div className="flex flex-row items-center gap-2">
                <Text className="m-0" size="x-small" weight="medium">{gettext('Profile')}</Text>
                <Select
                    fullWidth
                    value={this.state.selectedProfileId}
                    onChange={(profileId) => {
                        this.setState({
                            selectedProfileId: profileId,
                        }, () => {
                            this.props.onChange({
                                ...this.props.article,
                                profile: profileId,
                            });
                        });
                    }}
                    label="Profile"
                    inlineLabel
                    labelHidden
                >
                    <Option value="" />
                    {this.state.profilesList.map((profile) => (
                        <Option key={profile._id} value={profile._id}>
                            {profile.label}
                        </Option>
                    ))}
                </Select>
            </div>
        );
    }
}
