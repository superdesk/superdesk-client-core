import {ISuperdesk, IConfigComponentProps} from 'superdesk-api';
import * as React from 'react';

interface IConfig {
    initial_time_offset: number;
    increment_steps: Array<number>;
}

interface ISpacer {
    type: 'horizontal';
    spacing: 'medium';
    children: Array<React.ReactNode>;
}

const defaultConfig: IConfig = {
    initial_time_offset: 0,
    increment_steps: [],
};

class Spacer extends React.PureComponent<ISpacer> {
    render() {
        return (
            <div className="spacer-horizontal-medium">
                {this.props.children.map((el, i) => (
                    <div key={i}>{el}</div>
                ))}
            </div>
        );
    }
}

export function getConfigComponent(superdesk: ISuperdesk) {
    const gettext = superdesk.localization.gettext;

    return class DateTimeFieldConfig extends React.PureComponent<IConfigComponentProps<IConfig>> {
        render() {
            const config: IConfig = this.props.config ?? defaultConfig;
            const {onChange} = this.props;

            return (
                <div>
                    <div>{gettext('Initial time offset')}</div>

                    <Spacer type="horizontal" spacing="medium">
                        <input
                            type="number"
                            value={config.initial_time_offset}
                            onChange={(event) => {
                                onChange({
                                    ...config,
                                    initial_time_offset: parseInt(event.target.value, 10),
                                });
                            }}
                            style={{width: 54}}
                        />
                        {gettext('minutes')}
                    </Spacer>

                    <div>{gettext('Time increment steps')}</div>

                    {
                        config.increment_steps.map((value, i) => (
                            <Spacer type="horizontal" spacing="medium" key={i}>
                                <button
                                    onClick={() => {
                                        onChange({
                                            ...config,
                                            increment_steps: config.increment_steps.filter((_, _i) => i !== _i),
                                        });
                                    }}
                                >
                                    x
                                </button>

                                <input
                                    type="number"
                                    value={value}
                                    onChange={(event) => {
                                        const nextIncrementSteps = config.increment_steps.map((_value, j) => {
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

                                {gettext('minutes')}
                            </Spacer>
                        ))
                    }

                    <button
                        onClick={() => {
                            onChange({
                                ...config,
                                increment_steps: config.increment_steps.concat(0),
                            });
                        }}
                    >
                        {gettext('Add step')}
                    </button>
                </div>
            );
        }
    };
}
