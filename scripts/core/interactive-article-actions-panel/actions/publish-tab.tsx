import React, {CSSProperties} from 'react';
import {IArticle, IRestApiResponse} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {DestinationSelect} from '../subcomponents/destination-select';
import {IPanelError, IPropsHocInteractivePanelTab, ISendToDestination} from '../interfaces';
import {getCurrentDeskDestination} from '../utils/get-initial-destination';
import {
    IPublishingDateOptions,
    getInitialPublishingDateOptions,
    PublishingDateOptions,
    getPublishingDatePatch,
} from '../subcomponents/publishing-date-options';
import ng from 'core/services/ng';
import {confirmPublish} from 'apps/authoring/authoring/services/quick-publish-modal';
import {cloneDeep} from 'lodash';
import {
    PublishingTargetSelect,
    IPublishingTarget,
    getPublishingTargetPatch,
} from '../subcomponents/publishing-target-select';
import {appConfig, extensions} from 'appConfig';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {ISubscriber} from 'superdesk-interfaces/Subscriber';
import {showModal} from '@superdesk/common';
import {PreviewModal} from 'apps/publish-preview/previewModal';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';

interface IProps extends IPropsHocInteractivePanelTab {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    markupV2: boolean;
    onError: (error: IPanelError) => void;
    onDataChange: (item: IArticle) => void;
}

interface IState {
    selectedDestination: ISendToDestination;
    publishingDateOptions: IPublishingDateOptions;
    publishingTarget: IPublishingTarget;
    subscribers: Array<ISubscriber> | null;
}

export class WithPublishTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...getInitialPublishingDateOptions([this.props.item]),
            selectedDestination: getCurrentDeskDestination(),
            publishingDateOptions: getInitialPublishingDateOptions([props.item]),
            publishingTarget: {
                target_subscribers: this.props.item.target_subscribers ?? [],
                target_regions: this.props.item.target_regions ?? [],
                target_types: this.props.item.target_regions ?? [],
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
                const emptyPatches: Array<Partial<IArticle>> = [{}];

                const afterSending =
                    applyDestination === true
                    && this.state.selectedDestination.type === 'desk'
                    && this.otherDeskSelected()
                        ? sdApi.article.sendItems([item], this.state.selectedDestination)
                        : Promise.resolve(emptyPatches);

                afterSending.then(([patchAfterSending]) => {
                    let itemToPublish: IArticle = {
                        ...item,
                        ...patchAfterSending,
                        ...getPublishingDatePatch(item, this.state.publishingDateOptions),
                        ...getPublishingTargetPatch(item, this.state.publishingTarget),
                    };

                    const confirmed = appConfig?.features?.confirmDueDate === true
                        ? confirmPublish([itemToPublish])
                        : Promise.resolve();

                    confirmed.then(() => {
                        // Cloning to prevent objects from being modified by angular
                        sdApi.article.publishItem(
                            cloneDeep(item),
                            cloneDeep(itemToPublish),
                            'publish',
                            this.props.onError,
                        )
                            .then(() => {
                                ng.get('authoringWorkspace').close();
                                ng.get('$rootScope').$applyAsync(); // required for authoring close to take effect
                                notify.success('Item published.');
                            });
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
        const publishFromEnabled = (appConfig.ui.sendAndPublish ?? true) === true;

        const sectionsFromExtensions = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.publishingSections ?? []);

        const style: CSSProperties | undefined = sectionsFromExtensions.length > 0
            ? {display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 32, height: '100%'}
            : undefined;

        const childrenStyle: CSSProperties = {
            flex: 1, // equal width for columns
            position: 'relative',
            height: '100%',
        };

        return this.props.children({
            columnCount: 1 + sectionsFromExtensions.length,
            content: (
                <React.Fragment>
                    <PanelContent markupV2={markupV2} data-test-id="publishing-section">
                        <div style={style}>
                            <div style={childrenStyle}>
                                {
                                    publishFromEnabled && (
                                        <ToggleBox title={gettext('From')} initiallyOpen>
                                            <DestinationSelect
                                                value={this.state.selectedDestination}
                                                onChange={(value) => {
                                                    this.setState({
                                                        selectedDestination: value,
                                                    });

                                                    /**
                                                     * do not persist destination
                                                     * article desk isn't supposed to be changed,
                                                     * except when user chooses "publish from" option
                                                     * that sends to another desk and publishes at the same time.
                                                     * If operation is cancelled, "publish from" value must not be saved
                                                     */
                                                }}
                                                includePersonalSpace={false}

                                                /**
                                                 * Changing the destination is only used
                                                 * to control which desk's output stage
                                                 * the published item appears in, thus
                                                 * choosing a stage would not have an impact
                                                 */
                                                hideStages={true}

                                                availableDesks={sdApi.desks.getAllDesks()
                                                    .filter((desk) => sdApi.article.canPublishOnDesk(desk.desk_type))
                                                    .toOrderedMap()
                                                }
                                            />
                                        </ToggleBox>
                                    )
                                }

                                <PublishingDateOptions
                                    items={[this.props.item]}
                                    value={this.state.publishingDateOptions}
                                    onChange={(val) => {
                                        this.setState(
                                            {publishingDateOptions: val},
                                            () => {
                                                this.props.onDataChange?.({
                                                    ...this.props.item,
                                                    ...getPublishingDatePatch(
                                                        this.props.item,
                                                        this.state.publishingDateOptions,
                                                    ),
                                                });
                                            },
                                        );
                                    }}
                                    allowSettingEmbargo={appConfig.ui.publishEmbargo !== false}
                                />

                                <PublishingTargetSelect
                                    value={this.state.publishingTarget}
                                    onChange={(val) => {
                                        this.setState(
                                            {publishingTarget: val},
                                            () => {
                                                this.props.onDataChange?.({
                                                    ...this.props.item,
                                                    ...getPublishingTargetPatch(
                                                        this.props.item,
                                                        this.state.publishingTarget,
                                                    ),
                                                });
                                            },
                                        );
                                    }}
                                />
                            </div>

                            {
                                sectionsFromExtensions.map((panel, i) => {
                                    const Component = panel.component;

                                    return (
                                        <div style={childrenStyle} key={i}>
                                            <Component item={this.props.item} />
                                        </div>
                                    );
                                })
                            }

                        </div>
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
                            publishFromEnabled && (
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
                                    data-test-id="publish-from"
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
                            data-test-id="publish"
                        />
                    </PanelFooter>
                </React.Fragment>
            ),
        });
    }
}
