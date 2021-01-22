import React from 'react';
import {closeActionsMenu} from '../../helpers';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    label: string;
}

class Label extends React.PureComponent<IProps> {
    render() {
        const {item, label} = this.props;

        return (
            <li>
                <div className="dropdown__menu-label">
                    {label}

                    {
                        label === 'Actions'
                            ? (
                                <button
                                    className="dropdown__menu-close"
                                    onClick={() => {
                                        closeActionsMenu(item._id);
                                    }}
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
