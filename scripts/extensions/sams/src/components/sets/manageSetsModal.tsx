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
import {getSetContentPanelState, getSelectedSetId} from '../../store/sets/selectors';

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
    RightPanel,
} from '../../ui';
import {getSetListPanel} from './setListPanel';
import {getSetPreviewPanel} from './setPreviewPanel';
import {getSetEditorPanel} from './setEditorPanel';
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

export function getShowManageSetsModalFunction(superdesk: ISuperdesk) {
    const ManageSetsModal = getManageSetsModalComponent(superdesk);

    return () => showModalConnectedToStore(
        superdesk,
        ManageSetsModal,
    );
}

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
            const ContentPanel = this.getContentPanelComponent();
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

                            <RightPanel open={ContentPanel != null}>
                                <Panel side="right">
                                    {ContentPanel && (
                                        <ContentPanel key={this.props.selectedSetId} />
                                    )}
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
                </Modal>
            );
        }
    }

    return connect(
        mapStateToProps,
        mapDispatchToProps,
    )(ManageSetsModalComponent);
}
