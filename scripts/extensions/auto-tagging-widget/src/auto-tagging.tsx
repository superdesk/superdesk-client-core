import * as React from 'react';
import {OrderedMap, OrderedSet} from 'immutable';
import {Switch, Button, ButtonGroup} from 'superdesk-ui-framework/react';
import {ToggleBoxNext} from 'superdesk-ui-framework';

import {IArticle, ISuperdesk, ISubject} from 'superdesk-api';

import {getTagsListComponent} from './tag-list';
import {getNewItemComponent} from './new-item';
import {ITagUi} from './types';
import {toClientFormat, IServerResponse, toServerFormat} from './adapter';

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
}

const RUN_AUTOMATICALLY_PREFERENCE = 'run_automatically';

function createTagsPatch(
    article: IArticle,
    tags: OrderedMap<string, ITagUi>,
    superdesk: ISuperdesk,
): Partial<IArticle> {
    const serverFormat = toServerFormat(tags, superdesk);
    const patch: Partial<IArticle> = {};

    Object.entries(serverFormat).forEach((item) => {
        const key = item[0] as keyof IServerResponse;
        const newValues = serverFormat[key];

        if (newValues != null) {
            let oldValues = OrderedMap<string, ISubject>((article[key] || []).map((_item) => [_item.qcode, _item]));
            let newValuesMap = OrderedMap<string, ISubject>();

            newValues.forEach((tag) => {
                newValuesMap.set(tag.qcode, tag);
            });

            const wasRemoved = (tag: ISubject) =>
                tag.source === 'imatrics'
                && oldValues.has(tag.qcode)
                && !newValuesMap.has(tag.qcode);

            patch[key] = oldValues
                .merge(newValuesMap)
                .filter((tag) => tag != null && wasRemoved(tag) !== true)
                .toArray();
        }
    });

    return patch;
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {preferences} = superdesk;
    const {httpRequestJsonLocal} = superdesk;
    const {gettext} = superdesk.localization;
    const {memoize, generatePatch} = superdesk.utilities;

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
            };

            this.runAnalysis = this.runAnalysis.bind(this);
            this.updateTags = this.updateTags.bind(this);
            this.createNewTag = this.createNewTag.bind(this);
            this.insertTagFromSearch = this.insertTagFromSearch.bind(this);
            this.isDirty = memoize((a, b) => Object.keys(generatePatch(a, b)).length > 0);
        }
        runAnalysis() {
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
                    const resClient = toClientFormat(res.analysis);

                    this.setState({
                        data: {original: {analysis: resClient}, changes: {analysis: resClient}},
                    });
                });
            });
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
                source: '',
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
        componentDidMount() {
            preferences.get(RUN_AUTOMATICALLY_PREFERENCE).then((res: boolean | null) => {
                const value = res ?? false;

                this.setState({runAutomaticallyPreference: value});

                if (value === true) {
                    this.runAnalysis();
                }
            });
        }
        render() {
            const {runAutomaticallyPreference} = this.state;

            if (runAutomaticallyPreference === 'loading') {
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
                                            );
                                        }}
                                    >
                                        {gettext('Save')}
                                    </button>

                                    <button
                                        className="btn"
                                        onClick={() => this.setState({
                                            data: {
                                                ...data,
                                                changes: data.original,
                                            },
                                        })}
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
                                return null;
                            } else {
                                const items = data.changes.analysis;

                                const isEntity = (tag: ITagUi) => entityGroups.has(tag.group.value);

                                const entities = items.filter((tag) => tag != null && isEntity(tag));
                                const entitiesGrouped = entities.groupBy((tag) => tag?.group.value);

                                const others = items.filter((tag) => tag != null && isEntity(tag) === false);
                                const othersGrouped = others.groupBy((tag) => tag?.group.value);

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
                                            {
                                                othersGrouped.map((tags, key) => {
                                                    if (tags == null) {
                                                        throw new Error('Can not be nullish');
                                                    }

                                                    return (
                                                        <ToggleBoxNext
                                                            key={key}
                                                            title={key}
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
                                                }).toArray()
                                            }

                                            {
                                                entitiesGrouped.size < 1 ? null : (
                                                    <ToggleBoxNext
                                                        title={gettext('Entities')}
                                                        style="circle"
                                                        isOpen={true}
                                                    >
                                                        {entitiesGrouped.map((tags, key) => {
                                                            if (tags == null) {
                                                                throw new Error('Can not be nullish');
                                                            }

                                                            const groupName = key;

                                                            return (
                                                                <div key={key}>
                                                                    <div>{groupName}</div>
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
                                                            );
                                                        }).toArray()}
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
                                                // not implemented
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
