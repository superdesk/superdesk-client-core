import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import * as actions from '../../actions';
import {getSelectedEntityType, getSelectedEntityData} from '../links/entityUtils';
import {gettext} from 'core/utils';
import {IEditorStore} from 'core/editor3/store';

interface IProps extends Partial<IEditorStore> {
    removeLink(): void;
    removeLinkSuggestion(): void;
    onEdit(link: any): void;
}

export class LinkToolbarComponent extends React.Component<IProps, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.onRemove = this.onRemove.bind(this);
    }

    /**
     * @ngdoc method
     * @name LinkToolbar#onSubmit
     * @description Callback when delete link.
     */
    onRemove() {
        const {suggestingMode, removeLinkSuggestion, removeLink} = this.props;

        suggestingMode ? removeLinkSuggestion() : removeLink();
    }

    render() {
        const {editorState, onEdit} = this.props;
        const {link} = getSelectedEntityData(editorState);
        const isLink = getSelectedEntityType(editorState) === 'LINK';
        const cx = classNames({
            'dropdown': true,
            'link-toolbar': true,
            'is-link': isLink,
        });

        return (
            <div className={cx}>
                {!isLink ? <span>&nbsp;</span> : (
                    <span>
                        {gettext('Link controls:')}
                        {
                            link && link.href
                                ? <a href={link.href} target="_blank" rel="noopener noreferrer">{gettext('Open')}</a>
                                : null
                        }
                        <a onClick={() => onEdit(link)}>{gettext('Edit')}</a>
                        <a onClick={this.onRemove}>{gettext('Delete')}</a>
                    </span>
                )}
            </div>
        );
    }
}

const mapStateToProps = ({suggestingMode}: IEditorStore['suggestingMode']) => ({suggestingMode});

const mapDispatchToProps = (dispatch) => ({
    removeLink: () => dispatch(actions.removeLink()),
    removeLinkSuggestion: () => dispatch(actions.removeLinkSuggestion()),
});

const mapDispatchToPropsMultiLineQuote = (dispatch) => ({
    removeLink: () => dispatch(actions.removeLinkFromMuliLineQuote()),
    removeLinkSuggestion: () => dispatch(actions.removeLinkSuggestion()),
});

export const LinkToolbar = connect(
    mapStateToProps,
    mapDispatchToProps,
)(LinkToolbarComponent);

export const LinkToolbarMultiLineQuote = connect(
    mapStateToProps,
    mapDispatchToPropsMultiLineQuote,
)(LinkToolbarComponent);
