import * as React from 'react';

import {IArticle, ISuperdesk} from 'superdesk-api';
import {getTagsListComponent} from './tag-list';

export interface ITag {
    uuid: string;
    title: string;
    weight: number;
    media_topic: Array<any>;
}

interface IAutoTaggingResponse {
    analysis: {
        organisation?: Array<ITag>;
        place?: Array<ITag>;
        subject?: Array<ITag>;
    };
}

interface IProps {
    article: IArticle;
}

interface IState {
    data: 'not-initialized' | 'loading' | {original: IAutoTaggingResponse; changes: IAutoTaggingResponse};
}

export function getAutoTaggingComponent(superdesk: ISuperdesk, label: string) {
    const {httpRequestJsonLocal} = superdesk;
    const {gettext} = superdesk.localization;
    const {memoize, generatePatch} = superdesk.utilities;

    const TagListComponent = getTagsListComponent(superdesk);

    return class AutoTagging extends React.PureComponent<IProps, IState> {
        isDirty: (a: IAutoTaggingResponse, b: Partial<IAutoTaggingResponse>) => boolean;

        constructor(props: IProps) {
            super(props);

            this.state = {
                data: 'not-initialized',
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
        updateTags(tags: Partial<IAutoTaggingResponse['analysis']>) {
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
                                        analysis.subject == null ? null : (
                                            <div>
                                                <h4>{gettext('Organisation')}</h4>

                                                <TagListComponent
                                                    tags={analysis.subject}
                                                    onChange={(tags) => {
                                                        this.updateTags({subject: tags});
                                                    }}
                                                />
                                            </div>
                                        )
                                    }

                                    {
                                        analysis.place == null ? null : (
                                            <div>
                                                <h4>{gettext('Place')}</h4>

                                                <TagListComponent
                                                    tags={analysis.place}
                                                    onChange={(tags) => {
                                                        this.updateTags({place: tags});
                                                    }}
                                                />
                                            </div>
                                        )
                                    }

                                    {
                                        analysis.subject == null ? null : (
                                            <div>
                                                <h4>{gettext('Subject')}</h4>

                                                <TagListComponent
                                                    tags={analysis.subject}
                                                    onChange={(tags) => {
                                                        this.updateTags({subject: tags});
                                                    }}
                                                />
                                            </div>
                                        )
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
