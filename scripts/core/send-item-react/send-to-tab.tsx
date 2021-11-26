import React from 'react';
import {IDesk, IStage, IArticle} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {Button, ToggleBox, FormLabel} from 'superdesk-ui-framework/react';
import {gettext, toServerDateFormat} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dispatchInternalEvent} from 'core/internal-events';
import {DateTimePicker} from 'core/ui/components/date-time-picker';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {appConfig, extensions} from 'appConfig';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';
import {getInitialDestination} from './get-initial-destination';
import {notNullOrUndefined, assertNever} from 'core/helpers/typescript-helpers';

export interface ISendToDestinationDesk {
    type: 'desk';
    desk: IDesk['_id'];
    stage: IStage['_id'];
}

export interface ISendToDestinationPersonalSpace {
    type: 'personal-space';
}

export type ISendToDestination = ISendToDestinationDesk | ISendToDestinationPersonalSpace;

const PERSONAL_SPACE = 'PERSONAL_SPACE';

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
    allDesks: OrderedMap<IDesk['_id'], IDesk>;
    stagesForDesk: OrderedMap<IStage['_id'], IStage>;
    selectedDestination: ISendToDestination;
    embargo: Date | null;
    publishSchedule: Date | null;
    timeZone: string | null;
}

function canSendToPersonal(items: Array<IArticle>) {
    const haveDeskSet = items.every((item) => item.task?.desk != null);

    return haveDeskSet
        && appConfig?.features?.sendToPersonal === true
        && sdApi.user.hasPrivilege('send_to_personal');
}

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
// TODO: ensure SDESK-6319 is merged
export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const allDesks = sdApi.desks.getAllDesks();
        const selectedDestination = getInitialDestination(allDesks, props.items, canSendToPersonal(props.items));
        const stagesForDesk = selectedDestination.type === 'desk'
            ? sdApi.desks.getDeskStages(selectedDestination.desk)
            : OrderedMap<IStage['_id'], IStage>();

        this.state = {
            allDesks,
            stagesForDesk,
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
                        return this.state.allDesks.find((desk) => desk._id === selectedDestination.desk);
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
        const {allDesks, selectedDestination, stagesForDesk} = this.state;
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

        const destinationPersonalSpace: {id: string; label: string} = {
            id: PERSONAL_SPACE, label: gettext('Personal space'),
        };

        let destinations: Array<{id: string; label: string}> =
            allDesks.toArray().map((desk) => ({id: desk._id, label: desk.name}));

        if (canSendToPersonal(items)) {
            destinations.push(destinationPersonalSpace);
        }

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('Destination')} initiallyOpen>
                        <div style={{paddingTop: 5}}>
                            <SelectFilterable
                                value={(() => {
                                    const dest = this.state.selectedDestination;

                                    if (dest.type === 'personal-space') {
                                        return destinationPersonalSpace;
                                    } else if (dest.type === 'desk') {
                                        const destinationDesk: {id: string; label: string} = {
                                            id: dest.desk,
                                            label: this.state.allDesks.find((desk) => desk._id === dest.desk).name,
                                        };

                                        return destinationDesk;
                                    } else {
                                        assertNever(dest);
                                    }
                                })()}
                                items={destinations}
                                onChange={(val) => {
                                    if (val.id === PERSONAL_SPACE) {
                                        this.setState({
                                            selectedDestination: {
                                                type: 'personal-space',
                                            },
                                        });
                                    } else {
                                        const deskId: IDesk['_id'] = val.id;
                                        const nextStages = sdApi.desks.getDeskStages(deskId);

                                        this.setState({
                                            selectedDestination: {
                                                type: 'desk',
                                                desk: deskId,
                                                stage: nextStages.first()._id,
                                            },
                                            stagesForDesk: nextStages,
                                        });
                                    }
                                }}
                                getLabel={(destination) => destination.label}
                                required
                            />
                        </div>

                        {
                            selectedDestination.type === 'desk' && (
                                <div>
                                    <br />

                                    <FormLabel text={gettext('Stage')} />

                                    <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 5}}>
                                        {
                                            stagesForDesk.map((stage) => (
                                                <div key={stage._id} style={{flexBasis: 'calc((100% - 10px) / 2)'}}>
                                                    <Button
                                                        text={stage.name}
                                                        disabled={
                                                            items.length === 1
                                                                ? stage._id === items[0].task.stage
                                                                : false
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                selectedDestination: {
                                                                    ...selectedDestination,
                                                                    stage: stage._id,
                                                                },
                                                            });
                                                        }}
                                                        type={
                                                            selectedDestination.stage === stage._id
                                                                ? 'primary'
                                                                : 'default'
                                                        }
                                                        expand
                                                    />
                                                </div>
                                            )).toArray()
                                        }
                                    </div>
                                </div>
                            )
                        }
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
