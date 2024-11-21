import React from 'react';
import {IDifferenceComponentProps, ITimeFieldConfig, ITimeValueOperational} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<ITimeValueOperational, ITimeFieldConfig>;

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
