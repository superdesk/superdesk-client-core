// External Modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

import {getHumanReadableFileSize} from '@sourcefabric/common';

// Types
import {IAttachment} from 'superdesk-api';
import {superdeskApi} from '../../apis';
import {IAssetItem, ISetItem, SET_STATE} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {getAssets} from '../../store/assets/selectors';
import {loadAssetsByIds} from '../../store/assets/actions';

// UI
import {Icon, Label, IconButton} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemColumn,
    ListItemRow,
    ListItemActionMenu,
} from '../../ui/list';

// Utils
import {getIconTypeFromMimetype} from '../../utils/ui';

interface IProps {
    files: Array<IAttachment>;
    assets: Dictionary<string, IAssetItem>;
    sets: Dictionary<string, ISetItem>;
    readOnly: boolean;

    editFile: (file: IAttachment) => void;
    download: (file: IAttachment) => void;
    removeFile: (file: IAttachment) => void;

    loadAssetsByIds(ids: Array<string>): Promise<void>;
}

interface IState {
    loading: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    assets: getAssets(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    loadAssetsByIds: (ids: Array<string>) => dispatch<any>(loadAssetsByIds(ids)),
});

class SamsAttachmentsListComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: false,
        };

        this.renderFile = this.renderFile.bind(this);
    }

    componentDidMount() {
        this.loadAssets();
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (prevProps.files.length !== this.props.files.length) {
            this.loadAssets();
        }
    }

    loadAssets() {
        this.setState({loading: true});
        const {getMediaId} = superdeskApi.entities.attachment;
        const mediaIds = this.props.files.map(
            (file) => getMediaId(file),
        );

        this.props.loadAssetsByIds(mediaIds)
            .then(() => {
                this.setState({loading: false});
            });
    }

    getAttachmentSet(file: IAttachment): ISetItem | undefined {
        const mediaId = superdeskApi.entities.attachment.getMediaId(file);
        const asset = this.props.assets?.[mediaId];

        return this.props.sets?.[asset?.set_id];
    }

    renderFile(file: IAttachment) {
        const {gettext} = superdeskApi.localization;
        const set = this.getAttachmentSet(file);
        const canEdit = this.state.loading === false && set?.state === SET_STATE.USABLE;

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
                            <Label
                                text={gettext('internal')}
                                color="label--orange2"
                            />
                        </ListItemRow>
                    )}
                    {set?.state !== SET_STATE.DISABLED ? null : (
                        <ListItemRow>
                            <Label
                                text={gettext('Set Disabled')}
                                color="label--orange2"
                            />
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
                            {canEdit === false ? null : (
                                <IconButton
                                    ariaValue="edit"
                                    onClick={() => this.props.editFile(file)}
                                    icon="pencil"
                                />
                            )}
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
                {this.state.loading === false ? null : (
                    <div className="sd-loader" />
                )}
                {this.props.files.length === 0 ? null : (
                    <ul>
                        {this.props.files.map(this.renderFile)}
                    </ul>
                )}
            </div>
        );
    }
}

export const SamsAttachmentsList = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SamsAttachmentsListComponent);
