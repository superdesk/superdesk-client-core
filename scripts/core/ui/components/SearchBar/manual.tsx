import React from 'react';
import {gettext} from 'core/utils';

interface IProps {
    onSearch(): void;
    onInputChange(value: string): void;
    actionButtons: React.ReactNode;
    value: string;
}

export class ManualSearch extends React.PureComponent<IProps> {
    inputRef: HTMLInputElement;

    componentDidMount() {
        if (this.props.value !== '' || this.props.value != null) {
            this.inputRef.focus();
        }
    }

    render(): React.ReactNode {
        return (
            <div
                className="sd-display--flex sd-flex--grow sd-flex--items-center sd-flex--align-self-stretch"
            >
                <input
                    ref={(e) => this.inputRef = e}
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            this.props.onSearch();
                        }
                    }}
                    value={this.props.value}
                    onChange={(e) => {
                        this.props.onInputChange(e.target.value);
                    }}
                    type="text"
                    placeholder={gettext('Search...')}
                />

                {this.props.actionButtons}
            </div>
        );
    }
}
