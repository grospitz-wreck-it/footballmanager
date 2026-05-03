export class CameraController {
  constructor() { this.cx = 0.5; this.cy = 0.5; this.zoom = 1; }
  setFocus([cx, cy, zoom]) { this.cx = cx; this.cy = cy; this.zoom = zoom; }
}
