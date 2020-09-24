import React from 'react';

import Button from 'core/ui/components/Button';
import {gettext, gettextPlural} from 'core/utils';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {appConfig} from 'appConfig';

interface IProps {
    closeModal(): void;
}

interface IFileError {
    valid: boolean;
    name: string;
    width: number;
    height: number;
    type: string;
}

export function fileUploadErrorModal(
    invalidFiles: Array<IFileError>,
) {
    return class FileUploadErrorModal extends React.PureComponent<IProps> {
        render() {
            if (invalidFiles.length > 0) {
                return (
                    <Modal>
                        <ModalHeader onClose={this.props.closeModal}>
                            {
                                gettextPlural(
                                    invalidFiles.length,
                                    'The file was not uploaded',
                                    'Some files were not uploaded',
                                )
                            }
                        </ModalHeader>
                        <ModalBody>
                            {invalidFiles.some((file) => file.type.startsWith('image')) && (
                                <h4>
                                    {
                                        gettext(
                                            'Minimum allowed image size is {{minWidth}}x{{minHeight}}',
                                            {
                                                minWidth: appConfig.pictures.minWidth,
                                                minHeight: appConfig.pictures.minHeight,
                                            },
                                        )
                                    }
                                </h4>
                            )}
                            <ol>
                                {
                                    invalidFiles.map((file, index) => {
                                        if (file.type !== null) {
                                            if (file.type.startsWith('image')) {
                                                return (
                                                    <li key={index}>
                                                        {gettext('The size of {{filename}} is {{width}}x{{height}}',
                                                            {
                                                                filename: file.name,
                                                                width: file.width,
                                                                height: file.height,
                                                            },
                                                        )}
                                                    </li>
                                                );
                                            } else {
                                                return (
                                                    <li key={index}>
                                                        {gettext('Invalid File : {{name}}',
                                                            {
                                                                name: file.name,
                                                            },
                                                        )}
                                                    </li>
                                                );
                                            }
                                        } else {
                                            return null;
                                        }
                                    })
                                }
                            </ol>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.props.closeModal}>
                                {gettext('Ok')}
                            </Button>
                        </ModalFooter>
                    </Modal>
                );
            } else {
                return null;
            }
        }
    };
}
