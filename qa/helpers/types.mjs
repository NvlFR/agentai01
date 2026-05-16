// qa/helpers/types.mjs — JSDoc type definitions for QA runner

/**
 * @typedef {object} QaExpectation
 * @property {string} label        — human-readable description
 * @property {string} actualPath   — dot-separated path into the actual response
 * @property {unknown} [equals]    — exact equality check
 * @property {unknown} [includes]  — inclusion check (string/array)
 */

/**
 * @typedef {HttpStep | MessageStep} QaStep
 */

/**
 * @typedef {object} HttpStep
 * @property {'http'} type
 * @property {{ method: string; path: string; body?: unknown }} request
 * @property {QaExpectation[]} expect
 */

/**
 * @typedef {object} MessageStep
 * @property {'message'} type
 * @property {string} channel
 * @property {unknown} payload
 * @property {QaExpectation[]} expect
 */

/**
 * @typedef {object} QaScenario
 * @property {string} name
 * @property {QaStep[]} steps
 */

/**
 * @typedef {object} StepFailure
 * @property {string} scenarioName
 * @property {number} stepIndex
 * @property {string} stepLabel     — type + path or description
 * @property {string} assertionLabel
 * @property {unknown} expected
 * @property {unknown} actual
 */

/**
 * @typedef {object} ScenarioResult
 * @property {string} name
 * @property {'pass'|'fail'|'error'} status
 * @property {StepFailure[]} failures
 * @property {string} [errorMessage]
 */

export {}
