import React from 'react';
import {gettext} from 'core/utils';
import {IArticle, IDesk} from 'superdesk-api';
import {Alert, Button, Modal, MultiSelect} from 'superdesk-ui-framework/react';
import {sdApi} from 'api';
import {nameof} from 'core/helpers/typescript-helpers';
import {Spacer} from 'core/ui/components/Spacer';
import {setMarkedDesks} from './helper';

interface IProps {
    article: IArticle;
    closeModal(): void;
}

interface IState {
    selectedDesks: Array<string> | null;
}

export class MarkForDesksModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDesks: this.props.article.marked_desks?.map((x) => x.desk_id),
        };
    }

    render(): JSX.Element {
        const allDesks = sdApi.desks.getAllDesks();
        const selectedDesks = (this.state.selectedDesks ?? []).map((id) => allDesks.get(id));

        return (
            <Modal
                visible
                zIndex={1050}
                onHide={this.props.closeModal}
                size="medium"
                headerTemplate={gettext('Marked for desks')}
            >
                <Spacer v gap="8">
                    <MultiSelect
                        inlineLabel
                        labelHidden
                        label={gettext('Multi select')}
                        onChange={(value) => {
                            this.setState({
                                ...this.state,
                                selectedDesks: value.map((desk) => desk._id),
                            });
                        }}
                        optionLabel={(desk) => desk.name}
                        options={allDesks.toArray()}
                        value={selectedDesks}
                        placeholder={gettext('Select desks')}
                    />

                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            onClick={() => {
                                setMarkedDesks(this.state.selectedDesks, this.props.article._id)
                                    .then(() => this.props.closeModal());
                            }}
                            text={gettext('Save')}
                            type="primary"
                            style="filled"
                        />
                        <Button
                            onClick={this.props.closeModal}
                            text={gettext('Cancel')}
                            style="hollow"
                        />
                    </Spacer>
                </Spacer>
            </Modal>
        );
    }
}
