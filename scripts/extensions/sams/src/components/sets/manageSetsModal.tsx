// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {CONTENT_PANEL_STATE} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {editSet, onManageSetsModalClosed} from '../../store/sets/actions';
import {getSetContentPanelState, getSelectedSetId} from '../../store/sets/selectors';

// UI
import {Button, ButtonGroup, SubNav} from 'superdesk-ui-framework/react';
import {PageLayout} from '../../containers/PageLayout';
import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from '../../ui';
import {SetListPanel} from './setListPanel';
import {SetPreviewPanel} from './setPreviewPanel';
import {SetEditorPanel} from './setEditorPanel';

// Utils
import {showModalConnectedToStore} from '../../utils/ui';

interface IProps {
    closeModal(): void;
    contentPanelState: CONTENT_PANEL_STATE;
    createSet(): void;
    selectedSetId?: string;
    onModalClosed(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    contentPanelState: getSetContentPanelState(state),
    selectedSetId: getSelectedSetId(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    createSet: () => dispatch(editSet()),
    onModalClosed: () => dispatch(onManageSetsModalClosed()),
});

export function showManageSetsModal() {
    return showModalConnectedToStore(ManageSetsModal);
}

export class ManageSetsModalComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.closeModal = this.closeModal.bind(this);
    }

    closeModal() {
        this.props.onModalClosed();
        this.props.closeModal();
    }

    getContentPanelComponent(): React.ComponentType<any> | null {
        if (this.props.contentPanelState === CONTENT_PANEL_STATE.PREVIEW) {
            return SetPreviewPanel;
        } else if (
            this.props.contentPanelState === CONTENT_PANEL_STATE.CREATE ||
            this.props.contentPanelState === CONTENT_PANEL_STATE.EDIT
        ) {
            return SetEditorPanel;
        }

        return null;
    }

    render() {
        const {gettext} = superdeskApi.localization;

        const ContentPanel = this.getContentPanelComponent();
        const addButtonDisabled = this.props.contentPanelState === CONTENT_PANEL_STATE.CREATE ||
            this.props.contentPanelState === CONTENT_PANEL_STATE.EDIT;

        return (
            <Modal
                id="ManageSetsModal"
                size="x-large"
                closeModal={this.closeModal}
                closeOnEsc={true}
                fullHeight={true}
            >
                <ModalHeader
                    text={gettext('Manage Sets')}
                    onClose={this.closeModal}
                />
                <ModalBody
                    noPadding={true}
                    fullHeight={true}
                >
                    <PageLayout
                        header={(
                            <SubNav zIndex={2}>
                                <ButtonGroup align="end">
                                    <Button
                                        type="primary"
                                        text={gettext('Add New')}
                                        icon="plus-sign"
                                        disabled={addButtonDisabled}
                                        onClick={this.props.createSet}
                                    />
                                </ButtonGroup>
                            </SubNav>
                        )}
                        mainClassName="sd-padding--2"
                        main={<SetListPanel />}
                        rightPanelOpen={ContentPanel != null}
                        rightPanel={ContentPanel == null ? (
                            <div />
                        ) : (
                            <ContentPanel key={this.props.selectedSetId} />
                        )}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        text={gettext('Close')}
                        onClick={this.closeModal}
                    />
                </ModalFooter>
            </Modal>
        );
    }
}

export const ManageSetsModal = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ManageSetsModalComponent);
