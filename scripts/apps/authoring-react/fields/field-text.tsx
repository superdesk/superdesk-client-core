import React from 'react';
import {IArticle} from 'superdesk-api';

interface IProps {
    value: string;
    onChange(value: string): void;
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
                />
            </div>
        );
    }
}
