import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {sdApi} from 'api';
import {getInitialDestination} from '../utils/get-initial-destination';
import {canSendToPersonal} from '../utils/can-send-to-personal';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {OrderedMap} from 'immutable';

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

        sdApi.article.duplicateItems(items, selectedDestination).then((res) => {
            closeDuplicateToView();

            if (openAfterDuplicating) {
                openArticle(res[0]._id, 'edit');
            }
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
