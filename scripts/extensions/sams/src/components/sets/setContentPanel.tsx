import * as React from 'react';

import {ISamsAPI, ISetItem, IStorageDestinationItem, CONTENT_PANEL_STATE} from '../../interfaces';
import {ISuperdesk} from 'superdesk-api';

import {
    RightPanel,
    Panel,
} from '../../ui';

import {getSetPreviewPanel} from './setPreviewPanel';
import {getSetEditorPanel} from './setEditorPanel';

interface IProps {
    state: CONTENT_PANEL_STATE;
    currentSet?: ISetItem;
    destinations?: Array<IStorageDestinationItem>;
    onDelete(set: ISetItem): void;
    onEdit(set: ISetItem): void;
    previewSet(set: ISetItem): void;
    onClose(): void;
}

export function getSetContentPanel(superdesk: ISuperdesk, api: ISamsAPI) {
    const SetPreviewPanel = getSetPreviewPanel(superdesk);
    const SetEditorPanel = getSetEditorPanel(superdesk, api);

    return class SetContentPanel extends React.Component<IProps, any> {
        constructor(props: IProps) {
            super(props);

            this.renderPanel = this.renderPanel.bind(this);
            this.onDelete = this.onDelete.bind(this);
            this.onEdit = this.onEdit.bind(this);
            this.previewSet = this.previewSet.bind(this);
        }

        onDelete() {
            if (this.props.currentSet != null) {
                this.props.onDelete(this.props.currentSet);
            }
        }

        onEdit() {
            if (this.props.currentSet != null) {
                this.props.onEdit(this.props.currentSet);
            }
        }

        previewSet() {
            if (this.props.currentSet != null) {
                this.props.previewSet(this.props.currentSet);
            }
        }

        renderPanel() {
            const {state, currentSet, onClose} = this.props;

            if (state === 'preview' && currentSet != null) {
                return (
                    <SetPreviewPanel
                        set={currentSet}
                        onEdit={this.onEdit}
                        onDelete={this.onDelete}
                        onClose={onClose}
                    />
                );
            } else if (state === CONTENT_PANEL_STATE.EDIT || state === CONTENT_PANEL_STATE.CREATE) {
                return (
                    <SetEditorPanel
                        set={currentSet}
                        destinations={this.props.destinations}
                        onDelete={this.onDelete}
                        onClose={currentSet?._id == null ? onClose : this.previewSet}
                    />
                );
            }
            return null;
        }

        render() {
            return (
                <RightPanel open={this.props.state !== CONTENT_PANEL_STATE.CLOSED}>
                    <Panel side="right">
                        {this.renderPanel()}
                    </Panel>
                </RightPanel>
            );
        }
    };
}
