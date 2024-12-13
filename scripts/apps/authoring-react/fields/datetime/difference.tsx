import React from 'react';
import {IDateTimeFieldConfig, IDateTimeValueOperational, IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IDateTimeValueOperational, IDateTimeFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={value1 == null ? [] : [value1]}
                items2={value2 == null ? [] : [value2]}
                getId={(item) => item}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
