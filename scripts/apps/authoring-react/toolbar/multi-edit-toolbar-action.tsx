import React, {ReactNode} from 'react';
import {IArticle} from 'superdesk-api';
import {MultiEditModal} from '../multi-edit-modal';
import {Button, Modal, MultiSelect} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';
import {showModal} from '@superdesk/common';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

interface IProps {
    selectedArticles: Array<IArticle>;
    onClose(): void;
}

interface IState {
    selectedArticles: Array<IArticle>;
}

export class MultiEditToolbarAction extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedArticles: this.props.selectedArticles,
        };
    }

    render(): ReactNode {
        return (
            <Modal
                contentPadding="none"
                zIndex={1050}
                onHide={this.props.onClose}
                visible
                headerTemplate={gettext('Select articles')}
                size="medium"
            >
                <Spacer v gap="8" noWrap style={{padding: 10}}>
                    <MultiSelect
                        optionLabel="slugline"
                        value={this.state.selectedArticles}
                        onChange={(values) => {
                            this.setState({selectedArticles: values as Array<IArticle>});
                        }}
                        options={
                            sdApi.article.getWorkQueueItems()
                                .filter((article) =>
                                    this.state.selectedArticles.map(({_id}) => _id).includes(article._id) === false,
                                )
                        }
                    />
                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            type="primary"
                            text={gettext('Open multi edit')}
                            style="filled"
                            disabled={this.state.selectedArticles.length <= 1}
                            onClick={() => {
                                showModal(({closeModal}) => (
                                    <MultiEditModal
                                        initiallySelectedArticles={this.state.selectedArticles}
                                        onClose={closeModal}
                                    />
                                ));

                                this.props.onClose();
                            }}
                        />
                        <Button
                            text={gettext('Close')}
                            style="filled"
                            onClick={this.props.onClose}
                        />
                    </Spacer>
                </Spacer>
            </Modal>
        );
    }
}
