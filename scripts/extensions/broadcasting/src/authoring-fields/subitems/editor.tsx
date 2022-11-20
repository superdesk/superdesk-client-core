import * as React from 'react';
import {
    IEditorComponentProps, IVocabularyItem,
} from 'superdesk-api';
import {Alert, IconButton} from 'superdesk-ui-framework/react';
import {Map} from 'immutable';
import {ISubitemsValueOperational, ISubitemsFieldConfig, ISubitemsUserPreferences} from '.';
import {RUNDOWN_SUBITEM_TYPES} from '../../constants';

import {superdesk} from '../../superdesk';
import {SubitemsViewEdit} from './subitems-view-edit';
import {SubitemLabel} from './subitem-label';

const {vocabulary} = superdesk.entities;
const {gettext} = superdesk.localization;
const {showPopup, Card, Spacer} = superdesk.components;

type IProps = IEditorComponentProps<ISubitemsValueOperational, ISubitemsFieldConfig, ISubitemsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        const subitemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_SUBITEM_TYPES).items.map((item) => [item.qcode, item]),
        );

        const selectableSubitems = subitemTypes
            .filter(({qcode}) => (this.props.value ?? []).find((item) => item.qcode === qcode) == null);

        const miniToolbar = (
            <IconButton
                icon="plus-sign"
                onClick={(event) => {
                    showPopup(
                        event.target as HTMLElement,
                        'bottom-end',
                        ({closePopup}) => (
                            <Card>
                                {
                                    selectableSubitems.size > 0
                                        ? (
                                            <Spacer v gap="4">
                                                {
                                                    selectableSubitems.map((subitem) => (
                                                        <div key={subitem.qcode}>
                                                            <button
                                                                style={{padding: 0}}
                                                                onClick={() => {
                                                                    this.props.onChange(
                                                                        (this.props.value ?? []).concat({
                                                                            qcode: subitem.qcode,
                                                                            technical_info: '',
                                                                            content: '',
                                                                        }),
                                                                    );

                                                                    closePopup();
                                                                }}
                                                            >
                                                                <SubitemLabel subitem={subitem} />
                                                            </button>
                                                        </div>
                                                    )).toArray()
                                                }
                                            </Spacer>
                                        )
                                        : (
                                            <Alert size="small" margin="none">
                                                {gettext('No items available')}
                                            </Alert>
                                        )
                                }
                            </Card>
                        ),
                        1051,
                    );
                }}
                disabled={this.props.readOnly}
                ariaValue={gettext('Add')}
            />
        );

        return (
            <Container miniToolbar={miniToolbar}>
                <SubitemsViewEdit
                    subitems={this.props.value ?? []}
                    onChange={(val) => this.props.onChange(val)}
                    readOnly={this.props.readOnly}
                />
            </Container>
        );
    }
}
