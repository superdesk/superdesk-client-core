import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {DateTimePicker} from 'core/ui/components/date-time-picker';
import {appConfig} from 'appConfig';
import {ToggleBox} from 'superdesk-ui-framework/react';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';

export interface IPublishingDateOptions {
    embargo: Date | null;
    publishSchedule: Date | null;
    timeZone: string | null;
}

export function getInitialPublishingDateOptions(items: Array<IArticle>): IPublishingDateOptions {
    return {
        embargo: items.length === 1 && items[0].embargo != null
            ? new Date(items[0].embargo) ?? null
            : null,
        publishSchedule: items.length === 1 && items[0].publish_schedule != null
            ? new Date(items[0].publish_schedule) ?? null
            : null,
        timeZone: items.length === 1 ? items[0].schedule_settings?.time_zone ?? null : null,
    };
}

interface IProps {
    items: Array<IArticle>;
    value: IPublishingDateOptions;
    onChange(value: IPublishingDateOptions): void;
}

export class PublishingDateOptions extends React.PureComponent<IProps> {
    render() {
        const {items} = this.props;
        const {
            embargo,
            publishSchedule,
            timeZone,
        } = this.props.value;

        return (
            <div>
                {
                    items.length === 1 && (
                        <div>
                            {
                                publishSchedule == null && (
                                    <ToggleBox title={gettext('Embargo')} initiallyOpen>
                                        <DateTimePicker
                                            value={embargo}
                                            onChange={(val) => {
                                                this.props.onChange({
                                                    embargo: val,
                                                    timeZone: timeZone ?? appConfig.default_timezone,
                                                    publishSchedule: null,
                                                });
                                            }}
                                        />
                                    </ToggleBox>
                                )
                            }

                            {
                                embargo == null && (
                                    <ToggleBox title={gettext('Publish schedule')} initiallyOpen>
                                        <DateTimePicker
                                            value={publishSchedule}
                                            onChange={(val) => {
                                                this.props.onChange({
                                                    publishSchedule: val,
                                                    timeZone: timeZone ?? appConfig.default_timezone,
                                                    embargo: null,
                                                });
                                            }}
                                        />
                                    </ToggleBox>
                                )
                            }

                            {
                                (embargo != null || publishSchedule != null) && (
                                    <ToggleBox title={gettext('Time zone')} initiallyOpen>
                                        <TimeZonePicker
                                            value={timeZone}
                                            onChange={(val) => {
                                                this.props.onChange({
                                                    ...this.props.value,
                                                    timeZone: val,
                                                });
                                            }}
                                        />

                                        {
                                            timeZone == null && (
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
            </div>
        );
    }
}
