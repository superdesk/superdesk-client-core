import {SpacerBlock} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {getNoValueLabel} from './constants';

interface IProps {
    item: IArticle;
}

export class MediaMetadata extends React.PureComponent<IProps> {
    render() {
        const metadataFields: Array<{label: string; field: keyof IArticle}> = [
            {
                label: gettext('Alt text:'),
                field: 'alt_text',
            },
            {
                label: gettext('Credit:'),
                field: 'byline',
            },
            {
                label: gettext('Copyright holder:'),
                field: 'copyrightholder',
            },
            {
                label: gettext('Assign rights:'),
                field: 'usageterms',
            },
            {
                label: gettext('Copyright notice:'),
                field: 'copyrightnotice',
            },
        ];

        const {item} = this.props;
        const noValueLabel = getNoValueLabel();

        return (
            <div className="field--media--metadata">
                {
                    metadataFields.map(({label, field}, i) => (
                        <div key={i}>
                            <span className="field--media--metadata-label">{label}</span>
                            <SpacerBlock h gap="8" />
                            {item[field] ?? noValueLabel}
                        </div>
                    ))
                }
            </div>
        );
    }
}
