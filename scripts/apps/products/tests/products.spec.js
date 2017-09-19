describe('products filter', () => {
    let products = [
        {name: 'test'},
        {name: 'test both', product_type: 'both'},
        {name: 'test api', product_type: 'api'},
        {name: 'direct', product_type: 'direct'}
    ];

    let productsByFilter = null;

    beforeEach(window.module('superdesk.apps.products'));
    beforeEach(inject((_productsByFilter_) => {
        productsByFilter = _productsByFilter_;
    }));

    it('can get all products if no product type', () => {
        let items = productsByFilter(products);

        expect(items.length).toBe(4);
    });

    it('can get all products buy name test', () => {
        let items = productsByFilter(products, {name: 'test'});

        expect(items.length).toBe(3);
    });

    it('can get all products by product type both', () => {
        let items = productsByFilter(products, {product_type: 'both'});

        expect(items.length).toBe(2);
        expect(items[0].name).toBe('test');
        expect(items[1].name).toBe('test both');
    });

    it('can get all products by product type direct', () => {
        let items = productsByFilter(products, {product_type: 'direct'});

        expect(items.length).toBe(1);
        expect(items[0].name).toBe('direct');
    });

    it('can get all products by product type api', () => {
        let items = productsByFilter(products, {product_type: 'api'});

        expect(items.length).toBe(1);
        expect(items[0].name).toBe('test api');
    });
});
