/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {DifferenceGeneric} from '../../difference-generic';
import {IDropdownConfigVocabulary, IDropdownOption, IDropdownValue} from '..';
import {getOptions} from './get-options';
import {notNullOrUndefined} from 'core/helpers/typescript-helpers';

type IProps = IDifferenceComponentProps<IDropdownValue, IDropdownConfigVocabulary>;

function template(props: {item: IDropdownOption}) {
    return (
        <span>{props.item.label}</span>
    );
}

export class DifferenceVocabulary extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;
        const options = getOptions(config);

        const values1: Array<IDropdownOption> =
            (Array.isArray(value1) ? value1 : [value1])
                .map((val) => options.lookup[val]?.value)
                .filter(notNullOrUndefined);

        const values2: Array<IDropdownOption> =
            (Array.isArray(value2) ? value2 : [value2])
                .map((val) => options.lookup[val]?.value)
                .filter(notNullOrUndefined);

        return (
            <DifferenceGeneric
                items1={values1}
                items2={values2}
                getId={(item: IDropdownOption) => item.id.toString()}
                template={template}
            />
        );
    }
}
