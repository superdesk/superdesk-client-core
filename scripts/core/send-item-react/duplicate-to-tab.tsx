import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';
import {getInitialDestination} from './get-initial-destination';
import {assertNever} from 'core/helpers/typescript-helpers';
import {canSendToPersonal} from './can-send-to-personal';
import {DestinationSelect} from './destination-select';
import {ISendToDestination} from './interfaces';

interface IProps {
    items: Array<IArticle>;
    closeDuplicateToView(): void;
    markupV2: boolean;
}

interface IState {
    selectedDestination: ISendToDestination;
}

export class DuplicateToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDestination: getInitialDestination(props.items, canSendToPersonal(props.items)),
        };

        this.duplicateItems = this.duplicateItems.bind(this);
    }

    duplicateItems(
        /**
         * Is only supposed to be used when only one item is being duplicated
         */
        openAfterDuplicating?: boolean,
    ) {
        const {selectedDestination} = this.state;
        const {closeDuplicateToView, items} = this.props;

        return Promise.all(
            items.map((item) => {
                const payload = (() => {
                    if (selectedDestination.type === 'personal-space') {
                        return {
                            type: 'archive',
                            desk: null,
                        };
                    } else if (selectedDestination.type === 'desk') {
                        return {
                            type: 'archive',
                            desk: selectedDestination.desk,
                            stage: selectedDestination.stage,
                        };
                    } else {
                        assertNever(selectedDestination);
                    }
                })();

                return httpRequestJsonLocal({
                    method: 'POST',
                    path: `/archive/${item._id}/duplicate`,
                    payload: payload,
                });
            }),
        ).then((responses: Array<any>) => {
            closeDuplicateToView();

            if (openAfterDuplicating) {
                openArticle(responses[0]._id, 'edit');
            }

            notify.success(gettext('Item duplicated'));

            sdApi.preferences.update('destination:active', selectedDestination);
        });
    }

    render() {
        const {items, markupV2} = this.props;

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('Destination')} initiallyOpen>
                        <DestinationSelect
                            value={this.state.selectedDestination}
                            onChange={(value) => {
                                this.setState({
                                    selectedDestination: value,
                                });
                            }}
                            includePersonalSpace={canSendToPersonal(items)}
                        />
                    </ToggleBox>
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    {
                        this.props.items.length === 1 && (
                            <Button
                                text={gettext('Duplicate and open')}
                                onClick={() => {
                                    this.duplicateItems(true);
                                }}
                                size="large"
                                type="primary"
                                expand
                            />
                        )
                    }
                    <Button
                        text={gettext('Duplicate')}
                        onClick={() => {
                            this.duplicateItems();
                        }}
                        size="large"
                        type="primary"
                        expand
                    />
                </PanelFooter>
            </React.Fragment>
        );
    }
}
