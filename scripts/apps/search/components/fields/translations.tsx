import React from 'react';
import ng from 'core/services/ng';
import {gettext, gettextPlural} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {TranslationsList} from './translations-list';
import {ItemListPopup} from '../item-list-popup';

interface IProps {
    item: IArticle;
}

interface IState {
    popup?: {
        ids: Array<IArticle['_id']>;
        label: string;
        target: HTMLElement;
    };
}

export class Translations extends React.PureComponent<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {popup: null};
        this.closePopup = this.closePopup.bind(this);
    }

    render() {
        return (
            <React.Fragment>
                {this.props.item.translated_from != null && (
                    <button key="translated" className="label label--hollow"
                        onClick={(event) => {
                            this.renderOriginalArticle(event.target);
                        }}>
                        {gettext('translation')}
                    </button>
                )}

                {this.props.item.translations != null && this.props.item.translations.length > 0 && (
                    <button key="translations" className="text-link"
                        onClick={(event) => {
                            this.renderTranslations(event.target);
                        }}>
                        {'('}<b>{this.props.item.translations.length}</b>{')'}
                        {' '}
                        {gettextPlural(this.props.item.translations.length, 'translation', 'translations')}
                    </button>
                )}

                {this.state.popup != null && (
                    <ItemListPopup
                        key="popup"
                        target={this.state.popup.target}
                        label={this.state.popup.label}
                        close={this.closePopup}>
                        <TranslationsList
                            ids={this.state.popup.ids}
                            onClick={(item) => {
                                ng.get('$rootScope').$broadcast('broadcast:preview', {item});
                            }}
                        />
                    </ItemListPopup>
                )}
            </React.Fragment>
        );
    }

    renderOriginalArticle(elem: EventTarget) {
        this.setState({
            popup: {
                label: gettext('Original Article'),
                ids: [this.props.item.translated_from],
                target: elem as HTMLElement,
            },
        });
    }

    renderTranslations(elem: EventTarget) {
        this.setState({
            popup: {
                label: gettext('Translations'),
                ids: this.props.item.translations,
                target: elem as HTMLElement,
            },
        });
    }

    closePopup() {
        this.setState({popup: null});
    }
}
