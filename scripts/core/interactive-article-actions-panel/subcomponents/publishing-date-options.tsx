import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext, toServerDateFormat} from 'core/utils';
import {DateTimePicker} from 'core/ui/components/date-time-picker';
import {appConfig} from 'appConfig';
import {ToggleBox} from 'superdesk-ui-framework/react';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {generatePatch} from 'core/patch';
import {sdApi} from 'api';

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

export function getPublishingDatePatch(item: IArticle, options: IPublishingDateOptions): Partial<IArticle> {
    const {
        embargo,
        publishSchedule,
        timeZone,
    } = options;

    const currentOptions: Partial<IArticle> = {
        embargo: item.embargo,
        publish_schedule: item.publish_schedule,
        schedule_settings: item.schedule_settings,
    };

    const nextOptions: Partial<IArticle> = {
        embargo: embargo == null
            ? null
            : toServerDateFormat(embargo),
        publish_schedule: publishSchedule == null
            ? null
            : toServerDateFormat(publishSchedule),
        schedule_settings: {
            ...item.schedule_settings,
            time_zone: timeZone,
        },
    };

    return generatePatch(currentOptions, nextOptions, {undefinedEqNull: true});
}

interface IProps {
    items: Array<IArticle>;
    value: IPublishingDateOptions;
    onChange(value: IPublishingDateOptions): void;
    allowSettingEmbargo: boolean;
}

export class PublishingDateOptions extends React.PureComponent<IProps> {
    render() {
        const {items} = this.props;
        const {
            embargo,
            publishSchedule,
            timeZone,
        } = this.props.value;

        const canSetEmbargo =
            publishSchedule == null
            && this.props.allowSettingEmbargo
            && sdApi.user.hasPrivilege('embargo');

        const canSetPublishSchedule = embargo == null;

        return (
            <div>
                {
                    items.length === 1 && (
                        <div>
                            {
                                canSetEmbargo && (
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
                                canSetPublishSchedule && (
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
