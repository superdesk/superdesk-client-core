import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {Dropdown} from './dropdown';

type IProps = IEditorComponentProps<IDropdownValue, IDropdownConfig, never>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        return (
            <Dropdown
                config={this.props.config}
                value={this.props.value}
                onChange={(val) => {
                    this.props.onChange(val);
                }}
                language={this.props.language}
            />
        );
    }
}
