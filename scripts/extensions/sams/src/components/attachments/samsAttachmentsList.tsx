// External Modules
import * as React from 'react';

// Types
import {IAttachment} from 'superdesk-api';

// UI
import {Icon, Label, IconButton} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemColumn,
    ListItemRow,
    ListItemActionMenu,
} from '../../ui/list';

// Utils
import {getIconTypeFromMimetype, getHumanReadableFileSize} from '../../utils/ui';

interface IProps {
    files: Array<IAttachment>;
    readOnly: boolean;

    editFile: (file: IAttachment) => void;
    download: (file: IAttachment) => void;
    removeFile: (file: IAttachment) => void;
}

export class SamsAttachmentsList extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.renderFile = this.renderFile.bind(this);
    }

    renderFile(file: IAttachment) {
        return (
            <ListItem key={file._id} shadow={1}>
                <ListItemColumn>
                    <Icon name={getIconTypeFromMimetype(file.mimetype)} />
                </ListItemColumn>
                <ListItemColumn grow={true}>
                    <ListItemRow>
                        <h4>{file.title}</h4>
                    </ListItemRow>
                    <ListItemRow>
                        <h5>{file.filename} {`(${getHumanReadableFileSize(file.media.length)})`}</h5>
                    </ListItemRow>
                    <ListItemRow>
                        <div className="description">
                            {file.description}
                        </div>
                    </ListItemRow>
                    {file.internal === false ? null : (
                        <ListItemRow>
                            <Label text={'internal'} color="label--orange2" />
                        </ListItemRow>
                    )}
                </ListItemColumn>
                <ListItemActionMenu row={true}>
                    <IconButton
                        ariaValue="download"
                        onClick={() => this.props.download(file)}
                        icon="download"
                    />
                    {this.props.readOnly === true ? null : (
                        <React.Fragment>
                            <IconButton
                                ariaValue="edit"
                                onClick={() => this.props.editFile(file)}
                                icon="pencil"
                            />
                            <IconButton
                                ariaValue="delete"
                                onClick={() => this.props.removeFile(file)}
                                icon="trash"
                            />
                        </React.Fragment>
                    )}
                </ListItemActionMenu>
            </ListItem>
        );
    }

    render() {
        return (
            <div className="attachments-list">
                {this.props.files.length === 0 ? null : (
                    <ul>
                        {this.props.files.map(this.renderFile)}
                    </ul>
                )}
            </div>
        );
    }
}
