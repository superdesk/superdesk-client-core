import React from 'react';
import {IArticle} from 'superdesk-api';

import {gettext} from 'core/utils';
import Button from 'core/ui/components/Button';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Checkbox} from 'core/ui/components/Form';
import {ListItem, ListItemColumn} from 'core/components/ListItem';

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
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{gettext('Confirm Unpublishing')}</ModalHeader>
                    <ModalBody>
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
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onClick={this.props.closeModal}>
                            {gettext('Cancel')}
                        </Button>
                        <Button color="primary" onClick={() => {
                            unpublish(this.state.related);
                            this.props.closeModal();
                        }}>{gettext('Confirm')}</Button>
                    </ModalFooter>
                </Modal>
            );
        }
    };
}
