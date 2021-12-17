import React from 'react';
import {IDesk, IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext, gettextPlural} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dispatchInternalEvent} from 'core/internal-events';
import {extensions, appConfig} from 'appConfig';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';
import {getInitialDestination} from './get-initial-destination';
import {notNullOrUndefined, assertNever} from 'core/helpers/typescript-helpers';
import {canSendToPersonal} from './can-send-to-personal';
import {DestinationSelect} from './destination-select';
import {ISendToDestination} from './interfaces';
import {
    IPublishingDateOptions,
    getInitialPublishingDateOptions,
    PublishingDateOptions,
    getPublishingDatePatch,
} from './publishing-date-options';

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

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
// TODO: ensure SDESK-6319 is merged
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

        const middlewares = Object.values(extensions)
            .map((ext) => ext?.activationResult?.contributions?.entities?.article?.onSendBefore)
            .filter(notNullOrUndefined);

        return handleUnsavedChanges(this.props.items)
            .then((items) => {
                const selectedDeskObj: IDesk | null = (() => {
                    if (selectedDestination.type === 'desk') {
                        return sdApi.desks.getAllDesks().find((desk) => desk._id === selectedDestination.desk);
                    } else {
                        return null;
                    }
                })();

                middlewares.reduce(
                    (current, next) => {
                        return current.then(() => {
                            return next(items, selectedDeskObj);
                        });
                    },
                    Promise.resolve(),
                ).then(() => {
                    return Promise.all(
                        items.map((item) => {
                            return (() => {
                                /**
                                 * If needed, update embargo / publish schedule / time zone
                                 */

                                if (items.length !== 1) {
                                    return Promise.resolve({});
                                }

                                var patch = getPublishingDatePatch(item, this.state.publishingDateOptions);

                                if (Object.keys(patch).length > 0) {
                                    return httpRequestJsonLocal<IArticle>({
                                        method: 'PATCH',
                                        path: `/archive/${item._id}`,
                                        payload: patch,
                                        headers: {
                                            'If-Match': item._etag,
                                        },
                                    });
                                } else {
                                    return Promise.resolve({});
                                }
                            })().then((patch1: Partial<IArticle>) => {
                                const payload = (() => {
                                    const basePayload = {};

                                    if (sendPackageItems) {
                                        basePayload['allPackageItems'] = true;
                                    }

                                    if (selectedDestination.type === 'personal-space') {
                                        return basePayload;
                                    } else if (selectedDestination.type === 'desk') {
                                        const _payload: Partial<IArticle> = {
                                            ...basePayload,
                                            task: {
                                                desk: selectedDestination.desk,
                                                stage: selectedDestination.stage,
                                            },
                                        };

                                        return _payload;
                                    } else {
                                        assertNever(selectedDestination);
                                    }
                                })();

                                return httpRequestJsonLocal({
                                    method: 'POST',
                                    path: `/archive/${item._id}/move`,
                                    payload: payload,
                                }).then((patch2: Partial<IArticle>) => {
                                    return {
                                        ...patch1,
                                        ...patch2,
                                    };
                                });
                            });
                        }),
                    ).then((patches: Array<Partial<IArticle>>) => {
                        /**
                         * Patch articles that are open in authoring.
                         * Otherwise data displayed in authoring might be out of date
                         * and _etag mismatch error would be thrown when attempting to save.
                         */
                        for (const patch of patches) {
                            dispatchInternalEvent(
                                'dangerouslyOverwriteAuthoringData',
                                patch,
                            );
                        }

                        closeSendToView();

                        if (itemToOpenAfterSending != null) {
                            openArticle(itemToOpenAfterSending, 'edit');
                        }

                        notify.success(gettext('Item sent'));

                        sdApi.preferences.update('destination:active', selectedDestination);
                    });
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
