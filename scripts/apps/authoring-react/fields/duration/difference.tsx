import React from 'react';
import {IDifferenceComponentProps, IDurationValueOperational, IDurationFieldConfig} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IDurationValueOperational, IDurationFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        // TODO: format to user friendly format before showing the diff

        return (
            <DifferenceGeneric
                items1={value1 == null ? [] : [value1]}
                items2={value2 == null ? [] : [value2]}
                getId={(item) => item.toString()}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
