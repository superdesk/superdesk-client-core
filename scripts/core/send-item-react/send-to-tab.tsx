import React from 'react';
import {IDesk, IStage, IArticle} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {desks} from 'api/desks';
import {Button, ToggleBox, FormLabel} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dispatchInternalEvent} from 'core/internal-events';
import {DateTimePicker} from 'core/ui/components/date-time-picker';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {appConfig} from 'appConfig';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    markupV2: boolean;
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

function sendItems(items: Array<IArticle>, deskId: IDesk['_id'], stageId: IStage['_id']): Promise<void> {
    return Promise.all(
        items.map((item) => {
            return httpRequestJsonLocal({
                method: 'POST',
                path: `/archive/${item._id}/move`,
                payload: {
                    'task': {
                        'desk': deskId,
                        'stage': stageId,
                    },
                },
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
    });
}

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const allDesks = desks.getAllDesks();
        const selectedDesk = allDesks.first();
        const stagesForDesk = desks.getDeskStages(selectedDesk._id);

        this.state = {
            allDesks,
            stagesForDesk,
            selectedDesk: selectedDesk._id,
            selectedStage: stagesForDesk.first()._id,
            embargo: null,
            publishSchedule: null,
            timeZone: props.items.length === 1 ? props.items[0].schedule_settings?.time_zone ?? null : null,
        };
    }
    render() {
        const {items, closeSendToView, markupV2} = this.props;
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
                                    const nextStages = desks.getDeskStages(deskId);

                                    this.setState({
                                        selectedDesk: deskId,
                                        stagesForDesk: desks.getDeskStages(deskId),
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
                        itemToOpenAfterSending && (
                            <Button
                                text={gettext('Send and open')}
                                onClick={() => {
                                    sendItems(this.props.items, this.state.selectedDesk, this.state.selectedStage)
                                        .then(() => {
                                            closeSendToView();
                                            openArticle(itemToOpenAfterSending, 'edit');
                                        });
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
                            sendItems(this.props.items, this.state.selectedDesk, this.state.selectedStage).then(() => {
                                closeSendToView();
                            });
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
