import * as React from 'react';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {UploadComplete} from './UploadComplete';
import {UploadConfigModalInformation} from './UploadConfigModalInformation';
import {DropZone} from './drop-zone';
import {notify} from '../../../core/notify/notify';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

interface IProps {
    closeModal(): void;
}

interface IState {
    files: Array<File>;
}

const RESOURCE = 'upload/config-file';

export function UploadConfig(updateVocabulary) {
    return class UploadConfigModal extends React.PureComponent<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                files: [],
            };

            this.onAddFiles = this.onAddFiles.bind(this);
            this.uploadFile = this.uploadFile.bind(this);
        }

        onAddFiles(files) {
            this.setState({files: Array.from(files || [])});
        }

        uploadFile() {
            const formData = new FormData();

            this.state.files.forEach((file) => formData.append('json_file', file));

            return dataApi.uploadFileWithProgress(
                '/' + RESOURCE + '?resource=vocabularies',
                formData,
            ).then((res: any) => {
                if (res._success) {
                    res.items.forEach((item) => updateVocabulary(item));
                    notify.success(gettext(res._success._message));
                } else if (res._error) {
                    notify.error(gettext(res._error._message));
                }
            }).catch((error: any) => {
                notify.error(gettext(error._message));
            });
        }

        render() {
            const modalInformationLabel = gettext(`Please be aware that uploading external config files
                will overwrite your existing configuration.`);
            const dropZoneLabel = gettext(`Drag one or more files here to upload them,
                or select files by clicking the button below`);

            return (
                <Modal
                    visible
                    zIndex={1050}
                    size="large"
                    position="center"
                    onHide={this.props.closeModal}
                    headerTemplate={gettext('Upload config')}
                    footerTemplate={
                        (
                            <ButtonGroup align="end">
                                <Button
                                    type="default"
                                    text={gettext('Cancel')}
                                    onClick={this.props.closeModal}
                                />
                                <Button
                                    type="primary"
                                    text={gettext('Apply config')}
                                    onClick={() => {
                                        this.uploadFile();
                                        this.props.closeModal();
                                    }}
                                    disabled={this.state.files.length === 0}
                                    data-test-id="confirm"
                                />
                            </ButtonGroup>
                        )
                    }
                >
                    <div className="sd-padding--3">
                        <UploadConfigModalInformation label= {modalInformationLabel} />
                        {this.state.files.length === 0
                            ? (
                                <DropZone
                                    label={dropZoneLabel}
                                    className={[
                                        'sd-file-upload__drop-target',
                                        'sd-file-upload__drop-target--height-l',
                                        'sd-margin-t--2',
                                    ].join(' ')}
                                    fileAccept="application/json"
                                    onFileSelect={(files) => this.onAddFiles(files)}
                                    canDrop={(event) => {
                                        return event.dataTransfer.items.length > 0 &&
                                            event.dataTransfer.items[0].type.startsWith('application/json');
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        this.onAddFiles(event.dataTransfer.files);
                                    }}
                                    multiple={true}
                                />
                            )
                            : (
                                <UploadComplete />
                            )
                        }
                    </div>
                </Modal>
            );
        }
    };
}
