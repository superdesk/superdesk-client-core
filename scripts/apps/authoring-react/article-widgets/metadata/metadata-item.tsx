import {Spacer} from 'core/ui/components/Spacer';
import React from 'react';
import {ContentDivider, Heading} from 'superdesk-ui-framework/react';

interface IProps {
    label: string;
    value: string | number | JSX.Element;
}

export class MetadataItem extends React.Component<IProps> {
    render(): React.ReactNode {
        const {label, value} = this.props;

        return (
            <>
                <Spacer h gap="32" justifyContent="space-between" alignItems="center" noWrap>
                    <Heading type="h6" align="start">
                        {label.toUpperCase()}
                    </Heading>
                    <div>{value}</div>
                </Spacer>
                <ContentDivider border type="dotted" margin="x-small" />
            </>
        );
    }
}
