import * as React from 'react';
import {OrderedMap, OrderedSet, Map} from 'immutable';
import {Switch, Button, ButtonGroup, EmptyState, Autocomplete} from 'superdesk-ui-framework/react';
import {ToggleBoxNext} from 'superdesk-ui-framework';

import {IArticle, ISuperdesk} from 'superdesk-api';

import {getTagsListComponent} from './tag-list';
import {getNewItemComponent} from './new-item';
import {ITagUi} from './types';
import {toClientFormat, IServerResponse} from './adapter';
import {SOURCE_IMATRICS} from './constants';
import {getGroups} from './groups';
import {getAutoTaggingVocabularyLabels} from './common';
import {getExistingTags, createTagsPatch} from './data-transformations';
import {noop} from 'lodash';

export const entityGroups = OrderedSet(['place', 'person', 'organisation']);

export type INewItem = Partial<ITagUi>;

interface IAutoTaggingResponse {
    analysis: OrderedMap<string, ITagUi>;
}

interface IAutoTaggingSearchResult {
    result: {
        tags: IServerResponse;
    };
}

interface IProps {
    article: IArticle;
}

interface IIMatricsFields {
    [key: string]: {
        name: string;
        order: number;
    };
}

type IEditableData = {original: IAutoTaggingResponse; changes: IAutoTaggingResponse};

interface IState {
    runAutomaticallyPreference: boolean | 'loading';
    data: 'not-initialized' | 'loading' | IEditableData;
    newItem: INewItem | null;
    vocabularyLabels: Map<string, string> | null;
}

const RUN_AUTOMATICALLY_PREFERENCE = 'run_automatically';

function tagAlreadyExists(data: IEditableData, qcode: string): boolean {
    return data.changes.analysis.has(qcode);
}

function hasConfig(key: string, iMatricsFields: IIMatricsFields) {
    return iMatricsFields[key] != null;
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {preferences} = superdesk;
    const {httpRequestJsonLocal} = superdesk;
    const {gettext} = superdesk.localization;
    const {memoize, generatePatch} = superdesk.utilities;
    const groupLabels = getGroups(superdesk);

    const TagListComponent = getTagsListComponent(superdesk);
    const NewItemComponent = getNewItemComponent(superdesk);

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        private isDirty: (a: IAutoTaggingResponse, b: Partial<IAutoTaggingResponse>) => boolean;
        private _mounted: boolean;
        private iMatricsFields = superdesk.instance.config.iMatricsFields ?? {entities: {}, others: {}};

        constructor(props: IProps) {
            super(props);

            this.state = {
                data: 'not-initialized',
                newItem: null,
                runAutomaticallyPreference: 'loading',
                vocabularyLabels: null,
            };

            this._mounted = false;
            this.runAnalysis = this.runAnalysis.bind(this);
            this.initializeData = this.initializeData.bind(this);
            this.updateTags = this.updateTags.bind(this);
            this.createNewTag = this.createNewTag.bind(this);
            this.insertTagFromSearch = this.insertTagFromSearch.bind(this);
            this.reload = this.reload.bind(this);
            this.isDirty = memoize((a, b) => Object.keys(generatePatch(a, b)).length > 0);
        }
        runAnalysis() {
            const dataBeforeLoading = this.state.data;

            this.setState({data: 'loading'}, () => {
                const {guid, language, headline, body_html, abstract} = this.props.article;

                httpRequestJsonLocal<{analysis: IServerResponse}>({
                    method: 'POST',
                    path: '/ai/',
                    payload: {
                        service: 'imatrics',
                        item: {
                            guid,
                            language,
                            headline,
                            body_html,
                            abstract,
                        },
                    },
                }).then((res) => {
                    const resClient = toClientFormat(res.analysis);

                    if (this._mounted) {
                        this.setState({
                            data: {
                                original: dataBeforeLoading === 'loading' || dataBeforeLoading === 'not-initialized'
                                    ? {analysis: OrderedMap<string, ITagUi>()} // initialize empty data
                                    : dataBeforeLoading.original, // use previous data
                                changes: {analysis: resClient},
                            },
                        });
                    }
                });
            });
        }
        initializeData(preload: boolean) {
            const existingTags = getExistingTags(this.props.article);

            if (Object.keys(existingTags).length > 0) {
                const resClient = toClientFormat(existingTags);

                this.setState({
                    data: {original: {analysis: resClient}, changes: {analysis: resClient}},
                });
            } else if (preload) {
                this.runAnalysis();
            }
        }
        updateTags(tags: OrderedMap<string, ITagUi>, data: IEditableData) {
            const {changes} = data;

            this.setState({
                data: {
                    ...data,
                    changes: {
                        ...changes,
                        analysis: tags,
                    },
                },
            });
        }
        createNewTag(newItem: INewItem, data: IEditableData) {
            const _title = newItem.name;

            if (_title == null || newItem.group == null) {
                return;
            }

            const tag: ITagUi = {
                qcode: Math.random().toString(),
                name: _title,
                source: SOURCE_IMATRICS,
                altids: {},
                group: newItem.group,
            };

            this.updateTags(
                data.changes.analysis.set(tag.qcode, tag),
                data,
            );

            this.setState({newItem: null});
        }
        insertTagFromSearch(tag: ITagUi, data: IEditableData) {
            this.updateTags(
                data.changes.analysis.set(tag.qcode, tag),
                data,
            );
        }
        getGroupName(group: string, vocabularyLabels: Map<string, string>) {
            return this.iMatricsFields.others[group]?.name ?? vocabularyLabels?.get(group) ?? group;
        }
        reload() {
            this.setState({data: 'not-initialized'});

            this.initializeData(false);
        }
        componentDidMount() {
            this._mounted = true;

            Promise.all([
                getAutoTaggingVocabularyLabels(superdesk),
                preferences.get(RUN_AUTOMATICALLY_PREFERENCE),
            ]).then(([vocabularyLabels, runAutomatically = false]) => {
                this.setState({
                    vocabularyLabels,
                    runAutomaticallyPreference: runAutomatically,
                });

                this.initializeData(runAutomatically);
            });
        }
        componentWillUnmount() {
            this._mounted = false;
        }
        render() {
            const {runAutomaticallyPreference, vocabularyLabels} = this.state;

            if (runAutomaticallyPreference === 'loading' || vocabularyLabels == null) {
                return null;
            }

            const {data} = this.state;
            const dirty = data === 'loading' || data === 'not-initialized' ? false :
                this.isDirty(data.original, data.changes);

            const readOnly = superdesk.entities.article.isLockedInOtherSession(this.props.article);

            return (
                <React.Fragment>
                    <div className="widget-header">
                        <div className="widget-title">{label}</div>

                        {
                            data === 'loading' || data === 'not-initialized' || !dirty ? null : (
                                <div className="widget__sliding-toolbar widget__sliding-toolbar--right">
                                    <button
                                        className="btn btn--primary"
                                        onClick={() => {
                                            superdesk.entities.article.patch(
                                                this.props.article,
                                                createTagsPatch(this.props.article, data.changes.analysis, superdesk),
                                            ).then(() => {
                                                this.reload();
                                            });
                                        }}
                                    >
                                        {gettext('Save')}
                                    </button>

                                    <button
                                        className="btn"
                                        onClick={() => {
                                            this.reload();
                                        }}
                                    >
                                        {gettext('Cancel')}
                                    </button>
                                </div>
                            )
                        }
                    </div>

                    <div className="widget-content sd-padding-all--2">
                        <div>
                            <div className="form__row form__row--flex" style={{padding: 0}}>
                                <ButtonGroup align="left">
                                    <Switch
                                        value={runAutomaticallyPreference}
                                        disabled={readOnly}
                                        onChange={() => {
                                            const newValue = !runAutomaticallyPreference;

                                            this.setState({runAutomaticallyPreference: newValue});

                                            superdesk.preferences.set(RUN_AUTOMATICALLY_PREFERENCE, newValue);

                                            if (newValue && this.state.data === 'not-initialized') {
                                                this.runAnalysis();
                                            }
                                        }}
                                    />
                                    <label>{gettext('Run automatically')}</label>
                                </ButtonGroup>
                            </div>

                            {
                                data === 'loading' || data === 'not-initialized' ? null : (
                                    <div className="form__row form__row--flex" style={{alignItems: 'center'}}>
                                        <div style={{flexGrow: 1}}>
                                            <Autocomplete
                                                value={''}
                                                keyValue="name"
                                                items={[]}
                                                search={(searchString, callback) => {
                                                    let cancelled = false;

                                                    httpRequestJsonLocal<IAutoTaggingSearchResult>({
                                                        method: 'POST',
                                                        path: '/ai_data_op/',
                                                        payload: {
                                                            service: 'imatrics',
                                                            operation: 'search',
                                                            data: {term: searchString},
                                                        },
                                                    }).then((res) => {
                                                        if (cancelled !== true) {
                                                            const result = toClientFormat(res.result.tags).toArray();

                                                            const withoutExistingTags = result.filter(
                                                                (searchTag) => tagAlreadyExists(
                                                                    data,
                                                                    searchTag.qcode,
                                                                ) !== true,
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
                                                listItemTemplate={(__item: any) => {
                                                    const _item: ITagUi = __item;

                                                    return (
                                                        <div className="auto-tagging-widget__autocomplete-item">
                                                            <b>{_item.name}</b>

                                                            {
                                                                _item?.group?.value == null ? null : (
                                                                    <p>{_item.group.value}</p>
                                                                )
                                                            }

                                                            {
                                                                _item?.description == null ? null : (
                                                                    <p>{_item.description}</p>
                                                                )
                                                            }
                                                        </div>
                                                    );
                                                }}
                                                onSelect={(_value: any) => {
                                                    const value = _value as ITagUi;

                                                    this.insertTagFromSearch(value, data);
                                                    // TODO: clear autocomplete?
                                                }}
                                                onChange={noop}
                                            />
                                        </div>

                                        <div style={{marginLeft: 10}}>
                                            <Button
                                                type="primary"
                                                icon="plus-large"
                                                size="small"
                                                shape="round"
                                                text={gettext('Add')}
                                                iconOnly={true}
                                                disabled={readOnly}
                                                onClick={() => {
                                                    this.setState({
                                                        newItem: {
                                                            name: '',
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        </div>

                        {(() => {
                            if (data === 'loading') {
                                return (
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <div className="spinner-big" />
                                    </div>
                                );
                            } else if (data === 'not-initialized') {
                                return (
                                    <EmptyState
                                        title={gettext('No tags yet')}
                                        description={readOnly ? undefined : gettext('Click "Run" to generate')}
                                    />
                                );
                            } else {
                                const items = data.changes.analysis;
                                const savedTags = data.original.analysis.keySeq().toSet();

                                const isEntity = (tag: ITagUi) => entityGroups.has(tag.group.value);

                                const entities = items.filter((tag) => isEntity(tag));
                                const entitiesGrouped = entities.groupBy((tag) => tag?.group.value);

                                const entitiesGroupedAndSortedByConfig = entitiesGrouped
                                    .filter((_, key) => hasConfig(key, this.iMatricsFields.entities))
                                    .sortBy((_, key) => this.iMatricsFields.entities[key].order,
                                        (a, b) => a - b);

                                const entitiesGroupedAndSortedNotInConfig = entitiesGrouped
                                    .filter((_, key) => !hasConfig(key, this.iMatricsFields.entities))
                                    .sortBy((_, key) => key!.toString().toLocaleLowerCase(),
                                        (a, b) => a.localeCompare(b));

                                const entitiesGroupedAndSorted = entitiesGroupedAndSortedByConfig
                                    .concat(entitiesGroupedAndSortedNotInConfig);

                                const others = items.filter((tag) => isEntity(tag) === false);
                                const othersGrouped = others.groupBy((tag) => tag.group.value);

                                let allGrouped = OrderedMap<string, JSX.Element>();

                                othersGrouped.forEach((tags, groupId) =>
                                    tags && groupId ? allGrouped = allGrouped.set(groupId,
                                        <ToggleBoxNext
                                            key={groupId}
                                            title={this.getGroupName(groupId, vocabularyLabels)}
                                            style="circle"
                                            isOpen={true}
                                        >
                                            <TagListComponent
                                                savedTags={savedTags}
                                                tags={tags.toMap()}
                                                readOnly={readOnly}
                                                onRemove={(id) => {
                                                    this.updateTags(
                                                        data.changes.analysis.remove(id),
                                                        data,
                                                    );
                                                }}
                                            />
                                        </ToggleBoxNext>,
                                    ) : false,
                                );

                                if (entitiesGroupedAndSorted.size > 0) {
                                    allGrouped = allGrouped.set('entities',
                                        <ToggleBoxNext
                                            title={this.getGroupName('entities', vocabularyLabels)}
                                            style="circle"
                                            isOpen={true}
                                            key="entities"
                                        >
                                            {entitiesGroupedAndSorted.map((tags, key) => (
                                                <div key={key}>
                                                    <div
                                                        className="form-label"
                                                        style={{display: 'block'}}
                                                    >
                                                        {groupLabels.get(key).plural}
                                                    </div>
                                                    <TagListComponent
                                                        savedTags={savedTags}
                                                        tags={tags.toMap()}
                                                        readOnly={readOnly}
                                                        onRemove={(id) => {
                                                            this.updateTags(
                                                                data.changes.analysis.remove(id),
                                                                data,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            )).toArray()}
                                        </ToggleBoxNext>,
                                    );
                                }

                                const allGroupedAndSortedByConfig = allGrouped
                                    .filter((_, key) => hasConfig(key, this.iMatricsFields.others))
                                    .sortBy((_, key) => this.iMatricsFields.others[key].order,
                                        (a, b) => a - b);

                                const allGroupedAndSortedNotInConfig = allGrouped
                                    .filter((_, key) => !hasConfig(key, this.iMatricsFields.others));

                                const allGroupedAndSorted = allGroupedAndSortedByConfig
                                    .concat(allGroupedAndSortedNotInConfig);

                                return (
                                    <React.Fragment>
                                        {
                                            this.state.newItem == null ? null : (
                                                <NewItemComponent
                                                    item={this.state.newItem}
                                                    onChange={(newItem) => {
                                                        this.setState({newItem});
                                                    }}
                                                    save={(newItem: INewItem) => {
                                                        this.createNewTag(newItem, data);
                                                    }}
                                                    cancel={() => {
                                                        this.setState({newItem: null});
                                                    }}
                                                    tagAlreadyExists={
                                                        (qcode) => tagAlreadyExists(data, qcode)
                                                    }
                                                    insertTagFromSearch={(tag: ITagUi) => {
                                                        this.insertTagFromSearch(tag, data);
                                                    }}
                                                />
                                            )
                                        }

                                        <div className="widget-content__main">
                                            {allGroupedAndSorted.map((item) => item).toArray()}
                                        </div>
                                    </React.Fragment>
                                );
                            }
                        })()}

                        <div className="widget-content__footer">
                            {(() => {
                                if (data === 'loading') {
                                    return null;
                                } else if (data === 'not-initialized') {
                                    return (
                                        <Button
                                            type="primary"
                                            text={gettext('Run')}
                                            expand={true}
                                            disabled={readOnly}
                                            onClick={() => {
                                                this.runAnalysis();
                                            }}
                                        />
                                    );
                                } else {
                                    return (
                                        <Button
                                            type="primary"
                                            text={gettext('Refresh')}
                                            expand={true}
                                            disabled={readOnly}
                                            onClick={() => {
                                                this.runAnalysis();
                                            }}
                                        />
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </React.Fragment>
            );
        }
    };
}
