// External Modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {Dispatch} from 'redux';
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, IStorageDestinationItem, SET_STATE, IApplicationState} from '../../interfaces';

// Redux Actions & Selectors
import {confirmBeforeDeletingSet} from '../../store/sets/actions';
import {setsBranch} from '../../store/sets/branch';
import {getSelectedSet, getSelectedSetStorageDestination} from '../../store/sets/selectors';

// UI
import {FormLabel} from 'superdesk-ui-framework/react';
import {PanelContent, PanelContentBlock, PanelContentBlockInner, PanelHeader, PanelTools, Text} from '../../ui';
import {IPanelTools} from '../../ui/PanelTools';

interface IProps {
    set?: ISetItem;
    storageDestination?: IStorageDestinationItem;
    onEdit(set: ISetItem): void;
    onDelete(set: ISetItem): void;
    onClose(): void;
    dispatch: Dispatch;
}

const mapStateToProps = (state: IApplicationState) => ({
    set: getSelectedSet(state),
    storageDestination: getSelectedSetStorageDestination(state),
});

export function getSetPreviewPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    class SetPreviewPanelComponent extends React.PureComponent<IProps> {
        constructor(props: IProps) {
            super(props);

            this.onEdit = this.onEdit.bind(this);
            this.onDelete = this.onDelete.bind(this);
            this.onClose = this.onClose.bind(this);
        }

        onEdit() {
            if (this.props.set?._id != null) {
                this.props.dispatch(setsBranch.editSet.action(this.props.set._id));
            }
        }

        onDelete() {
            if (this.props.set?._id != null) {
                this.props.dispatch<any>(confirmBeforeDeletingSet(this.props.set));
            }
        }

        onClose() {
            this.props.dispatch(setsBranch.closeContentPanel.action());
        }

        render() {
            const {set, storageDestination} = this.props;

            if (set?._id == null) {
                return null;
            }

            let topTools: Array<IPanelTools> = [{
                title: gettext('Edit'),
                icon: 'pencil',
                onClick: this.onEdit,
                ariaValue: 'edit',
            }, {
                title: gettext('Close'),
                icon: 'close-small',
                onClick: this.onClose,
                ariaValue: 'close',
            }];

            if (set.state === SET_STATE.DRAFT) {
                topTools = [
                    {
                        title: gettext('Delete'),
                        icon: 'trash',
                        onClick: this.onDelete,
                        ariaValue: 'delete',
                    },
                    ...topTools,
                ];
            }

            return (
                <React.Fragment>
                    <PanelHeader borderB={true} title={gettext('Set Details')}>
                        <PanelTools tools={topTools}/>
                    </PanelHeader>
                    <PanelContent>
                        <PanelContentBlock flex={true}>
                            <PanelContentBlockInner grow={true}>
                                <FormLabel text={gettext('Name')} style="light"/>
                                <Text>{set.name}</Text>

                                <FormLabel text={gettext('Description')} style="light"/>
                                <Text>{set.description}</Text>

                                <FormLabel text={gettext('Storage Destination')} style="light"/>
                                <Text>{storageDestination?._id}</Text>

                                <FormLabel text={gettext('Storage Provider')} style="light"/>
                                <Text>{storageDestination?.provider}</Text>
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    </PanelContent>
                </React.Fragment>
            );
        }
    }

    return connect(mapStateToProps)(SetPreviewPanelComponent);
}
