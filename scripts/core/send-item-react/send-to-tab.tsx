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
import {notNullOrUndefined} from 'core/helpers/typescript-helpers';

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
    selectedDesk: IDesk['_id'];
    selectedStage: IStage['_id'];
    embargo: Date | null;
    publishSchedule: Date | null;
    timeZone: string | null;
}

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
// TODO: ensure SDESK-6319 is merged
export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const allDesks = sdApi.desks.getAllDesks();
        const selectedDesk = allDesks.first();
        const stagesForDesk = sdApi.desks.getDeskStages(selectedDesk._id);
        const initialDestination = getInitialDestination(allDesks, props.items);

        this.state = {
            allDesks,
            stagesForDesk,
            selectedDesk: initialDestination.desk,
            selectedStage: initialDestination.stage,
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
        const {closeSendToView, onSendBefore} = this.props;
        const {selectedDesk, selectedStage} = this.state;

        const selectedDeskObj = this.state.allDesks.find((desk) => desk._id === selectedDesk);

        const middlewares = Object.values(extensions)
            .map((ext) => ext?.activationResult?.contributions?.entities?.article?.onSendBefore)
            .filter(notNullOrUndefined);

        return onSendBefore(this.props.items)
            .then((items) => {
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
                                return httpRequestJsonLocal({
                                    method: 'POST',
                                    path: `/archive/${item._id}/move`,
                                    payload: {
                                        'task': {
                                            'desk': selectedDesk,
                                            'stage': selectedStage,
                                        },
                                    },
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

                        sdApi.preferences.update('destination:active', {
                            desk: selectedDesk,
                            stage: selectedStage,
                        });
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
        const {allDesks, stagesForDesk} = this.state;
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
                        <FormLabel text={gettext('Desk')} />

                        <div style={{paddingTop: 5}}>
                            <SelectFilterable
                                value={this.state.selectedDesk == null ? null : allDesks.get(this.state.selectedDesk)}
                                items={allDesks.toArray()}
                                onChange={(val) => {
                                    const deskId = val._id;
                                    const nextStages = sdApi.desks.getDeskStages(deskId);

                                    this.setState({
                                        selectedDesk: deskId,
                                        stagesForDesk: sdApi.desks.getDeskStages(deskId),
                                        selectedStage: nextStages.first()._id,
                                    });
                                }}
                                getLabel={(desk) => desk.name}
                                required
                            />
                        </div>

                        <br />

                        <FormLabel text={gettext('Stage')} />

                        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 5}}>
                            {
                                stagesForDesk.map((stage) => (
                                    <div key={stage._id} style={{flexBasis: 'calc((100% - 10px) / 2)'}}>
                                        <Button
                                            text={stage.name}
                                            disabled={items.length === 1 ? stage._id === items[0].task.stage : false}
                                            onClick={() => {
                                                this.setState({selectedStage: stage._id});
                                            }}
                                            type={this.state.selectedStage === stage._id ? 'primary' : 'default'}
                                            expand
                                        />
                                    </div>
                                )).toArray()
                            }
                        </div>
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
