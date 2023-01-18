import {sdApi} from 'api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {dispatchInternalEvent} from 'core/internal-events';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {isEqual} from 'lodash';
import React from 'react';
import {IArticle, IHighlight, IHighlightResponse} from 'superdesk-api';
import {Button, Modal, MultiSelect} from 'superdesk-ui-framework/react';

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
    isSaving: boolean;
}

type IState = IStateLoaded | IStateLoading;

export default class HighlightsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.markHighlights = this.markHighlights.bind(this);
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

    markHighlights(): void {
        if (this.state.initialized) {
            this.setState({...this.state, isSaving: true});
            sdApi.highlights.markItem(this.state.markedHighlights, this.props.article._id).then(() => {
                this.props.closeModal();
                dispatchInternalEvent('dangerouslyForceReloadAuthoring', undefined);
            });
        }
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
                <Spacer v gap="16">
                    <MultiSelect
                        onChange={(value: any) => {
                            this.setState({
                                ...state,
                                markedHighlights: value.value.map(({_id}) => _id),
                            });
                        }}
                        optionLabel="name"
                        options={state.availableHighlights}
                        value={state.availableHighlights.filter(({_id}) => state.markedHighlights?.includes(_id))}
                    />
                    <Spacer h gap="16" justifyContent="end" noWrap>
                        <Button
                            onClick={this.props.closeModal}
                            text={gettext('Cancel')}
                        />
                        <Button
                            disabled={isEqual(this.props.article.highlights, state.markedHighlights)}
                            onClick={this.markHighlights}
                            text={gettext('Save')}
                            type="primary"
                            isLoading={this.state.isSaving}
                        />
                    </Spacer>
                </Spacer>
            </Modal>
        );
    }
}
