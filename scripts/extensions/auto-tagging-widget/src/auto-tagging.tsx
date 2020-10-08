import * as React from 'react';

import {IArticle, ISuperdesk} from 'superdesk-api';
import {getTagsListComponent} from './tag-list';
import {getNewItemComponent} from './new-item';

import {Switch, Button, ButtonGroup} from 'superdesk-ui-framework/react';
import {ToggleBoxNext} from 'superdesk-ui-framework';

export enum ITagGroup {
    organisation = 'organisation',
    place = 'place',
    subject = 'subject',
}

export interface ITag {
    uuid: string;
    title: string;
    weight: number;
    media_topic: Array<any>;
}

export interface INewItem {
    title: string;
    group: ITagGroup;
}

type IAnalysisFields = {
    [key in ITagGroup]?: Array<ITag>;
};

interface IAutoTaggingResponse {
    analysis: IAnalysisFields;
}

interface IProps {
    article: IArticle;
}

interface IState {
    runAutomaticallyPreference: boolean | 'loading';
    data: 'not-initialized' | 'loading' | { original: IAutoTaggingResponse; changes: IAutoTaggingResponse };
    newItem: Partial<INewItem> | null;
}

const RUN_AUTOMATICALLY_PREFERENCE = 'run_automatically';

export function getGroupLabel(group: ITagGroup, superdesk: ISuperdesk): string {
    const {gettext} = superdesk.localization;
    const {assertNever} = superdesk.helpers;

    if (group === ITagGroup.organisation) {
        return gettext('Organisation');
    } else if (group === ITagGroup.place) {
        return gettext('Place');
    } else if (group === ITagGroup.subject) {
        return gettext('Subject');
    } else {
        return assertNever(group);
    }
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {httpRequestJsonLocal, preferences} = superdesk;
    const {gettext} = superdesk.localization;
    const {memoize, generatePatch} = superdesk.utilities;
    const {notNullOrUndefined} = superdesk.helpers;

    const TagListComponent = getTagsListComponent(superdesk);
    const NewItemComponent = getNewItemComponent(superdesk);

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        isDirty: (a: IAutoTaggingResponse, b: Partial<IAutoTaggingResponse>) => boolean;

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
            this.isDirty = memoize((a, b) => Object.keys(generatePatch(a, b)).length > 0);
        }
        runAnalysis() {
            this.setState({data: 'loading'}, () => {
                httpRequestJsonLocal<IAutoTaggingResponse>({
                    method: 'POST',
                    path: '/ai/',
                    payload: {
                        service: 'imatrics',
                        item_id: this.props.article._id,
                    },
                }).then((res) => {
                    this.setState({
                        data: {original: res, changes: res},
                    });
                });
            });
        }
        updateTags(tags: Partial<IAnalysisFields>) {
            const {data} = this.state;

            if (data === 'loading' || data === 'not-initialized') {
                return;
            }

            const {changes} = data;

            this.setState({
                data: {
                    ...data,
                    changes: {
                        ...changes,
                        analysis: {
                            ...changes.analysis,
                            ...tags,
                        },
                    },
                },
            });
        }
        createNewTag(newItem: INewItem, changes: IAutoTaggingResponse) {
            const tag: ITag = {
                uuid: Math.random().toString(),
                title: newItem.title,
                weight: 1,
                media_topic: [],
            };

            this.updateTags({
                [newItem.group]: (changes.analysis[newItem.group] ?? []).concat(tag),
            });

            this.setState({newItem: null});
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
                            data === 'loading' || data === 'not-initialized' ? null : (
                                dirty === true ?
                                    (<div className="widget__sliding-toolbar widget__sliding-toolbar--right">
                                        <button className="btn btn--primary">{gettext('Save')}</button>
                                        <button className="btn"
                                            onClick={() => this.setState({
                                                data: {
                                                    ...data,
                                                    changes: data.original,
                                                },
                                            })}>
                                            {gettext('Cancel')}
                                        </button>
                                    </div>)
                                    : null
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
                                                onClick={() => this.setState({newItem: {}})} />
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
                                const analysis = data.changes.analysis;
                                const groups = Object.values(ITagGroup)
                                    .map((group) => {
                                        var items = analysis[group];

                                        if (items == null || items.length < 1) {
                                            return null;
                                        } else {
                                            return {group, items: items};
                                        }
                                    })
                                    .filter(notNullOrUndefined);

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
                                                        this.createNewTag(newItem, data.changes);
                                                    }}
                                                    cancel={() => {
                                                        this.setState({newItem: null});
                                                    }}
                                                />
                                            )
                                        }
                                        <div className="widget-content__main">
                                            {
                                                groups.map(({group, items}) => (
                                                    <ToggleBoxNext key={group}
                                                        title={getGroupLabel(group, superdesk)}
                                                        style="circle" isOpen={true}>
                                                        <TagListComponent
                                                            tags={items}
                                                            onChange={(tags) => {
                                                                this.updateTags({[group]: tags});
                                                            }}
                                                        />
                                                    </ToggleBoxNext>
                                                ))
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
