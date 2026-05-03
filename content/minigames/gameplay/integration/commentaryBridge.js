/**
 * Commentary Bridge (Stub):
 * Ziel: bestehende Commentary Engine später kompatibel ankoppeln.
 */
export function attachCommentaryEngine(adapter) {
  return {
    attached: false,
    requiredAdapterMethods: ['emitCommentary(event)', 'setMatchContext(context)'],
    matchEventContract: {
      id: 'string', minute: 'number', second: 'number', type: 'string',
      team: 'HOME|AWAY', timelineText: 'string', intensity: 'number'
    },
    adapter,
    note: 'Stub only. No commentary implementation in sandbox.'
  };
}
