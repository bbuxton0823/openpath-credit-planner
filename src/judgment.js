/**
 * Optional future semantic judgment boundary. Deliberately contains no network
 * transport, credentials, model selection, or API schema. This is an application
 * interface, not a TypeSafe client. Existing lookups and rules never use it.
 *
 * Future adapter may select an ID from code-supplied candidates or return null.
 * It cannot change credit facts, bridge course numbers, or approve applicability.
 * Separate user authorization and human-reviewed evidence are required before
 * implementing any hosted adapter. See PRD.md.
 */
export const judgment = Object.freeze({
  enabled: false,
  async selectEvidenceCandidate() {
    return { candidateId: null, status: 'disabled', requiresHumanReview: true };
  },
});
