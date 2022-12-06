import {sdApi} from 'api';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IHighlight} from 'superdesk-api';
import {Button, Modal, MultiSelect, SimpleList, SimpleListItem} from 'superdesk-ui-framework/react';

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
        sdApi.highlights.fetchHighlights().then((res) => {
            this.setState({
                initialized: true,
                availableHighlights: res._items,
                markedHighlights: this.props.article.highlights,
            });
        });
    }

    markHighlight(highlighId) {
        sdApi.highlights.markItem(highlighId, this.props.article._id);
    }

    render() {
        if (!this.state.initialized) {
            return null;
        }

        const state = this.state;

        // TODO: Fix
        // article doesn't have highlights field available even if it actually has chosen highlights in the DB
        // from where do we get the article with all fields?
        const markedHighlightsFromAvailable = state.availableHighlights
            .filter((highlight) => this.props.article.highlights?.includes(highlight._id));

        return (
            <Modal
                onHide={this.props.closeModal}
                zIndex={1050}
                size="small"
                visible
                headerTemplate={gettext('Available highlights')}
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
                                    style={markedHighlightsFromAvailable.includes(highlight) ? 'hollow' : 'filled'}
                                    theme="light"
                                    onClick={() => this.markHighlight(highlight._id)}
                                    disabled={markedHighlightsFromAvailable.includes(highlight)}
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
