// qa/helpers/request.mjs — helper functions for building QA scenario requests

/**
 * Build a standard HTTP step for a QA scenario.
 *
 * @param {object} params
 * @param {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} params.method
 * @param {string} params.path
 * @param {unknown} [params.body]
 * @param {QaExpectation[]} params.expect
 * @returns {QaStep}
 */
export function httpStep({ method, path, body, expect }) {
  return { type: 'http', request: { method, path, body }, expect }
}

/**
 * Build a message step for a QA scenario (via qa-channel).
 *
 * @param {object} params
 * @param {string} params.channel
 * @param {unknown} params.payload
 * @param {QaExpectation[]} params.expect
 * @returns {QaStep}
 */
export function messageStep({ channel, payload, expect }) {
  return { type: 'message', channel, payload, expect }
}

// --- Assertion helpers ---

/**
 * Assert that a response field equals an expected value.
 *
 * @param {string} label
 * @param {string} actualPath  dot-separated path into the response object
 * @param {unknown} equals
 * @returns {QaExpectation}
 */
export function assertEquals(label, actualPath, equals) {
  return { label, actualPath, equals }
}

/**
 * Assert that a response field includes an expected value.
 *
 * @param {string} label
 * @param {string} actualPath
 * @param {unknown} includes
 * @returns {QaExpectation}
 */
export function assertIncludes(label, actualPath, includes) {
  return { label, actualPath, includes }
}

/**
 * Resolve a dot-separated path into an object.
 *
 * @param {unknown} obj
 * @param {string} path
 * @returns {unknown}
 */
export function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined
    return /** @type {Record<string, unknown>} */ (acc)[key]
  }, obj)
}

/**
 * @typedef {import('./types.mjs').QaStep} QaStep
 * @typedef {import('./types.mjs').QaExpectation} QaExpectation
 */
