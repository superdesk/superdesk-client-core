import React from 'react';
import ng from 'core/services/ng';
import {gettext, gettextPlural} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {TranslationsList} from './translations-list';
import {ItemListPopup} from '../item-list-popup';

interface IProps {
    svc: any;
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
        const output = [];

        if (this.props.item.translated_from != null) {
            output.push(
                <button key="translated" className="label label--hollow"
                    onClick={(event) => {
                        this.renderOriginalArticle(event.target);
                    }}>
                    {gettext('translation')}
                </button>,
            );
        }

        if (this.props.item.translations != null && this.props.item.translations.length > 0) {
            output.push(
                <button key="translations" className="text-link"
                    onClick={(event) => {
                        this.renderTranslations(event.target);
                    }}>
                    {'('}<b>{this.props.item.translations.length}</b>{')'}
                    {' '}
                    {gettextPlural(this.props.item.translations.length, 'translation', 'translations')}
                </button>,
            );
        }

        if (this.state.popup != null) {
            output.push(
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
                </ItemListPopup>,
            );
        }

        return output.length > 0 ? output : null;
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
