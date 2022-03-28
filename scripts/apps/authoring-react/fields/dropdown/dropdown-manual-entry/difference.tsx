import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../../difference-generic';
import {IDropdownConfigManualSource, IDropdownOption, IDropdownValue} from '..';
import {DropdownItemTemplate} from '../dropdown-item-template';

type IProps = IDifferenceComponentProps<IDropdownValue, IDropdownConfigManualSource>;

export class DifferenceManualEntry extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;
        const {options} = config;

        const values1: Array<IDropdownOption> =
            (Array.isArray(value1) ? value1 : [value1])
                .map((val) => options.find((_option) => _option.id === val));

        const values2: Array<IDropdownOption> =
            (Array.isArray(value2) ? value2 : [value2])
                .map((val) => options.find((_option) => _option.id === val));

        return (
            <DifferenceGeneric
                items1={values1}
                items2={values2}
                getId={(item) => item.id.toString()}
                template={({item}) => <DropdownItemTemplate option={item} config={config} />}
            />
        );
    }
}
