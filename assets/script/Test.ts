import { _decorator, Button, Component, Node, v3, Vec3 } from 'cc';
import { punchPosition } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {
  @property(Node) nodeA: Node = null;
  @property(Node) nodeB: Node = null;
  @property(Button) button: Button = null;

  start() {
    // this.schedule(() => {
    //   console.log(
    //     "frame time",
    //     director.root.cumulativeTime,
    //     director.root.frameTime,
    //     director.root.cumulativeTime - Math.floor(director.root.frameTime)
    //   );
    // }, 1);

    // resources.load("test", JsonAsset, (err, data) => {
    //   if (err != null) {
    //     console.error(err);
    //     return;
    //   }

    //   console.log("json data", data);
    // });

    this.button.node.on(Button.EventType.CLICK, () => {
      this.nodeA.eulerAngles = Vec3.ZERO;
      // punchRotation2(this.nodeA, v3(0, 0, 20), 0.2, 20, 1);
      punchPosition(this.nodeA, v3(0, 10, 0), 0.2, 20, 1);
      // console.log("before", this.nodeA.position.x, this.nodeA.position.y);
      // this.nodeA.setParent(this.nodeB, true);
      // console.log("after", this.nodeA.position.x, this.nodeA.position.y);
    });
  }

  update(deltaTime: number) {}
}
