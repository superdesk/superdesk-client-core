import React from 'react';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    showAltText?: boolean;
    className?: string;
}

export class MediaMetadataView extends React.PureComponent<IProps> {
    render() {
        const {item, showAltText, className} = this.props;
        const validator = appConfig.validator_media_metadata;
        const NO_VALUE_LABEL = gettext('[No Value]');

        const fields: Array<{fieldId: keyof IArticle; label: string}> = [
            {fieldId: 'byline', label: gettext('Credit:')},
            {fieldId: 'copyrightholder', label: gettext('Copyright holder:')},
            {fieldId: 'usageterms', label: gettext('Assign rights:')},
            {fieldId: 'copyrightnotice', label: gettext('Copyright notice:')},
        ];

        return (
            <div className={className}>
                {
                    showAltText !== true ? null : (
                        <span>
                            <em>{gettext('Alt text:')}</em>
                            {item.alt_text ?? NO_VALUE_LABEL}
                        </span>
                    )
                }

                {
                    fields
                        .filter(({fieldId}) => validator[fieldId] != null)
                        .map(({fieldId, label}) => (
                            <span key={fieldId}>
                                <em>{label}</em>
                                {item[fieldId] ?? NO_VALUE_LABEL}
                            </span>
                        ))
                }
            </div>
        );
    }
}
