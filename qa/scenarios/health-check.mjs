// qa/scenarios/health-check.mjs — example QA scenario: runtime health check

import { httpStep, assertEquals, assertIncludes } from '../helpers/request.mjs'

/** @type {import('../helpers/types.mjs').QaScenario} */
export default {
  name: 'health-check',
  steps: [
    httpStep({
      method: 'GET',
      path: '/health',
      expect: [
        assertEquals('status code path exists', 'status', 'ok'),
      ],
    }),
  ],
}
