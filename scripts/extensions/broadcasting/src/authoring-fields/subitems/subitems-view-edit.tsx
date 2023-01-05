import * as React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {IconButton, Input, FormLabel, Alert} from 'superdesk-ui-framework/react';
import {Map} from 'immutable';
import {ISubitem} from '.';
import {RUNDOWN_SUBITEM_TYPES} from '../../constants';

import {superdesk} from '../../superdesk';
import {SubitemLabel} from './subitem-label';

const {vocabulary} = superdesk.entities;
const {gettext} = superdesk.localization;
const {Editor3Html, Spacer, SpacerBlock} = superdesk.components;

interface IPropsEditable {
    readOnly: false;
    subitems: Array<ISubitem>;
    onChange(val: Array<ISubitem>): void;
}

interface IPropsReadOnly {
    readOnly: true;
    subitems: Array<ISubitem>;
}

type IProps = IPropsEditable | IPropsReadOnly;

export class SubitemsViewEdit extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.patchSubitem = this.patchSubitem.bind(this);
    }

    private patchSubitem(qcode: string, patch: Partial<ISubitem>): Array<ISubitem> {
        return this.props.subitems.map((item) => {
            if (item.qcode === qcode) {
                return {
                    ...item,
                    ...patch,
                };
            } else {
                return item;
            }
        });
    }

    render() {
        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
        );

        const {subitems} = this.props;

        return (
            <>
                {
                    subitems.length > 0
                        ? (
                            <Spacer v gap="32">
                                {
                                    subitems.map((subitem) => (
                                        <div key={subitem.qcode}>
                                            <Spacer h gap="4" justifyContent="space-between" noGrow>
                                                <div>
                                                    <SubitemLabel
                                                        subitem={subitemTypes.find(
                                                            (item) => item?.qcode === subitem.qcode,
                                                        )}
                                                    />
                                                </div>

                                                {
                                                    !this.props.readOnly && (() => {
                                                        const {onChange} = this.props;

                                                        return (
                                                            <span className="text-red--600">
                                                                <IconButton
                                                                    icon="remove-sign"
                                                                    ariaValue={gettext('Remove')}
                                                                    onClick={() => {
                                                                        onChange(
                                                                            subitems.filter(
                                                                                ({qcode}) => qcode !== subitem.qcode,
                                                                            ),
                                                                        );
                                                                    }}
                                                                />
                                                            </span>
                                                        );
                                                    })()
                                                }
                                            </Spacer>

                                            <SpacerBlock v gap="16" />

                                            <Spacer v gap="16" style={{paddingLeft: 20}} noWrap>
                                                <div style={{width: '100%'}}>
                                                    <Input
                                                        label={gettext('Technical information')}
                                                        type="text"
                                                        value={subitem.technical_info}
                                                        onChange={(val) => {
                                                            if (!this.props.readOnly) {
                                                                this.props.onChange(
                                                                    this.patchSubitem(
                                                                        subitem.qcode,
                                                                        {technical_info: val},
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                        disabled={this.props.readOnly}
                                                    />
                                                </div>

                                                <div style={{width: '100%'}}>
                                                    <FormLabel text={gettext('Content')} />

                                                    <Editor3Html
                                                        value={subitem.content}
                                                        onChange={(val) => {
                                                            if (!this.props.readOnly) {
                                                                this.props.onChange(
                                                                    this.patchSubitem(subitem.qcode, {content: val}),
                                                                );
                                                            }
                                                        }}
                                                        readOnly={this.props.readOnly}
                                                    />
                                                </div>
                                            </Spacer>
                                        </div>
                                    ))
                                }
                            </Spacer>
                        )
                        : (
                            <Alert size="small" margin="none">
                                {gettext('No subitems')}
                            </Alert>
                        )
                }
            </>
        );
    }
}
