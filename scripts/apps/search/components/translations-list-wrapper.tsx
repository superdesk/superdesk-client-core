import React from 'react';
import {TranslationsList} from './fields/translations-list';
import ng from 'core/services/ng';
import {IArticle} from 'superdesk-api';

interface IProps {
    ids: Array<IArticle['_id']>;
    label: string;
    close: () => void;
}

export class TranslationsListWrapper extends React.PureComponent<IProps> {
    render() {
        return (
            <ul data-theme="dark-ui" className="highlights-list-menu">
                <li>
                    <div className="dropdown__menu-label">{this.props.label}</div>
                    <button
                        className="dropdown__menu-close"
                        onClick={() => {
                            this.props.close();
                        }}
                    >
                        <i className="icon-close-small" />
                    </button>
                </li>

                <li>
                    <TranslationsList
                        ids={this.props.ids}
                        onClick={(item) => {
                            ng.get('$rootScope').$broadcast('broadcast:preview', {item});
                        }}
                    />
                </li>
            </ul>
        );
    }
}
