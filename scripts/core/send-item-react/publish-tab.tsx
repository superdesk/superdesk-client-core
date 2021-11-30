import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {DestinationSelect} from './destination-select';
import {ISendToDestination} from './interfaces';
import {getInitialDestination} from './get-initial-destination';
import {
    IPublishingDateOptions,
    getInitialPublishingDateOptions,
    PublishingDateOptions,
} from './publishing-date-options';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    markupV2: boolean;
}

interface IState extends IPublishingDateOptions {
    selectedDestination: ISendToDestination;
}

export class PublishTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...getInitialPublishingDateOptions([this.props.item]),
            selectedDestination: getInitialDestination([this.props.item], false),
        };
    }

    render() {
        const {markupV2} = this.props;

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('From')} initiallyOpen>
                        <DestinationSelect
                            value={this.state.selectedDestination}
                            onChange={(value) => {
                                this.setState({
                                    selectedDestination: value,
                                });
                            }}
                            includePersonalSpace={false}
                        />
                    </ToggleBox>

                    <PublishingDateOptions
                        items={[this.props.item]}
                        value={{
                            embargo: this.state.embargo,
                            publishSchedule: this.state.publishSchedule,
                            timeZone: this.state.timeZone,
                        }}
                        onChange={({embargo, publishSchedule, timeZone}) => {
                            this.setState({embargo, publishSchedule, timeZone});
                        }}
                    />

                    {
                        // TODO: add target: subscribers, regions, target types
                    }
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    <Button
                        text={gettext('Publish from')}
                        onClick={() => {
                            //
                        }}
                        size="large"
                        type="primary"
                        expand
                    />

                    <Button
                        text={gettext('Publish')}
                        onClick={() => {
                            //
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
