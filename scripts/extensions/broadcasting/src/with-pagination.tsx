import * as React from 'react';
import {IRestApiResponse} from 'superdesk-api';
import {Icon} from 'superdesk-ui-framework';

interface IProps<T> {
    pageSize?: number;
    getItems(pageNo: number, signal: AbortSignal): Promise<IRestApiResponse<T>>;
    children: (items: Array<T>) => JSX.Element;
}

interface IState<T> {
    currentPage: number;
    items: Array<T> | null;
}

export class WithPagination<T> extends React.PureComponent<IProps<T>, IState<T>> {
    private pageCount: number;
    private abortController: AbortController;
    private ref: HTMLDivElement | null;
    private inProgress: boolean;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            currentPage: 1,
            items: null,
        };

        this.switchPage = this.switchPage.bind(this);
        this.getPageSize = this.getPageSize.bind(this);

        this.pageCount = 0;
        this.abortController = new AbortController();
        this.ref = null;
        this.inProgress = false;
    }

    getPageSize() {
        return this.props.pageSize ?? 20;
    }

    switchPage(page: number) {
        if (this.inProgress) {
            this.abortController.abort();
        }

        this.inProgress = true;
        this.props.getItems(page, this.abortController.signal).then((res) => {
            this.inProgress = false;
            this.setState({items: res._items, currentPage: page}, () => {
                const scrollableEl = this.getScrollParent(this.ref);
                const diff = scrollableEl != null && this.ref?.scrollHeight != null
                    ? scrollableEl.offsetHeight - this.ref?.scrollHeight
                    : null;

                if (scrollableEl != null) {
                    scrollableEl.scrollTop = diff != null ? diff : 0;
                }
            });
        });
    }

    getScrollParent(element: HTMLElement | null): HTMLElement | null {
        if (element == null) {
            return null;
        }

        let pEl: HTMLElement | null = element;

        while (pEl !== null && window.getComputedStyle(pEl).overflowY !== ('auto' || 'scroll')) {
            pEl = element.parentElement ?? null;
        }

        return pEl;
    }

    componentDidMount(): void {
        this.props.getItems(1, this.abortController.signal).then((res) => {
            this.pageCount = Math.ceil(res._meta.total / this.getPageSize());
            this.setState({items: res._items});
        });
    }

    render() {
        if (this.state.items == null) {
            return null;
        }

        const pButton = (n: number) => (
            <button
                className='sd-pagination__item'
                onClick={() => this.switchPage(n)}
            >
                {n}
            </button>
        );
        const span = <span className='sd-pagination__item sd-pagination__item--more'>...</span>;

        const pageArray = [
            this.state.currentPage - 1,
            this.state.currentPage,
            this.state.currentPage + 1,
        ]
            .filter((x) => x >= 1 && x <= this.pageCount)
            .map((pN) => {
                if (pN === this.pageCount - 1 && this.state.currentPage + 1 !== this.pageCount) {
                    return;
                }

                if (this.state.currentPage === this.pageCount && pN === this.pageCount) {
                    return (
                        <>
                            {pButton(1)}
                            {span}
                            {pButton(pN - 2)}
                            {pButton(pN - 1)}
                            {pButton(pN)}
                        </>
                    );
                }

                if (this.state.currentPage === this.pageCount - 1 && pN + 2 === this.pageCount) {
                    return (
                        <>
                            {pButton(1)}
                            {span}
                            {pButton(pN)}
                        </>
                    );
                }

                if (
                    this.state.currentPage + 2 === this.pageCount && pN + 1 === this.state.currentPage
                ) {
                    return (
                        <>
                            {pButton(1)}
                            {span}
                            {pButton(pN + 1)}
                        </>
                    );
                }

                if (this.state.currentPage + 2 === this.pageCount) {
                    return (
                        <>
                            {pButton(pN + 1)}
                            {pButton(pN + 2)}
                        </>
                    );
                }

                if (
                    this.state.currentPage !== this.pageCount
                    && pN - this.state.currentPage === 1
                    && this.pageCount !== pN
                ) {
                    return (
                        <>
                            {pButton(pN)}
                            {span}
                            {pButton(this.pageCount)}
                        </>
                    );
                }

                return pButton(pN);
            });

        pageArray.unshift(
            <>
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
            </>,
        );

        pageArray.push(
            <>
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
            </>,
        );

        const pagination = (
            <div className='sd-pagination' ref={(el) => this.ref = el}>
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
                    this.ref = element;
                }}
            >
                {pagination}
                {this.props.children(this.state.items)}
                {pagination}
            </div>
        );
    }
}
