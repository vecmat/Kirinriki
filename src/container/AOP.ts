/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { getMethodNames } from "./Util";
import { Exception, Check } from "@vecmat/vendor";
import { Container, IOCContainer } from "./Container";
import { TAGGED_AOP, TAGGED_CLS } from "./IContainer";

/**
 * defined AOP type
 *
 * @export
 * @enum {number}
 */
export enum AOPType {
    "Before" = "Before",
    "BeforeEach" = "BeforeEach",
    "After" = "After",
    "AfterEach" = "AfterEach"
}

/**
 * Aspect interface
 *
 * @export
 * @interface IAspect
 */
export interface IAspect {
    app: any

    run: (...args: any[]) => Promise<any>
}

/**
 * Indicates that an decorated class is a "aspect".
 *
 * @export
 * @param {string} [identifier]
 * @returns {ClassDecorator}
 */
export function Aspect(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        if (!identifier.endsWith("Aspect")) {
            throw new Exception("BOOTERR_DECLS_UNSUITED", "Aspect class names must use a suffix `Aspect`.");
        }
        const oldMethod = Reflect.get(target.prototype, "run");
        if (!oldMethod) {
            throw new Exception("BOOTERR_DECLS_MISSATTR", "The aspect class must implement the `run` method.");
        }
        IOCContainer.saveClass("COMPONENT", target, identifier);
    };
}

/**
 * Executed before specifying the PointCut method.
 *
 * @export
 * @param {(string | Function)} aopName
 * @returns {MethodDecorator}
 */
export function Before(aopName: string | Function): MethodDecorator {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        if (!aopName) {
            throw new Exception("BOOTERR_DEMET_MISSPARAMS","AopName is required.");
        }
        // const { value, configurable, enumerable } = descriptor;
        // descriptor = {
        //     configurable,
        //     enumerable,
        //     writable: true,
        //     async value(...props: any[]) {
        //         await executeAspect(aopName, props);
        //         // tslint:disable-next-line: no-invalid-this
        //         return value.apply(this, props);
        //     },
        // };
        // return descriptor;
        IOCContainer.saveClassMetadata(TAGGED_CLS, TAGGED_AOP, {
            type: AOPType.Before,
            name: aopName,
            method: methodName,
        }, target);
    };
}

/**
 * Executed after execution of each method of the specified PointCut class.
 *
 * @export
 * @param {string} [aopName]
 * @returns {Function}
 */
export function BeforeEach(aopName?: string | Function): ClassDecorator {
    return (target: any) => {
        IOCContainer.saveClassMetadata(TAGGED_CLS, TAGGED_AOP, {
            type: AOPType.BeforeEach,
            name: aopName
        }, target);
    };
}

/**
 * Executed after specifying the PointCut method.
 *
 * @export
 * @param {(string | Function)} aopName
 * @returns {MethodDecorator}
 */
export function After(aopName: string | Function): MethodDecorator {
    return (target: any, methodName: symbol | string, descriptor: PropertyDescriptor) => {
        if (!aopName) {
            throw  new Exception("BOOTERR_DEMET_MISSPARAMS","AopName is required.");
        }
        // const { value, configurable, enumerable } = descriptor;
        // descriptor = {
        //     configurable,
        //     enumerable,
        //     writable: true,
        //     async value(...props: any[]) {
        //         // tslint:disable-next-line: no-invalid-this
        //         const res = await value.apply(this, props);
        //         await executeAspect(aopName, props);
        //         return res;
        //     }
        // };
        // return descriptor;
        IOCContainer.saveClassMetadata(TAGGED_CLS, TAGGED_AOP, {
            type: AOPType.After,
            name: aopName,
            method: methodName,
        }, target);
    };
}

/**
 * Executed after execution of each method of the specified PointCut class.
 *
 * @export
 * @param {string} aopName
 * @returns {Function}
 */
export function AfterEach(aopName?: string | Function): ClassDecorator {
    return (target: any) => {
        IOCContainer.saveClassMetadata(TAGGED_CLS, TAGGED_AOP, {
            type: AOPType.AfterEach,
            name: aopName
        }, target);
    };
}

/**
 * Execute aspect
 *
 * @param {(string | Function)} aopName
 * @param {any[]} props
 * @returns {*}  
 */
async function executeAspect(aopName: string | Function, props: any[]) {
    // tslint:disable-next-line: one-variable-per-declaration
    let aspect;//, name = "";
    if (Check.isClass(aopName)) {
        // tslint:disable-next-line: no-invalid-this
        aspect = IOCContainer.getInsByClass(aopName);
        // name = IOCContainer.getIdentifier(<Function>aopName) || (<Function>aopName).name || "";
    } else {
        // tslint:disable-next-line: no-invalid-this
        aspect = IOCContainer.get(<string>aopName, "COMPONENT");
        // name = <string>aopName;
    }
    if (aspect && lodash.isFunction(aspect.run)) {
        // logger.Info(`Execute the aspect ${name}`);
        // tslint:disable-next-line: no-invalid-this
        await aspect.run(props);
    }
    return Promise.resolve();
}

/**
 * inject AOP
 *
 * @export
 * @param {*} target
 * @param {*} instance
 * @param {Container} container
 */
export function injectAOP(target: any, instance: any, container: Container) {
    const allMethods = getMethodNames(target);
    // only binding self method
    const selfMethods = getMethodNames(target, true);
    const methodsFilter = (ms: string[]) => ms.filter((m: string) => !['constructor', 'init', '__before', '__after'].includes(m));
    let hasDefault = false;
    if (allMethods.includes('__before') || allMethods.includes('__after')) {
        // inject default AOP method
        injectDefaultAOP(target, instance, methodsFilter(selfMethods));
        hasDefault = true;
    }

    const classMetaData = container.getClassMetadata(TAGGED_CLS, TAGGED_AOP, target);
    const { type, name, method } = classMetaData || {};
    if (name && [AOPType.Before, AOPType.BeforeEach, AOPType.After, AOPType.AfterEach].includes(type)) {
        methodsFilter(selfMethods).forEach((element: string) => {
            if (element === method) {
                // If the class has defined the default AOP method, @BeforeEach and @AfterEach will not take effect
                if (hasDefault && (type === AOPType.BeforeEach || type === AOPType.AfterEach)) {
                    return;
                }
                // Logger.Debug(`Register inject AOP ${target.name} method: ${element} => ${type}`);
                defineAOPProperty(target, element, name, type);
            }
        });
    }
}

// /**
//  * Determine whether the class contains the default AOP method
//  *
//  * @param {*} target
//  * @returns {*}  {boolean}
//  */
// function hasDefaultAOP(target: any): boolean {
//     const allMethods = getMethodNames(target).filter((m: string) =>
//         !["constructor", "init"].includes(m)
//     );
//     // class contains the default AOP method
//     if (allMethods.includes("__before") || allMethods.includes("__after")) {
//         return true;
//     }
//     return false;
// }

/**
 * inject default AOP
 *
 * @export
 * @param {*} target
 * @param {*} instance
 * @param {string[]} methods
 * @returns {*}
 */
function injectDefaultAOP(target: any, instance: any, methods: string[]) {
    // class methods
    // const methods = getMethodNames(target, true).filter((m: string) =>
    //     !["constructor", "init", "__before", "__after"].includes(m)
    // );
    // logger.Warn(`The ${target.name} class has a default AOP method, @BeforeEach and @AfterEach maybe not take effect`);
    methods.forEach((element) => {
        if (lodash.isFunction(instance.__before)) {
            // logger.Debug(`Register inject default AOP ${target.name} method: ${element} => __before`);
            defineAOPProperty(target, element, "__before", AOPType.BeforeEach);
        }
        if (lodash.isFunction(instance.__after)) {
            // logger.Debug(`Register inject default AOP ${target.name} method: ${element} => __after`);
            defineAOPProperty(target, element, "__after", AOPType.AfterEach);
        }
    });
}

/**
 * Dynamically add methods for target class types
 *
 * @param {Function} classes
 * @param {string} protoName
 * @param {(string | Function)} aopName
 */
function defineAOPProperty(classes: Function, protoName: string, aopName: string | Function, type: AOPType) {
    const oldMethod = Reflect.get(classes.prototype, protoName);
    if (oldMethod) {
        Reflect.defineProperty(classes.prototype, protoName, {
            writable: true,
            async value(...props: any[]) {
                if ([AOPType.Before, AOPType.BeforeEach].includes(type)) {
                    if (aopName === "__before") {
                        // logger.Info(`Execute the aspect ${classes.name}.__before`);
                        // tslint:disable-next-line: no-invalid-this
                        await Reflect.apply(this.__before, this, props);
                    } else {
                        await executeAspect(aopName, props);
                    }
                    // tslint:disable-next-line: no-invalid-this
                    return Reflect.apply(oldMethod, this, props);
                } else {
                    // tslint:disable-next-line: no-invalid-this
                    const res = await Reflect.apply(oldMethod, this, props);
                    if (aopName === "__after") {
                        // logger.Info(`Execute the aspect ${classes.name}.__after`);
                        // tslint:disable-next-line: no-invalid-this
                        await Reflect.apply(this.__after, this, props);
                    } else {
                        await executeAspect(aopName, props);
                    }
                    return res;
                }
            }
        });
    } else {
        throw  new Exception("BOOTERR_DEPRO_MISSATTR",`${protoName} method does not exist.`);
    }
}