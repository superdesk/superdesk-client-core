import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, ButtonGroup, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {sdApi} from 'api';
import {getInitialDestination} from '../utils/get-initial-destination';
import {canSendToPersonal} from '../utils/can-send-to-personal';
import {DestinationSelect} from '../subcomponents/destination-select';
import {ISendToDestination} from '../interfaces';

export interface IDuplicateToConfig {
    items: Array<IArticle>;
    closeDuplicateToView(): void;
}

interface IState {
    selectedDestination: ISendToDestination;
}

interface IRenderArgs {
    body: JSX.Element;
    footer: JSX.Element;
}

interface IProps extends IDuplicateToConfig {
    children(args: IRenderArgs): JSX.Element;
}

/**
 * Duplicate To action - provides body and footer as render props.
 * This allows the parent to compose them into either the standalone panel or widget layout.
 */
export class DuplicateToAction extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDestination: getInitialDestination(props.items, canSendToPersonal(props.items)),
        };

        this.duplicateItems = this.duplicateItems.bind(this);
    }

    duplicateItems(openAfterDuplicating?: boolean) {
        const {selectedDestination} = this.state;
        const {closeDuplicateToView, items} = this.props;

        sdApi.article.duplicateItems(items.map(({_id}) => _id), selectedDestination).then((res) => {
            closeDuplicateToView();

            if (openAfterDuplicating) {
                openArticle(res[0]._id, 'edit');
            }
        });
    }

    render() {
        const {items} = this.props;

        const body = (
            <ToggleBox variant="simple" title={gettext('Destination')} initiallyOpen>
                <DestinationSelect
                    value={this.state.selectedDestination}
                    onChange={(value) => {
                        this.setState({
                            selectedDestination: value,
                        });
                    }}
                    includePersonalSpace={canSendToPersonal(items)}
                />
            </ToggleBox>
        );

        const footer = (
            <ButtonGroup orientation="vertical">
                {
                    this.props.items.length === 1 && (
                        <Button
                            text={gettext('Duplicate and open')}
                            onClick={() => {
                                this.duplicateItems(true);
                            }}
                            size="large"
                            type="primary"
                            expand
                            data-test-id="duplicate-and-open"
                        />
                    )
                }
                <Button
                    text={gettext('Duplicate')}
                    onClick={() => {
                        this.duplicateItems();
                    }}
                    size="large"
                    type="primary"
                    expand
                    data-test-id="duplicate"
                />
            </ButtonGroup>
        );

        return this.props.children({body, footer});
    }
}
