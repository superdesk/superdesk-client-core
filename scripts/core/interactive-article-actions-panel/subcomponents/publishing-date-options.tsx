import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext, toIsoStringWithoutTimezoneOffset} from 'core/utils';
import {appConfig} from 'appConfig';
import {DateTimePicker, ToggleBox} from 'superdesk-ui-framework';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {generatePatch} from 'core/patch';
import {sdApi} from 'api';
import {isValid} from 'date-fns';
import {TZDate} from '@sourcefabric/date-fns-tz';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';

export interface IPublishingDateOptions {
    embargo: Date | null;
    publishSchedule: Date | null;
    timeZone: string | null;
}

function ignoreTimezone(
    /**
     * Server adds +0000 to embargo/publish_schedule no matter what timezone it is,
     * so ignore that and treat it as local time for editing to avoid further conversion.
     */
    date: string,
): TZDate {
    return new TZDate(date.replace('+0000', ''));
}

export function getInitialPublishingDateOptions(items: Array<IArticle>): IPublishingDateOptions {
    const timeZone = items.length === 1 ? items[0].schedule_settings?.time_zone ?? null : null;

    return {
        embargo: (() => {
            if (items.length != 1) {
                return null;
            }

            const embargo = items[0]?.embargo;

            if (embargo == null) {
                return null;
            }

            return ignoreTimezone(embargo);
        })(),
        publishSchedule: (() => {
            if (items.length != 1) {
                return null;
            }

            const publishSchedule = items[0]?.publish_schedule;

            if (publishSchedule == null) {
                return null;
            }

            return ignoreTimezone(publishSchedule);
        })(),
        timeZone: timeZone,
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
            : toIsoStringWithoutTimezoneOffset(new TZDate(embargo)),
        publish_schedule: publishSchedule == null
            ? null
            : toIsoStringWithoutTimezoneOffset(new TZDate(publishSchedule)),
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

        return (
            <div>
                {canSetEmbargo && (
                    <ToggleBox variant="simple" title={gettext('Embargo')} initiallyOpen>
                        <DateTimePicker
                            value={embargo}
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
                            value={publishSchedule}
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
