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
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                }}
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
