// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ISetItem, IStorageDestinationItem, SET_STATE} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {editSet, confirmBeforeDeletingSet, closeSetContentPanel} from '../../store/sets/actions';
import {getSelectedSet, getSelectedSetStorageDestination, getSelectedSetCount} from '../../store/sets/selectors';

// UI
import {FormLabel} from 'superdesk-ui-framework/react';
import {
    FormRow,
    PanelContent,
    PanelContentBlock,
    PanelContentBlockInner,
    PanelHeader,
    PanelTools,
    Text,
} from '../../ui';
import {IPanelTools} from '../../ui/PanelTools';
import {getHumanReadableFileSize} from '../../utils/ui';
import {VersionUserDateLines} from '../common/versionUserDateLines';

interface IProps {
    set?: ISetItem;
    storageDestination?: IStorageDestinationItem;
    count?: number;
    onEdit(set: ISetItem): void;
    onDelete(set: ISetItem): void;
    onClose(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    set: getSelectedSet(state),
    storageDestination: getSelectedSetStorageDestination(state),
    count: getSelectedSetCount(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onEdit: (set: ISetItem) => dispatch(editSet(set._id)),
    onDelete: (set: ISetItem) => dispatch<any>(confirmBeforeDeletingSet(set)),
    onClose: () => dispatch(closeSetContentPanel()),
});

export class SetPreviewPanelComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {set, storageDestination, count} = this.props;

        if (set?._id == null) {
            return null;
        }

        let topTools: Array<IPanelTools> = [{
            title: gettext('Edit'),
            icon: 'pencil',
            onClick: () => this.props.onEdit(set),
            ariaValue: 'edit',
        }, {
            title: gettext('Close'),
            icon: 'close-small',
            onClick: this.props.onClose,
            ariaValue: 'close',
        }];

        if (set.state === SET_STATE.DRAFT || (set.state === SET_STATE.DISABLED && !count)) {
            topTools = [
                {
                    title: gettext('Delete'),
                    icon: 'trash',
                    onClick: () => this.props.onDelete(set),
                    ariaValue: 'delete',
                },
                ...topTools,
            ];
        }

        return (
            <React.Fragment>
                <PanelHeader borderB={true} title={gettext('Set Details')}>
                    <PanelTools tools={topTools} />
                </PanelHeader>
                <PanelContent>
                    <PanelContentBlock flex={true}>
                        <PanelContentBlockInner grow={true}>
                            <VersionUserDateLines item={set} />
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                    <PanelContentBlock className="sd-padding-t--0">
                        <PanelContentBlockInner grow={true}>
                            <FormRow>
                                <FormLabel text={gettext('Name')} style="light" />
                                <Text>{set.name}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Description')} style="light" />
                                <Text>{set.description}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Max Asset Size')} style="light" />
                                <Text>{getHumanReadableFileSize(set.maximum_asset_size || 0)}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Storage Destination')} style="light" />
                                <Text>{storageDestination?._id}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Storage Provider')} style="light" />
                                <Text>{storageDestination?.provider}</Text>
                            </FormRow>
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                </PanelContent>
            </React.Fragment>
        );
    }
}

export const SetPreviewPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SetPreviewPanelComponent);
