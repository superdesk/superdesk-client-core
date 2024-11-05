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

        const metadataValues: Array<{label: string; value: string}> = [];

        if (item.renditions?.original?.width != null && item.renditions?.original?.height != null) {
            metadataValues.push({
                label: gettext('Original size'),
                value: gettext(
                    '{{width}} x {{height}} px',
                    {
                        width: item.renditions.original.width,
                        height: item.renditions.original.height,
                    },
                ),
            });
        }

        for (const {label, field} of metadataFields) {
            metadataValues.push({
                label: label,
                value: (item[field] ?? '').trim().length > 0 ? item[field] : noValueLabel,
            });
        }

        return (
            <div className="field--media--metadata">
                {
                    metadataValues.map(({label, value}, i) => (
                        <div key={i}>
                            <span className="field--media--metadata-label">{label}</span>
                            <SpacerBlock h gap="8" />
                            {value}
                        </div>
                    ))
                }
            </div>
        );
    }
}
