export type IFunctionPointCallback = (args: any) => Promise<object>;

export interface IFunctionPointRegisters {
    [name: string]: Array<IFunctionPointCallback>;
}

export interface IFunctionPointsService {
    functions: IFunctionPointRegisters;

    register(type: string, callback: IFunctionPointCallback): void;
    get(type: string): Array<IFunctionPointCallback>;
    run(type: string, args: any): Promise<void | object>;
}

/**
 * @ngdoc service
 * @module superdesk.apps.extension-points
 * @name functionPoints
 * @description
 * External superdesk apps can register callback functions that then will be hooked into
 * the core functionality
 * Inject 'functionPoints' into your module and then:
 *
 * functionPoints.register('MY_TYPE', myCallback) // do this in config phase
 *
 * where myCallback is a function with the signature (args: object) : Promise<void>
 *
 * Then in the core functionality where you want the hook to be placed, put the following
 * functionPoints.run('MY_TYPE', args)
 *
 * The callbacks will be processed one at a time (passing through the supplied args to each one).
 * If all callbacks return a resolved promise, the core functionality can continue.
 * If any callback returns a rejected promise, no further callbacks will be processed,
 * and the core functionality will receive the rejected promise with the value provided
 */
export class FunctionPointsService implements IFunctionPointsService {
    $q: any;
    functions: IFunctionPointRegisters;

    constructor($q: any) {
        this.$q = $q;
        this.functions = {};
    }

    /**
     * @ngdoc method
     * @name functionPoints#register
     * @public
     * @param {String} type - The name of the core functionality to register for
     * @param {IFunctionPointCallback} callback - The callback function to register
     * @description Registers a callback to core functionality
     */
    register(type: string, callback: IFunctionPointCallback): void {
        if (typeof this.functions[type] === 'undefined') {
            this.functions[type] = new Array<IFunctionPointCallback>();
        }

        this.functions[type].push(callback);
    }

    /**
     * @ngdoc method
     * @name functionPoints#get
     * @public
     * @param {String} type - The name of the core functionality
     * @return {Array<IFunctionPointCallback>} Registered callbacks
     * @description Returns an array of the registered callbacks to the core functionality provided
     */
    get(type: string): Array<IFunctionPointCallback> {
        if (typeof this.functions[type] === 'undefined') {
            return [];
        }

        return this.functions[type];
    }

    /**
     * @ngdoc method
     * @name functionPoints#run
     * @public
     * @param {String} type - The name of the core functionality
     * @param {any} args - The argument to provide to the callbacks
     * @return {Promise<void | object>}
     * @description Executes all the callbacks one at a time.
     */
    run(type: string, args?: any): Promise<void | object> {
        const callbacks = this.get(type);
        const deferred = this.$q.defer();

        if (callbacks.length === 0) {
            deferred.resolve();
            return deferred.promise;
        }

        let index: number = 0;
        const runNextCallback = (res?: any): void => {
            if (index >= callbacks.length) {
                deferred.resolve(res);
                return;
            }

            const cb: IFunctionPointCallback = callbacks[index];

            index += 1;
            cb(args).then(
                (result) => runNextCallback(result),
                (error) => deferred.reject(error),
            );
        };

        runNextCallback();

        return deferred.promise;
    }
}

FunctionPointsService.$inject = ['$q'];
