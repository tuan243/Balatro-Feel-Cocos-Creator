import {
	_decorator,
	Component,
	Sprite,
	SpriteFrame,
	toRadian,
	tween,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("BasicFlipAnimation")
export class BasicFlipAnimation extends Component {
  @property(SpriteFrame) frontCard: SpriteFrame = null;
  @property(SpriteFrame) backCard: SpriteFrame = null;

  private tweenObj = { angle: 0 };

  onLoad() {
    tween(this.tweenObj)
      .set({ angle: 0 })
      .to(
        0.25,
        { angle: 90 },
        {
          onStart: () => {
            this.getComponent(Sprite).spriteFrame = this.backCard;
          },
          onUpdate: (target) => {
            const angleInRad = toRadian(target.angle);
            this.node.setScale(Math.cos(angleInRad), 1);
          },
        }
      )
      .to(
        0.25,
        { angle: 180 },
        {
          onStart: () => {
            this.getComponent(Sprite).spriteFrame = this.frontCard;
          },
          onUpdate: (target) => {
            const angleInRad = toRadian(target.angle);
            this.node.setScale(Math.cos(angleInRad), 1);
          },
        }
      )
      .delay(2)
      .union()
      .repeatForever()
      .start();
  }
}
