import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext, gettextPlural} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {appConfig} from 'appConfig';
import {sdApi} from 'api';
import {getInitialDestination} from '../utils/get-initial-destination';
import {canSendToPersonal} from '../utils/can-send-to-personal';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {
    IPublishingDateOptions,
    getInitialPublishingDateOptions,
    PublishingDateOptions,
} from '../subcomponents/publishing-date-options';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    markupV2: boolean;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

interface IState {
    selectedDestination: ISendToDestination;
    publishingDateOptions: IPublishingDateOptions;
}

export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const selectedDestination = getInitialDestination(props.items, canSendToPersonal(props.items));

        this.state = {
            selectedDestination: selectedDestination,
            publishingDateOptions: getInitialPublishingDateOptions(props.items),
        };

        this.sendItems = this.sendItems.bind(this);
    }

    sendItems(itemToOpenAfterSending?: IArticle['_id'], sendPackageItems?: boolean) {
        const {selectedDestination} = this.state;
        const {closeSendToView, handleUnsavedChanges} = this.props;

        return handleUnsavedChanges(this.props.items)
            .then((items) => {
                sdApi.article.sendItems(
                    items,
                    selectedDestination,
                    sendPackageItems,
                    this.state.publishingDateOptions,
                ).then(() => {
                    closeSendToView();

                    if (itemToOpenAfterSending != null) {
                        openArticle(itemToOpenAfterSending, 'edit');
                    } else if (items.length === 1 && applicationState.articleInEditMode === items[0]._id) {
                        authoringApiCommon.closeAuthoringForce();
                    }
                }).catch(() => {
                    /**
                     * Middleware that rejected the promise is responsible
                     * for informing the user regarding the reason.
                     */
                });
            }).catch(() => {
                // sending cancelled by user
            });
    }

    render() {
        const {items, markupV2} = this.props;
        const itemToOpenAfterSending: IArticle['_id'] | null = (() => {
            if (items.length !== 1) {
                return null;
            }

            const item = items[0];

            if (item._id !== applicationState.articleInEditMode) {
                return item._id;
            } else {
                return null;
            }
        })();

        const sendPackages = this.props.items.every(({type}) => type === 'composite');

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('Destination')} initiallyOpen>
                        <DestinationSelect
                            desks={sdApi.desks.getAllDesks().filter((desk) => desk.send_to_desk_allowed).toOrderedMap()}
                            value={this.state.selectedDestination}
                            onChange={(value) => {
                                this.setState({
                                    selectedDestination: value,
                                });
                            }}
                            includePersonalSpace={canSendToPersonal(items)}
                            disallowedStages={// if only one item is being sent, disallow current stage
                                items.length === 1 && items[0]?.task?.stage != null
                                    ? [items[0].task.stage]
                                    : undefined
                            }
                        />
                    </ToggleBox>

                    {
                        this.props.items.length === 1 && (
                            <PublishingDateOptions
                                items={this.props.items}
                                value={this.state.publishingDateOptions}
                                onChange={(val) => {
                                    this.setState({publishingDateOptions: val});
                                }}
                                allowSettingEmbargo={appConfig.ui.sendEmbargo !== false}
                            />
                        )
                    }
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    {
                        itemToOpenAfterSending != null && (
                            <Button
                                text={gettext('Send and open')}
                                onClick={() => {
                                    this.sendItems(itemToOpenAfterSending);
                                }}
                                size="large"
                                type="primary"
                                expand
                            />
                        )
                    }

                    <Button
                        text={gettext('Send')}
                        onClick={() => {
                            this.sendItems();
                        }}
                        size="large"
                        type="primary"
                        expand
                    />

                    {
                        sendPackages && (
                            <Button
                                text={gettextPlural(
                                    this.props.items.length,
                                    'Send package and items',
                                    'Send packages and items',
                                )}
                                onClick={() => {
                                    this.sendItems(undefined, true);
                                }}
                                size="large"
                                type="primary"
                                expand
                            />
                        )
                    }
                </PanelFooter>
            </React.Fragment>
        );
    }
}
