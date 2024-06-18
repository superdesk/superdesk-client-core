import React from 'react';
import {gettext, gettextPlural} from 'core/utils';
import {appConfig} from 'appConfig';
import {Button, Modal} from 'superdesk-ui-framework/react';

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
                    <Modal
                        visible
                        zIndex={1050}
                        size="small"
                        position="top"
                        onHide={this.props.closeModal}
                        headerTemplate={
                            gettextPlural(
                                invalidFiles.length,
                                'The file was not uploaded',
                                'Some files were not uploaded',
                            )
                        }
                        footerTemplate={
                            <Button type="primary" onClick={this.props.closeModal} text={gettext('Ok')} />
                        }
                    >
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
                    </Modal>
                );
            } else {
                return null;
            }
        }
    };
}
