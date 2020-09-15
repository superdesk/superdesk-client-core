import React from 'react';
import {appConfig} from 'appConfig';
import {ILanguage} from 'superdesk-interfaces/Language';
import {gettext} from 'core/utils';
import {IVocabularyItem} from 'superdesk-api';

interface IProps {
    item: IVocabularyItem;
    update<T extends keyof IVocabularyItem>(field: T, value: IVocabularyItem[T]): void;
    languages: Array<ILanguage>;
}

export class ManageVocabularyItemTranslations extends React.PureComponent<IProps> {
    render() {
        const {languages, item, update} = this.props;

        return (
            <div>
                {
                    languages
                        .filter((language) => appConfig.default_language !== language.language)
                        .map((language) => (
                            <div
                                key={language.language}
                                className="sd-line-input sd-line-input--boxed"
                            >
                                <label className="sd-line-input__label">
                                    {gettext(
                                        'Name ({{language}})',
                                        {language: language.label},
                                    )}
                                </label>

                                <input
                                    value={item?.translations?.name?.[language.language] ?? ''}
                                    onChange={(event) => {
                                        const {value} = event.target;

                                        const allTranslations = item.translations ?? {};
                                        const nameTranslations = allTranslations.name ?? {};
                                        const nameTranslationsUpdated = {
                                            ...nameTranslations,
                                            [language.language]: value,
                                        };

                                        update(
                                            'translations',
                                            {
                                                ...allTranslations,
                                                name: nameTranslationsUpdated,
                                            },
                                        );
                                    }}
                                    className="sd-line-input__input"
                                />
                            </div>
                        ))
                }
            </div>
        );
    }
}
