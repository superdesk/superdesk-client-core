// External modules
import * as React from 'react';

// Types
import {superdeskApi} from '../apis';

// UI
import {Button, ButtonGroup} from 'superdesk-ui-framework/react';
import {PanelContent, PanelContentBlock, PanelContentBlockInner} from '../ui';
import {IModalSize, Modal, ModalHeader, ModalFooter} from '../ui/modal';
import {GridList} from '../ui/grid/GridList';
import {PageLayout} from './PageLayout';

export interface IUploadItem {
    id: string;
    binary: File;
    uploadProgress: number;
    error: boolean;
    completed: boolean;
}

export interface IUploadFileListItemProps<T = any> {
    item: IUploadItem;
    asset: T;
    selected: boolean;
    selectFile(): void;
    removeFile?(): void;
}

export interface IContentPanelProps {
    item: IUploadItem;
    submitting?: boolean;
}

interface IProps<T> {
    theme?: 'dark-ui';
    modalSize?: IModalSize;
    multiple?: boolean;
    accept?: Array<string>;
    initialFiles?: Array<{
        id: string;
        file: File;
    }>;

    closeModal(): void;
    title: string;

    onFileAdded(id: string, file: File): void;
    onFileRemoved(id: string): void;
    uploadFile(item: IUploadItem, onProgress: (progressEvent: ProgressEvent) => void): Promise<T>;
    assets: Dictionary<string, T>;

    ListItemComponent: React.ComponentType<IUploadFileListItemProps<T>>;
    RightPanelComponent: React.ComponentType<IContentPanelProps>;
}

interface IState {
    selectedIndex: number;
    submitting: boolean;
    items: Array<IUploadItem>;
}

export class FileUploadModal<T> extends React.Component<IProps<T>, IState> {
    fileInputNode: React.RefObject<HTMLInputElement>;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            selectedIndex: 0,
            submitting: false,
            items: this.getInitialItems(),
        };

        this.showFileUploadDialog = this.showFileUploadDialog.bind(this);
        this.addFiles = this.addFiles.bind(this);
        this.removeFile = this.removeFile.bind(this);
        this.selectFile = this.selectFile.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.fileInputNode = React.createRef<HTMLInputElement>();
    }

    componentDidMount() {
        if (this.state.items.length === 0) {
            this.showFileUploadDialog();
        }
    }

    showFileUploadDialog() {
        if (this.fileInputNode.current != null) {
            this.fileInputNode.current.click();
        }
    }

    getInitialItems(): Array<IUploadItem> {
        const items: Array<IUploadItem> = [];

        if (this.props.initialFiles != null && this.props.initialFiles?.length > 0) {
            this.props.initialFiles.forEach(
                (item) => {
                    items.push({
                        id: item.id,
                        binary: item.file,
                        uploadProgress: 0,
                        error: false,
                        completed: false,
                    });
                },
            );
        }

        return items;
    }

    addFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const newItems: Array<IUploadItem> = [];

        Array.from(event.target.files ?? []).forEach(
            (file: File) => {
                const id = Math.random().toString(36).substr(1);

                this.props.onFileAdded(id, file);
                newItems.push({
                    id: id,
                    binary: file,
                    uploadProgress: 0,
                    error: false,
                    completed: false,
                });
            },
        );

        this.setState((state: IState) => ({
            items: [
                ...state.items,
                ...newItems,
            ],
        }));

        event.target.value = ''; // reset to allow selecting same file again
    }

    getItemIndexById(id: string) {
        return this.state.items.findIndex((item) => item.id === id);
    }

    removeFile(index: number) {
        this.props.onFileRemoved(this.state.items[index].id);

        this.setState((state: IState) => {
            const updates: IState = {...state};

            updates.items.splice(index, 1);

            if (updates.items.length <= 1) {
                updates.selectedIndex = 0;
            } else if (index >= updates.items.length) {
                updates.selectedIndex = index - 1;
            }

            return updates;
        });
    }

    selectFile(index: number) {
        this.setState({selectedIndex: index});
    }

    updateAssetState(index: number, updates: Partial<IUploadItem>) {
        this.setState((state: IState) => {
            const items: IState['items'] = [...state.items];

            items[index] = {
                ...items[index],
                ...updates,
            };

            return {items: items};
        });
    }

    onSubmit() {
        this.setState({submitting: true});
        let requestsCompleted = 0;
        let failed = false;

        this.state.items.forEach(
            (item, index) => {
                if (item.completed) {
                    if (item.error === false) {
                        requestsCompleted += 1;
                        return;
                    } else {
                        this.updateAssetState(index, {
                            error: false,
                            completed: false,
                            uploadProgress: 0,
                        });
                    }
                }

                const onSuccess = () => {
                    this.updateAssetState(index, {
                        error: false,
                        completed: true,
                        uploadProgress: 100,
                    });
                };

                const onFail = () => {
                    failed = true;
                    this.updateAssetState(index, {
                        error: true,
                        completed: true,
                        uploadProgress: 100,
                    });
                };

                const onCompleted = () => {
                    const {notify} = superdeskApi.ui;
                    const {gettext, gettextPlural} = superdeskApi.localization;

                    requestsCompleted += 1;

                    if (requestsCompleted === this.state.items.length) {
                        if (failed === false) {
                            setTimeout(this.props.closeModal, 500);
                            notify.success(
                                gettextPlural(
                                    requestsCompleted,
                                    'File uploaded successfully',
                                    '{{count}} files uploaded successfully',
                                    {count: requestsCompleted},
                                ),
                            );
                        } else {
                            this.setState({submitting: false});
                            // TODO: Improve displaying error messages to the user
                            notify.error(gettext('Failed to upload files'));
                        }
                    }
                };

                const onProgress = (progressEvent: ProgressEvent) => {
                    // limit progress to 90% and set 100 only after request is done
                    let uploadProgress = Math.min(
                        Math.round(
                            progressEvent.loaded / progressEvent.total * 100.0,
                        ),
                        90,
                    );

                    this.updateAssetState(index, {uploadProgress: uploadProgress});
                };

                this.props.uploadFile(item, onProgress)
                    .then(onSuccess, onFail)
                    .finally(onCompleted);
            },
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {ListItemComponent, RightPanelComponent} = this.props;
        const currentItem = this.state.items[this.state.selectedIndex];

        return (
            <Modal
                id="UploadFileModal"
                size={this.props.modalSize}
                closeModal={this.props.closeModal}
                closeOnEsc={true}
                theme={this.props.theme}
            >
                <ModalHeader
                    text={this.props.title}
                    flex={true}
                >
                    <ButtonGroup align="end">
                        <Button
                            text={gettext('Close')}
                            onClick={this.props.closeModal}
                            disabled={this.state.submitting}
                        />
                        <Button
                            text={gettext('Add File')}
                            onClick={this.showFileUploadDialog}
                            icon="plus-sign"
                            type="sd-green"
                            disabled={this.state.submitting}
                        />
                        <Button
                            text={gettext('Upload')}
                            onClick={this.onSubmit}
                            type="primary"
                            disabled={this.state.submitting || this.state.items.length === 0}
                        />
                    </ButtonGroup>
                </ModalHeader>
                <PageLayout
                    mainClassName="sd-padding--2"
                    main={(
                        <GridList>
                            {this.state.items.map((item, index) => (
                                <ListItemComponent
                                    key={item.id}
                                    item={item}
                                    asset={this.props.assets[item.id]}
                                    selected={this.state.selectedIndex === index}
                                    selectFile={() => this.selectFile(index)}
                                    removeFile={this.state.submitting === true ?
                                        undefined :
                                        () => this.removeFile(index)
                                    }
                                />
                            ))}
                        </GridList>
                    )}
                    rightPanelOpen={currentItem != null}
                    rightPanel={currentItem == null ? (
                        <div />
                    ) : (
                        <PanelContent>
                            <PanelContentBlock flex={true}>
                                <PanelContentBlockInner grow={true}>
                                    <RightPanelComponent
                                        key={currentItem.id}
                                        item={currentItem}
                                        submitting={this.state.submitting}
                                    />
                                </PanelContentBlockInner>
                            </PanelContentBlock>
                        </PanelContent>
                    )}
                />
                <ModalFooter>
                    <input
                        type="file"
                        ref={this.fileInputNode}
                        onChange={this.addFiles}
                        multiple={this.props.multiple}
                        accept={(this.props.accept ?? []).join(',')}
                        style={{visibility: 'hidden'}}
                    />
                </ModalFooter>
            </Modal>
        );
    }
}
