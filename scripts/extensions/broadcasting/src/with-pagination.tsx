import * as React from 'react';
import {IRestApiResponse} from 'superdesk-api';

import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

interface IProps<T> {
    pageSize?: number;
    totalItems?: number;
    getItems(pageNo: number): Promise<IRestApiResponse<T>>;
    children: (items: Array<T>) => JSX.Element;
}

interface IState<T> {
    currentPage: number;
    items: Array<T> | null;
}

export class WithPagination<T> extends React.PureComponent<IProps<T>, IState<T>> {
    private element: HTMLDivElement | null;
    private pageCount: number;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            currentPage: 1,
            items: null,
        };

        this.switchPage = this.switchPage.bind(this);

        this.element = null;
        this.pageCount = 0;
    }

    switchPage(page: number) {
        if (page <= this.pageCount) {
            this.props.getItems(page).then((res) => {
                this.setState({items: res._items, currentPage: page}, () => {
                    const scrollableEl = this.getScrollParent(this.element);

                    if (scrollableEl != null) {
                        scrollableEl.scrollTop = 0;
                    }
                });
            });
        }
    }

    getScrollParent(element: HTMLElement | null): HTMLElement | null {
        if (element == null) {
            return null;
        }

        if (element.attributes[0]?.nodeValue?.includes('overflow: auto')) {
            return element;
        }

        return this.getScrollParent(element?.parentElement);
    }

    componentDidMount(): void {
        this.props.getItems(1).then((res) => {
            this.pageCount = Math.ceil(res._meta.total / (this.props?.pageSize ?? 200));
            this.setState({items: res._items});
        });
    }

    render() {
        if (this.state.items == null) {
            return null;
        }

        // TODO: apply design
        // TODO: figure out scrolling - test if it catches the overflow via CSS

        const pagination = (
            <div>
                <pre>current page: {JSON.stringify(this.state.currentPage)}</pre>
                {this.state.currentPage !== 1 && (
                    <button
                        disabled={this.state.currentPage < 1}
                        onClick={() => this.switchPage(this.state.currentPage - 1)}
                    >
                        {gettext('Previous')}
                    </button>
                )}
                {this.state.currentPage > 2 && (
                    <button onClick={() => this.switchPage(this.state.currentPage - 2)}>
                        {this.state.currentPage - 2}
                    </button>
                )
                }
                {this.state.currentPage !== 1 && (
                    <button onClick={() => this.switchPage(this.state.currentPage - 1)}>
                        {this.state.currentPage - 1}
                    </button>
                )
                }
                <button style={{backgroundColor: 'orange'}} onClick={() => this.switchPage(this.state.currentPage)}>
                    {this.state.currentPage}
                </button>
                {this.state.currentPage < this.pageCount && (
                    <button onClick={() => this.switchPage(this.state.currentPage + 1)}>
                        {this.state.currentPage + 1}
                    </button>
                )
                }
                {this.state.currentPage < this.pageCount - 1 && (
                    <button onClick={() => this.switchPage(this.state.currentPage + 2)}>
                        {this.state.currentPage + 2}
                    </button>
                )
                }
                {this.state.currentPage !== this.pageCount && (
                    <button onClick={() => this.switchPage(this.state.currentPage + 1)}>
                        {gettext('Next')}
                    </button>
                )
                }
                <select value={this.state.currentPage} onChange={(e) => this.switchPage(parseInt(e.target.value, 10))}>
                    {new Array(this.pageCount)
                        .fill(null)
                        .map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)
                    }
                </select>
            </div>
        );

        return (
            <div
                style={{height: '100%', width: '100%'}}
                ref={(element) => {
                    this.element = element;
                }}
            >
                {pagination}
                {this.props.children(this.state.items)}
                {pagination}
            </div>
        );
    }
}
