/** API-Vertrag (Stub): verbindet MatchEvents mit bestehender Event-Bar. */
export function attachToEventBar(adapter) {
  return {
    attached: false,
    requiredAdapterMethods: ['pushTimelineEvent(event)'],
    adapter,
    note: 'Stub only. Existing Event-Bar remains untouched.'
  };
}
