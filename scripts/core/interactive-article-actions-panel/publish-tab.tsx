import React from 'react';
import {IArticle, IRestApiResponse} from 'superdesk-api';
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
import {PublishingTargetSelect, IPublishingTarget, getPublishingTargetPatch} from './publishing-target-select';
import {appConfig} from 'appConfig';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {ISubscriber} from 'superdesk-interfaces/Subscriber';
import {showModal} from 'core/services/modalService';
import {PreviewModal} from 'apps/publish-preview/previewModal';
import {notify} from 'core/notify/notify';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    markupV2: boolean;
}

interface IState {
    selectedDestination: ISendToDestination;
    publishingDateOptions: IPublishingDateOptions;
    publishingTarget: IPublishingTarget;
    subscribers: Array<ISubscriber> | null;
}

export class PublishTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...getInitialPublishingDateOptions([this.props.item]),
            selectedDestination: getInitialDestination([this.props.item], false),
            publishingDateOptions: getInitialPublishingDateOptions([props.item]),
            publishingTarget: {
                target_subscribers: [],
                target_regions: [],
                target_types: [],
            },
            subscribers: null,
        };

        this.doPublish = this.doPublish.bind(this);
        this.doPreview = this.doPreview.bind(this);
        this.otherDeskSelected = this.otherDeskSelected.bind(this);
    }

    otherDeskSelected(): boolean {
        return this.state.selectedDestination.type === 'desk'
            && this.state.selectedDestination.desk !== this.props.item.task?.desk;
    }

    doPublish(applyDestination?: boolean): void {
        this.props.handleUnsavedChanges()
            .then((item) => {
                let itemToPublish: IArticle = {
                    ...item,
                    ...getPublishingDatePatch(item, this.state.publishingDateOptions),
                    ...getPublishingTargetPatch(item, this.state.publishingTarget),
                };

                if (
                    applyDestination === true
                    && this.state.selectedDestination.type === 'desk'
                    && this.otherDeskSelected()
                ) {
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
                    ng.get('authoring').publish(cloneDeep(this.props.item), cloneDeep(itemToPublish)).then(() => {
                        ng.get('authoringWorkspace').close();
                        notify.success('Item published.');
                    });
                });
            })
            .catch(() => {
                // cancelled by user
            });
    }

    doPreview() {
        this.props.handleUnsavedChanges().then(() => {
            showModal(({closeModal}) => (
                <PreviewModal
                    itemId={this.props.item._id}
                    subscribers={this.state.subscribers}
                    closeModal={closeModal}
                />
            ));
        });
    }

    componentDidMount() {
        httpRequestJsonLocal({
            method: 'GET',
            path: '/subscribers',
        }).then((res: IRestApiResponse<ISubscriber>) => {
            this.setState({subscribers: res._items});
        });
    }

    render() {
        if (this.state.subscribers == null) { // loading
            return null;
        }

        const {markupV2} = this.props;
        const otherDeskSelected = this.otherDeskSelected();
        const canPreview: boolean = this.state.subscribers.some(({destinations}) =>
            (destinations ?? []).some(({preview_endpoint_url}) => (preview_endpoint_url ?? '').length > 0),
        );

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
                        allowSettingEmbargo={appConfig.ui.publishEmbargo !== false}
                    />

                    <PublishingTargetSelect
                        value={this.state.publishingTarget}
                        onChange={(val) => {
                            this.setState({
                                publishingTarget: val,
                            });
                        }}
                    />
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    {
                        canPreview && (
                            <Button
                                text={gettext('Preview')}
                                onClick={() => {
                                    this.doPreview();
                                }}
                                size="large"
                                expand
                                style="hollow"
                            />
                        )
                    }

                    {
                        appConfig.ui.sendAndPublish === true && (
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
                        )
                    }

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
