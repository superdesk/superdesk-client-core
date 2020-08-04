import * as React from 'react';

import {ISuperdesk} from 'superdesk-api';
import {ISetItem} from '../../interfaces';
import {SET_STATE} from '../../constants';

import {FormLabel} from 'superdesk-ui-framework/react';
import {PanelContent, PanelContentBlock, PanelContentBlockInner, PanelHeader, PanelTools, Text} from '../../ui';
import {IPanelTools} from '../../ui/PanelTools';

interface IProps {
    set: ISetItem;
    onEdit(): void;
    onDelete(): void;
    onClose(): void;
}

export function getSetPreviewPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return class SetPreviewPanel extends React.PureComponent<IProps> {
        render() {
            const {set} = this.props;

            if (set?._id == null) {
                return null;
            }

            let topTools: Array<IPanelTools> = [{
                title: gettext('Edit'),
                icon: 'pencil',
                onClick: this.props.onEdit,
                ariaValue: 'edit',
            }, {
                title: gettext('Close'),
                icon: 'close-small',
                onClick: this.props.onClose,
                ariaValue: 'close',
            }];

            if (set?.state === SET_STATE.DRAFT) {
                topTools = [
                    {
                        title: gettext('Delete'),
                        icon: 'trash',
                        onClick: this.props.onDelete,
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
                                <Text>{set.destination?._id}</Text>

                                <FormLabel text={gettext('Storage Provider')} style="light"/>
                                <Text>{set.destination?.provider}</Text>
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    </PanelContent>
                </React.Fragment>
            );
        }
    };
}