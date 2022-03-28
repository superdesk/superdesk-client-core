import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IDropdownTreeConfig, IDropdownValue} from '..';
import {DifferenceGeneric} from '../../difference-generic';
import {getValueTemplate} from './get-value-template';

type IProps = IDifferenceComponentProps<IDropdownValue, IDropdownTreeConfig>;

export class DifferenceDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;

        const values1 = Array.isArray(value1) ? value1 : [value1];
        const values2 = Array.isArray(value2) ? value2 : [value2];

        const template = getValueTemplate(config);

        return (
            <DifferenceGeneric
                items1={values1}
                items2={values2}
                getId={(item) => config.getId(item)}
                template={template}
            />
        );
    }
}
