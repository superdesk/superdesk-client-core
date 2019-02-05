import React from 'react';
import PropTypes from 'prop-types';
import ng from 'core/services/ng';

/**
 * @name LinkStrategy
 * @param {Object} contentBlock The content block being scanned
 * @param {Function} callback The callback to call upon finding a range to decorate
 * @param {Object} contentState The content state
 * @description The function that defines the strategy for identifying ranges to decorate.
 */
function LinkStrategy(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();

            return entityKey !== null && contentState.getEntity(entityKey).getType() === 'LINK';
        },
        callback,
    );
}

/**
 * @name LinkComponent
 * @param {Object} props
 * @description The link decorator.
 */
class LinkComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    link: any;

    constructor(props) {
        super(props);
        this.state = {title: ''};
        this.getLinksAndAttachments(props);
    }

    componentWillReceiveProps(nextProps) {
        this.getLinksAndAttachments(nextProps);
    }

    getLinksAndAttachments(props) {
        const entity = props.contentState.getEntity(props.entityKey);

        this.link = entity.getData().link;

        if (!this.link && entity.getData() && entity.getData().url) {
            this.link = {href: entity.getData().url};
        }

        if (this.link.attachment) {
            ng.get('attachments').byId(this.link.attachment)
                .then((attachment) => {
                    this.setState({title: attachment.title});
                });
        }
    }

    render() {
        if (this.link.attachment) {
            return <a data-attachment={this.link.attachment} title={this.state.title}>{this.props.children}</a>;
        }

        return <a href={this.link.href} title={this.link.href}>{this.props.children}</a>;
    }
}

LinkComponent.propTypes = {
    contentState: PropTypes.object.isRequired,
    entityKey: PropTypes.string.isRequired,
    children: PropTypes.array.isRequired,
};

export const LinkDecorator = {
    strategy: LinkStrategy,
    component: LinkComponent,
};
