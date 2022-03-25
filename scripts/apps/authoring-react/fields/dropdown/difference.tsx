import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {DifferenceManualEntry} from './dropdown-manual-entry/difference';
import {DifferenceVocabulary} from './dropdown-vocabulary/difference';
import {DifferenceRemoteSource} from './dropdown-remote-source/difference';
import {assertNever} from 'core/helpers/typescript-helpers';

export class Difference extends React.PureComponent<IDifferenceComponentProps<IDropdownValue, IDropdownConfig>> {
    render() {
        const {value1, value2, config} = this.props;
        const {source} = config;

        switch (source) {
        case 'manual-entry':
            return (
                <DifferenceManualEntry
                    value1={value1}
                    value2={value2}
                    config={config}
                />
            );
        case 'vocabulary':
            return (
                <DifferenceVocabulary
                    value1={value1}
                    value2={value2}
                    config={config}
                />
            );
        case 'remote-source':
            return (
                <DifferenceRemoteSource
                    value1={value1}
                    value2={value2}
                    config={config}
                />
            );
        default:
            assertNever(source);
        }
    }
}
