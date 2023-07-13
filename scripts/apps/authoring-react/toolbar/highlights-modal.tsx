import React from 'react';
import {IArticle, IHighlight, IHighlightResponse} from 'superdesk-api';
import {Button, Modal, MultiSelect} from 'superdesk-ui-framework/react';
import {dispatchInternalEvent} from 'core/internal-events';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {isEqual} from 'lodash';
import {sdApi} from 'api';

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

export class HighlightsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.markHighlights = this.markHighlights.bind(this);
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

    componentDidMount(): void {
        Promise.all([
            sdApi.highlights.fetchHighlights(),
            sdApi.article.get(this.props.article._id),
        ]).then(([highlightResponse, article]: [IHighlightResponse, IArticle]) => {
            this.setState({
                initialized: true,
                availableHighlights: highlightResponse._items,
                markedHighlights: article.highlights,
            });
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
                        label=""
                        inlineLabel
                        labelHidden
                        onChange={(value) => {
                            this.setState({
                                ...state,
                                markedHighlights: value.map(({_id}) => _id),
                            });
                        }}
                        optionLabel={(option) => option.name}
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
