/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {ISuperdesk, IConfigComponentProps} from 'superdesk-api';
import {IDateTimeFieldConfig, defaultDateTimeConfig} from './extension';
import {Button, FormLabel, IconButton} from 'superdesk-ui-framework/react';

export function getConfigComponent(superdesk: ISuperdesk) {
    const gettext = superdesk.localization.gettext;
    const {Spacer} = superdesk.components;

    return class DateTimeFieldConfig extends React.PureComponent<IConfigComponentProps<IDateTimeFieldConfig>> {
        render() {
            const config: IDateTimeFieldConfig = this.props.config ?? defaultDateTimeConfig;
            const {onChange} = this.props;

            return (
                <Spacer type="vertical" spacing="8">
                    <div>
                        <FormLabel text={gettext('Initial time offset')} />

                        <Spacer type="horizontal" spacing="8" align="end">
                            <div className="sd-line-input sd-line-input--no-margin sd-line-input--no-label">
                                <input
                                    className="sd-line-input__input"
                                    type="number"
                                    value={config.initial_offset_minutes}
                                    onChange={(event) => {
                                        onChange({
                                            ...config,
                                            initial_offset_minutes: parseInt(event.target.value, 10),
                                        });
                                    }}
                                    style={{width: 54}}
                                />
                            </div>
                            {gettext('minutes')}
                        </Spacer>
                    </div>

                    <div>
                        <FormLabel text={gettext('Time increment steps')} />

                        {
                            config.increment_steps.map((value, i) => (
                                <Spacer type="horizontal" spacing="8" align="center" key={i}>
                                    <IconButton
                                        icon="remove-sign"
                                        ariaValue={gettext('Remove')}
                                        onClick={() => {
                                            onChange({
                                                ...config,
                                                increment_steps: config.increment_steps.filter((_, _i) => i !== _i),
                                            });
                                        }}
                                    />

                                    <Spacer type="horizontal" spacing="8" align="end" key={i}>
                                        <div className="sd-line-input sd-line-input--no-margin sd-line-input--no-label">
                                            <input
                                                className="sd-line-input__input"
                                                type="number"
                                                value={value}
                                                onChange={(event) => {
                                                    const nextIncrementSteps = config.increment_steps
                                                        .map((_value, j) => {
                                                            if (j === i) {
                                                                return parseInt(event.target.value, 10);
                                                            } else {
                                                                return _value;
                                                            }
                                                        });

                                                    onChange({
                                                        ...config,
                                                        increment_steps: nextIncrementSteps,
                                                    });
                                                }}
                                                style={{width: 54}}
                                            />
                                        </div>

                                        {gettext('minutes')}
                                    </Spacer>
                                </Spacer>
                            ))
                        }
                    </div>

                    <Button
                        text={gettext('Add step')}
                        size="small"
                        style="hollow"
                        onClick={() => {
                            onChange({
                                ...config,
                                increment_steps: config.increment_steps.concat(0),
                            });
                        }}
                    />
                </Spacer>
            );
        }
    };
}
