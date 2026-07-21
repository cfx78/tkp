export function classifyPwaDiagnostics(report: Record<string, unknown>) {
  if (!report.secureContext) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.serviceWorkerSupported) return 'NO SERVICE WORKER SUPPORT';
  if (!report.registrationFound) return 'NO REGISTRATION';
  if (!report.activeExpectedWorker) return 'REGISTRATION PRESENT, NO ACTIVE WORKER';
  if (!report.scopeMatches || !report.manifestSameOrigin) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.controlled) return 'ACTIVE WORKER, PAGE NOT CONTROLLED';
  if (!report.controllerExpectedWorker) return 'ORIGIN OR SCOPE MISMATCH';
  if (!report.expectedCacheExists || !report.offlinePresent) return 'OFFLINE CACHE MISSING';
  if (!report.offlineValid) return 'OFFLINE DOCUMENT INVALID';
  if (!report.handshakeSucceeded || !report.workerVersionMatches) return 'WORKER VERSION MISMATCH';
  return 'READY FOR OFFLINE RETEST';
}
