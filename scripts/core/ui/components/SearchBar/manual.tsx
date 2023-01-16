import {gettext} from 'core/utils';
import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react';

interface IProps {
    search(): void;
    onInputChange(value: string): void;
    removeButton: React.ReactNode;
    showButtons: boolean;
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
                            this.props.search();
                        }
                    }}
                    onChange={(e) => this.props.onInputChange(e.target.value)}
                    type="text"
                    placeholder={gettext('Search...')}
                />
                {
                    this.props.showButtons && (
                        <>
                            {this.props.removeButton}
                            <IconButton
                                style="outline"
                                size="small"
                                ariaValue={gettext('Search')}
                                icon="chevron-right-thin"
                                onClick={this.props.search}
                            />
                        </>
                    )
                }
            </div>
        );
    }
}
