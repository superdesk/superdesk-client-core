import * as React from 'react';
import {OrderedMap, OrderedSet, Map} from 'immutable';
import {Switch, Button, ButtonGroup, EmptyState, Autocomplete} from 'superdesk-ui-framework/react';
import {ToggleBoxNext} from 'superdesk-ui-framework';

import {IArticle, ISuperdesk} from 'superdesk-api';

import {getTagsListComponent} from './tag-list';
import {getNewItemComponent} from './new-item';
import {ITagUi} from './types';
import {toClientFormat, IServerResponse, toServerFormat} from './adapter';
import {getGroups} from './groups';
import {getAutoTaggingVocabularyLabels} from './common';
import {getExistingTags, createTagsPatch} from './data-transformations';

export const entityGroups = OrderedSet(['place', 'person', 'organisation', 'event']);

export type INewItem = Partial<ITagUi>;

interface IAutoTaggingResponse {
    analysis: OrderedMap<string, ITagUi>;
}

interface IAutoTaggingSearchResult {
    result: {
        tags: IServerResponse;

        /**
         * When search is performed, this will contain
         * all parents of items that matched the search query
         * and were returned in `tags` section.
         */
        broader?: IServerResponse;
    };
}

interface IProps {
    article: IArticle;
}

interface ISemaphoreFields {
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
    tentativeTagName: string;
}

const RUN_AUTOMATICALLY_PREFERENCE = 'run_automatically';

function tagAlreadyExists(data: IEditableData, qcode: string): boolean {
    return data.changes.analysis.has(qcode);
}

export function hasConfig(key: string, semaphoreFields: ISemaphoreFields) {
    return semaphoreFields[key] != null;
}
// Runs when clicking the "Run" button. Returns the tags from the semaphore service
export function getAutoTaggingData(data: IEditableData, semaphoreConfig: any) {
    const items = data.changes.analysis;

    const isEntity = (tag: ITagUi) => tag.group && entityGroups.has(tag.group.value);

    const entities = items.filter((tag) => isEntity(tag));
    const entitiesGrouped = entities.groupBy((tag) => tag?.group.value);

    const entitiesGroupedAndSortedByConfig = entitiesGrouped
        .filter((_, key) => hasConfig(key, semaphoreConfig.entities))
        .sortBy((_, key) => semaphoreConfig.entities[key].order,
            (a, b) => a - b);
    const entitiesGroupedAndSortedNotInConfig = entitiesGrouped
        .filter((_, key) => !hasConfig(key, semaphoreConfig.entities))
        .sortBy((_, key) => key!.toString().toLocaleLowerCase(),
            (a, b) => a.localeCompare(b));
    const entitiesGroupedAndSorted = entitiesGroupedAndSortedByConfig
        .concat(entitiesGroupedAndSortedNotInConfig);

    const others = items.filter((tag) => isEntity(tag) === false);
    const othersGrouped = others.groupBy((tag) => tag.group.value);

    return {entitiesGroupedAndSorted, othersGrouped};
}

function showAutoTaggerServiceErrorModal(superdesk: ISuperdesk, errors: Array<ITagUi>) {
    const {gettext} = superdesk.localization;
    const {showModal} = superdesk.ui;
    const {Modal, ModalHeader, ModalBody, ModalFooter} = superdesk.components;

    showModal(({closeModal}) => (
        <Modal>
            <ModalHeader onClose={closeModal}>
                {gettext('Autotagger service error')}
            </ModalHeader>

            <ModalBody>
                <h3>{gettext('Some tags can not be displayed')}</h3>

                <p>
                    {
                        gettext(
                            'Autotagger service has returned tags referencing parents that do not exist in the response.',
                        )
                    }
                </p>

                <table className="table">
                    <thead>
                        <th>{gettext('tag name')}</th>
                        <th>{gettext('qcode')}</th>
                        <th>{gettext('parent ID')}</th>
                    </thead>

                    <tbody>
                        {
                            errors.map((tag) => (
                                <tr key={tag.qcode}>
                                    <td>{tag.name}</td>
                                    <td>{tag.qcode}</td>
                                    <td>{tag.parent}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </ModalBody>

            <ModalFooter>
                <Button
                    aria-label="close"
                    text={gettext('close')}
                    onClick={() => {
                        closeModal();
                    }}
                />
            </ModalFooter>
        </Modal>
    ));
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {preferences} = superdesk;
    const {httpRequestJsonLocal} = superdesk;
    const {gettext, gettextPlural} = superdesk.localization;
    const {memoize, generatePatch, arrayToTree} = superdesk.utilities;
    const {WidgetHeading, Alert} = superdesk.components;
    const groupLabels = getGroups(superdesk);

    const TagListComponent = getTagsListComponent(superdesk);
    const NewItemComponent = getNewItemComponent(superdesk);

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        private isDirty: (a: IAutoTaggingResponse, b: Partial<IAutoTaggingResponse>) => boolean;
        private _mounted: boolean;
        private semaphoreFields = superdesk.instance.config.semaphoreFields ?? {entities: {}, others: {}};

        constructor(props: IProps) {
            super(props);

            this.state = {
                data: 'not-initialized',
                newItem: null,
                runAutomaticallyPreference: 'loading',
                vocabularyLabels: null,
                tentativeTagName: '',
            };

            this._mounted = false;
            this.runAnalysis = this.runAnalysis.bind(this);
            this.initializeData = this.initializeData.bind(this);
            this.updateTags = this.updateTags.bind(this);
            this.createNewTag = this.createNewTag.bind(this);
            this.insertTagFromSearch = this.insertTagFromSearch.bind(this);
            this.reload = this.reload.bind(this);
            this.save = this.save.bind(this);
            this.isDirty = memoize((a, b) => Object.keys(generatePatch(a, b)).length > 0);
        }
    
        runAnalysis() {
            const dataBeforeLoading = this.state.data;

            this.setState({data: 'loading'}, () => {
                const {guid, language, headline, body_html, abstract, slugline} = this.props.article;

                httpRequestJsonLocal<{analysis: IServerResponse}>({
                    method: 'POST',
                    path: '/ai/',
                    payload: {
                        service: 'semaphore',
                        item: {
                            guid,
                            language,
                            slugline,
                            headline,
                            body_html,
                            abstract,
                        },
                    },
                }).then((res) => {

                    const resClient = toClientFormat(res.analysis);
                    // Use the line below to get the existing tags from the article
                    // const existingTags = getExistingTags(this.props.article);                         
                        
                    if (this._mounted) {      
                        const existingTags = dataBeforeLoading !== 'loading' && dataBeforeLoading !== 'not-initialized'
                        ? dataBeforeLoading.changes.analysis // keep existing tags
                        : OrderedMap<string, ITagUi>();                  
                        // Merge new analysis with existing tags
                        const mergedTags = existingTags.merge(resClient);
                        this.setState({
                            data: {
                                original: dataBeforeLoading === 'loading' || dataBeforeLoading === 'not-initialized'
                                    ? {analysis: OrderedMap<string, ITagUi>()} // initialize empty data
                                    : dataBeforeLoading.original, // use previous data
                                changes: {analysis: mergedTags},
                            },
                        });
                    }
                }).catch((error) => {
                    console.error('Error during analysis. We are in runAnalysis:  ',error);   

                    if (this._mounted) {
                        this.setState({
                            data: 'not-initialized' // or you could set to a new error state
                        });
                    }
                    
                });
            });
        }
        initializeData(preload: boolean) {
            try {
                const existingTags = getExistingTags(this.props.article);
                if (Object.keys(existingTags).length > 0) {
                    const resClient = toClientFormat(existingTags);
                    this.setState({
                        data: { original: { analysis: resClient }, changes: { analysis: resClient } },
                    });
                } else if (preload) {
                    this.runAnalysis();
                }
            } catch (error) {
                console.error('Error in initializeData:', error);
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
                description: newItem.description,
                source: 'manual',
                altids: {},
                group: newItem.group,
            };

            this.updateTags(
                data.changes.analysis.set(tag.qcode, tag),
                data,
            );

            this.setState({newItem: null});
        }
        insertTagFromSearch(tag: ITagUi, data: IEditableData, searchResponse: IAutoTaggingSearchResult) {
            /**
             * Contains parents of all items returned in search results,
             * not only the one that was eventually chosen
             */
            const parentsMixed = searchResponse?.result?.broader != null
                ? toClientFormat(searchResponse.result.broader)
                : OrderedMap<string, ITagUi>();

            const parentsForChosenTag: Array<ITagUi> = [];

            let latestParent = tag;

            while (latestParent?.parent != null) {
                const nextParent = parentsMixed.get(latestParent.parent);

                if (nextParent != null) {
                    parentsForChosenTag.push(nextParent);
                }

                latestParent = nextParent;
            }

            let result: OrderedMap<string, ITagUi> = data.changes.analysis;

            result = result.set(tag.qcode, tag);

            for (const parent of parentsForChosenTag) {
                result = result.set(parent.qcode, parent);
            }

            this.updateTags(
                result,
                data,
            );
            // Reset the autocomplete input
            this.setState({ tentativeTagName: '' });
        }
        getGroupName(group: string, vocabularyLabels: Map<string, string>) {
            return this.semaphoreFields.others[group]?.name ?? vocabularyLabels?.get(group) ?? group;
        }
        reload() {
            this.setState({data: 'not-initialized'});
            this.initializeData(false);
        }
        // Saves the tags to the article
        save() {
            const {data} = this.state;
            if (data === 'loading' || data === 'not-initialized') {
                return;
            }

            superdesk.entities.article.patch(
                this.props.article,
                createTagsPatch(this.props.article, data.changes.analysis, superdesk),
            ).then(() => {
                this.reload();
                this.sendFeedback(this.props.article, data.changes.analysis);
            });
        }
        sendFeedback(article: IArticle, tags: IAutoTaggingResponse['analysis']): Promise<any> {
            const {guid, language, headline, body_html, abstract} = article;

            return httpRequestJsonLocal<{analysis: IServerResponse}>({
                method: 'POST',
                path: '/ai_data_op/',
                payload: {
                    service: 'imatrics',
                    operation: 'feedback',
                    data: {
                        item: {
                            guid,
                            language,
                            headline,
                            body_html,
                            abstract,
                        },
                        tags: toServerFormat(tags, superdesk),
                    },
                },
            });
        }
        componentDidMount() {
            this._mounted = true;

            Promise.all([
                getAutoTaggingVocabularyLabels(superdesk),
                preferences.get(RUN_AUTOMATICALLY_PREFERENCE),
                // Need to remove false from the line below to run the analysis automatically
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
                    {
                        (() => {
                            if (data === 'loading' || data === 'not-initialized') {
                                return null;
                            } else {
                                const treeErrors = arrayToTree(
                                    data.changes.analysis.toArray(),
                                    (item) => item.qcode,
                                    (item) => item.parent,
                                ).errors;
                                // only show errors when there are unsaved changes
                                if (treeErrors.length > 0 && dirty) {
                                    return (
                                        <Alert
                                            type="warning"
                                            size="small"
                                            title={gettext('Autotagger service error')}
                                            message={
                                                gettextPlural(
                                                    treeErrors.length,
                                                    '1 tag can not be displayed',
                                                    '{{n}} tags can not be displayed',
                                                    {n: treeErrors.length},
                                                )
                                            }
                                            actions={[
                                                {
                                                    label: gettext('details'),
                                                    onClick: () => {
                                                        showAutoTaggerServiceErrorModal(superdesk, treeErrors);
                                                    },
                                                    icon: 'info-sign',
                                                },
                                            ]}
                                        />
                                    );
                                } else {
                                    return null;
                                }
                            }
                        })()
                    }

                    <WidgetHeading
                        widgetName={label}
                        editMode={dirty}
                    >
                        {
                            data === 'loading' || data === 'not-initialized' || !dirty ? null : (
                                <div>
                                    <button
                                        aria-label="save"
                                        className="btn btn--primary"
                                        onClick={this.save}
                                    >
                                        {gettext('Save')}
                                    </button>

                                    <button
                                        aria-label="cancel"
                                        className="btn"
                                        onClick={this.reload}
                                    >
                                        {gettext('Cancel')}
                                    </button>
                                </div>
                            )
                        }
                    </WidgetHeading>

                    <div className="widget-content sd-padding-all--2">
                        <div>
                            {/* Run automatically button is hidden for the next release */}
                            <div className="form__row form__row--flex sd-padding-b--1" style={{ display: 'none' }}>
                                <ButtonGroup align="start">
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
                                        aria-label="Run automatically"
                                        label={{text: gettext('Run automatically')}}
                                    />
                                </ButtonGroup>
                            </div>

                            {
                                data === 'loading' || data === 'not-initialized' ? null : (
                                    <>
                                        <div className="form__row form__row--flex" style={{alignItems: 'center'}}>
                                            <div style={{flexGrow: 1}}>
                                                <Autocomplete
                                                    value={''}
                                                    keyValue="keyValue"
                                                    items={[]}
                                                    placeholder="Search for an entity or subject"
                                                    search={(searchString, callback) => {
                                                        let cancelled = false;
                                                        
                                                        httpRequestJsonLocal<{analysis: IAutoTaggingSearchResult}>({
                                                            method: 'POST',
                                                            path: '/ai/',
                                                            payload: {
                                                                service: 'semaphore',
                                                                item: {
                                                                    searchString
                                                                },
                                                            },
                                                        }).then((res) => {
                                                            if (cancelled !== true) {
                                                                const json_response = res.analysis.result.tags;
                                                                const result_data = res.analysis;
                                            
                                                                const result = toClientFormat(json_response).toArray();
    
                                                                const withoutExistingTags = result.filter(
                                                                  (searchTag) => !tagAlreadyExists(data, searchTag.qcode)
                                                                );
                                                                
                                                                const withResponse = withoutExistingTags.map((tag) => ({
                                                                  keyValue: tag.name, // required for Autocomplete component
                                                                  tag,
                                                                  entireResponse: result_data, // required to get all parents when an item is selected
                                                                }));
                                                            
                                                                callback(withResponse); // Assuming 'callback' is a function that takes the processed data
                                                              }
                                                            })
                                                            .catch(error => {
                                                              console.error('Error during fetch request:', error);
                                                              // Handle the error, for example, by calling an error callback
                                                            });
                                                        return {
                                                            cancel: () => {
                                                                cancelled = true;
                                                            },
                                                        };
                                                    }}
                                                    listItemTemplate={(__item: any) => {
                                                        const _item: ITagUi = __item.tag;

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
                                                        const tag: ITagUi = _value.tag;
                                                        const entireResponse: IAutoTaggingSearchResult =
                                                            _value.entireResponse;
                                                        this.insertTagFromSearch(tag, data, entireResponse);
                                                    }}
                                                    onChange={
                                                        //do nothing
                                                        () => {}
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="form__row form__row--flex" style={{alignItems: 'center'}}>
                                            <Button
                                                aria-label="Add an entity"
                                                type="primary"
                                                size="small"
                                                shape="round"
                                                text={gettext('Add an entity')}
                                                disabled={readOnly}
                                                onClick={() => {
                                                    this.setState({
                                                        newItem: {
                                                            name: '',
                                                        },
                                                    });
                                                }}/>
                                        </div>
                                    </>
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
                                        description={readOnly ? undefined : gettext('Click "Run" to test Autotagger')}
                                    />
                                );
                            } else {
                                const {
                                    entitiesGroupedAndSorted,
                                    othersGrouped,
                                } = getAutoTaggingData(data, this.semaphoreFields);

                                const savedTags = data.original.analysis.keySeq().toSet();

                                let allGrouped = OrderedMap<string, JSX.Element>();

                                othersGrouped.forEach((tags, groupId) => {
                                    if (tags != null && groupId != null) {
                                        allGrouped = allGrouped.set(groupId,
                                            <ToggleBoxNext
                                                key={groupId}
                                                title={gettext('Subjects')}
                                                style="circle"
                                                isOpen={true}
                                            >
                                                <TagListComponent
                                                    savedTags={savedTags}
                                                    tags={tags.toMap()}
                                                    readOnly={readOnly}
                                                    // array of qcodes are ids of tags to remove
                                                    onRemove={(ids) => {
                                                        this.updateTags(
                                                            ids.reduce(
                                                                (analysis, id) => analysis.remove(id),
                                                                data.changes.analysis,
                                                            ),
                                                            data,
                                                        );
                                                    }}
                                                />
                                            </ToggleBoxNext>,
                                        );
                                    }
                                });
                                //  renders the tags in the entities group in the widget window
                                if (entitiesGroupedAndSorted.size > 0) {
                                    allGrouped = allGrouped.set('entities',
                                        <ToggleBoxNext
                                            title={gettext('Entities')}
                                            style="circle"
                                            isOpen={true}
                                            key="entities"
                                        >
                                            {entitiesGroupedAndSorted.map((tags, key) => (
                                                <div key={key}>
                                                    <div
                                                        className="form-label"
                                                        style={{display: 'block', marginBottom: '5px', marginTop: '10px' }}
                                                    >
                                                        {groupLabels.get(key).plural}
                                                    </div>
                                                    <TagListComponent
                                                        savedTags={savedTags}
                                                        tags={tags.toMap()}
                                                        readOnly={readOnly}
                                                        onRemove={(ids) => {
                                                            this.updateTags(
                                                                ids.reduce(
                                                                    (analysis, id) => analysis.remove(id),
                                                                    data.changes.analysis,
                                                                ),
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
                                    .filter((_, key) => hasConfig(key, this.semaphoreFields.others))
                                    .sortBy((_, key) => this.semaphoreFields.others[key].order,
                                        (a, b) => a - b);

                                const allGroupedAndSortedNotInConfig = allGrouped
                                    .filter((_, key) => !hasConfig(key, this.semaphoreFields.others));

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
                                            aria-label="Run"
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
                                            aria-label="Refresh"
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
