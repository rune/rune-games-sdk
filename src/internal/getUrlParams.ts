export function getUrlParams() {
  const data = new URLSearchParams(globalThis.location.search)

  return {
    enableInitialOverlayInBrowser: !!data.get("enableInitialOverlayInBrowser"),
    useDocumentForPostMessages: !!data.get("customPostMessages"),
    challengeNumber: Number(data.get("challengeNumber")) || 1,
    startMuted: !!data.get("startMuted"),
  }
}
