/*
 * @module
 * This module provides basic logging functions with an option to add
 * an prefix for easy observability.
 * 
 * @example
 * ```ts
 * import { logops } from "@ajhalili2006/api-servers-lib"
 * 
 * logops.debug("test", "lab") // [debug] lab: test
 * logops.log("laboratory") // [log] laboratory
 * ```
 */

export function log(msg: string, prefix?: string): void {
    console.log(prefix ? `[log] ${prefix}: ${msg}` : `[debug] ${msg}`)
}

/*
 * Emits a formatted debug log into console.
 *
 * @param {string} msg Message for debug logs
 * @param {string} prefix Optional log prefix
 */
export function debug(msg: string, prefix?: string): void {
    console.debug(prefix ? `${prefix}: ${msg}` : `${msg}`);
    console.log(prefix ? `[debug] ${prefix}: ${msg}` : `[debug] ${msg}`)
}

export function error(msg: string, prefix?: string) {
   console.error(prefix ? `[error] ${prefix}: ${msg}` : `[error] ${msg}`);
}