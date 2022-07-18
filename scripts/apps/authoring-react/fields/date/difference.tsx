import {formatDate} from 'core/get-superdesk-api-implementation';
import React from 'react';
import {IDateFieldConfig, IDateValueOperational, IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IDateValueOperational, IDateFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={value1 == null ? [] : [formatDate(new Date(value1))]}
                items2={value2 == null ? [] : [formatDate(new Date(value2))]}
                getId={(item) => item}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
