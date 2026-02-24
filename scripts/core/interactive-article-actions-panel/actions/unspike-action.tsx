import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {getInitialDestination} from '../utils/get-initial-destination';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';
import {sdApi} from 'api';

export interface IUnspikeConfig {
    items: Array<IArticle>;
    closeUnspikeView(): void;
}

interface IState {
    selectedDestination: ISendToDestination;
}

interface IRenderArgs {
    body: JSX.Element;
    footer: JSX.Element;
}

interface IProps extends IUnspikeConfig {
    children(args: IRenderArgs): JSX.Element;
}

/**
 * Unspike action - provides body and footer as render props.
 * This allows the parent to compose them into either the standalone panel or widget layout.
 */
export class UnspikeAction extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDestination: getInitialDestination(props.items, false),
        };

        this.doUnspike = this.doUnspike.bind(this);
    }

    doUnspike() {
        const {selectedDestination} = this.state;

        if (selectedDestination.type === 'desk') {
            Promise.all(
                this.props.items.map((item) => sdApi.article.doUnspike(
                    item,
                    selectedDestination.desk,
                    selectedDestination.stage,
                )),
            ).then(() => {
                this.props.closeUnspikeView();
            });
        }
    }

    render() {
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
            <Button
                text={gettext('Unspike')}
                onClick={() => {
                    this.doUnspike();
                }}
                size="large"
                type="primary"
                expand
                data-test-id="unspike"
            />
        );

        return this.props.children({body, footer});
    }
}
