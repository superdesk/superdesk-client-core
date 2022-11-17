import * as React from 'react';
import {
    IEditorComponentProps, IVocabularyItem,
} from 'superdesk-api';
import {Dropdown, IconButton} from 'superdesk-ui-framework/react';
import {Map} from 'immutable';
import {ISubitemsValueOperational, ISubitemsFieldConfig, ISubitemsUserPreferences} from '.';
import {RUNDOWN_SUBITEM_TYPES} from '../../constants';

import {superdesk} from '../../superdesk';
import {noop} from 'lodash';
import {SubitemsViewEdit} from './subitems-view-edit';

const {vocabulary} = superdesk.entities;
const {gettext} = superdesk.localization;

type IProps = IEditorComponentProps<ISubitemsValueOperational, ISubitemsFieldConfig, ISubitemsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
        );

        const miniToolbar = (
            <Dropdown
                items={[{
                    type: 'group',
                    items: subitemTypes
                        .filter(({qcode}) => (this.props.value ?? []).find((item) => item.qcode === qcode) == null)
                        .map(({name, qcode}) => ({
                            label: name,
                            onSelect: () => {
                                this.props.onChange(
                                    (this.props.value ?? []).concat({
                                        qcode: qcode,
                                        technical_info: '',
                                        content: '',
                                    }),
                                );
                            },
                        })).toArray(),
                }]}
            >
                <IconButton
                    icon="plus-sign"
                    onClick={noop}
                    ariaValue={gettext('Add')}
                />
            </Dropdown>
        );

        return (
            <Container miniToolbar={miniToolbar}>
                <SubitemsViewEdit
                    subitems={this.props.value ?? []}
                    onChange={(val) => this.props.onChange(val)}
                    readOnly={false}
                />
            </Container>
        );
    }
}
