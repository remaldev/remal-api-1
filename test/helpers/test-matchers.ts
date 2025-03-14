/**
 * Custom Jest asymmetric matchers for common validations
 */

/**
 * Custom asymmetric matcher for valid ISO dates
 * Usage: expect(obj).toMatchObject({ date: isValidDate })
 */
export const isValidDate = {
  asymmetricMatch: (actual: string) => (
      typeof actual === 'string' &&
      new Date(actual).toString() !== 'Invalid Date'
    ),
  toAsymmetricMatcher: () => 'isValidDate',
}
