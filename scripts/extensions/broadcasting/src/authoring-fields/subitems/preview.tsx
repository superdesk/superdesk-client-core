import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {ISubitemsFieldConfig, ISubitemsValueOperational} from '.';
import {SubitemsViewEdit} from './subitems-view-edit';

type IProps = IPreviewComponentProps<ISubitemsValueOperational, ISubitemsFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <SubitemsViewEdit
                readOnly={true}
                subitems={this.props.value ?? []}
            />
        );
    }
}
