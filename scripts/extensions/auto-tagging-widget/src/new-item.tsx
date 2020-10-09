import * as React from 'react';
import {ITagGroup, getGroupLabel, INewItem, ITag} from './auto-tagging';
import {ISuperdesk} from 'superdesk-api';

import {Select, Option} from 'superdesk-ui-framework/react';
import {Autocomplete} from './autocomplete';
import {uniqBy} from 'lodash';

interface ISearchTag extends ITag {
    type: ITagGroup;
    source?: string;
}

interface IAutoTaggingSearchResult {
    result: {
        tags: Array<ISearchTag>;
    };
}

interface IProps {
    item: INewItem;
    onChange(item: INewItem | null): void;
    save(item: INewItem): void;
    cancel(): void;
    tagAlreadyExists(uuid: ITag['uuid']): boolean;
    insertTagFromSearch(group: ITagGroup, tag: ITag): void;
}

function convertToTag(searchTag: ISearchTag): ITag {
    const {uuid, title, weight, media_topic} = searchTag;
    const tag: ITag = {uuid, title, weight, media_topic};

    return tag;
}

export function getNewItemComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;
    const {httpRequestJsonLocal} = superdesk;

    return class NewItem extends React.PureComponent<IProps> {
        render() {
            const {onChange, save, cancel, insertTagFromSearch, tagAlreadyExists} = this.props;
            const item = this.props.item;
            const {tag} = item;

            const savingDisabled = (tag.title?.trim().length ?? 0) < 1 || item?.group == null;

            return (
                <div className="sd-card auto-tagging-widget__card-absolute">
                    <div className="sd-card__header sd-card__header--white">
                        <div className="sd-card__heading">{gettext('Add keyword')}</div>
                    </div>
                    <div className="sd-card__content">
                        <div className="form__row">
                            <Autocomplete
                                fieldLabel={gettext('Title')}
                                value={tag.title ?? ''}
                                onChange={(value) => {
                                    onChange({
                                        ...item,
                                        tag: {
                                            ...item.tag,
                                            title: value,
                                        },
                                    });
                                }}
                                getSuggestions={(searchString, callback) => {
                                    let cancelled = false;

                                    httpRequestJsonLocal<IAutoTaggingSearchResult>({
                                        method: 'POST',
                                        path: '/ai_data_op/',
                                        payload: {
                                            service: 'imatrics',
                                            operation: 'search',
                                            data: {term: searchString},
                                        },
                                    })
                                        .then((res) => {
                                            if (cancelled !== true) {
                                                const withoutExistingTags = res.result.tags.filter(
                                                    (searchTag) => tagAlreadyExists(searchTag.uuid) !== true,
                                                );

                                                // TODO: remove filtering - API should return items without duplicates
                                                const withLabel = withoutExistingTags.map(
                                                    (_item) => ({label: _item.title, item: _item}),
                                                );
                                                const withoutUndefinedOrNull = withLabel.filter(
                                                    ({label}) => label != null,
                                                );
                                                const unique = uniqBy(withoutUndefinedOrNull, (_item) => _item.label);

                                                callback(unique.map((itemWithLabel) => itemWithLabel.item));
                                            }
                                        });

                                    return {
                                        cancel: () => {
                                            cancelled = true;
                                        },
                                    };
                                }}
                                getLabel={({title}: ISearchTag) => title}
                                onSuggestionSelect={(suggestion: ISearchTag) => {
                                    insertTagFromSearch(
                                        suggestion.type,
                                        convertToTag(suggestion),
                                    );
                                    this.props.onChange(null); // closing new item view
                                }}
                            />
                        </div>
                        <div className="form__row">
                            <Select label={gettext('Type')} value={item.group ?? ''}
                                onChange={(event) => {
                                    const group = event === '' ? undefined : event as ITagGroup;

                                    onChange({
                                        ...item,
                                        group: group,
                                    });
                                }}>
                                <Option>{gettext('Select type')}</Option>
                                {
                                    Object.values(ITagGroup)
                                        .map((group) => (
                                            <Option key={group} value={group}>{getGroupLabel(group, superdesk)}</Option>
                                        ))
                                }
                            </Select>
                        </div>
                    </div>
                    <div className="sd-card__footer">
                        <button className="btn sd-flex-grow" onClick={() => cancel()}>
                            {gettext('Cancel')}
                        </button>
                        <button className="btn btn--primary sd-flex-grow"
                            disabled={savingDisabled}
                            onClick={() => {
                                const title = item.tag.title;
                                const group = item.group;

                                if (title != null && group != null) {
                                    save({
                                        group: group,
                                        tag: {
                                            title: title,
                                        },
                                    });
                                }
                            }}>
                            {gettext('Add')}
                        </button>
                    </div>
                </div>
            );
        }
    };
}
