import React from 'react';
import {ICommonFieldConfig, IDatelineValueOperational, IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IDatelineValueOperational, ICommonFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={[value1]}
                items2={[value2]}
                getId={(item) => JSON.stringify(item)}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
