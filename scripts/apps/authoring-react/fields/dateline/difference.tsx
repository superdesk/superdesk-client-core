import React from 'react';
import {ICommonFieldConfig, IDatelineValueOperational, IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IDatelineValueOperational, ICommonFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        // The dateline value is an object; diff its composed `text`, not the object itself.
        const text1 = value1?.text;
        const text2 = value2?.text;

        return (
            <DifferenceGeneric
                items1={text1 == null || text1.length === 0 ? [] : [text1]}
                items2={text2 == null || text2.length === 0 ? [] : [text2]}
                getId={(item) => item}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
