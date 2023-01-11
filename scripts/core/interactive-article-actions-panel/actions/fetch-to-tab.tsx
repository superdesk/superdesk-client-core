import React from 'react';
import {IArticle, IDesk, OrderedMap} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {getInitialDestination} from '../utils/get-initial-destination';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {sdApi} from 'api';
import {noop} from 'lodash';

interface IProps {
    items: Array<IArticle>;
    closeFetchToView(): void;
    markupV2: boolean;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

interface IState {
    selectedDestination: ISendToDestination;
}

export class FetchToTab extends React.PureComponent<IProps, IState> {
    availableDesks: OrderedMap<string, IDesk>;

    constructor(props: IProps) {
        super(props);

        this.availableDesks = sdApi.desks.getAllDesks();

        this.state = {
            selectedDestination: getInitialDestination(props.items, false, this.availableDesks),
        };

        this.fetchItems = this.fetchItems.bind(this);
    }

    fetchItems(openAfterFetching?: boolean) {
        if (this.state.selectedDestination.type === 'desk') { // personal space not supported
            sdApi.article.fetchItems(this.props.items, this.state.selectedDestination)
                .then((res) => {
                    this.props.closeFetchToView();

                    if (openAfterFetching) {
                        openArticle(res[0]._id, 'edit');
                    }
                })
                .catch(noop);
        }
    }

    render() {
        const {markupV2} = this.props;

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('Destination')} initiallyOpen>
                        <DestinationSelect
                            availableDesks={this.availableDesks}
                            value={this.state.selectedDestination}
                            onChange={(value) => {
                                this.setState({
                                    selectedDestination: value,
                                });
                            }}
                            includePersonalSpace={false}
                        />
                    </ToggleBox>
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    {
                        this.props.items.length === 1 && (
                            <Button
                                text={gettext('Fetch and open')}
                                onClick={() => {
                                    this.fetchItems(true);
                                }}
                                size="large"
                                type="primary"
                                expand
                            />
                        )
                    }

                    <Button
                        text={gettext('Fetch')}
                        onClick={() => {
                            this.fetchItems();
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
