import React from 'react';
import {IDesk, IStage, IArticle} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {desks} from 'api/desks';
import {Select, Option, Button, ToggleBox} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {PanelContent} from './panel/panel-content';
import {PanelFooter} from './panel/panel-footer';
import {applicationState, openArticle} from 'core/get-superdesk-api-implementation';
import {dispatchInternalEvent} from 'core/internal-events';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    markupV2: boolean;
}

interface IState {
    allDesks: OrderedMap<IDesk['_id'], IDesk>;
    stagesForDesk: OrderedMap<IStage['_id'], IStage>;
    selectedDesk: IDesk['_id'];
    selectedStage: IStage['_id'];
}

function sendItems(items: Array<IArticle>, deskId: IDesk['_id'], stageId: IStage['_id']): Promise<void> {
    return Promise.all(
        items.map((item) => {
            return httpRequestJsonLocal({
                method: 'POST',
                path: `/archive/${item._id}/move`,
                payload: {
                    'task': {
                        'desk': deskId,
                        'stage': stageId,
                    },
                },
            });
        }),
    ).then((patches: Array<Partial<IArticle>>) => {
        /**
         * Patch articles that are open in authoring.
         * Otherwise authors may see out of date data
         * and/or get an _etag mismatch error.
         */
        for (const patch of patches) {
            dispatchInternalEvent(
                'dangerouslyOverwriteAuthoringData',
                patch,
            );
        }
    });
}

// TODO: ensure https://github.com/superdesk/superdesk-ui-framework/issues/574 is fixed before merging to develop
export class SendToTab extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const allDesks = desks.getAllDesks();
        const selectedDesk = allDesks.first();
        const stagesForDesk = desks.getDeskStages(selectedDesk._id);

        this.state = {
            allDesks,
            stagesForDesk,
            selectedDesk: selectedDesk._id,
            selectedStage: stagesForDesk.first()._id,
        };
    }
    render() {
        const {items, closeSendToView, markupV2} = this.props;
        const {allDesks, stagesForDesk} = this.state;
        const itemToOpen: IArticle['_id'] | null = (() => {
            if (items.length !== 1) {
                return null;
            }

            const item = items[0];

            if (item._id !== applicationState.articleInEditMode) {
                return item._id;
            } else {
                return null;
            }
        })();

        return (
            <React.Fragment>
                <PanelContent markupV2={markupV2}>
                    <ToggleBox title={gettext('Destination')} initiallyOpen>
                        <Select
                            label={'Desk'}
                            onChange={(value) => {
                                const nextStages = desks.getDeskStages(value);

                                this.setState({
                                    selectedDesk: value,
                                    stagesForDesk: desks.getDeskStages(value),
                                    selectedStage: nextStages.first()._id,
                                });
                            }}
                            value={this.state.selectedDesk}
                        >
                            {
                                allDesks.map((desk) => (
                                    <Option key={desk._id} value={desk._id}>{desk.name}</Option>
                                )).toArray()
                            }
                        </Select>

                        <br />

                        <Select
                            label={'Stage'}
                            onChange={(value) => {
                                this.setState({selectedStage: value});
                            }}
                            value={this.state.selectedStage}
                        >
                            {
                                stagesForDesk.map((stage) => (
                                    <Option key={stage._id} value={stage._id}>{stage.name}</Option>
                                )).toArray()
                            }
                        </Select>
                    </ToggleBox>
                </PanelContent>

                <PanelFooter markupV2={markupV2}>
                    {
                        itemToOpen && (
                            <Button
                                text={gettext('Send and open')}
                                onClick={() => {
                                    sendItems(this.props.items, this.state.selectedDesk, this.state.selectedStage)
                                        .then(() => {
                                            closeSendToView();
                                            openArticle(itemToOpen, 'edit');
                                        });
                                }}
                                size="large"
                                type="primary"
                                expand
                            />
                        )
                    }
                    <Button
                        text={gettext('Send')}
                        onClick={() => {
                            sendItems(this.props.items, this.state.selectedDesk, this.state.selectedStage).then(() => {
                                closeSendToView();
                            });
                        }}
                        size="large"
                        type="primary"
                        expand
                    />
                </PanelFooter>
            </React.Fragment>
        );
    }
}
