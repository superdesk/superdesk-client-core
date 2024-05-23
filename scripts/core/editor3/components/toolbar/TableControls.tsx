import React from 'react';
import {connect} from 'react-redux';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {inlineStyles} from '../../helpers/inlineStyles';
import {getData, getCell} from '../../helpers/table';
import {ITableKind} from '../tables/TableBlock';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';
import {blockStyles} from './BlockStyleButtons';
import {SelectionButtonCustomEditorState} from './SelectionButton';
import {gettext} from 'core/utils';
import {LinkToolbarForTableCell} from '../links/LinkToolbar';
import {PopupTypes} from '../../actions';
import {LinkInputForTableCell} from '../links/LinkInput';
import {IEditorStore} from 'core/editor3/store';

interface IOwnProps {
    className: string;
    tableKind: ITableKind;
    editorFormat: Array<RICH_FORMATTING_OPTION>;
}

interface IDispatchProps {
    addRowAfter(): void;
    addColAfter(): void;
    removeRow(): void;
    removeCol(): void;
    toggleTableHead(): void;
    toggleTableStyle(inlineStyle: any): void;
    toggleTableBlockType(type:any): void;
    setTablePopup(type:any, data: any): void;
}

interface IReduxStateProps {
    activeCell: IEditorStore['activeCell'];
    editorState: IEditorStore['editorState'];
    popup: IEditorStore['popup'];
}

type IProps = IOwnProps & IReduxStateProps & IDispatchProps;

const TableControlsComponent: React.FunctionComponent<IProps> = (props) => {
    const {
        addRowAfter,
        addColAfter,
        removeRow,
        removeCol,
        activeCell,
        popup,
        editorState,
        editorFormat,
        toggleTableHead,
        toggleTableStyle,
        toggleTableBlockType,
        setTablePopup,
        className,
        tableKind,
    } = props;

    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const data = getData(contentState, key);
    const {withHeader} = data;
    const cellEditorState = getCell(data, i, j, currentStyle, selection);
    const currentInlineStyle = cellEditorState.getCurrentInlineStyle();
    const blockStyle = cellEditorState
        .getCurrentContent()
        .getBlockForKey(cellEditorState.getSelection().getStartKey())
        .getType();

    return (
        <div className={'table-controls ' + className}>
            {
                tableKind === 'table' && (
                    <>
                        <StyleButton active={withHeader} label={'TH'} onToggle={toggleTableHead} />

                        <span
                            className="Editor3-styleButton Editor3-styleButton--short"
                            onClick={removeRow}
                        >
                            <i className="icon-minus-sign" />
                        </span>

                        <span
                            className="Editor3-styleButton"
                            onClick={addRowAfter}
                        >
                            <i className="icon-plus-sign" />
                            {' '}row
                        </span>

                        <span
                            className="Editor3-styleButton Editor3-styleButton--short"
                            onClick={removeCol}
                        >
                            <i className="icon-minus-sign" />
                        </span>

                        <span className="Editor3-styleButton" onClick={addColAfter}>
                            <i className="icon-plus-sign" />
                            {' '}col
                        </span>
                    </>
                )
            }

            {
                editorFormat
                    .filter((type) => type in inlineStyles)
                    .map((type) => (
                        <StyleButton
                            key={type}
                            active={currentInlineStyle.has(inlineStyles[type])}
                            label={type}
                            onToggle={toggleTableStyle}
                            style={inlineStyles[type]}
                        />
                    ))
            }

            {
                editorFormat
                    .filter((type) => type in blockStyles)
                    .sort()
                    .map((type) => (
                        <StyleButton
                            key={type}
                            active={blockStyles[type] === blockStyle}
                            label={type}
                            onToggle={() => toggleTableBlockType(blockStyles[type])}
                            style={blockStyles[type]}
                        />
                    ))
            }

            {
                editorFormat.includes('link') && (
                    <SelectionButtonCustomEditorState
                        editorState={cellEditorState}
                        onClick={(payload) => setTablePopup(PopupTypes.Link, payload)}
                        iconName="link"
                        tooltip={gettext('Link')}
                    />
                )
            }

            {
                popup.type === PopupTypes.Link && (
                    <LinkInputForTableCell
                        data={popup.data}
                        editorState={cellEditorState}
                    />
                )
            }

            <LinkToolbarForTableCell
                editorState={cellEditorState}
                onEdit={(payload) => setTablePopup(PopupTypes.Link, payload)}
            />
        </div>
    );
};

const mapDispatchToProps = (dispatch): IDispatchProps => ({
    addRowAfter: () => dispatch(actions.addRowAfter()),
    addColAfter: () => dispatch(actions.addColAfter()),
    removeRow: () => dispatch(actions.removeRow()),
    removeCol: () => dispatch(actions.removeCol()),
    toggleTableHead: () => dispatch(actions.toggleTableHeader()),
    toggleTableStyle: (inlineStyle) => dispatch(actions.toggleTableStyle(inlineStyle)),
    toggleTableBlockType: (type) => dispatch(actions.toggleTableBlockType(type)),
    setTablePopup: (type, data) => dispatch(actions.setTablePopup(type, data)),
});

const mapStateToProps = (state: IEditorStore) => ({
    activeCell: state.activeCell,
    editorState: state.editorState,
    popup: state.popup,
});

export const TableControls: React.ComponentType<IOwnProps> = connect<IReduxStateProps, IDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(TableControlsComponent);
