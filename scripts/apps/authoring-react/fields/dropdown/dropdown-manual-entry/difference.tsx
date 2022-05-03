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
            (() => {
                if (value1 == null) {
                    return [];
                } else if (Array.isArray(value1)) {
                    return value1;
                } else {
                    return [value1];
                }
            })()
                .map((val) => options.find((_option) => _option.id === val));

        const values2: Array<IDropdownOption> =
            (() => {
                if (value2 == null) {
                    return [];
                } else if (Array.isArray(value2)) {
                    return value2;
                } else {
                    return [value2];
                }
            })()
                .map((val) => options.find((_option) => _option.id === val));

        const noPadding = values1.every(({color}) => color == null) && values2.every(({color}) => color == null);

        return (
            <DifferenceGeneric
                items1={values1}
                items2={values2}
                getId={(item) => item.id.toString()}
                template={({item}) => <DropdownItemTemplate option={item} config={config} noPadding={noPadding} />}
            />
        );
    }
}
