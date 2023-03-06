/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { MetadataClass } from "./Metadata";
import { Exception, Helper } from "@vecmat/vendor";
import { IRpcServerCallback, IRpcServerUnaryCall, IWebSocket, KoaContext, IContext, WsRequest } from "./IContext";

/**
 *  Create IContext
 *
 * @export
 * @param {KoaContext} ctx
 * @param {*} req
 * @param {*} res
 * @returns {*}  {IContext}
 */
export function CreateContext(ctx: KoaContext, req: any, res: any): IContext {
    const context = initBaseContext(ctx);
    switch (ctx.protocol) {
        case "ws":
        case "wss":
            return createWsContext(context, req, res);
        case "grpc":
            return createGrpcContext(context, req, res);
        default:
            return context;
    }
}

/**
 * Create Kirinriki gRPC Context
 *
 *
 * @param {IContext} ctx
 * @param {IRpcServerUnaryCall<any, any>} call
 * @param {IRpcServerCallback<any>} rpcCallback
 * @returns {*}  {IContext}
 */
function createGrpcContext(context: IContext, call: IRpcServerUnaryCall<any, any>, callback: IRpcServerCallback<any>): IContext {
    context.status = 200;
    //
    Helper.define(context, "rpc", {
        call,
        callback
    });
    // metadata
    context.metadata = MetadataClass.from(call.metadata.toJSON());

    if (call) {
        let handler: any = {};
        if (Object.hasOwnProperty.call(call, "handler")) {
            handler = Reflect.get(call, "handler") || {};
        } else if (Object.hasOwnProperty.call(call, "call")) {
            const called = Reflect.get(call, "call") || {};
            handler = called.handler || {};
        }
        const cmd = handler.path || "";
        // originalPath
        context.setMetaData("originalPath", cmd);
        // payload
        context.setMetaData("_body", call.request || {});
        // sendMetadata
        context.sendMetadata = function (data: MetadataClass) {
            const m = data.getMap();
            const metadata = call.metadata.clone();
            for (const k in m) {
                if (Object.prototype.hasOwnProperty.call(m, k)) {
                    metadata.add(k, m[k]);
                }
            }
            call.sendMetadata(metadata);
        };
    }

    return context;
}

/**
 * Create Kirinriki Websocket Context
 *
 * @param {IContext} ctx
 * @param {IncomingMessage} req
 * @param {WebSocket} socket
 * @returns {*}  {IContext}
 */
function createWsContext(context: IContext, req: WsRequest, socket: IWebSocket): IContext {
    context.status = 200;
    Helper.define(context, "websocket", socket);
    context.setMetaData("_body", (req.data ?? "").toString());

    return context;
}

/**
 * initialize Base Context
 *
 * @param {Kirinriki} app
 * @param {KoaContext} ctx
 * @returns {*}  {IContext}
 */
function initBaseContext(ctx: KoaContext): IContext {
    const context = Object.create(ctx);
    // throw
    context.throw = function (sign: string, temp: string, info: object): never {
        // 标准错误处理（GRPC 错误码和HTTP错误码通用处理）
        // 只返回错误码？
        ctx.status = 500;
        throw new Exception(sign, temp, info);
    };

    // metadata
    context.metadata = new MetadataClass();
    // getMetaData
    context.getMetaData = function (key: string) {
        const value = context.metadata.get(key);
        if (value.length === 1) {
            return value[0];
        }
        return value;
    };

    // setMetaData
    context.setMetaData = function (key: string, value: any) {
        context.metadata.set(key, value);
    };

    // sendMetadata
    context.sendMetadata = function (data: MetadataClass) {
        context.set(data.toJSON());
    };

    return context;
}
