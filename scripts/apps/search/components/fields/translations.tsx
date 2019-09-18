import React from 'react';
import {gettext, gettextPlural} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {openActionsMenu, closeActionsMenu} from 'apps/search/helpers';
import {TranslationsList} from './translations-list';

interface IProps {
    svc: any;
    item: IArticle;
}

export class Translations extends React.PureComponent<IProps> {
    render() {
        const output = [];

        if (this.props.item.translated_from != null) {
            output.push(
                <button key="translated" className="label label--hollow"
                    onClick={($event) => {
                        this.renderOriginalArticle($event.target);
                    }}>
                    {gettext('translation')}
                </button>,
            );
        }

        if (this.props.item.translations != null && this.props.item.translations.length > 0) {
            output.push(
                <button key="translations" className="text-link"
                    onClick={($event) => {
                        this.renderTranslations($event.target);
                    }}>
                    {'('}<b>{this.props.item.translations.length}</b>{')'}
                    {' '}
                    {gettextPlural(this.props.item.translations.length, 'translation', 'translations')}
                </button>,
            );
        }

        return output.length > 0 ? output : null;
    }

    renderOriginalArticle(elem: EventTarget) {
        this.renderPopup(
            gettext('Original Article'),
            [this.props.item.translated_from],
            elem,
        );
    }

    renderTranslations(elem: EventTarget) {
        this.renderPopup(
            gettext('Translations'),
            this.props.item.translations,
            elem,
        );
    }

    renderPopup(label: string, ids: Array<IArticle['_id']>, ref: React.ReactNode) {
        const popup = (
            <TranslationsList
                ids={ids}
                svc={this.props.svc}
                label={label}
                onClose={() => this.closeDropdown()}
                onClick={(item) => {
                    this.props.svc.$rootScope.$broadcast('broadcast:preview', {item});
                }}
            />
        );

        openActionsMenu(popup, ref, this.props.item._id);
    }

    closeDropdown() {
        closeActionsMenu(this.props.item._id);
    }
}
