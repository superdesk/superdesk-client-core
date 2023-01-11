import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {getInitialDestination} from '../utils/get-initial-destination';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {sdApi} from 'api';
import {OrderedMap} from 'immutable';

interface IProps {
    items: Array<IArticle>;
    closeUnspikeView(): void;
    markupV2: boolean;
}

interface IState {
    selectedDestination: ISendToDestination;
}

export class UnspikeTab extends React.PureComponent<IProps, IState> {
    availableDesks: OrderedMap<string, IDesk>;

    constructor(props: IProps) {
        super(props);

        this.availableDesks = sdApi.desks.getAllDesks();

        this.state = {
            selectedDestination: getInitialDestination(props.items, false, this.availableDesks),
        };

        this.doUnspike = this.doUnspike.bind(this);
    }

    doUnspike() {
        const {selectedDestination} = this.state;

        if (selectedDestination.type === 'desk') {
            Promise.all(
                this.props.items.map((item) => sdApi.article.doUnspike(
                    item,
                    selectedDestination.desk,
                    selectedDestination.stage,
                )),
            ).then(() => {
                this.props.closeUnspikeView();
            });
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
                    <Button
                        text={gettext('Unspike')}
                        onClick={() => {
                            this.doUnspike();
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
