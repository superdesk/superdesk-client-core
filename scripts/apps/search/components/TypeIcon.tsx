import React from 'react';
import {gettext} from 'core/utils';
import {dataStore} from 'data-store';

interface IProps {
    contentProfileId: string;
    type: string;
    highlight?: boolean;
    'aria-hidden'?: boolean;
}

/**
 * Type icon component
 */
export class TypeIcon extends React.PureComponent<IProps> {
    render() {
        const {type, highlight, contentProfileId} = this.props;

        if (contentProfileId != null) {
            const profile = dataStore.contentProfiles.get(contentProfileId);

            if (profile.icon != null) {
                return (
                    <i
                        className={'icon-' + profile.icon}
                        aria-label={gettext('Content profile: {{name}}', {name: profile.label})}
                        aria-hidden={this.props['aria-hidden'] ?? false}
                        data-test-id="type-icon"
                        data-test-value={profile.icon}
                    />
                );
            }
        }

        if (type === 'composite' && highlight) {
            return (
                <i
                    className={'filetype-icon-highlight-pack'}
                    aria-label={gettext('Article Type {{type}}', {type})}
                    aria-hidden={this.props['aria-hidden'] ?? false}
                    data-test-id="type-icon"
                />
            );
        }

        return (
            <i
                className={'filetype-icon-' + type}
                title={gettext('Article Type: {{type}}', {type})}
                aria-label={gettext('Article Type {{type}}', {type})}
                aria-hidden={this.props['aria-hidden'] ?? false}
                data-test-id="type-icon"
                data-test-value={type}
            />
        );
    }
}
