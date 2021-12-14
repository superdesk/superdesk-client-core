import React from 'react';

interface IProps {
    value: string;
    onChange(value: string): void;
    readOnly?: boolean;
}

export class FieldText extends React.PureComponent<IProps> {
    render() {
        return (
            <div>
                <input
                    type="text"
                    value={this.props.value}
                    onChange={(event) => {
                        this.props.onChange(event.target.value);
                    }}
                    readOnly={this.props.readOnly}
                />
            </div>
        );
    }
}
