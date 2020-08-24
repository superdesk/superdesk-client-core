import * as React from 'react';

import {IArticle, ISuperdesk} from 'superdesk-api';
import {getTagsListComponent} from './tag-list';

enum ITagGroup {
    organisation = 'organization',
    place = 'place',
    subject = 'subject',
}

export interface ITag {
    uuid: string;
    title: string;
    weight: number;
    media_topic: Array<any>;
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
    data: 'not-initialized' | 'loading' | {original: IAutoTaggingResponse; changes: IAutoTaggingResponse};
    newItem: Partial<ITag> | null;
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {httpRequestJsonLocal} = superdesk;
    const {gettext} = superdesk.localization;
    const {memoize, generatePatch} = superdesk.utilities;
    const {assertNever, notNullOrUndefined} = superdesk.helpers;

    const TagListComponent = getTagsListComponent(superdesk);

    function getGroupLabel(group: ITagGroup): string {
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

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        isDirty: (a: IAutoTaggingResponse, b: Partial<IAutoTaggingResponse>) => boolean;

        constructor(props: IProps) {
            super(props);

            this.state = {
                data: 'not-initialized',
                newItem: null,
            };

            this.runAnalysis = this.runAnalysis.bind(this);
            this.updateTags = this.updateTags.bind(this);
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
        render() {
            const {data} = this.state;

            return (
                <div>
                    <div>
                        <span>{label}</span>
                        <button
                            onClick={() => {
                                console.log('test');
                            }}
                        >
                            +
                        </button>
                    </div>

                    {(() => {
                        if (data === 'loading') {
                            return (
                                <div>{gettext('loading...')}</div>
                            );
                        } else if (data === 'not-initialized') {
                            return (
                                <button onClick={() => this.runAnalysis()}>
                                    {gettext('Run')}
                                </button>
                            );
                        } else {
                            const dirty = this.isDirty(data.original, data.changes);
                            const analysis = data.changes.analysis;
                            const groups = Object.values(ITagGroup)
                                .map((group) => {
                                    var items = analysis[group];

                                    if (items == null) {
                                        return null;
                                    } else {
                                        return {group, items: items};
                                    }
                                })
                                .filter(notNullOrUndefined);

                            return (
                                <div>
                                    {
                                        dirty === true ?
                                            (
                                                <div>
                                                    <button>{gettext('Save')}</button>
                                                    <button
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
                                            : null
                                    }

                                    {
                                        groups.map(({group, items}) => (
                                            <div key={group}>
                                                <h4>{getGroupLabel(group)}</h4>

                                                <TagListComponent
                                                    tags={items}
                                                    onChange={(tags) => {
                                                        this.updateTags({[group]: tags});
                                                    }}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                            );
                        }
                    })()}
                </div>
            );
        }
    };
}
