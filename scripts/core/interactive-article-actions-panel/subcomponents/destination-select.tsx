import React from 'react';
import {IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {OrderedMap} from 'immutable';
import {assertNever} from 'core/helpers/typescript-helpers';
import {sdApi} from 'api';
import {FormLabel, Button} from 'superdesk-ui-framework/react';
import {ISendToDestination} from '../interfaces';
import {SelectFilterableNoLabels} from 'core/ui/components/select-filterable-no-labels';

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

        return (
            <div>
                <div style={{paddingTop: 5}}>
                    <SelectFilterableNoLabels
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
                            if (val.id === PERSONAL_SPACE) {
                                this.props.onChange({
                                    type: 'personal-space',
                                });
                            } else {
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
                    />
                </div>

                {
                    (selectedDestination.type === 'desk' && this.props.hideStages !== true) && (
                        <div>
                            <br />

                            <FormLabel text={gettext('Stage')} />

                            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 5}}>
                                {
                                    sdApi.desks.getDeskStages(selectedDestination.desk).map((stage) => (
                                        <div key={stage._id} style={{flexBasis: 'calc((100% - 10px) / 2)'}}>
                                            <Button
                                                text={stage.name}
                                                disabled={(this.props.disallowedStages ?? []).includes(stage._id)}
                                                onClick={() => {
                                                    this.props.onChange({
                                                        ...selectedDestination,
                                                        stage: stage._id,
                                                    });
                                                }}
                                                type={
                                                    selectedDestination.stage === stage._id
                                                        ? 'primary'
                                                        : 'default'
                                                }
                                                expand
                                                icon={selectedDestination.stage === stage._id ? 'ok' : undefined}
                                            />
                                        </div>
                                    )).toArray()
                                }
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }
}
