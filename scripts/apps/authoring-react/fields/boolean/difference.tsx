import React from 'react';
import {IBooleanFieldValueOperational, ICommonFieldConfig, IDifferenceComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {DifferenceGeneric} from '../difference-generic';

type IProps = IDifferenceComponentProps<IBooleanFieldValueOperational, ICommonFieldConfig>;

function toItems(value: IBooleanFieldValueOperational): Array<string> {
    if (value == null) {
        return [];
    }

    return [value === true ? gettext('Yes') : gettext('No')];
}

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2} = this.props;

        return (
            <DifferenceGeneric
                items1={toItems(value1)}
                items2={toItems(value2)}
                getId={(item) => item}
                template={({item}) => <span>{item}</span>}
            />
        );
    }
}
