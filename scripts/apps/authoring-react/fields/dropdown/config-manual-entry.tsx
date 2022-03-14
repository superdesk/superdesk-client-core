import * as React from 'react';
import {RadioButtonGroup, Button, IconButton, Checkbox, Alert} from 'superdesk-ui-framework/react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext, arrayMove} from 'core/utils';
import {IDropdownValue, IDropdownOption, IDropdownDataCustom} from '.';
import {Spacer, SpacerInline} from 'core/ui/components/Spacer';
import {Dropdown} from './dropdown';
import {assertNever, isNumeric} from 'core/helpers/typescript-helpers';

interface IState {
    previewValue: IDropdownValue | null;
}

const newItemTemplate: IDropdownOption = {
    id: null,
    label: '',
};

type IDropdownConfig = IDropdownDataCustom;

export class ConfigManualEntry extends React.PureComponent<IConfigComponentProps<IDropdownConfig>, IState> {
    constructor(props) {
        super(props);

        this.state = {
            previewValue: null,
        };

        this.getConfig = this.getConfig.bind(this);
        this.validate = this.validate.bind(this);
    }

    getConfig(): IDropdownConfig {
        const config: IDropdownConfig = this.props.config ?? {
            source: 'manual-entry',
            type: 'text',
            options: [
                newItemTemplate,
            ],
            roundCorners: false,
            readOnly: false,
            required: false,
        };

        return config;
    }

    /**
     * Returns `null` if validation passes. If not, error message is returned.
     */
    validate(): string {
        const config: IDropdownConfig = this.getConfig();
        const ids = new Set();

        for (const option of config.options) {
            if (option.id == null) {
                return gettext('Identifiers have to be specified for all items.');
            } else if (ids.has(option.id)) {
                return gettext('Duplicate ID: {{x}}', {x: option.id});
            } else {
                ids.add(option.id);
            }
        }

        return null;
    }

    render() {
        const valueTypeText: IDropdownConfig['type'] = 'text';
        const valueTypeNumber: IDropdownConfig['type'] = 'number';

        const config: IDropdownConfig = this.getConfig();

        const someItemsHaveColorsSelected = config.options.some(
            (item) => item.color != null,
        );

        const error = this.validate();

        return (
            <Spacer v gap="16" noWrap>
                <div>
                    <label className="form-label">{gettext('Value type')}</label>

                    <RadioButtonGroup
                        options={[
                            {label: gettext('Text'), value: valueTypeText},
                            {label: gettext('Number'), value: valueTypeNumber},
                        ]}
                        value={config.type}
                        onChange={(val: IDropdownConfig['type']) => {
                            this.props.onChange({
                                ...config,
                                type: val,
                                options: val === 'number' ?
                                    config.options.map((_option) => ({
                                        ..._option,
                                        id: isNumeric(_option.id.toString())
                                            ? parseFloat(_option.id.toString())
                                            : null,
                                    }))
                                    : config.options,
                            });
                        }}
                    />
                </div>

                <div>
                    <label className="form-label">{gettext('Options:')}</label>

                    <table>
                        <thead>
                            <tr>
                                <th>{gettext('ID')}</th>
                                <th>{gettext('label')}</th>
                                <th>{gettext('{{field}} (optional)', {field: gettext('color')})}</th>
                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {
                                config.options.map((option, i) => (
                                    <tr key={i}>
                                        <td>
                                            <input
                                                type={config.type}
                                                value={option.id ?? ''}
                                                onChange={(event) => {
                                                    const value = (() => {
                                                        if (config.type === 'text') {
                                                            return event.target.value;
                                                        } else if (config.type === 'number') {
                                                            return event.target.value === ''
                                                                ? null
                                                                : parseFloat(event.target.value);
                                                        } else {
                                                            assertNever(config.type);
                                                        }
                                                    })();

                                                    this.props.onChange({
                                                        ...config,
                                                        options: config.options.map(
                                                            (_opt, _i) => i === _i ? {..._opt, id: value} : _opt,
                                                        ),
                                                    });
                                                }}
                                            />
                                        </td>

                                        <td>
                                            <input
                                                type="text"
                                                value={option.label}
                                                onChange={(event) => {
                                                    const {value} = event.target;

                                                    this.props.onChange({
                                                        ...config,
                                                        options: config.options.map(
                                                            (_opt, _i) => i === _i ? {..._opt, label: value} : _opt,
                                                        ),
                                                    });
                                                }}
                                            />
                                        </td>

                                        <td>
                                            <input
                                                type="color"
                                                value={option.color ?? '#ffffff'}
                                                onChange={(event) => {
                                                    const {value} = event.target;

                                                    this.props.onChange({
                                                        ...config,
                                                        options: config.options.map(
                                                            (_opt, _i) => i === _i ? {..._opt, color: value} : _opt,
                                                        ),
                                                    });
                                                }}
                                            />
                                        </td>

                                        <td>
                                            <IconButton
                                                ariaValue={gettext('Remove')}
                                                icon="remove-sign"
                                                onClick={() => {
                                                    this.props.onChange({
                                                        ...config,
                                                        options: config.options.filter(
                                                            (_opt, _i) => i !== _i,
                                                        ),
                                                    });
                                                }}
                                            />

                                            <IconButton
                                                ariaValue={gettext('Move up')}
                                                icon="chevron-up-thin"
                                                disabled={i === 0}
                                                onClick={() => {
                                                    this.props.onChange({
                                                        ...config,
                                                        options: arrayMove(config.options, i, i - 1),
                                                    });
                                                }}
                                            />

                                            <IconButton
                                                ariaValue={gettext('Move down')}
                                                icon="chevron-down-thin"
                                                disabled={i === config.options.length - 1}
                                                onClick={() => {
                                                    this.props.onChange({
                                                        ...config,
                                                        options: arrayMove(config.options, i, i + 1),
                                                    });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>

                    {
                        error != null && (
                            <React.Fragment>
                                <SpacerInline v gap="16" />

                                <Alert type="alert" size="small">{error}</Alert>
                            </React.Fragment>
                        )
                    }

                    <SpacerInline v gap="16" />

                    <Button
                        text={gettext('Add')}
                        onClick={() => {
                            this.props.onChange({
                                ...config,
                                options: config.options.concat(newItemTemplate),
                            });
                        }}
                    />
                </div>

                {
                    someItemsHaveColorsSelected && (
                        <div>
                            <Checkbox
                                label={{text: gettext('Round corners for dropdown items')}}
                                checked={config.roundCorners}
                                onChange={(val: IDropdownConfig['roundCorners']) => {
                                    this.props.onChange({
                                        ...config,
                                        roundCorners: val,
                                    });
                                }}
                            />
                        </div>
                    )
                }

                <div>
                    <label className="form-label">{gettext('Configuration preview')}</label>

                    <Dropdown
                        config={config}
                        value={this.state.previewValue}
                        onChange={(val) => {
                            this.setState({previewValue: val});
                        }}
                    />
                </div>
            </Spacer>
        );
    }
}
