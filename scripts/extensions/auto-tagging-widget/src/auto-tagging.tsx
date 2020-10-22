import * as React from 'react';
import {OrderedMap, OrderedSet, Map} from 'immutable';
import {Switch, Button, ButtonGroup, EmptyState} from 'superdesk-ui-framework/react';
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

export const entityGroups = OrderedSet(['place', 'person', 'organisation']);

export type INewItem = Partial<ITagUi>;

interface IAutoTaggingResponse {
    analysis: OrderedMap<string, ITagUi>;
}

interface IProps {
    article: IArticle;
}

type IEditableData = {original: IAutoTaggingResponse; changes: IAutoTaggingResponse};

interface IState {
    runAutomaticallyPreference: boolean | 'loading';
    data: 'not-initialized' | 'loading' | IEditableData;
    newItem: INewItem | null;
    vocabularyLabels: Map<string, string> | null;
}

const RUN_AUTOMATICALLY_PREFERENCE = 'run_automatically';

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

        constructor(props: IProps) {
            super(props);

            this.state = {
                data: 'not-initialized',
                newItem: null,
                runAutomaticallyPreference: 'loading',
                vocabularyLabels: null,
            };

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
                const {guid, language, headline, body_html} = this.props.article;

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
                        },
                    },
                }).then((res) => {
                    const resClient = toClientFormat(res.analysis, false);

                    if (dataBeforeLoading === 'loading' || dataBeforeLoading === 'not-initialized') {
                        this.setState({
                            data: {original: {analysis: OrderedMap<string, ITagUi>()}, changes: {analysis: resClient}},
                        });
                    } else {
                        this.setState({
                            data: {
                                ...dataBeforeLoading,
                                changes: {analysis: resClient.merge(dataBeforeLoading.changes.analysis)},
                            },
                        });
                    }
                });
            });
        }
        initializeData(preload: boolean) {
            const existingTags = getExistingTags(this.props.article);

            if (Object.keys(existingTags).length > 0) {
                const resClient = toClientFormat(existingTags, true);

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
                saved: false,
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
        reload() {
            this.setState({data: 'not-initialized'});

            this.initializeData(false);
        }
        componentDidMount() {
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
        render() {
            const {runAutomaticallyPreference, vocabularyLabels} = this.state;

            if (runAutomaticallyPreference === 'loading' || vocabularyLabels == null) {
                return null;
            }

            const {data} = this.state;
            const dirty = data === 'loading' || data === 'not-initialized' ? false :
                this.isDirty(data.original, data.changes);

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
                        {
                            <div className="form__row form__row--flex">
                                <ButtonGroup align="left">
                                    <Switch
                                        value={runAutomaticallyPreference}
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
                                {
                                    data === 'loading' || data === 'not-initialized' ? null : (
                                        <ButtonGroup align="right">
                                            <Button
                                                type="primary"
                                                icon="plus-large"
                                                size="small"
                                                shape="round"
                                                text={gettext('Add')}
                                                onClick={() => {
                                                    this.setState({
                                                        newItem: {
                                                            name: '',
                                                        },
                                                    });
                                                }} />
                                        </ButtonGroup>
                                    )
                                }
                            </div>
                        }

                        {(() => {
                            if (data === 'loading') {
                                return (
                                    <div className="spinner-big" />
                                );
                            } else if (data === 'not-initialized') {
                                return (
                                    <EmptyState
                                        title={gettext('No tags yet')}
                                        description={gettext('Click "Run" to generate')}
                                    />
                                );
                            } else {
                                const items = data.changes.analysis;

                                const isEntity = (tag: ITagUi) => entityGroups.has(tag.group.value);

                                const entities = items.filter((tag) => isEntity(tag));
                                const entitiesGrouped = entities.groupBy((tag) => tag?.group.value);
                                const entitiesGroupedAndSorted = entitiesGrouped.sortBy(
                                    (_, key) => key!.toString().toLocaleLowerCase(),
                                    (a, b) => a.localeCompare(b),
                                );

                                const others = items.filter((tag) => isEntity(tag) === false);
                                const othersGrouped = others.groupBy((tag) => tag.group.value);
                                const othersGroupedAndSorted = othersGrouped.sortBy(
                                    (_, key) => key!.toString().toLocaleLowerCase(),
                                    (a, b) => a.localeCompare(b),
                                );

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
                                                    tagAlreadyExists={(qcode) => {
                                                        return data.changes.analysis.has(qcode);
                                                    }}
                                                    insertTagFromSearch={(tag: ITagUi) => {
                                                        this.insertTagFromSearch(tag, data);
                                                    }}
                                                />
                                            )
                                        }

                                        <div className="widget-content__main">
                                            {othersGroupedAndSorted.map((tags, groupId) => {
                                                return (
                                                    <ToggleBoxNext
                                                        key={groupId}
                                                        title={vocabularyLabels.get(groupId) ?? groupId}
                                                        style="circle"
                                                        isOpen={true}
                                                    >
                                                        <TagListComponent
                                                            tags={tags.toMap()}
                                                            onRemove={(id) => {
                                                                this.updateTags(
                                                                    data.changes.analysis.remove(id),
                                                                    data,
                                                                );
                                                            }}
                                                        />
                                                    </ToggleBoxNext>
                                                );
                                            }).toArray()}

                                            {
                                                entitiesGroupedAndSorted.size < 1 ? null : (
                                                    <ToggleBoxNext
                                                        title={gettext('Entities')}
                                                        style="circle"
                                                        isOpen={true}
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
                                                                    tags={tags.toMap()}
                                                                    onRemove={(id) => {
                                                                        this.updateTags(
                                                                            data.changes.analysis.remove(id),
                                                                            data,
                                                                        );
                                                                    }}
                                                                />
                                                            </div>
                                                        )).toArray()}
                                                    </ToggleBoxNext>
                                                )
                                            }
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
