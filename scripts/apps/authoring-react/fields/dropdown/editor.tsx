import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {EditorManualEntry} from './dropdown-manual-entry/editor';
import {EditorRemoteSource} from './dropdown-remote-source/editor';
import {EditorVocabulary} from './dropdown-vocabulary/editor';
import {assertNever} from 'core/helpers/typescript-helpers';
import {EditorDropdownTree} from './dropdown-tree/editor';

type IProps = IEditorComponentProps<IDropdownValue, IDropdownConfig, never>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;

        switch (config.source) {
        case 'manual-entry':
            return (
                <EditorManualEntry
                    {...this.props}
                    config={config}
                />
            );
        case 'vocabulary':
            return (
                <EditorVocabulary
                    {...this.props}
                    config={config}
                />
            );
        case 'remote-source':
            return (
                <EditorRemoteSource
                    {...this.props}
                    config={config}
                />
            );
        case 'dropdown-tree':
            return (
                <EditorDropdownTree
                    {...this.props}
                    config={config}
                />
            );
        default:
            assertNever(config);
        }
    }
}
