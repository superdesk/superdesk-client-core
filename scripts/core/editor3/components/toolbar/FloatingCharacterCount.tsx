import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {EditorState} from 'draft-js';
import {EditorLimit} from '../../actions';
import {TextStatistics} from 'apps/authoring/authoring/components/text-statistics';
import {getCharsBeforeCursor, getSelectedCharsCount} from '../../helpers/cursor-position-count';
import {gettext} from 'core/utils';

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
    if (showFloatingCount !== true) {
        return null;
    }

    const selection = editorState.getSelection();
    const hasFocus = selection.getHasFocus();
    const hasLimit = limitConfig?.chars != null;
    const hasContent = editorState.getCurrentContent().hasText();
    const isActive = (hasFocus || floating) && hasContent;

    const cx = classNames({
        'floating-char-count': true,
        'floating-char-count--active': isActive,
    });

    return (
        <div className={cx}>
            {isActive && (
                <>
                    <span className="char-count__base">
                        {hasFocus && (() => {
                            const [label, count] = selection.isCollapsed()
                                ? [gettext('Position'), getCharsBeforeCursor(editorState)]
                                : [gettext('Selected'), getSelectedCharsCount(editorState)];

                            return `${label}: ${count} ${gettext('characters')}`;
                        })()}
                    </span>

                    {hasLimit && (
                        <TextStatistics
                            text={editorState.getCurrentContent().getPlainText()}
                            limit={limitConfig.chars}
                            hideReadingTime
                        />
                    )}
                </>
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
