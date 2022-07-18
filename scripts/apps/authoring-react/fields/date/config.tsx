import React from 'react';
import {Button, Input, Select, Option, IconButton} from 'superdesk-ui-framework/react';
import {IConfigComponentProps, IDateFieldConfig, IDateShortcut} from 'superdesk-api';
import {gettext} from 'core/utils';

type IProps = IConfigComponentProps<IDateFieldConfig>;

export class Config extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleShortcutChange = this.handleShortcutChange.bind(this);
    }

    handleShortcutChange(index, nextValue: IDateShortcut) {
        const shortcuts = this.props.config?.shortcuts ?? [];

        this.props.onChange({
            ...(this.props.config ?? {}),
            shortcuts: shortcuts.map((_shortcut, _i) => _i === index ? nextValue : _shortcut),
        });
    }

    render() {
        const shortcuts = this.props.config?.shortcuts ?? [];

        return (
            <div>
                <table style={{borderSpacing: 20, marginLeft: -20, marginRight: -20}}>
                    <tbody>
                        {
                            shortcuts.map((shortcut, i) => (
                                <tr key={i}>
                                    <td>
                                        <Input
                                            type="text"
                                            label={gettext('Label')}
                                            value={shortcut.label}
                                            onChange={(val) => {
                                                this.handleShortcutChange(
                                                    i,
                                                    {
                                                        ...shortcut,
                                                        label: val,
                                                    },
                                                );
                                            }}
                                        />
                                    </td>

                                    <td>
                                        <Input
                                            label={gettext('Value')}
                                            type="number"
                                            value={shortcut.value}
                                            onChange={(val) => {
                                                this.handleShortcutChange(
                                                    i,
                                                    {
                                                        ...shortcut,
                                                        value: val,
                                                    },
                                                );
                                            }}
                                        />
                                    </td>

                                    <td>
                                        <Select
                                            label={''}
                                            labelHidden
                                            value={shortcut.term}
                                            onChange={(val: IDateShortcut['term']) => {
                                                this.handleShortcutChange(
                                                    i,
                                                    {
                                                        ...shortcut,
                                                        term: val,
                                                    },
                                                );
                                            }}
                                        >
                                            <Option value="days">{gettext('days')}</Option>
                                            <Option value="weeks">{gettext('weeks')}</Option>
                                            <Option value="months">{gettext('months')}</Option>
                                            <Option value="years">{gettext('years')}</Option>
                                        </Select>
                                    </td>

                                    <td style={{verticalAlign: 'bottom'}}>
                                        <IconButton
                                            icon="remove-sign"
                                            ariaValue={gettext('Remove')}
                                            onClick={() => {
                                                this.props.onChange({
                                                    ...(this.props.config ?? {}),
                                                    shortcuts: shortcuts.filter((_, _i) => i !== _i),
                                                });
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>

                <Button
                    text={gettext('Add')}
                    onClick={() => {
                        this.props.onChange({
                            ...(this.props.config ?? {}),
                            shortcuts: shortcuts.concat({label: '', value: 0, term: 'days'}),
                        });
                    }}
                />
            </div>
        );
    }
}
