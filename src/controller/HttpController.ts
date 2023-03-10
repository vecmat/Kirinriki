/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { formatApiData } from "../base/widget";
import { ApiInput, ApiOutput } from "../base/Component";
import { BaseController } from "../base/BaseController";

/**
 * HTTP controller
 *
 * @export
 * @class HttpController
 * @implements {IController}
 */
export class HttpController extends BaseController {
    /**
     * Whether it is a GET request
     *
     * @public
     * @returns {boolean}
     * @memberof HttpController
     */
    public isGet(): boolean {
        return this.ctx.method === "GET";
    }

    /**
     * Whether it is a POST request
     *
     * @public
     * @returns {boolean}
     * @memberof HttpController
     */
    public isPost(): boolean {
        return this.ctx.method === "POST";
    }

    /**
     * Determines whether the METHOD request is specified
     *
     * @public
     * @param {string} method
     * @returns {boolean}
     * @memberof HttpController
     */
    public isMethod(method: string): boolean {
        return this.ctx.method === method.toUpperCase();
    }

    /**
     * Get/Set headers.
     *
     * @public
     * @param {string} [name]
     * @param {*} [value]
     * @returns {*}
     * @memberof HttpController
     */
    public header(name?: string, value?: any): any {
        if (name === undefined)
            return this.ctx.headers;

        if (value === undefined)
            return this.ctx.get(name);

        return this.ctx.set(name, value);
    }

    /**
     * Get POST/GET parameters, the POST value is priority.
     *
     * @param {string} [name]
     * @returns
     * @memberof HttpController
     */
    public param(name?: string) {
        return this.ctx.bodyParser().then((body: any) => {
            const getParams: any = this.ctx.queryParser() || {};
            const postParams = (body.post ? body.post : body) || {};
            if (name !== undefined)
                return postParams[name] === undefined ? getParams[name] : postParams[name];

            return { ...getParams, ...postParams, };
        });
    }

    /**
     * Set response content-type
     *
     * @public
     * @param {string} contentType
     * @param {(string | boolean)} [encoding]
     * @returns {string}
     * @memberof HttpController
     */
    public type(contentType: string, encoding?: string | boolean): string {
        if (encoding !== false && !contentType.includes("charset"))
            contentType = `${contentType}; charset=${encoding || this.app.config("encoding")}`;

        this.ctx.type = contentType;
        return contentType;
    }

    /**
     * set cache-control and expires header
     *
     * @public
     * @param {number} [timeout=30]
     * @returns {void}
     * @memberof HttpController
     */
    public expires(timeout = 30): void {
        timeout = lodash.toNumber(timeout) * 1000;
        const date = new Date(Date.now() + timeout);
        this.ctx.set("Cache-Control", `max-age=${timeout}`);
        return this.ctx.set("Expires", date.toUTCString());
    }

    /**
     * Url redirect
     *
     * @param {string} urls
     * @param {string} [alt]
     * @returns {void}
     * @memberof HttpController
     */
    public redirect(urls: string, alt?: string): void {
        return this.ctx.redirect(urls, alt);
    }

    /**
     * Block access
     *
     * @param {number} [code=403]
     * @returns {Promise<any>}
     * @memberof HttpController
     */
    public deny(code = 403): Promise<any> {
        // todo ?????????
        return this.ctx.throw(code);
    }

    /**
     * Set response Body content
     *
     * @param {*} data
     * @param {string} [contentType]
     * @param {string} [encoding]
     * @returns {Promise<any>}
     * @memberof HttpController
     */
    public body(data: any, contentType?: string, encoding?: string): Promise<any> {
        contentType = contentType || "text/plain";
        encoding = encoding || this.app.config("encoding") || "utf-8";
        this.type(contentType, encoding);
        this.ctx.body = data;
        return null;
    }

    /**
     * Respond to json formatted content
     *
     * @param {*} data
     * @returns {Promise<any>}
     * @memberof HttpController
     */
    public json(data: any) {
        return this.body(data, "application/json");
    }

    /**
     * Response to normalize json format content for success
     *
     * @param {(string | ApiInput)} msg   ????????????message??????
     * @param {*} [data]    ??????????????????
     * @param {number} [code=200]    ??????????????????0
     * @returns {*}
     * @memberof HttpController
     */
    public ok(msg: string | ApiInput, data?: any, code = 0) {
        const obj: ApiOutput = formatApiData(msg, data, code);
        return this.json(obj);
    }

    /**
     * Response to normalize json format content for fail
     *
     * @param {(string | ApiInput)} msg
     * @param {*} [data]
     * @param {number} [code=1]
     * @returns {*}
     * @memberof HttpController
     */
    public fail(msg: Error | string | ApiInput, data?: any, code = 1) {
        const obj: ApiOutput = formatApiData(msg, data, code);
        return this.json(obj);
    }
}

