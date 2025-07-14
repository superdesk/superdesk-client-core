import React from 'react';
import Textarea from 'react-textarea-autosize';
import {QumuWidget, isQumuWidget} from './QumuWidget';
import * as actions from '../../actions';
import ng from 'core/services/ng';
import {loadIframelyEmbedJs} from './loadIframely';
import {debounce, noop} from 'lodash';
import {gettext} from 'core/utils';
import {processEmbedCode} from '../../actions';
import {ContentBlock, ContentState} from 'draft-js';
import {connect} from 'react-redux';
import {IEditorStore} from 'core/editor3/store';

// debounce to avoid multiple widget load calls on initial load
// when it gets executed for every embed block
const loadIframely = debounce(loadIframelyEmbedJs, 100);

interface IOwnProps {
    contentState: ContentState;
    block: ContentBlock;
}

interface IReduxStateProps {
    readOnly: boolean;
}

interface IDispatchProps {
    dispatch(action): void;
}

type IProps = IOwnProps & IReduxStateProps & IDispatchProps;

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an embed block within the editor, using oEmbed data
 * retrieved from iframe.ly
 */
export class EmbedBlockComponent extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    globalKeys: Array<string>;

    constructor(props) {
        super(props);

        this.onClickDelete = this.onClickDelete.bind(this);
        this.editEmbedHtml = this.editEmbedHtml.bind(this);
        this.onChangeDescription = this.onChangeDescription.bind(this);

        this.globalKeys = [];
    }

    /**
     * @name EmbedBlockComponent#runScripts
     * @param {string} html
     * @description Runs and imports all the scripts in the given HTML.
     */
    runScripts(html) {
        const tree = $('<div />').html(html);

        tree.find('script').each((i, s) => {
            if (s.hasAttribute('src')) {
                const newScript = document.createElement('script');
                const oldKeys = Object.keys(window);

                newScript.setAttribute('src', s.getAttribute('src'));
                newScript.setAttribute('async', s.hasAttribute('async') ? 'async' : '');
                document.body.appendChild(newScript);
                newScript.onload = () => {
                    const newKeys = Object.keys(window);

                    // keep track of new global objects created after the script was loaded
                    this.globalKeys = newKeys.filter((k) => !oldKeys.includes(k) && isNaN(parseInt(k, 10)));

                    document.body.removeChild(newScript);
                };

                return;
            }

            try {
                // eslint-disable-next-line no-eval
                eval(s.innerHTML);
            } catch (e) {
                /* carry on */
            }
        });
    }

    getEntityKey() {
        const {block} = this.props;

        return block.getEntityAt(0);
    }

    getBlockKey() {
        const {block} = this.props;

        return block.getKey();
    }

    onChangeDescription(event) {
        const entityKey = this.getEntityKey();
        const blockKey = this.getBlockKey();

        this.props.dispatch(actions.mergeEntityDataByKey(
            blockKey,
            entityKey,
            {
                description: event.target.value,
            },
        ));
    }

    editEmbedHtml() {
        const embed = this.data();
        const entityKey = this.getEntityKey();
        const blockKey = this.getBlockKey();
        const modal = ng.get('modal');

        modal.prompt(gettext('Edit embed'), embed.data.html)
            .then((html) => {
                this.props.dispatch(actions.mergeEntityDataByKey(
                    blockKey,
                    entityKey,
                    {
                        data: {...embed.data, html: processEmbedCode(html)},
                    },
                ));
            });
    }

    data() {
        const {contentState} = this.props;
        const entityKey = this.getEntityKey();
        const entity = contentState.getEntity(entityKey);

        return entity.getData();
    }

    shouldComponentUpdate(nextProps) {
        const {contentState} = nextProps;
        const entityKey = this.getEntityKey();
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();
        const oldData = this.data();

        return data.html !== oldData.html;
    }

    onClickDelete() {
        const {block} = this.props;

        this.props.dispatch(actions.removeBlock(block.getKey()));
    }

    componentDidMount() {
        const embed = this.data();
        const html = embed.data.html;
        const isQumu = isQumuWidget(html);

        if (embed.data.html.includes('iframe.ly')) {
            loadIframely();
        } else if (isQumu !== true) {
            this.runScripts(html);
        }
    }

    componentWillUnmount(): void {
        this.globalKeys.forEach((k) => delete window[k]);
        this.globalKeys = [];
    }

    render() {
        const embed = this.data();
        const html = embed.data.html;
        const isQumu = isQumuWidget(html);
        const {readOnly} = this.props;

        const setLocked = () => {
            this.props.dispatch(actions.setLocked(true));
        };

        return (
            <div className="embed-block">
                {
                    readOnly ? null : (
                        <a className="icn-btn embed-block__remove" onMouseDown={this.onClickDelete}>
                            <i className="icon-close-small" />
                        </a>
                    )
                }
                {
                    readOnly ? null : (
                        <a className="icn-btn embed-block__edit" onMouseDown={this.editEmbedHtml}>
                            <i className="icon-pencil" />
                        </a>
                    )
                }

                {
                    isQumu
                        ? <QumuWidget html={html} />
                        : <div className="embed-block__wrapper" dangerouslySetInnerHTML={{__html: html}} />
                }

                <Textarea
                    placeholder={gettext('Description')}
                    onFocus={setLocked}
                    onClick={setLocked}
                    className="image-block__description"
                    value={embed.description || ''}
                    onChange={this.onChangeDescription}
                    disabled={readOnly}
                />
            </div>
        );
    }
}

const mapStateToProps = (state: IEditorStore): IReduxStateProps => ({
    readOnly: state.readOnly,
});

export const EmbedBlock: React.ComponentType<IOwnProps> = connect<IReduxStateProps, IOwnProps, IDispatchProps>(
    mapStateToProps,
)(EmbedBlockComponent);
