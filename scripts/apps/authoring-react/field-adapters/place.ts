import {Map} from 'immutable';
import {IArticle, IAuthoringFieldV2, IFieldAdapter, IRestApiResponse, ISubject, IVocabularyItem} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfigRemoteSource, IDropdownConfigVocabulary, IDropdownValue} from '../fields/dropdown';
import {isMultiple} from './utilities';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IGeoName} from 'apps/authoring/metadata/PlacesService';
import {ITreeWithLookup} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {sdApi} from 'api';

export function getPlaceAdapter(): IFieldAdapter<IArticle> {
    const useGeoNamesApi = sdApi.config.featureEnabled('places_autocomplete');

    if (useGeoNamesApi) {
        return {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const fieldConfig: IDropdownConfigRemoteSource = {
                    source: 'remote-source',
                    searchOptions: (searchTerm, language, callback) => {
                        httpRequestJsonLocal<IRestApiResponse<IGeoName>>({
                            method: 'GET',
                            path: '/places_autocomplete',
                            urlParams: {
                                lang: language,
                                name: searchTerm,
                            },
                        }).then((res) => {
                            const tree: ITreeWithLookup<IGeoName> = {
                                nodes: res._items.map((item) => ({value: item})),
                                lookup: {},
                            };

                            callback(tree);
                        });
                    },
                    getId: (option: IGeoName) => option.code,
                    getLabel: (option: IGeoName) => option.name,
                    multiple: true,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'place',
                    name: gettext('Place'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
            retrieveStoredValue: (article) => {
                return article.place;
            },
            storeValue: (val: Array<ISubject>, article) => {
                return {
                    ...article,
                    place: val,
                };
            },
        };
    } else { // use "locators" vocabulary
        return {
            getFieldV2: (fieldEditor, fieldSchema) => {
                const multiple = isMultiple('locators');

                const fieldConfig: IDropdownConfigVocabulary = {
                    source: 'vocabulary',
                    vocabularyId: 'locators',
                    multiple: multiple,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'place',
                    name: gettext('Place'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
            retrieveStoredValue: (article) => {
                const multiple = isMultiple('locators');

                if (multiple) {
                    return article.place.map(({qcode}) => qcode);
                } else {
                    return article.place.map(({qcode}) => qcode)[0];
                }
            },
            storeValue: (val: IDropdownValue, article) => {
                const vocabulary = sdApi.vocabularies.getAll().get('locators');
                const vocabularyItems = Map<IVocabularyItem['qcode'], IVocabularyItem>(
                    vocabulary.items.map((item) => [item.qcode, item]),
                );

                if (Array.isArray(val)) {
                    return {
                        ...article,
                        place: val.map(
                            (qcode) => ({qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}),
                        ),
                    };
                } else if (val == null) {
                    return {
                        ...article,
                        place: null,
                    };
                } else {
                    const qcode = val;

                    return {
                        ...article,
                        place: [{qcode, name: vocabularyItems.get(qcode.toString())?.name ?? ''}],
                    };
                }
            },
        };
    }
}
