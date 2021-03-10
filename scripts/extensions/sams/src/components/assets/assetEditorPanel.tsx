// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {cloneDeep} from 'lodash';

// Types
import {IAssetItem} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {previewAsset, updateAsset, unlockAsset} from '../../store/assets/actions';
import {getSelectedAsset} from '../../store/assets/selectors';

// UI
import {Button, ButtonGroup, Tag} from 'superdesk-ui-framework/react';
import {
    PanelHeader,
    PanelHeaderSlidingToolbar,
    PanelContentBlock,
    PanelContentBlockInner,
    FormGroup,
    FormRow,
} from '../../ui';
import {AssetEditor} from './assetEditor';
import {VersionUserDateLines} from '../common/versionUserDateLines';

interface IProps {
    original?: IAssetItem;
    previewAsset(asset: IAssetItem): void;
    updateAsset(original: IAssetItem, updates: Partial<IAssetItem>): Promise<IAssetItem>;
    unlockAsset(asset: IAssetItem): Promise<IAssetItem>;
}

interface IState {
    updates: Partial<IAssetItem>;
    isDirty: boolean;
    submitting: boolean;
}

const mapStateToProps = (state: IApplicationState) => ({
    original: getSelectedAsset(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    previewAsset: (asset: IAssetItem) => dispatch(previewAsset(asset._id)),
    updateAsset: (original: IAssetItem, updates: IAssetItem) => dispatch<any>(updateAsset(original, updates)),
    unlockAsset: (asset: IAssetItem) => dispatch<any>(unlockAsset(asset)),
});

export class AssetEditorPanelComponent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        if (this.props.original?._id == null) {
            this.state = {
                updates: {
                },
                isDirty: true,
                submitting: false,
            };
        } else {
            this.state = {
                updates: cloneDeep<IAssetItem>(this.props.original),
                isDirty: false,
                submitting: false,
            };
        }

        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.addTag = this.addTag.bind(this);
    }

    onChange<K extends keyof IAssetItem>(field: K, value: IAssetItem[K]) {
        if (field === 'tags') {
            this.addTag(value);
        } else {
            this.setState((prevState: IState) => ({
                updates: {
                    ...prevState.updates,
                    [field]: value,
                },
                isDirty: true,
            }));
        }
    }

    addTag<K extends keyof IAssetItem>(value: IAssetItem[K]) {
        this.setState((preState: IState) => {
            const oldStateUpdates = preState.updates;
            const tags: Array<any> = oldStateUpdates.tags ? oldStateUpdates.tags! : [];
            const newTag: any = value!;
            const index = tags.findIndex((tag) => {
                return tag.code === newTag.code;
            });

            if (index === -1) {
                tags.push(value!);
                return {
                    updates: {...oldStateUpdates, tags},
                    isDirty: true,
                };
            }

            return {
                updates: oldStateUpdates,
                isDirty: preState.isDirty,
            };
        });
    }

    removeTag(index: number) {
        this.setState((preState: IState) => {
            const oldStateUpdates = preState.updates;
            const tags: Array<{name: string, code: string}> = oldStateUpdates.tags!;

            tags.splice(index, 1);
            return {
                updates: {...oldStateUpdates, tags},
                isDirty: true,
            };
        });
    }

    onSave() {
        this.setState({submitting: true});

        if (this.props.original != null) {
            const promise = this.props.updateAsset(this.props.original, this.state.updates);

            promise
                .then((asset: IAssetItem) => {
                    // If the submission was completed successfully
                    // then close the editor and open the preview
                    this.props.unlockAsset(asset)
                        .then(() => {
                            this.props.previewAsset(asset);
                        });
                })
                .catch(() => {
                    // If there was an error submitting the request
                    // then re-enable the 'SAVE'|'CREATE' button
                    this.setState({submitting: false});
                });
        }
    }

    onCancel() {
        this.props.unlockAsset(this.props.original!)
            .then(() => {
                if (this.props.original != null) {
                    this.props.previewAsset(this.props.original);
                }
            });
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <PanelHeader borderB={true}>
                    <PanelHeaderSlidingToolbar>
                        <ButtonGroup align="right">
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                onClick={this.onCancel}
                                disabled={this.state.submitting}
                            />
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                disabled={!this.state.isDirty || this.state.submitting}
                                onClick={this.onSave}
                            />
                        </ButtonGroup>
                    </PanelHeaderSlidingToolbar>
                </PanelHeader>
                {this.props.original == null ? null : (
                    <PanelContentBlock flex={true}>
                        <PanelContentBlockInner grow={true}>
                            <VersionUserDateLines item={this.props.original} />
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                )}
                <PanelContentBlock flex={true}>
                    <PanelContentBlockInner grow={true}>
                        <AssetEditor
                            key={this.props.original?._id}
                            asset={this.props.original!}
                            onChange={this.onChange}
                            fields={[
                                'name',
                                'description',
                                'state',
                                'tags',
                            ]}
                        />
                        <FormGroup>
                            <FormRow>
                                {this.state.updates?.tags?.map((tag) => (
                                    <Tag
                                        key={this.state.updates?.tags?.indexOf(tag)}
                                        text={tag.name}
                                        onClick={() => {
                                            this.removeTag(this.state.updates?.tags?.indexOf(tag)!);
                                        }}
                                    />
                                ))}
                            </FormRow>
                        </FormGroup>
                    </PanelContentBlockInner>
                </PanelContentBlock>
            </React.Fragment>
        );
    }
}

export const AssetEditorPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AssetEditorPanelComponent);
