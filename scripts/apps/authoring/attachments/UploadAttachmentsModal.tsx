import * as React from 'react';
import {showModal} from '@superdesk/common';
import {IAttachment} from 'superdesk-api';
import {attachmentsApi} from './attachmentsService';
import {gettext} from 'core/utils';
import {Button, ButtonGroup, Input, Modal, Switch} from 'superdesk-ui-framework/react';

interface IProps {
    files: Array<File>;
    closeModal(): void;
    onUploaded(attachments: Array<IAttachment>): void;
}

interface IUploadItem {
    file: File;
    meta: {
        title: string;
        description: string;
        internal: boolean;
    };
    progress: number;
}

interface IState {
    saving: boolean;
    items: Array<IUploadItem>;
}

export class UploadAttachmentsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            saving: false,
            items: this.props.files.map((file) => ({
                file: file,
                meta: {
                    title: '',
                    description: '',
                    internal: false,
                },
                progress: 0,
            })),
        };

        this.save = this.save.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }

    uploadFile(item: IUploadItem, index: number) {
        return attachmentsApi.upload(
            {
                title: item.meta.title,
                description: item.meta.description,
                internal: item.meta.internal,
            },
            item.file,
            (progress) => {
                this.updateItemProgress(
                    index,
                    (progress.loaded / progress.total) * 100.0,
                );
            },
        );
    }

    updateItemProgress(index, progress) {
        this.setState((prevState: IState) => {
            const items = [...prevState.items];

            items[index].progress = progress;

            return {items: items};
        });
    }

    updateItemMeta<K extends keyof IUploadItem['meta']>(index: number, field: K, value: IUploadItem['meta'][K]) {
        this.setState((prevState: IState) => {
            const items: Array<IUploadItem> = [...prevState.items];

            items[index].meta[field] = value;

            return {items: items};
        });
    }

    save() {
        this.setState({saving: true});
        return Promise.all(this.state.items.map(this.uploadFile))
            .then((items) => {
                this.props.onUploaded(items);
                this.props.closeModal();
            });
    }

    cancelItem(index) {
        this.setState((prevState: IState) => {
            const items = {...prevState.items};

            items.splice(index, 1);

            return {items: items};
        });
    }

    disableUploadButton() {
        if (this.state.items[0] != null && this.state.items[0].meta.title && this.state.items[0].meta.description) {
            return false;
        }
        return true;
    }

    render() {
        const ulClass = 'upload-thumbs flex-grid flex-grid--boxed flex-grid--wrap-items flex-grid--small-4';

        return (
            <Modal
                visible
                zIndex={1050}
                size="x-large"
                position="center"
                onHide={this.state.saving ? null : this.props.closeModal}
                headerTemplate={gettext('Attach files')}
                footerTemplate={
                    (
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                            }}
                        >
                            <span className="pull-left">{gettext('* fields are required')}</span>
                            <ButtonGroup>
                                <Button
                                    text={gettext('Cancel')}
                                    type="default"
                                    onClick={this.props.closeModal}
                                    disabled={this.state.saving}
                                />
                                <Button
                                    text={gettext('Upload')}
                                    type="primary"
                                    onClick={this.save}
                                    disabled={this.disableUploadButton()}
                                />
                            </ButtonGroup>
                        </div>
                    )
                }
            >
                <form className="attachmentsForm upload-media">
                    <div className="upload-edit">
                        <ul className={ulClass}>
                            {this.state.items.map((item, index) => (
                                <li className="flex-grid__item sd-shadow--z3 sd-card" key={item.file.name}>
                                    <div className="thumb sd-card__thumbnail">
                                        <div className="holder"><i className="big-icon--text" /></div>
                                        <span className="remove" onClick={() => this.cancelItem(index)}>
                                            <i className="icon-close-small" />
                                        </span>
                                    </div>
                                    <div className="sd-card__content">
                                        {item.progress === 0 ? null : (
                                            <div className="upload-progress">
                                                <div className="bar" style={{width: item.progress + '%'}} />
                                            </div>
                                        )}
                                        <div className="other-info">
                                            <div className="form__row">
                                                <Switch
                                                    label={{content: gettext('Internal'), hidden: true}}
                                                    value={item.meta.internal}
                                                    onChange={(value) => {
                                                        this.updateItemMeta(index, 'internal', value);
                                                    }}
                                                    disabled={this.state.saving}
                                                />
                                            </div>
                                            <div className="form__row">
                                                <Input
                                                    type="text"
                                                    label={gettext('Title')}
                                                    required={true}
                                                    value={item.meta.title}
                                                    onChange={(value) => {
                                                        this.updateItemMeta(index, 'title', value);
                                                    }}
                                                    disabled={this.state.saving}
                                                />
                                            </div>
                                            <div className="form__row">
                                                <Input
                                                    type="text"
                                                    label={gettext('Description')}
                                                    required={true}
                                                    value={item.meta.description}
                                                    onChange={(value) => {
                                                        this.updateItemMeta(index, 'description', value);
                                                    }}
                                                    disabled={this.state.saving}
                                                />
                                            </div>
                                            <div className="form__row">
                                                <Input
                                                    type="text"
                                                    label={gettext('File Name')}
                                                    required={true}
                                                    value={item.file.name}
                                                    onChange={() => false}
                                                    disabled={true}
                                                />
                                            </div>
                                            <div className="form__row">
                                                <Input
                                                    type="text"
                                                    label={gettext('File Size')}
                                                    required={true}
                                                    value={item.file.size.toString()}
                                                    onChange={() => false}
                                                    disabled={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </form>
            </Modal>
        );
    }
}

export function showUploadAttachmentsModal(props: Omit<IProps, 'closeModal'>) {
    showModal(({closeModal}) => (
        <UploadAttachmentsModal
            closeModal={closeModal}
            {...props}
        />
    ));
}
