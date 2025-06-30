import { _decorator, Component, Graphics, v2, Vec2 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Wall")
export class Wall extends Component {
  normal: Vec2 = v2(0, -1);
  vector: Vec2 = v2(1, 0);

  onLoad() {
    let g = this.getComponent(Graphics);

    g.moveTo(0, 0);
    const lineToPoint = Vec2.multiplyScalar(v2(), this.vector, 1000)
    g.lineTo(lineToPoint.x, lineToPoint.y);
    g.stroke();
  }
}
