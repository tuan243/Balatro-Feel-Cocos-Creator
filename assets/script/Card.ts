import {
  _decorator,
  Component,
  EventMouse,
  EventTouch,
  find,
  instantiate,
  mat4,
  Mat4,
  Node,
  Prefab,
  UITransform,
  v2,
  v3,
  Vec2,
  Vec3
} from 'cc';
import type { CardVisual } from './CardVisual';
import { remap } from './Utils';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
  // @property(Node) anchor: Node = null;
  @property(Prefab) cardVisualPrefab: Prefab = null;
  hovering = false;
  dragging = false;
  cardVisual: CardVisual = null;
  private mousePosition: Vec2 = v2();
  private tempVec2: Vec2 = v2();
  private tempVec3: Vec3 = v3();
  private offset: Vec3 = v3();
  private _visualPos = v3();

  private _selectingCardCb: (_: Card) => void;
  private _deSelectingCardCb: (_: Card) => void;

  localMat: Mat4 = mat4();
  private _visualMat = mat4();
  private _cardContainerMat = mat4();

  crossing = false;

  onLoad() {
    Mat4.invert(this.localMat, this.node.parent.worldMatrix);

    const visualContainer = find('Canvas/card-visual-container');
    Mat4.invert(this._visualMat, visualContainer.parent.worldMatrix);
    Mat4.invert(this._cardContainerMat, this.node.parent.parent.worldMatrix);
  }

  get visualPosition() {
    return Vec3.transformMat4(this._visualPos, this.node.worldPosition, this._visualMat);
  }

  start() {
    const cardVisualNode = instantiate(this.cardVisualPrefab);
    this.cardVisual = cardVisualNode.getComponent('CardVisual') as CardVisual;
    this.cardVisual.initialzie(this);

    this.getComponent(UITransform).setContentSize(cardVisualNode.getComponent(UITransform).contentSize);
    this.node.parent.on(Node.EventType.TRANSFORM_CHANGED, () => {
      Mat4.invert(this.localMat, this.node.parent.worldMatrix);

      const visualContainer = find('Canvas/card-visual-container');
      Mat4.invert(this._visualMat, visualContainer.parent.worldMatrix);
    });

    this.node.on(Node.EventType.MOUSE_ENTER, () => {
      this.hovering = true;

      this.cardVisual.onPointerEnter();
    });

    this.node.on(Node.EventType.MOUSE_LEAVE, () => {
      this.hovering = false;

      this.cardVisual.onPointerExit();
    });

    this.node.on(Node.EventType.MOUSE_MOVE, (event: EventMouse) => {
      this.cardVisual.setMouseMoveLocation(event.getUILocation());
    });

    this.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      this.dragging = true;

      event.getUILocation(this.mousePosition);
      this.offset.set(this.mousePosition.x - this.node.worldPosition.x, this.mousePosition.y - this.node.worldPosition.y);

      this.cardVisual.onBeginDrag();

      this.cardVisual.onPointerDown();

      if (this._selectingCardCb) {
        this._selectingCardCb(this);
      }
    });

    this.node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (!this.dragging) return;
      event.getUILocation(this.mousePosition);
    });

    const touchEndCb = () => {
      this.dragging = false;

      this.cardVisual.node.setParent(find('Canvas/card-visual-container'));
      this.cardVisual.updateIndex();
      this.cardVisual.onEndDrag();

      this.node.setPosition(0, 0);
      if (this._deSelectingCardCb) {
        this._deSelectingCardCb(this);
      }

      this.cardVisual.onPointerUp();
    };

    [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL].forEach((eventType) => {
      this.node.on(eventType, touchEndCb);
    });
  }

  update(dt: number) {
    if (this.dragging) {
      this.tempVec3.set(this.mousePosition.x, this.mousePosition.y).subtract(this.offset);

      const translation = Vec3.subtract(this.tempVec3, this.tempVec3, this.node.worldPosition);
      const len = translation.length();
      if (len > 75) {
        translation.multiplyScalar(75 / len);
      }

      const newPos = Vec3.add(translation, this.node.worldPosition, translation);
      this.node.setWorldPosition(newPos);
    }
  }

  protected lateUpdate(dt: number): void {
    this.crossing = false;
  }

  setSelectingCardCb(cb: (_: Card) => void) {
    this._selectingCardCb = cb;
  }

  setDeSelectingCardCb(cb: (_: Card) => void) {
    this._deSelectingCardCb = cb;
  }

  get siblingAmount() {
    return this.node.parent.parent.children.length - 1;
  }

  get parentIdx() {
    return this.node.parent.getSiblingIndex();
  }

  get normalizedPosition() {
    return remap(this.parentIdx, 0, this.node.parent.parent.children.length - 1, 0, 1);
  }
}
