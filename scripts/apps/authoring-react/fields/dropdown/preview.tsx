import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IDropdownValue, IDropdownConfig} from '.';
import {PreviewManualEntry} from './dropdown-manual-entry/preview';
import {PreviewRemoteSource} from './dropdown-remote-source/preview';
import {PreviewVocabulary} from './dropdown-vocabulary/preview';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        const {item, value, config} = this.props;
        const {source} = config;

        switch (source) {
        case 'manual-entry':
            return (
                <PreviewManualEntry
                    item={item}
                    value={value}
                    config={config}
                />
            );
        case 'vocabulary':
            return (
                <PreviewVocabulary
                    item={item}
                    value={value}
                    config={config}
                />
            );
        case 'remote-source':
            return (
                <PreviewRemoteSource
                    item={item}
                    value={value}
                    config={config}
                />
            );
        default:
            assertNever(source);
        }
    }
}
