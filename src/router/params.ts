/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import lodash from "lodash";
import { Exception } from "@vecmat/vendor";
import { ParamMetadata } from "./inject";
import { IOCContainer } from "../container";
import { Kirinriki, IContext } from "../core";

import {
    ClassValidator,
    FunctionValidator,
    convertParamsType,
    plainToClass,
    ValidRules,
    ValidOtpions,
    checkParamsType
} from "../validation";

/**
 * Parameter binding assignment.
 *
 * @param {Kirinriki} app
 * @param {IContext} ctx
 * @param {any[]} params
 * @returns
 */
export async function getParamter(app: Kirinriki, ctx: IContext, params?: ParamMetadata[]) {
    //convert type
    params = params || <ParamMetadata[]>[];
    const props: any[] = params.map(async (v: ParamMetadata, k: number) => {
        let value: any = null;
        if (v.fn && lodash.isFunction(v.fn)) {
            value = await v.fn(ctx);
        }

        // check params
        return checkParams(app, value, {
            index: k,
            isDto: v.isDto,
            type: v.type,
            validRule: v.rule,
            validOpt: v.options,
            dtoCheck: v.dtoCheck,
            dtoRule: v.dtoRule,
            clazz: v.clazz
        });
    });
    return Promise.all(props);
}

/**
 *
 *
 * @interface ParamOptions
 */
interface ParamOptions {
    index: number;
    isDto: boolean;
    type: string;
    validRule: Function | ValidRules | ValidRules[];
    validOpt: ValidOtpions;
    dtoCheck: boolean;
    dtoRule: any;
    clazz: any;
}

/**
 * Parameter binding assignment and rule verification.
 * If the input parameter type is inconsistent with the calibration,
 * it will cause the parameter type conversion
 *
 * @param {Kirinriki} app
 * @param {*} value
 * @param {ParamOptions} opt
 * @returns {*}
 */
async function checkParams(app: Kirinriki, value: any, opt: ParamOptions) {
    try {
        //@Validated
        if (opt.isDto) {
            // DTO class
            if (!opt.clazz) {
                opt.clazz = IOCContainer.getClass(opt.type, "COMPONENT");
            }
            if (opt.dtoCheck) {
                value = await ClassValidator.valid(opt.clazz, value, false);
            } else {
                value = plainToClass(opt.clazz, value, false);
            }
        } else {
            // querystring must be convert type
            value = convertParamsType(value, opt.type);
            //@Valid()
            if (opt.validRule) {
                validatorFuncs(`${opt.index}`, value, opt.type, opt.validRule, opt.validOpt);
            }
        }
        return value;
    } catch (err) {
        throw new Exception("APIMID_PARAMS_INVALID", err.message || `ValidatorError: invalid arguments.`);
    }
}

/**
 * Validated by funcs.
 *
 * @export
 * @param {string} name
 * @param {*} value
 * @param {string} type
 * @param {(ValidRules | ValidRules[] | Function)} rule
 * @param {ValidOtpions} [options]
 * @param {boolean} [checkType=true]
 * @returns
 */
function validatorFuncs(name: string, value: any, type: string, rule: ValidRules | ValidRules[] | Function, options?: ValidOtpions) {
    if (rule instanceof Function) {
        // Function no return value
        rule(value);
    } else {
        const funcs: any[] = [];
        if (lodash.isString(rule)) {
            funcs.push(rule);
        } else if (lodash.isArray(rule)) {
            funcs.push(...(<any[]>rule));
        }
        for (const func of funcs) {
            if (Object.hasOwnProperty.call(FunctionValidator, func)) {
                // FunctionValidator just throws error, no return value
                FunctionValidator[<ValidRules>func](value, options);
            }
        }
    }
}
