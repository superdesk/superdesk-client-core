import React from 'react';
import {IDifferenceComponentProps, IPlainTextFieldConfig, IPlainTextFieldValueOperational} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IPlainTextFieldValueOperational, IPlainTextFieldConfig>;

function toItems(value: IPlainTextFieldValueOperational): Array<string> {
    return value == null || value === '' ? [] : [value];
}

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={toItems(value1)}
                items2={toItems(value2)}
                getId={(item) => JSON.stringify(item)}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
