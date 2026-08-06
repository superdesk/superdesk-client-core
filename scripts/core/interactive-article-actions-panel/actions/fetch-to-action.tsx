import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ButtonGroup, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {getInitialDestination} from '../utils/get-initial-destination';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {sdApi} from 'api';
import {noop} from 'lodash';
import {assertNever} from 'core/helpers/typescript-helpers';

export interface IFetchToConfig {
    items: Array<IArticle>;
    closeFetchToView(): void;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

interface IState {
    selectedDestination: ISendToDestination;
}

interface IRenderArgs {
    body: JSX.Element;
    footer: JSX.Element;
}

interface IProps extends IFetchToConfig {
    children(args: IRenderArgs): JSX.Element;
}

export function canFetchToDestination(destination: ISendToDestination): boolean {
    if (destination.type === 'personal-space') {
        throw new Error('fetching to personal space is not supported');
    } else if (destination.type === 'desk') {
        const destinationStage = sdApi.desks.getDeskStages(destination.desk).get(destination.stage);

        // an unresolvable stage (desks store still loading, or a desk the user can not see) can
        // not be shown to be visible, so it falls back to the desk membership check
        if (destinationStage?.is_visible === true) {
            return true;
        } else {
            return sdApi.desks.getCurrentUserDesks()
                .map(({_id}) => _id)
                .includes(destination.desk);
        }
    } else {
        return assertNever(destination);
    }
}

/**
 * Fetch To action - provides body and footer as render props.
 * This allows the parent to compose them into either the standalone panel or widget layout.
 */
export class FetchToAction extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDestination: getInitialDestination(props.items, false),
        };

        this.fetchItems = this.fetchItems.bind(this);
    }

    fetchItems(openAfterFetching?: boolean) {
        if (this.state.selectedDestination.type === 'desk') { // personal space not supported
            sdApi.article.fetchItems(this.props.items, this.state.selectedDestination)
                .then((res) => {
                    this.props.closeFetchToView();

                    if (openAfterFetching) {
                        openArticle(res[0]._id, 'edit');
                    }
                })
                .catch(noop);
        }
    }

    render() {
        const canFetch: boolean = canFetchToDestination(this.state.selectedDestination);

        const body = (
            <ToggleBox variant="simple" title={gettext('Destination')} initiallyOpen>
                <DestinationSelect
                    value={this.state.selectedDestination}
                    onChange={(value) => {
                        this.setState({
                            selectedDestination: value,
                        });
                    }}
                    includePersonalSpace={false}
                />
            </ToggleBox>
        );

        const footer = (
            <ButtonGroup orientation="vertical">
                {
                    this.props.items.length === 1 && (
                        <Button
                            text={gettext('Fetch and open')}
                            onClick={() => {
                                this.fetchItems(true);
                            }}
                            size="large"
                            type="primary"
                            style="hollow"
                            expand
                            data-test-id="fetch-and-open"
                            disabled={!canFetch}
                        />
                    )
                }

                <Button
                    text={gettext('Fetch')}
                    onClick={() => {
                        this.fetchItems();
                    }}
                    size="large"
                    type="primary"
                    expand
                    data-test-id="fetch"
                    disabled={!canFetch}
                />
            </ButtonGroup>
        );

        return this.props.children({body, footer});
    }
}
