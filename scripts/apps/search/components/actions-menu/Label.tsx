import React from 'react';
import {gettext} from 'core/utils';

interface IProps {
    label: string;
    onClose(): void;
}

class Label extends React.PureComponent<IProps> {
    render() {
        const {label} = this.props;

        return (
            <li>
                <div className="dropdown__menu-label">
                    {label}

                    {
                        label === 'Actions'
                            ? (
                                <button
                                    className="dropdown__menu-close"
                                    onClick={this.props.onClose}
                                    aria-label={gettext('Close')}
                                    data-test-id="close"
                                >
                                    <i className="icon-close-small" />
                                </button>
                            )
                            : null
                    }
                </div>
            </li>
        );
    }
}

export default Label;
