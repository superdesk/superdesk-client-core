import {sdApi} from 'api';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IHighlight, IHighlightResponse} from 'superdesk-api';
import {Button, Modal} from 'superdesk-ui-framework/react';

interface IProps {
    closeModal(): void;
    article: IArticle;
}

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;
    availableHighlights: Array<IHighlight>;
    markedHighlights: Array<string>
}

type IState = IStateLoaded | IStateLoading;

export default class HighlightsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };
    }

    componentDidMount(): void {
        Promise.all([
            sdApi.highlights.fetchHighlights(),
            this.fetchArticleWithHighlights(),
        ]).then(([res1, res2]: [IHighlightResponse, any]) => {
            this.setState({
                initialized: true,
                availableHighlights: res1._items,
                markedHighlights: res2._items[0].highlights,
            });
        });
    }

    markHighlight(highlighId) {
        sdApi.highlights.markItem(highlighId, this.props.article._id).then((res) => {
            if (this.state.initialized) {
                this.setState({
                    ...this.state,
                    markedHighlights: [...this.state.markedHighlights, res.highlights],
                });
            }
        });
    }

    fetchArticleWithHighlights() {
        return httpRequestJsonLocal({
            method: 'GET',
            path: '/archive',
            urlParams: {
                auto: 0,
                es_highlight: 0,
                projections: ['highlights'],
                source: {
                    query: {
                        filtered: {
                            filter: {
                                and: [{not: {term: {state: 'spiked'}}},
                                    {
                                        not: {
                                            and: [
                                                {not: {exists: {field: 'task.desk'}}},
                                                {exists: {field: 'task.user'}},
                                                {not: {term: {'task.user': ng.get('session').identity._id}}},
                                            ],
                                        },
                                    }, {
                                        not: {term: {package_type: 'takes'}}}, {
                                        term: {'task.stage': '638a083940d7ff2038889bba'},
                                    },
                                ],
                            },
                        },
                    },
                    sort: [{versioncreated: 'desc'}], from: 0, size: 25,
                },
            },
        });
    }

    render() {
        if (!this.state.initialized) {
            return null;
        }

        const state = this.state;

        return (
            <Modal
                onHide={this.props.closeModal}
                zIndex={1050}
                size="small"
                visible
                headerTemplate={gettext('Highlights')}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {
                        state.availableHighlights.map((highlight) => {
                            return (
                                <Button
                                    key={highlight._id}
                                    type="primary"
                                    style={state.markedHighlights.includes(highlight._id) ? 'hollow' : 'filled'}
                                    onClick={() => this.markHighlight(highlight._id)}
                                    disabled={state.markedHighlights.includes(highlight._id)}
                                    text={highlight.name}
                                />
                            );
                        })
                    }
                </div>
            </Modal>
        );
    }
}
