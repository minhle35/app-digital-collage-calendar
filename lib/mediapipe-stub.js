/**
 * Stub for @mediapipe/selfie_segmentation.
 * The body-segmentation package statically imports SelfieSegmentation at the
 * top level even when runtime='tfjs' is chosen. This stub satisfies that import
 * so the build doesn't fail. The class is never actually instantiated in the
 * tfjs runtime path.
 */
export class SelfieSegmentation {
  setOptions() {}
  onResults() {}
  async send() {}
  close() {}
  reset() {}
  async initialize() {}
}
