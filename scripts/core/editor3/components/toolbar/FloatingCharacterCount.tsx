import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {EditorState} from 'draft-js';
import {EditorLimit} from '../../actions';
import {TextStatistics} from 'apps/authoring/authoring/components/text-statistics';

interface IOwnProps {
    floating: boolean;
}

interface IReduxStateProps {
    editorState: EditorState;
    limitConfig?: EditorLimit;
    showFloatingCount?: boolean;
}

type IProps = IOwnProps & IReduxStateProps;

const FloatingCharacterCountComponent: React.FC<IProps> = ({editorState, limitConfig, floating, showFloatingCount}) => {
    const hasLimit = limitConfig?.chars != null;
    const isActive = floating && hasLimit && showFloatingCount === true;

    const cx = classNames({
        'floating-char-count': true,
        'floating-char-count--active': isActive,
    });

    return (
        <div className={cx}>
            {isActive && (
                <TextStatistics
                    text={editorState.getCurrentContent().getPlainText()}
                    limit={limitConfig.chars}
                />
            )}
        </div>
    );
};

const mapStateToProps = (state): IReduxStateProps => ({
    editorState: state.editorState,
    limitConfig: state.limitConfig,
    showFloatingCount: state.showFloatingCount,
});

export const FloatingCharacterCount = connect(mapStateToProps)(FloatingCharacterCountComponent);
