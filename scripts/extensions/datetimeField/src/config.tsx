/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {Button, FormLabel, IconButton} from 'superdesk-ui-framework/react';
import {IConfigComponentProps} from 'superdesk-api';
import {superdesk} from './superdesk';
import {IConfig, defaultDateTimeConfig} from './extension';

const gettext = superdesk.localization.gettext;
const {Spacer, SpacerBlock} = superdesk.components;

export class Config extends React.PureComponent<IConfigComponentProps<IConfig>> {
    render() {
        const config: IConfig = this.props.config ?? defaultDateTimeConfig;
        const {onChange} = this.props;

        return (
            <div>
                <div>
                    <FormLabel text={gettext('Initial time offset')} />

                    <SpacerBlock v gap="8" />

                    <Spacer h gap="8" justifyContent="start" noGrow>
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

                <SpacerBlock v gap="16" />

                <FormLabel text={gettext('Time increment steps')} />

                <SpacerBlock v gap="8" />

                <Spacer v gap="8">
                    {
                        config.increment_steps.map((value, i) => (
                            <Spacer h gap="8" justifyContent="start" noGrow key={i}>
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

                                <span>{gettext('minutes')}</span>
                            </Spacer>
                        ))
                    }
                </Spacer>

                <SpacerBlock v gap="16" />

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
            </div>
        );
    }
}
