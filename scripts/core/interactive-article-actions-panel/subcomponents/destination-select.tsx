import React from 'react';
import {IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {OrderedMap} from 'immutable';
import {assertNever} from 'core/helpers/typescript-helpers';
import {sdApi} from 'api';
import {FormLabel, RadioButtonGroup} from 'superdesk-ui-framework/react';
import {ISendToDestination} from '../interfaces';
import {SelectFilterable} from 'core/ui/components/select-filterable';

interface IProps {
    value: ISendToDestination;
    onChange(value: ISendToDestination): void;
    includePersonalSpace: boolean;
    disallowedStages?: Array<IStage['_id']>;
    hideStages?: boolean;

    // Defaults to all desks
    availableDesks?: OrderedMap<string, IDesk>;
}

const PERSONAL_SPACE = 'PERSONAL_SPACE';

export class DestinationSelect extends React.PureComponent<IProps> {
    render() {
        const selectedDestination = this.props.value;
        const destinationPersonalSpace: {id: string; label: string} = {
            id: PERSONAL_SPACE, label: gettext('Personal space'),
        };

        const allDesks = this.props.availableDesks ?? sdApi.desks.getAllDesks();
        let destinations: Array<{id: string; label: string}> =
            allDesks.toArray().map((desk) => ({id: desk._id, label: desk.name}));

        if (this.props.includePersonalSpace) {
            destinations.push(destinationPersonalSpace);
        }

        const userDesksIds: Set<IDesk['_id']> = new Set(sdApi.desks.getCurrentUserDesks().map(({_id}) => _id));

        return (
            <div>
                <div style={{paddingTop: 5}}>
                    <SelectFilterable
                        value={(() => {
                            const dest = selectedDestination;

                            if (dest.type === 'personal-space') {
                                return destinationPersonalSpace;
                            } else if (dest.type === 'desk') {
                                const destinationDesk: {id: string; label: string} = {
                                    id: dest.desk,
                                    label: allDesks.find((desk) => desk._id === dest.desk).name,
                                };

                                return destinationDesk;
                            } else {
                                assertNever(dest);
                            }
                        })()}
                        items={destinations}
                        onChange={(val) => {
                            if (val != null && val.id === PERSONAL_SPACE) {
                                this.props.onChange({
                                    type: 'personal-space',
                                });
                            } else if (val != null) {
                                const deskId: IDesk['_id'] = val.id;
                                const nextStages = sdApi.desks.getDeskStages(deskId);

                                this.props.onChange({
                                    type: 'desk',
                                    desk: deskId,
                                    stage: nextStages.first()._id,
                                });
                            }
                        }}
                        getLabel={(destination) => destination.label}
                        required
                        data-test-id="destination-select"
                    />
                </div>
                {
                    (selectedDestination.type === 'desk' && this.props.hideStages !== true) && (
                        <div>
                            <br />
                            <FormLabel text={gettext('Stage')} />
                            <RadioButtonGroup
                                onChange={
                                    (stageId) => this.props.onChange({
                                        ...selectedDestination,
                                        stage: stageId,
                                    })
                                }
                                value={selectedDestination.stage}
                                group={{
                                    grid: true,
                                    padded: false,
                                    orientation: 'horizontal',
                                }}
                                options={
                                    sdApi.desks.getDeskStages(selectedDestination.desk).toArray()
                                        .filter((stage) => {
                                            if (stage.is_visible === true) {
                                                return true;
                                            } else {
                                                return userDesksIds.has(selectedDestination.desk);
                                            }
                                        })
                                        .map((stage) => ({
                                            label: stage.name,
                                            value: stage._id,
                                            icon: 'ok',
                                            disabled: (this.props.disallowedStages ?? []).includes(stage._id),
                                        }))
                                }
                                data-test-id="stage-select"
                            />
                        </div>
                    )
                }
            </div>
        );
    }
}
