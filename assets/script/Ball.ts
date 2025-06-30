import { _decorator, Component, Graphics, v2, v3, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Ball")
export class Ball extends Component {
  tempVec: Vec3 = v3();
  velocity = v2(1, 1).normalize();

  onLoad() {
    let g = this.getComponent(Graphics);
    if (g == null) {
      g = this.addComponent(Graphics);
    }

    g.circle(0, 0, 50);
    g.fill();
  }

  update(deltaTime: number) {
    const newPos = Vec3.add(
      this.tempVec,
      this.node.position,
      Vec3.multiplyScalar(this.tempVec, this.velocity.toVec3(), deltaTime * 50)
    );
    this.node.setPosition(newPos);
  }
}
