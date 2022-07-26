import * as React from 'react';
import {Button, Label, IconLabel} from 'superdesk-ui-framework/react';
import {IRundownItemBase} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID, SHOW_PART_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
import {arrayMove} from '@superdesk/common';
import {ICreate, IEdit} from './template-edit';
const {vocabulary} = superdesk.entities;

const {gettext} = superdesk.localization;

interface IProps {
    items: Array<IRundownItemBase>;
    onChange(items: Array<IRundownItemBase>): void;
    createOrEdit: ICreate | IEdit | null;
    initiateCreation(): void;
    initiateEditing(item: IRundownItemBase): void;
    readOnly: boolean;
}

export class ManageRundownItems extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.reorder = this.reorder.bind(this);
    }

    reorder(from: number, to: number) {
        this.props.onChange(arrayMove(this.props.items, from, to));
    }

    render() {
        const {readOnly} = this.props;

        const showParts = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(SHOW_PART_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const rundownItemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_ITEM_TYPES_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        return (
            <div>
                {
                    this.props.items.map((item, i) => {
                        const showPart = item.show_part == null ? null : showParts.get(item.show_part);
                        const itemType = item.item_type == null ? null : rundownItemTypes.get(item.item_type);

                        return (
                            <div key={i} style={{padding: 4, margin: 4, border: '1px solid blue'}}>
                                {item.title}

                                {
                                    showPart != null && (
                                        <Label
                                            text={showPart.name}
                                            color={showPart.color}
                                        />
                                    )
                                }

                                {
                                    itemType != null && (
                                        <Label
                                            text={itemType.name}
                                            color={itemType.color}
                                        />
                                    )
                                }

                                {
                                    !readOnly && (
                                        <div>
                                            <button
                                                onClick={() => {
                                                    this.reorder(i, i - 1);
                                                }}
                                            >
                                                move up
                                            </button>

                                            <button
                                                onClick={() => {
                                                    this.reorder(i, i + 1);
                                                }}
                                            >
                                                move down
                                            </button>
                                        </div>
                                    )
                                }

                                {
                                    // TODO: show 3 letter show symbol
                                }

                                {
                                    item.planned_duration != null && (
                                        <IconLabel
                                            text={item.planned_duration.toString()}
                                            innerLabel={gettext('Planned duration')}
                                            icon="time"
                                            style="translucent"
                                            size="small"
                                        />
                                    )
                                }

                                {
                                    item.duration != null && (
                                        <IconLabel
                                            text={item.duration.toString()}
                                            innerLabel={gettext('Duration')}
                                            style="translucent"
                                            size="small"
                                            type={(() => {
                                                if (item.planned_duration == null) {
                                                    return 'success';
                                                } else if (item.duration > item.planned_duration) {
                                                    return 'alert';
                                                } else if (item.duration < item.planned_duration) {
                                                    return 'warning';
                                                } else {
                                                    return 'success';
                                                }
                                            })()}
                                        />
                                    )
                                }

                                {
                                    !readOnly && (
                                        <span onClick={() => this.props.initiateEditing(item)}>EDIT</span>
                                    )
                                }
                            </div>
                        );
                    })
                }

                {
                    !readOnly && (
                        <div>
                            <Button
                                type="primary"
                                size="small"
                                icon="plus-large"
                                text={gettext('New rundown item template')}
                                shape="round"
                                iconOnly={true}
                                disabled={this.props.createOrEdit != null}
                                onClick={() => {
                                    this.props.initiateCreation();
                                }}
                            />
                        </div>
                    )
                }
            </div>
        );
    }
}
