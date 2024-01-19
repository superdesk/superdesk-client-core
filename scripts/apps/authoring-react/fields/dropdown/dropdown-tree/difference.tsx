import * as React from 'react';
import {IDifferenceComponentProps, IDropdownTreeConfig, IDropdownValue} from 'superdesk-api';
import {DifferenceGeneric} from '../../difference-generic';
import {getValueTemplate} from './get-value-template';

type IProps = IDifferenceComponentProps<IDropdownValue, IDropdownTreeConfig>;

export class DifferenceDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;

        const values1 = (() => {
            if (value1 == null) {
                return [];
            } else if (Array.isArray(value1)) {
                return value1;
            } else {
                return [value1];
            }
        })();

        const values2 = (() => {
            if (value2 == null) {
                return [];
            } else if (Array.isArray(value2)) {
                return value2;
            } else {
                return [value2];
            }
        })();

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
