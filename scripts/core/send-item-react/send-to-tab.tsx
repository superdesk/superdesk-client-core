import React from 'react';
import {IDesk, IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext, toServerDateFormat} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dispatchInternalEvent} from 'core/internal-events';
import {DateTimePicker} from 'core/ui/components/date-time-picker';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {appConfig, extensions} from 'appConfig';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';
import {getInitialDestination} from './get-initial-destination';
import {notNullOrUndefined, assertNever} from 'core/helpers/typescript-helpers';
import {canSendToPersonal} from './can-send-to-personal';
import {DestinationSelect} from './destination-select';
import {ISendToDestination} from './interfaces';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    markupV2: boolean;

    /**
     * Required to handle unsaved changes prompt
     */
    onSendBefore(items: Array<IArticle>): Promise<Array<IArticle>>;
}

interface IState {
    selectedDestination: ISendToDestination;
    embargo: Date | null;
    publishSchedule: Date | null;
    timeZone: string | null;
}

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
// TODO: ensure SDESK-6319 is merged
export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const selectedDestination = getInitialDestination(props.items, canSendToPersonal(props.items));

        this.state = {
            selectedDestination: selectedDestination,
            embargo: props.items.length === 1 && props.items[0].embargo != null
                ? new Date(props.items[0].embargo) ?? null
                : null,
            publishSchedule: props.items.length === 1 && props.items[0].publish_schedule != null
                ? new Date(props.items[0].publish_schedule) ?? null
                : null,
            timeZone: props.items.length === 1 ? props.items[0].schedule_settings?.time_zone ?? null : null,
        };

        this.sendItems = this.sendItems.bind(this);
    }

    sendItems(itemToOpenAfterSending?: IArticle['_id']) {
        const {selectedDestination} = this.state;
        const {closeSendToView, onSendBefore} = this.props;

        const middlewares = Object.values(extensions)
            .map((ext) => ext?.activationResult?.contributions?.entities?.article?.onSendBefore)
            .filter(notNullOrUndefined);

        return onSendBefore(this.props.items)
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

                                const itemEmbargo = item.embargo;
                                const itemPublishSchedule = item.publish_schedule;
                                const itemTimeZone = item.schedule_settings?.time_zone;

                                const currentEmbargo = this.state.embargo == null
                                    ? null
                                    : toServerDateFormat(this.state.embargo);

                                const currentPublishSchedule = this.state.publishSchedule == null
                                    ? null
                                    : toServerDateFormat(this.state.publishSchedule);

                                const currentTimeZone = this.state.timeZone;

                                if (
                                    currentEmbargo !== itemEmbargo
                                    || currentPublishSchedule !== itemPublishSchedule
                                    || currentTimeZone !== itemTimeZone
                                ) {
                                    const patch: Partial<IArticle> = {
                                        embargo: currentEmbargo,
                                        publish_schedule: currentPublishSchedule,
                                        schedule_settings: {
                                            ...(item.schedule_settings ?? {}),
                                            time_zone: currentTimeZone,
                                        },
                                    };

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
                                    if (selectedDestination.type === 'personal-space') {
                                        return {};
                                    } else if (selectedDestination.type === 'desk') {
                                        const _payload: Partial<IArticle> = {
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
                            <div>
                                {
                                    this.state.publishSchedule == null && (
                                        <ToggleBox title={gettext('Embargo')} initiallyOpen>
                                            <DateTimePicker
                                                value={this.state.embargo}
                                                onChange={(val) => {
                                                    this.setState({
                                                        embargo: val,
                                                        timeZone: this.state.timeZone ?? appConfig.default_timezone,
                                                    });
                                                }}
                                            />
                                        </ToggleBox>
                                    )
                                }

                                {
                                    this.state.embargo == null && (
                                        <ToggleBox title={gettext('Publish schedule')} initiallyOpen>
                                            <DateTimePicker
                                                value={this.state.publishSchedule}
                                                onChange={(val) => {
                                                    this.setState({
                                                        publishSchedule: val,
                                                        timeZone: this.state.timeZone ?? appConfig.default_timezone,
                                                    });
                                                }}
                                            />
                                        </ToggleBox>
                                    )
                                }

                                {
                                    (this.state.embargo != null || this.state.publishSchedule != null) && (
                                        <ToggleBox title={gettext('Time zone')} initiallyOpen>
                                            <TimeZonePicker
                                                value={this.state.timeZone}
                                                onChange={(val) => {
                                                    this.setState({timeZone: val});
                                                }}
                                            />

                                            {
                                                this.state.timeZone == null && (
                                                    <div style={{paddingTop: 5}}>
                                                        {gettext('If not set, the UTC+0 time zone is assumed.')}
                                                    </div>
                                                )
                                            }
                                        </ToggleBox>
                                    )
                                }
                            </div>
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
                </PanelFooter>
            </React.Fragment>
        );
    }
}
