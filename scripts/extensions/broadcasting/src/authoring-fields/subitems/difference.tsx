import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {ISubitemsFieldConfig, ISubitemsValueOperational} from '.';

type IProps = IDifferenceComponentProps<ISubitemsValueOperational, ISubitemsFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        // TODO: implement when difference widget is available for rundown items
        return null;
    }
}
