// External Modules
import * as React from 'react';

// Types
import {IAttachment} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';
import {superdeskApi, samsApi} from '../../apis';

// UI
import {Button} from 'superdesk-ui-framework/react';
import {Modal, ModalBody, ModalFooter, ModalHeader} from '../../ui/modal';
import {PageLayout} from '../../containers/PageLayout';
import {AssetEditor} from '../assets/assetEditor';

// Utils
import {showModalConnectedToStore} from '../../utils/ui';

interface IProps {
    closeModal(): void;
    attachment: IAttachment;
    onAssetUpdated?(updatedAttachment: IAttachment, updatedAsset: IAssetItem): void;
}

interface IState {
    original?: IAssetItem;
    updates: Partial<IAssetItem>;
    submitting: boolean;
}

export function showEditAttachmentModal(attachment: IAttachment): Promise<[IAttachment, IAssetItem]> {
    return new Promise((resolve) => {
        showModalConnectedToStore<Partial<IProps>>(
            EditAttachmentModal,
            {
                attachment: attachment,
                onAssetUpdated: (updatedAttachment: IAttachment, updatedAsset: IAssetItem) => {
                    resolve([updatedAttachment, updatedAsset]);
                },
            },
        );
    });
}

export class EditAttachmentModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            original: undefined,
            updates: {},
            submitting: false,
        };

        this.onChange = this.onChange.bind(this);
        this.saveAsset = this.saveAsset.bind(this);
    }

    componentDidMount() {
        const assetId = superdeskApi.entities.attachment.getMediaId(this.props.attachment);

        samsApi.assets.getById(assetId)
            .then((asset) => {
                this.setState({
                    original: asset,
                    updates: Object.assign({}, asset),
                });
            });
    }

    onChange<K extends keyof IAssetItem>(field: K, value: IAssetItem[K]) {
        this.setState((prevState: IState) => ({
            updates: {
                ...prevState.updates,
                [field]: value,
            },
        }));
    }

    saveAsset() {
        if (this.state.original != null) {
            samsApi.assets.updateMetadata(this.state.original, this.props.attachment, this.state.updates)
                .then(([updatedAttachment, updatedAsset]) => {
                    this.props.closeModal();
                    if (this.props.onAssetUpdated != null) {
                        this.props.onAssetUpdated(updatedAttachment, updatedAsset);
                    }
                });
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <Modal
                id="EditAttachmentModal"
                size="large"
                closeModal={this.props.closeModal}
                darkUI={true}
            >
                <ModalHeader
                    text={gettext('Edit Attachment')}
                />
                <ModalBody>
                    <PageLayout
                        mainClassName="sd-padding--2"
                        main={(
                            this.state.original == null ?
                                null : (
                                    <AssetEditor
                                        asset={this.state.updates}
                                        onChange={this.onChange}
                                        fields={[
                                            'name',
                                            'description',
                                            'state',
                                        ]}
                                    />
                                )
                        )}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        text={gettext('Cancel')}
                        onClick={this.props.closeModal}
                        style="hollow"
                    />
                    <Button
                        text={gettext('Save')}
                        type="primary"
                        onClick={this.saveAsset}
                    />
                </ModalFooter>
            </Modal>
        );
    }
}
