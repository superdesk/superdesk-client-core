import React from 'react';
import {TZDate} from '@sourcefabric/date-fns-tz';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {DateTimePicker, ToggleBox} from 'superdesk-ui-framework/react';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {generatePatch} from 'core/patch';
import {sdApi} from 'api';
import {isValid} from 'date-fns';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';
import {dateToServerString} from 'core/get-superdesk-api-implementation';

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
            ? new Date(items[0].publish_schedule)
            : null,
        timeZone: items.length === 1 ? items[0].schedule_settings?.time_zone ?? null : null,
    };
}

/**
 * It's tricky with timezones here.
 * UI widget to pick datetime doesn't support timezones,
 * thus before displaying in the picker - we convert it to users' local time.
 *
 * In order to generate the patch - we need to convert it back to selected timezone.
 */
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
            : dateToServerString(new TZDate(embargo, timeZone)),
        publish_schedule: publishSchedule == null
            ? null
            : dateToServerString(new TZDate(publishSchedule, timeZone)),
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
    allowSettingPublishSchedule?: boolean;
}

export class PublishingDateOptions extends React.PureComponent<IProps> {
    render() {
        const {items} = this.props;
        const {
            embargo,
            publishSchedule,
            timeZone,
        } = this.props.value;

        const canSetEmbargo = this.props.allowSettingEmbargo && sdApi.user.hasPrivilege('embargo');
        const canSetPublishSchedule = this.props.allowSettingPublishSchedule;

        if (items.length !== 1) {
            return null;
        }

        const timezoneApplied = timeZone ?? appConfig.default_timezone;

        return (
            <div>
                {canSetEmbargo && (
                    <ToggleBox variant="simple" title={gettext('Embargo')} initiallyOpen>
                        <DateTimePicker
                            value={embargo === null ? null : new TZDate(embargo, timezoneApplied)}
                            valueType="date"
                            locale={{
                                type: 'full',
                                payload: getLocaleForDatePicker(),
                            }}
                            dateFormat={appConfig.view.dateformat}
                            onChange={(val) => {
                                const isValidDate = isValid(val);
                                const isDateBeingReset = val === null;

                                if (isValidDate || isDateBeingReset) {
                                    this.props.onChange({
                                        embargo: val,
                                        timeZone: timeZone ?? appConfig.default_timezone,
                                        publishSchedule: publishSchedule,
                                    });
                                }
                            }}
                            data-test-id="embargo"
                        />
                    </ToggleBox>
                )}

                {canSetPublishSchedule && (
                    <ToggleBox variant="simple" title={gettext('Publish schedule')} initiallyOpen>
                        <DateTimePicker
                            value={publishSchedule === null ? null : new TZDate(publishSchedule, timezoneApplied)}
                            valueType="date"
                            locale={{
                                type: 'full',
                                payload: getLocaleForDatePicker(),
                            }}
                            dateFormat={appConfig.view.dateformat}
                            onChange={(val) => {
                                const isValidDate = isValid(val);
                                const isDateBeingReset = val === null;

                                if (isValidDate || isDateBeingReset) {
                                    this.props.onChange({
                                        publishSchedule: val,
                                        timeZone: timeZone ?? appConfig.default_timezone,
                                        embargo: embargo,
                                    });
                                }
                            }}
                            data-test-id="publish-schedule"
                        />
                    </ToggleBox>
                )}

                {(embargo != null || publishSchedule != null) && (
                    <ToggleBox variant="simple" title={gettext('Time zone')} initiallyOpen>
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
                                <div style={{paddingBlockStart: 5}}>
                                    {gettext('If not set, the UTC+0 time zone is assumed.')}
                                </div>
                            )
                        }
                    </ToggleBox>
                )}
            </div>
        );
    }
}
