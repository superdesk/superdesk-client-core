import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IDropdownValue, IDropdownConfig} from '.';
import {PreviewManualEntry} from './dropdown-manual-entry/preview';
import {PreviewRemoteSource} from './dropdown-remote-source/preview';
import {PreviewVocabulary} from './dropdown-vocabulary/preview';
import {PreviewDropdownTree} from './dropdown-tree/preview';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        const {value, config} = this.props;
        const {source} = config;

        switch (source) {
        case 'manual-entry':
            return (
                <PreviewManualEntry
                    value={value}
                    config={config}
                />
            );
        case 'vocabulary':
            return (
                <PreviewVocabulary
                    value={value}
                    config={config}
                />
            );
        case 'remote-source':
            return (
                <PreviewRemoteSource
                    value={value}
                    config={config}
                />
            );
        case 'dropdown-tree':
            return (
                <PreviewDropdownTree
                    value={value}
                    config={config}
                />
            );
        default:
            assertNever(source);
        }
    }
}
