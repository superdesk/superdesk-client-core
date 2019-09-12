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
    originalRef: React.ReactNode;
    translationsRef: React.ReactNode;

    render() {
        const output = [];

        if (this.props.item.translated_from != null) {
            output.push(
                <span key="translated" className="label label--hollow"
                    onClick={($event) => {
                        $event.stopPropagation();
                        this.renderOriginalArticle();
                    }} ref={(ref) => this.originalRef = ref}>
                    {gettext('translation')}
                </span>,
            );
        }

        if (this.props.item.translations != null && this.props.item.translations.length > 0) {
            output.push(
                <a key="translations" className="text-link" onClick={($event) => {
                    $event.stopPropagation();
                    this.renderTranslations();
                }} ref={(ref) => this.translationsRef = ref}>
                    {'('}<b>{this.props.item.translations.length}</b>{')'}
                    {' '}
                    {gettextPlural(this.props.item.translations.length, 'translation', 'translations')}
                </a>,
            );
        }

        return output.length > 0 ? output : null;
    }

    renderOriginalArticle() {
        this.renderPopup(
            gettext('Original Article'),
            [this.props.item.translated_from],
            this.originalRef,
        );
    }

    renderTranslations() {
        this.renderPopup(
            gettext('Translations'),
            this.props.item.translations,
            this.translationsRef,
        );
    }

    renderPopup(label: string, ids: Array<IArticle['_id']>, ref: React.ReactNode) {
        const popup = (
            <TranslationsList
                ids={ids}
                svc={this.props.svc}
                label={label}
                onClose={() => this.closeDropdown()}
                onClick={(item) => this.preview(item)}
            />
        );

        openActionsMenu(popup, ref, this.props.item._id);
    }

    closeDropdown() {
        closeActionsMenu(this.props.item._id);
    }

    preview(item: IArticle) {
        this.props.svc.$rootScope.$broadcast('broadcast:preview', {item});
    }
}
