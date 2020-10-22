import * as React from 'react';
import {INewItem, entityGroups} from './auto-tagging';
import {ISuperdesk} from 'superdesk-api';

import {Select, Option, Alert} from 'superdesk-ui-framework/react';
import {Autocomplete} from './autocomplete';
import {ITagUi} from './types';
import {IServerResponse, toClientFormat} from './adapter';
import {getGroups} from './groups';

interface IAutoTaggingSearchResult {
    result: {
        tags: IServerResponse;
    };
}

interface IProps {
    item: INewItem;
    onChange(item: INewItem | null): void;
    save(item: INewItem): void;
    cancel(): void;
    tagAlreadyExists(uuid: ITagUi['qcode']): boolean;
    insertTagFromSearch(tag: ITagUi): void;
}

interface IState {
    type: string | null;
    entityType: string | null;
    validationErrors: Array<string>;
}

export function getNewItemComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;
    const {httpRequestJsonLocal} = superdesk;

    const groups = getGroups(superdesk)
        .filter((_, id) => entityGroups.has(id) !== true)
        .toOrderedMap()
        .set('entity', {singular: gettext('Entity'), plural: 'Entities'});

    const entityGroupsWithLabels = getGroups(superdesk).filter((_, id) => entityGroups.has(id));

    return class NewItem extends React.PureComponent<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                type: null,
                entityType: null,
                validationErrors: [],
            };
        }
        render() {
            const {onChange, save, cancel, insertTagFromSearch, tagAlreadyExists} = this.props;
            const item = this.props.item;

            return (
                <div className="sd-card auto-tagging-widget__card-absolute">
                    <div className="sd-card__header sd-card__header--white">
                        <div className="sd-card__heading">{gettext('Add keyword')}</div>
                    </div>
                    <div className="sd-card__content">

                        {
                            this.state.validationErrors.map((error) => (
                                <Alert key={error} type="alert" size="small">{error}</Alert>
                            ))
                        }

                        <div className="form__row">
                            <Autocomplete
                                fieldLabel={gettext('Title')}
                                value={item.name ?? ''}
                                onChange={(value) => {
                                    onChange({
                                        ...item,
                                        name: value,
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
                                                const result = toClientFormat(res.result.tags, false).toArray();

                                                const withoutExistingTags = result.filter(
                                                    (searchTag) => tagAlreadyExists(searchTag.qcode) !== true,
                                                );

                                                callback(withoutExistingTags);
                                            }
                                        });

                                    return {
                                        cancel: () => {
                                            cancelled = true;
                                        },
                                    };
                                }}
                                getLabel={(tag: ITagUi) => {
                                    let desc = (tag.description?.trim().length ?? 0) > 0
                                        ? ` | ${tag.description?.trim()}`
                                        : '';

                                    return tag.name + desc;
                                }}
                                onSuggestionSelect={(suggestedTag: ITagUi) => {
                                    insertTagFromSearch(suggestedTag);
                                    this.props.onChange(null); // closing new item view
                                }}
                            />
                        </div>
                        <div className="form__row">
                            <Select
                                label={gettext('Type')}
                                value={this.state.type ?? ''}
                                onChange={(value) => {
                                    this.setState({type: value, entityType: null});
                                }}
                            >
                                <Option>{gettext('Select type')}</Option>
                                {
                                    groups.map((g, id) => (
                                        <Option key={id} value={id}>{g.singular}</Option>
                                    )).toArray()
                                }
                            </Select>

                            <br />

                            {
                                this.state.type !== 'entity' ? null : (
                                    <Select
                                        label={gettext('Entity type')}
                                        value={this.state.entityType ?? ''}
                                        onChange={(value) => {
                                            this.setState({entityType: value});
                                        }}
                                    >
                                        <Option>{gettext('Select type')}</Option>
                                        {
                                            entityGroupsWithLabels.map((g, id) => (
                                                <Option key={id} value={id}>{g.singular}</Option>
                                            )).toArray()
                                        }
                                    </Select>
                                )
                            }

                            <br />

                            <div>{gettext('Description')}</div>

                            <input
                                type="text"
                                value={item.description ?? ''}
                                onChange={(event) => {
                                    onChange({
                                        ...item,
                                        description: event.target.value,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div className="sd-card__footer">
                        <button className="btn sd-flex-grow" onClick={() => cancel()}>
                            {gettext('Cancel')}
                        </button>
                        <button
                            className="btn btn--primary sd-flex-grow"
                            onClick={() => {
                                const validationErrors = [];

                                if ((item.name?.trim().length ?? 0) < 1) {
                                    validationErrors.push(gettext('Name is required.'));
                                }

                                if (this.state.type == null) {
                                    validationErrors.push(gettext('Type is required.'));
                                }

                                if (this.state.type === 'entity' && this.state.entityType == null) {
                                    validationErrors.push(gettext('Entity type is required.'));
                                }

                                if (validationErrors.length > 0) {
                                    this.setState({validationErrors});
                                } else {
                                    const groupValue = this.state.entityType ?? this.state.type;

                                    if (groupValue == null) {
                                        throw new Error('Should have already been validated.');
                                    }

                                    save({
                                        ...item,
                                        group: {
                                            kind: 'visual',
                                            value: groupValue,
                                        },
                                    });
                                }
                            }}
                        >
                            {gettext('Add')}
                        </button>
                    </div>
                </div>
            );
        }
    };
}
