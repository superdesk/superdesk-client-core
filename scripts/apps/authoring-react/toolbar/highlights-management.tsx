import React from 'react';
import {IArticle, IHighlight} from 'superdesk-api';
import {dispatchInternalEvent} from 'core/internal-events';
import {Button, Heading, IconButton, Text} from 'superdesk-ui-framework/react';
import {Card} from 'core/ui/components/Card';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

interface IProps {
    article: IArticle;
    close(): void;
}

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;
    selectedHighlighIds: Array<IHighlight> | null;
}

type IState = IStateLoaded | IStateLoading;

export class HighlightsCardContent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.unmarkHighlight = this.unmarkHighlight.bind(this);
    }

    unmarkHighlight(highlightId: string): void {
        if (this.state.initialized) {
            const filteredHighlights = this.state.selectedHighlighIds
                .filter(({_id}) => _id !== highlightId)
                .map(({_id}) => _id);

            sdApi.highlights.markItem(filteredHighlights, this.props.article._id).then(() => {
                dispatchInternalEvent('dangerouslyForceReloadAuthoring', undefined);
            });
        }
    }

    componentDidMount(): void {
        sdApi.highlights.fetchHighlights().then((res) => {
            this.setState({
                ...this.state,
                initialized: true,
                selectedHighlighIds: res._items
                    .filter((highlight) => this.props.article.highlights.includes(highlight._id)),
            });
        });
    }

    render(): React.ReactNode {
        const state = this.state;

        if (!state.initialized) {
            return null;
        }

        return (
            <Card
                background="#000000"
            >
                <Spacer v gap="16">
                    <Spacer h gap="64" noGrow>
                        <Heading color="lighter" type="h5">
                            {gettext('Marked for')}
                        </Heading>
                        <IconButton
                            onClick={this.props.close}
                            icon="close-small"
                            ariaValue={gettext('Close')}
                        />
                    </Spacer>
                    {
                        state.selectedHighlighIds.map(({name, _id}) => (
                            <Spacer gap="32" h key={_id} justifyContent="space-between" noGrow>
                                <Text size="small" color="lighter">{name}</Text>
                                <Button
                                    size="small"
                                    style="hollow"
                                    type="primary"
                                    text={gettext('Remove')}
                                    onClick={() => this.unmarkHighlight(_id)}
                                />
                            </Spacer>
                        ))
                    }
                </Spacer>
            </Card>
        );
    }
}
