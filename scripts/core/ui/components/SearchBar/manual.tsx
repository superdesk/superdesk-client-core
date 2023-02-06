import React from 'react';
import {gettext} from 'core/utils';

interface IProps {
    onSearch(): void;
    onInputChange(value: string): void;
    actionButtons: React.ReactNode;
}

export class ManualSearch extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <div
                className="sd-display--flex sd-flex--grow sd-flex--items-center sd-flex--align-self-stretch"
            >
                <input
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            this.props.onSearch();
                        }
                    }}
                    onChange={(e) => this.props.onInputChange(e.target.value)}
                    type="text"
                    placeholder={gettext('Search...')}
                />

                {this.props.actionButtons}
            </div>
        );
    }
}
