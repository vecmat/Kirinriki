/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import KoaRouter from "@koa/router";
import { Check } from "@vecmat/vendor";
import { RouterOptions } from "../option";
import { RequestMethod } from "../mapping";
import { Logger } from "../../base/Logger";
import { IOCContainer } from "../../container";
import { Handler, injectParam, injectRouter } from "../inject";
import { Kirinriki, IContext, INext, IRouter } from "../../core";


/**
 * WebsocketRouter Options
 *
 * @export
 * @interface WebsocketRouterOptions
 */
export interface WebsocketRouterOptions extends RouterOptions {
    prefix: string;
}
// WsImplementation
export type WsImplementation = (ctx: IContext, next: INext) => Promise<any>;

export class WebsocketRouter implements IRouter {
    app: Kirinriki;
    readonly protocol: string;
    options: WebsocketRouterOptions;
    router: KoaRouter;

    constructor(app: Kirinriki, options?: RouterOptions) {
        this.app = app;
        this.options = Object.assign(
            {
                prefix: options.prefix
            },
            options
        );
        this.router = new KoaRouter(this.options);
    }

    /**
     * Set router
     *
     * @param {string} path
     * @param {WsImplementation} func
     * @param {RequestMethod} [method]
     * @returns {*}
     * @memberof WebsocketRouter
     */
    SetRouter(path: string, func: WsImplementation, method?: RequestMethod) {
        if (Check.isEmpty(method)) {
            return;
        }
        method = method ?? RequestMethod.ALL;
        this.router[method](path, func);
    }

    /**
     * ListRouter
     *
     * @returns {*} {KoaRouter.Middleware<any, unknown>}
     */
    ListRouter() {
        return this.router.routes();
    }

    /**
     *
     *
     * @param {any[]} list
     */
    LoadRouter(list: any[]) {
        try {
            for (const n of list) {
                const ctlClass = IOCContainer.getClass(n, "CONTROLLER");
                // inject router
                const ctlRouters = injectRouter(this.app, ctlClass);
                // inject param
                const ctlParams = injectParam(this.app, ctlClass);
                // tslint:disable-next-line: forin
                for (const it in ctlRouters) {
                    const router = ctlRouters[it];
                    const path = router.path;
                    const method = router.method;
                    const requestMethod = <RequestMethod>router.requestMethod;
                    const params = ctlParams[method];
                    // websocket only handler get request
                    if (requestMethod == RequestMethod.GET || requestMethod == RequestMethod.ALL) {
                        Logger.Debug(`[WS/${requestMethod}]: "${path}" => ${n}.${method}`);
                        this.SetRouter(
                            path,
                            (ctx: IContext): Promise<any> => {
                                const ctl = IOCContainer.getInsByClass(ctlClass, [ctx]);
                                return Handler(this.app, ctx, ctl, method, params);
                            },
                            requestMethod
                        );
                    }
                }
            }
            // Add websocket handler
            this.app.use(this.ListRouter()).use(this.router.allowedMethods());
        } catch (err) {
            Logger.Error(err);
        }
    }
}
