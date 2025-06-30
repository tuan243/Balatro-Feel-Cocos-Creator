import { _decorator, CCFloat, Component, Graphics } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Circle")
export class Circle extends Component {
  @property(CCFloat) radius: number = 50;

  onLoad() {
		const g = this.getComponent(Graphics);
		g.circle(0, 0, this.radius);
		g.fill();
	}
}
