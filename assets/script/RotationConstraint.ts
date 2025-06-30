import { _decorator, Component, Node } from 'cc';
const { ccclass, type } = _decorator;

@ccclass('RotationConstraint')
export class RotationConstraint extends Component {
	@type(Node) source: Node = null;

  update(deltaTime: number) {
		this.node.eulerAngles = this.source.eulerAngles;
		// this.node.eulerAngles = v3(this.node.eulerAngles.x, this.node.eulerAngles.y, this.source.worldRotation.getEulerAngles(v3()).z);
	}
}
