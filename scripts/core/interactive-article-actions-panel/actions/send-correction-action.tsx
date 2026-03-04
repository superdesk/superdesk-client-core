import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, DateTimePicker, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext, toIsoStringWithoutTimezoneOffset} from 'core/utils';
import ng from 'core/services/ng';
import {cloneDeep} from 'lodash';
import {notify} from 'core/notify/notify';
import {appConfig} from 'appConfig';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';
import {isValid} from 'date-fns';
import {TimeZonePicker} from 'core/ui/components/time-zone-picker';
import {TZDate} from '@sourcefabric/date-fns-tz';
import {ignoreTimezone} from '../subcomponents/publishing-date-options';

export interface ISendCorrectionConfig {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    onDataChange(changes: IArticle): void;
}

interface IState {
    embargo: Date | null;
    timeZone: string | null;
}

interface IRenderArgs {
    body: JSX.Element;
    footer: JSX.Element;
}

interface IProps extends ISendCorrectionConfig {
    children(args: IRenderArgs): JSX.Element;
}

/**
 * Send Correction action - provides body and footer as render props.
 * This allows the parent to compose them into either the standalone panel or widget layout.
 */
export class SendCorrectionAction extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            embargo: props.item.embargo != null ? ignoreTimezone(props.item.embargo) : null,
            timeZone: props.item.schedule_settings?.time_zone ?? null,
        };

        this.doSendCorrection = this.doSendCorrection.bind(this);
    }

    doSendCorrection(): void {
        this.props.handleUnsavedChanges()
            .then((item) => {
                // Cloning to prevent objects from being modified by angular
                ng.get('authoring').publish(
                    cloneDeep(item),
                    cloneDeep(item),
                    'correct',
                ).then(() => {
                    ng.get('authoringWorkspace').close();
                    notify.success('Correction sent');
                });
            })
            .catch(() => {
                // cancelled by user
            });
    }

    render() {
        const {embargo, timeZone} = this.state;

        const body = (
            <React.Fragment>
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
                                this.setState(
                                    {
                                        embargo: val,
                                        timeZone: timeZone ?? appConfig.default_timezone,
                                    },
                                    () => {
                                        this.props.onDataChange({
                                            ...this.props.item,
                                            embargo: val == null
                                                ? null
                                                : toIsoStringWithoutTimezoneOffset(new TZDate(val)),
                                            schedule_settings: {
                                                ...this.props.item.schedule_settings,
                                                time_zone: this.state.timeZone,
                                            },
                                        });
                                    },
                                );
                            }
                        }}
                    />
                </ToggleBox>

                {embargo != null && (
                    <ToggleBox variant="simple" title={gettext('Time zone')} initiallyOpen>
                        <TimeZonePicker
                            value={timeZone}
                            onChange={(val) => {
                                this.setState(
                                    {timeZone: val},
                                    () => {
                                        this.props.onDataChange({
                                            ...this.props.item,
                                            schedule_settings: {
                                                ...this.props.item.schedule_settings,
                                                time_zone: val,
                                            },
                                        });
                                    },
                                );
                            }}
                        />

                        {timeZone == null && (
                            <div style={{paddingBlockStart: 5}}>
                                {gettext('If not set, the UTC+0 time zone is assumed.')}
                            </div>
                        )}
                    </ToggleBox>
                )}
            </React.Fragment>
        );

        const footer = (
            <Button
                text={gettext('Send correction')}
                onClick={() => {
                    this.doSendCorrection();
                }}
                size="large"
                type="highlight"
                expand
            />
        );

        return this.props.children({body, footer});
    }
}
