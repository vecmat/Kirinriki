/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Exception } from "@vecmat/vendor";
import { Logger } from "../../base/Logger";
import { HttpStatusCode, HttpStatusCodeMap } from "../code";

/**
 * Websocket error handler
 *
 * @export
 * @param {IContext} ctx
 * @param {Capturer} err
 * @returns {*}  {void}
 */
export function WSCatcher(ctx: any, err: Error): void {
    try {
        ctx.status = ctx.status || 500;
        if (!HttpStatusCodeMap.has(ctx.status)) ctx.status = 500;

        const msg = err.message || ctx.message || "";
        const body = `{"sign":${err.message},"message":"${msg}","data":${ctx.body ? JSON.stringify(ctx.body) : ctx.body || null}}`;
        return ctx.websocket.send(body);
    } catch (error) {
        Logger.Error(error);
        return null;
    }
}
