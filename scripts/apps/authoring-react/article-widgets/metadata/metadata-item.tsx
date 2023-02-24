import {gettext} from 'core/utils';
import React from 'react';
import {ContentDivider} from 'superdesk-ui-framework';

interface IProps {
    label: string;
    value: string | number;
}

export class MetadataItem extends React.Component<IProps> {
    render(): React.ReactNode {
        const {label, value} = this.props;

        return (
            <>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>{gettext(label)}:</div>
                    <div>{value}</div>
                </div>
                <ContentDivider border type="dotted" margin="x-small" />
            </>
        );
    }
}
