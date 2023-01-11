import React from 'react';
import {IDifferenceComponentProps, IKeywordsFieldConfig, IKeywordsValueOperational} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IKeywordsValueOperational, IKeywordsFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={value1 == null ? [] : [value1]}
                items2={value2 == null ? [] : [value2]}
                getId={(item) => item[0]} // TODO: FIX so we pass the full array of items not just [0]
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
