import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Checkbox} from 'core/ui/components/Form';
import {ListItem, ListItemColumn} from 'core/components/ListItem';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

interface IProps {
    closeModal(): void;
}

interface IState {
    related: {[id: string]: boolean};
}

export function getUnpublishConfirmModal(
    item: IArticle,
    related: Array<IArticle>,
    unpublish: (related: IState['related']) => any,
): React.ComponentType<IProps> {
    return class UnpublishConfirmModal extends React.PureComponent<IProps, IState> {
        constructor(props) {
            super(props);

            this.state = {related: {}};
        }

        toggle(id) {
            const nextRelated = {...this.state.related, [id]: !this.state.related[id]};

            this.setState({related: nextRelated});
        }

        render() {
            return (
                <Modal
                    visible
                    zIndex={1050}
                    position="top"
                    size="small"
                    onHide={this.props.closeModal}
                    headerTemplate={gettext('Confirm Unpublishing')}
                    footerTemplate={
                        (
                            <ButtonGroup align="end">
                                <Button
                                    text={gettext('Cancel')}
                                    type="default"
                                    onClick={this.props.closeModal}
                                />
                                <Button
                                    text={gettext('Confirm')}
                                    type="primary"
                                    onClick={() => {
                                        unpublish(this.state.related);
                                        this.props.closeModal();
                                    }}
                                />
                            </ButtonGroup>
                        )
                    }

                >
                    <div>
                        {gettext('Are you sure you want to unpublish item "{{headline}}"?', {
                            headline: item.headline || item.slugline,
                        })}
                        {related.length > 0 && (
                            <form>
                                <legend>{gettext('Unpublish related items:')}</legend>
                                <ul>
                                    {related.map((_item) => (
                                        <ListItem key={_item._id} onClick={() => this.toggle(_item._id)}>
                                            <ListItemColumn>
                                                <Checkbox
                                                    value={this.state.related[_item._id]}
                                                    onChange={() => this.toggle(_item._id)}
                                                />
                                            </ListItemColumn>
                                            <ListItemColumn>
                                                {_item.headline || _item.slugline}
                                            </ListItemColumn>
                                        </ListItem>
                                    ))}
                                </ul>
                            </form>
                        )}
                    </div>
                </Modal>
            );
        }
    };
}
