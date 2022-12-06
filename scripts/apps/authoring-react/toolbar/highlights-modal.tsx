import {sdApi} from 'api';
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
    availableHighlights: Array<IHighlight> | null;
    markedHighlights: Array<string> | null;
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
        ]).then(([highlightResponse, article]: [IHighlightResponse, IArticle]) => {
            this.setState({
                initialized: true,
                availableHighlights: highlightResponse._items,
                markedHighlights: article.highlights,
            });
        });
    }

    markHighlight(highlighId: string): void {
        sdApi.highlights.markItem(highlighId, this.props.article._id).then((res) => {
            if (this.state.initialized && this.state.markedHighlights != null) {
                this.setState({
                    ...this.state,
                    markedHighlights: [...this.state.markedHighlights, res.highlights],
                });
            } else if (this.state.initialized) {
                this.setState({
                    ...this.state,
                    markedHighlights: res.highlights,
                });
            }
        });
    }

    fetchArticleWithHighlights(): Promise<IArticle> {
        return httpRequestJsonLocal<IArticle>({
            method: 'GET',
            path: `/archive/${this.props.article._id}`,
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
                        state.availableHighlights?.map((highlight) => {
                            return (
                                <Button
                                    key={highlight._id}
                                    type="primary"
                                    style={state.markedHighlights?.includes(highlight._id) ? 'hollow' : 'filled'}
                                    onClick={() => this.markHighlight(highlight._id)}
                                    disabled={state.markedHighlights?.includes(highlight._id)}
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
