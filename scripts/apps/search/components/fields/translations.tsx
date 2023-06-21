import React from 'react';
import {gettext, gettextPlural} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {TranslationsListWrapper} from '../translations-list-wrapper';
import {showPopup} from 'core/ui/components/popup';

interface IProps {
    item: IArticle;
}

export class Translations extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.renderOriginalArticle = this.renderOriginalArticle.bind(this);
        this.renderTranslations = this.renderTranslations.bind(this);
    }

    renderOriginalArticle(referenceElement: HTMLElement) {
        showPopup(
            referenceElement,
            'bottom',
            ({closePopup}) => (
                <TranslationsListWrapper
                    ids={[this.props.item.translated_from]}
                    label={gettext('Original Article')}
                    close={closePopup}
                />
            ),
        );
    }

    renderTranslations(referenceElement: HTMLElement) {
        showPopup(
            referenceElement,
            'bottom',
            ({closePopup}) => (
                <TranslationsListWrapper
                    ids={this.props.item.translations}
                    label={gettext('Translations')}
                    close={closePopup}
                />
            ),
            100,
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.props.item.translated_from != null && (
                    <button
                        key="translated"
                        className="label label--hollow"
                        onClick={(event) => {
                            this.renderOriginalArticle(event.target as HTMLElement);
                        }}
                    >
                        {gettext('Translation')}
                    </button>
                )}

                {this.props.item.translations != null && this.props.item.translations.length > 0 && (
                    <button
                        key="translations"
                        className="text-link"
                        onClick={(event) => {
                            this.renderTranslations(event.target as HTMLElement);
                        }}
                    >
                        {'('}<b>{this.props.item.translations.length}</b>{')'}
                        {' '}
                        {this.props.item.translations.length === 1 ? gettext('Translation') : gettext('Translations')}
                    </button>
                )}
            </React.Fragment>
        );
    }
}
