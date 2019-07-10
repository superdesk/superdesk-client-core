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
    item: IArticle;
    related: Array<IArticle>;
    close(): void;
    unpublish(related: IState['related']): void;
}

interface IState {
    related: {[id: string]: boolean};
}

export class UnpublishConfirmModal extends React.PureComponent<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {related: {}};
    }

    toggle(id) {
        const related = {...this.state.related, [id]: !this.state.related[id]};

        this.setState({related});
    }

    unpublish() {
        this.props.unpublish(this.state.related);
    }

    render() {
        return (
            <Modal>
                <ModalHeader onClose={this.props.close}>{gettext('Confirm Unpublishing')}</ModalHeader>
                <ModalBody>
                    {gettext('Are you sure you want to unpublish item "{{headline}}"?', {
                        headline: this.props.item.headline || this.props.item.slugline,
                    })}
                    {this.props.related.length > 0 && (
                        <form>
                            <legend>{gettext('Unpublish related items:')}</legend>
                            <ul>
                                {this.props.related.map((item) => (
                                    <ListItem key={item._id} onClick={() => this.toggle(item._id)}>
                                        <ListItemColumn>
                                            <Checkbox
                                                value={this.state.related[item._id]}
                                                onChange={() => this.toggle(item._id)}
                                            />
                                        </ListItemColumn>
                                        <ListItemColumn>
                                            {item.headline || item.slugline}
                                        </ListItemColumn>
                                    </ListItem>
                                ))}
                            </ul>
                        </form>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="default" onClick={this.props.close}>
                        {gettext('Cancel')}
                    </Button>
                    <Button color="primary" onClick={() => this.unpublish()}>
                        {gettext('Confirm')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }
}
