// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {CONTENT_PANEL_STATE} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {editSet, onManageSetsModalClosed} from '../../store/sets/actions';
import {getSetContentPanelState, isDeleteConfirmationOpen, getSelectedSetId} from '../../store/sets/selectors';

// UI
import {Button, ButtonGroup, SubNav} from 'superdesk-ui-framework/react';
import {
    HeaderPanel,
    LayoutContainer,
    MainPanel,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Panel,
    Portal,
    RightPanel,
} from '../../ui';
import {getSetListPanel} from './setListPanel';
import {getSetPreviewPanel} from './setPreviewPanel';
import {getSetEditorPanel} from './setEditorPanel';

interface IProps {
    closeModal(): void;
    contentPanelState: CONTENT_PANEL_STATE;
    createSet(): void;
    isDeleteConfirmationOpen: boolean;
    selectedSetId?: string;
    onModalClosed(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    contentPanelState: getSetContentPanelState(state),
    isDeleteConfirmationOpen: isDeleteConfirmationOpen(state),
    selectedSetId: getSelectedSetId(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    createSet: () => dispatch(editSet()),
    onModalClosed: () => dispatch(onManageSetsModalClosed()),
});

export function getManageSetsModalComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    const SetListPanel = getSetListPanel(superdesk);
    const SetPreviewPanel = getSetPreviewPanel(superdesk);
    const SetEditorPanel = getSetEditorPanel(superdesk);

    class ManageSetsModalComponent extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);

            this.closeModal = this.closeModal.bind(this);
        }

        closeModal() {
            this.props.onModalClosed();
            this.props.closeModal();
        }

        renderContentPanel() {
            if (this.props.contentPanelState === CONTENT_PANEL_STATE.PREVIEW) {
                return <SetPreviewPanel key={this.props.selectedSetId} />;
            } else if (
                this.props.contentPanelState === CONTENT_PANEL_STATE.CREATE ||
                this.props.contentPanelState === CONTENT_PANEL_STATE.EDIT
            ) {
                return <SetEditorPanel key={this.props.selectedSetId} />;
            }

            return null;
        }

        render() {
            const contentPanel = this.renderContentPanel();
            const addButtonDisabled = this.props.contentPanelState === CONTENT_PANEL_STATE.CREATE ||
                this.props.contentPanelState === CONTENT_PANEL_STATE.EDIT;

            return (
                <Modal
                    id="ManageSetsModal"
                    size="x-large"
                    closeModal={this.closeModal}
                    closeOnEsc={true}
                >
                    <ModalHeader onClose={this.closeModal}>
                        {gettext('Manage Sets')}
                    </ModalHeader>
                    <ModalBody noPadding={true}>
                        <LayoutContainer>
                            <HeaderPanel>
                                <SubNav zIndex={2}>
                                    <ButtonGroup align="right">
                                        <Button
                                            type="primary"
                                            text={gettext('Add New')}
                                            icon="plus-sign"
                                            disabled={addButtonDisabled}
                                            onClick={this.props.createSet}
                                        />
                                    </ButtonGroup>
                                </SubNav>
                            </HeaderPanel>
                            <MainPanel className="sd-padding--2">
                                <SetListPanel />
                            </MainPanel>

                            <RightPanel open={contentPanel != null}>
                                <Panel side="right">
                                    {contentPanel}
                                </Panel>
                            </RightPanel>
                        </LayoutContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            text={gettext('Close')}
                            onClick={this.closeModal}
                        />
                    </ModalFooter>
                    {!this.props.isDeleteConfirmationOpen ? null : (
                        <Portal id="deleteModalOverlay">
                            <div
                                className="modal__backdrop fade in"
                                style={{zIndex: 1050}}
                            />
                        </Portal>
                    )}
                </Modal>
            );
        }
    }

    return connect(
        mapStateToProps,
        mapDispatchToProps,
    )(ManageSetsModalComponent);
}
