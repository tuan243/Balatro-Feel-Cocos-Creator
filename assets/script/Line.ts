import { _decorator, Component, Graphics, v2, Vec2 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Line")
export class Line extends Component {
  @property(Vec2) p: Vec2 = v2();
  @property(Vec2) v: Vec2 = v2();

  onLoad() {
    const g = this.getComponent(Graphics);

    g.moveTo(this.p.x, this.p.y);
    g.lineTo(this.p.x + this.v.x, this.p.y + this.v.y);
    g.stroke();
  }
}
