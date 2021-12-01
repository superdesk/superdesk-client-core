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
    getPublishingDatePatch,
} from './publishing-date-options';
import ng from 'core/services/ng';
import {confirmPublish} from 'apps/authoring/authoring/services/quick-publish-modal';
import {cloneDeep} from 'lodash';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    markupV2: boolean;
}

interface IState {
    selectedDestination: ISendToDestination;
    publishingDateOptions: IPublishingDateOptions;
}

export class PublishTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...getInitialPublishingDateOptions([this.props.item]),
            selectedDestination: getInitialDestination([this.props.item], false),
            publishingDateOptions: getInitialPublishingDateOptions([props.item]),
        };

        this.doPublish = this.doPublish.bind(this);
        this.otherDeskSelected = this.otherDeskSelected.bind(this);
    }

    otherDeskSelected(): boolean {
        return this.state.selectedDestination.type === 'desk'
            && this.state.selectedDestination.desk !== this.props.item.task?.desk;
    }

    doPublish(applyDestination?: boolean): void {
        const {item} = this.props;

        let itemToPublish: IArticle = {
            ...item,
            ...getPublishingDatePatch(item, this.state.publishingDateOptions),
        };

        if (applyDestination === true && this.state.selectedDestination.type === 'desk' && this.otherDeskSelected()) {
            itemToPublish = {
                ...itemToPublish,
                task: {
                    ...(itemToPublish.task ?? {}),
                    desk: this.state.selectedDestination.desk,
                    stage: this.state.selectedDestination.stage,
                },
            };
        }

        confirmPublish([itemToPublish]).then(() => {
            // Cloning to prevent objects from being modified by angular
            ng.get('authoring').publish(cloneDeep(this.props.item), cloneDeep(itemToPublish));
        });
    }

    render() {
        const {markupV2} = this.props;
        const otherDeskSelected = this.otherDeskSelected();

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

                            /**
                             * Changing the destination is only used
                             * to control which desk's output stage
                             * the published item appears in, thus
                             * choosing a stage would not have an impact
                             */
                            hideStages={true}
                        />
                    </ToggleBox>

                    <PublishingDateOptions
                        items={[this.props.item]}
                        value={this.state.publishingDateOptions}
                        onChange={(val) => {
                            this.setState({publishingDateOptions: val});
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
                            this.doPublish(true);
                        }}
                        disabled={!otherDeskSelected}
                        size="large"
                        type="primary"
                        expand
                        style="hollow"
                    />

                    <Button
                        text={gettext('Publish')}
                        onClick={() => {
                            this.doPublish();
                        }}
                        disabled={otherDeskSelected}
                        size="large"
                        type="highlight"
                        expand
                    />
                </PanelFooter>
            </React.Fragment>
        );
    }
}
