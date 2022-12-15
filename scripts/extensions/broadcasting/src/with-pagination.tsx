import * as React from 'react';
import {IRestApiResponse} from 'superdesk-api';
import {Icon} from 'superdesk-ui-framework';

interface IProps<T> {
    pageSize?: number;
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
        this.getPageSize = this.getPageSize.bind(this);

        this.element = null;
        this.pageCount = 0;
    }

    getPageSize() {
        return this.props.pageSize ?? 20;
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
            this.pageCount = Math.ceil(res._meta.total / this.getPageSize());
            this.setState({items: res._items});
        });
    }

    render() {
        if (this.state.items == null) {
            return null;
        }

        const pagination = (
            <div className='sd-pagination'>
                <button
                    className='sd-pagination__item sd-pagination__item--start'
                    disabled={this.state.currentPage === 1}
                    onClick={() => this.switchPage(1)}
                >
                    <Icon name='backward-thin' />
                </button>
                <button
                    className='sd-pagination__item sd-pagination__item--start'
                    disabled={this.state.currentPage <= 1}
                    onClick={() => this.switchPage(this.state.currentPage - 1)}
                >
                    <Icon name='chevron-left-thin' />
                </button>
                {
                    (this.state.currentPage === this.pageCount || this.state.currentPage === this.pageCount - 1) && (
                        <>
                            <button
                                className='sd-pagination__item'
                                onClick={() => this.switchPage(1)}
                            >
                                {1}
                            </button>
                            <span className='sd-pagination__item sd-pagination__item--more'>...</span>
                        </>
                    )
                }
                {
                    this.pageCount === this.state.currentPage && this.state.currentPage - 2 > 0 &&
                    (
                        <button
                            className='sd-pagination__item'
                            onClick={() => this.switchPage(this.state.currentPage - 2)}
                        >
                            {this.state.currentPage - 2}
                        </button>
                    )
                }
                {
                    this.state.currentPage > 1 &&
                    (
                        <button
                            className='sd-pagination__item'
                            onClick={() => this.switchPage(this.state.currentPage - 1)}
                        >
                            {this.state.currentPage - 1}
                        </button>
                    )
                }
                <button
                    className='sd-pagination__item sd-pagination__item--active'
                    onClick={() => this.switchPage(this.state.currentPage)}
                >
                    {this.state.currentPage}
                </button>
                {
                    this.state.currentPage < this.pageCount && (
                        <button onClick={() => this.switchPage(this.state.currentPage + 1)}>
                            {this.state.currentPage + 1}
                        </button>
                    )
                }
                {
                    this.state.currentPage !== this.pageCount - 1 && this.state.currentPage !== this.pageCount && (
                        <>
                            <span className='sd-pagination__item sd-pagination__item--more'>...</span><button
                                className='sd-pagination__item'
                                onClick={() => this.switchPage(this.pageCount)}
                            >
                                {this.pageCount}
                            </button>
                        </>
                    )
                }
                <button
                    className='sd-pagination__item sd-pagination__item--forward'
                    onClick={() => this.switchPage(this.state.currentPage + 1)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <Icon name='chevron-right-thin' />
                </button>
                <button
                    className='sd-pagination__item sd-pagination__item--end'
                    onClick={() => this.switchPage(this.pageCount)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <Icon name='forward-thin' />
                </button>
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
