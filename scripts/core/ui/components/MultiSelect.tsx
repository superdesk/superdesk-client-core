import React from 'react';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    items: Array<{id: string; label: string}>;
    values: Array<string>;
    onChange(values: Array<string>): void;
}

export class MultiSelect extends React.PureComponent<IProps> {
    render() {
        return (
            <div>
                <select
                    multiple
                    onChange={(event) => {
                        this.props.onChange(Array.from(event.target.selectedOptions).map(({value}) => value));
                    }}
                    value={this.props.values}
                >
                    {
                        this.props.items.map(({id, label}) => (
                            <option key={id} value={id}>{label}</option>
                        ))
                    }
                </select>

                <div style={{paddingTop: 6}}>
                    <Button
                        text={gettext('Clear')}
                        onClick={() => {
                            this.props.onChange([]);
                        }}
                        size="small"
                        disabled={this.props.values.length < 1}
                    />
                </div>
            </div>
        );
    }
}
