import {
  _decorator,
  clamp,
  clamp01,
  Component,
  CurveRange,
  easing,
  find,
  Mat4,
  mat4,
  Material,
  misc,
  Node,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
  v2,
  v3,
  Vec2,
  Vec3,
} from "cc";
import type { Card } from "./Card";
import { punchRotation, remap } from "./Utils";
const { ccclass, property, type, float } = _decorator;

const FOLLOW_PARAM = { group: { name: "Follow Parameters", id: "1" } };
const ROTATION_PARAM = { group: { name: "Rotation Parameters", id: "2" } };
const SCALE_PARAM = { group: { name: "Scale Parameters", id: "3" } };
const SELECT_PARAM = { group: { name: "Select Parameters", id: "4" } };
const HOVER_PARAM = { group: { name: "Hover Parameters", id: "5" } };
const SWAP_PARAM = { group: { name: "Swap Parameters", id: "6" } };

@ccclass("CardVisual")
export class CardVisual extends Component {
  @type(Node) shakeAnchor: Node = null;
  @type(Node) tiltAnchor: Node = null;
  @type(Sprite) sprite: Sprite = null;
  @type(Node) visualShadow: Node = null;
  @property([Material]) materials: Material[] = [];
  @property([SpriteFrame]) cardSfs: SpriteFrame[] = [];

  material: Material;
  time: number = 0;

  @property(FOLLOW_PARAM)
  private followSpeed = 30;

  @property(ROTATION_PARAM)
  private rotationAmount = 20;

  @property(ROTATION_PARAM)
  private rotationSpeed = 50;

  @property(ROTATION_PARAM)
  private autoTiltAmount = 20;

  @property(ROTATION_PARAM)
  private manualTiltAmount = 20;

  @property(ROTATION_PARAM)
  private tiltSpeed = 20;

  @property(SCALE_PARAM)
  private scaleAnimations = true;

  @property(SCALE_PARAM)
  private scaleOnHover = 1.15;

  @property(SCALE_PARAM)
  private scaleOnSelect = 1.25;

  @property(SCALE_PARAM)
  private scaleTransition = 0.15;

  @property(SELECT_PARAM)
  private selectPunchAmount = 20;

  @property(HOVER_PARAM)
  private hoverPunchAngle = 5;

  @property(HOVER_PARAM)
  private hoverTransition = 0.15;

  @property(SWAP_PARAM)
  private swapAnimations = true;

  @property(SWAP_PARAM)
  private swapRotationAngle = 30;

  @property(SWAP_PARAM)
  private swapTransition = 0.15;

  @property(SWAP_PARAM)
  private swapVibrato = 5;

  @property(CurveRange)
  positioningCurve: CurveRange = new CurveRange();

  @float
  // positioningInfluence = 0.02 * 128;
  positioningInfluence = 100;

  @property(CurveRange)
  rotationCurve: CurveRange = new CurveRange();

  @float
  rotationInfluence = 1.2;

  private curveYOffset = 0;
  private curveRotationOffset = 0;

  private mouseLocation = v3();

  randomOffset: Vec2 = v2();
  private card: Card = null;
  private posVec: Vec3 = v3();
  private movementDelta: Vec3 = v3();
  private rotationDelta: Vec3 = v3();
  private visualMat = mat4();

  private shadowDistance = v3();
  // private shadowOffset = 20;
  private shadowOffset = v3(-133, -191).normalize().multiplyScalar(20);
  private savedIdx = 0;

  onLoad() {
    const visualContainer = find("Canvas/card-visual-container");
    Mat4.invert(this.visualMat, visualContainer.parent.worldMatrix);
  }

  start() {
    const randomNumer = Math.floor(Math.random() * 3);
    if (randomNumer < 2) {
      this.sprite.setMaterialInstance(this.materials[randomNumer], 0);
      this.material = this.sprite.getMaterialInstance(0);
    } else {
      this.material = this.sprite.sharedMaterial;
    }

    this.sprite.spriteFrame =
      this.cardSfs[Math.floor(Math.random() * this.cardSfs.length)];

    this.shadowDistance = this.visualShadow.position.clone();
  }

  initialzie(card: Card) {
    this.card = card;
    this.node.setPosition(this.card.visualPosition);
    this.node.setParent(find("Canvas/card-visual-container"));

    // if (this.card.parentIdx === 0) {
    //   this.node.setWorldScale(1.5, 1.5, 1);
    // }
  }

  update(deltaTime: number) {
    let xAngle = this.clampAngle(this.tiltAnchor.eulerAngles.x, -90, 90);
    let yAngle = this.clampAngle(this.tiltAnchor.eulerAngles.y, -90, 90);

    xAngle = remap(xAngle, -20, 20, -0.5, 0.5);
    yAngle = remap(yAngle, -20, 20, -0.5, 0.5);

    const h = this.material.passes[0].getHandle("rotation"); // Get the handle of the corresponding Uniform
    this.material.passes[0].setUniform(h, v2(xAngle, yAngle)); // Use 'Pass.setUniform' to set the Uniform property

    this.time += deltaTime;

    if (this.card != null) {
      this.handPositioning();
      this.smoothFollow(deltaTime);
      this.followRotation(deltaTime);
      this.cardTilt(deltaTime);
    }
  }

  handPositioning() {
    this.curveYOffset =
      this.positioningCurve.evaluate(this.card.normalizedPosition, 0) *
      this.positioningInfluence *
      this.card.siblingAmount;

    this.curveYOffset = this.card.siblingAmount < 5 ? 0 : this.curveYOffset;
    this.curveRotationOffset = this.rotationCurve.evaluate(
      this.card.normalizedPosition,
      0
    );
  }

  smoothFollow(deltatime: number) {
    if (this.card == null) return;
    const verticalOffset = this.posVec.set(
      0,
      this.card.dragging ? 0 : this.curveYOffset,
      0
    );
    Vec3.lerp(
      this.posVec,
      this.node.worldPosition,
      Vec3.add(this.posVec, this.card.node.worldPosition, verticalOffset),
      clamp01(this.followSpeed * deltatime)
    );
    this.node.setWorldPosition(this.posVec);
  }

  followRotation(deltatime: number) {
    // const movement = Vec3.subtract(
    //   this.posVec,
    //   this.node.position,
    //   this.card.visualPosition
    // ).multiplyScalar(1 / 128);

    // Vec3.lerp(
    //   this.movementDelta,
    //   this.movementDelta,
    //   movement,
    //   clamp01(25 * deltatime)
    // );

    // const movementRotation = Vec3.multiplyScalar(
    //   this.posVec,
    //   this.card.dragging ? this.movementDelta : movement,
    //   60
    // );

    // Vec3.lerp(
    //   this.rotationDelta,
    //   this.rotationDelta,
    //   movementRotation,
    //   clamp01(5 * deltatime)
    // );

    // this.node.angle = clamp(this.rotationDelta.x, -60, 60);

    const movement = Vec3.subtract(
      this.posVec,
      this.node.worldPosition,
      this.card.node.worldPosition
    ).multiplyScalar(1 / 128);
    Vec3.lerp(
      this.movementDelta,
      this.movementDelta,
      movement,
      clamp01(25 * deltatime)
    );

    const movementRotation = Vec3.multiplyScalar(
      this.posVec,
      this.card.dragging ? this.movementDelta : movement,
      this.rotationAmount
    );
    Vec3.lerp(
      this.rotationDelta,
      this.rotationDelta,
      movementRotation,
      clamp01(this.rotationSpeed * deltatime)
    );

    this.node.angle = clamp(this.rotationDelta.x, -60, 60);
    // const worldRotationEuler = Quat.toEuler(v3(), this.node.worldRotation);
    // this.node.setWorldRotationFromEuler(worldRotationEuler.x, worldRotationEuler.y, clamp(this.rotationDelta.x, -60, 60));
  }

  clampAngle(angle: number, min: number, max: number) {
    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;
    return misc.clampf(angle, min, max);
  }

  cardTilt(deltaTime: number) {
    this.savedIdx = this.card.parentIdx;

    const sine =
      Math.sin(this.time + this.savedIdx) * (this.card.hovering ? 0.2 : 1);
    const cosine =
      Math.cos(this.time + this.savedIdx) * (this.card.hovering ? 0.2 : 1);
    // const worldTiltEulerAngles = Quat.toEuler(v3(), this.tiltAnchor.worldRotation);
    if (this.card.parentIdx === 0) {
      // console.log('euler get', worldTiltEulerAngles.x, worldTiltEulerAngles.y, worldTiltEulerAngles.z);
    }

    const offset = Vec3.subtract(
      this.posVec,
      this.node.worldPosition,
      this.mouseLocation
    );
    const tiltX = this.card.hovering
      ? (-offset.y * this.manualTiltAmount) / 128
      : 0;
    const tiltY = this.card.hovering
      ? (offset.x * this.manualTiltAmount) / 128
      : 0;
    const tiltZ = this.card.dragging
      ? this.tiltAnchor.eulerAngles.z
      : this.curveRotationOffset *
        this.rotationInfluence *
        this.card.siblingAmount;

    const lerpX = this.lerpAngle(
      this.tiltAnchor.eulerAngles.x,
      tiltX + sine * this.autoTiltAmount,
      this.tiltSpeed * deltaTime
    );
    const lerpY = this.lerpAngle(
      this.tiltAnchor.eulerAngles.y,
      tiltY + cosine * this.autoTiltAmount,
      this.tiltSpeed * deltaTime
    );
    const lerpZ = this.lerpAngle(
      this.tiltAnchor.eulerAngles.z,
      tiltZ,
      (this.tiltSpeed / 2) * deltaTime
    );

    // this.tiltAnchor.eulerAngles = v3(lerpX, lerpY, lerpZ);
    // const worldRot = Quat.fromEuler(quat(), lerpX, lerpY, lerpZ);
    if (this.card.parentIdx === 0) {
      // console.log('euler save', lerpX, lerpY, lerpZ);
      // console.log('tilt x y', tiltX, tiltY);
      // console.log('lerp z', tiltZ, worldTiltEulerAngles.z, lerpZ);
      // console.log('offset tilt', offset);
      console.log(
        "world rot",
        this.tiltAnchor.worldRotation.getEulerAngles(v3())
      );
    }
    this.tiltAnchor.eulerAngles = v3(lerpX, lerpY, lerpZ);

    // this.tiltAnchor.setWorldRotationFromEuler(lerpX, lerpY, lerpZ);
    // this.node.setRotationFromEuler(lerpX, lerpY, lerpZ);
  }

  lerpAngle(a: number, b: number, t: number): number {
    let delta = this.deltaAngle(a, b);
    return a + delta * clamp01(t);
  }

  deltaAngle(current: number, target: number): number {
    let diff = this.repeat(target - current, 360);
    if (diff > 180) diff -= 360;
    return diff;
  }

  repeat(t: number, length: number): number {
    return t - Math.floor(t / length) * length;
  }

  updateIndex() {
    this.node.setSiblingIndex(this.card.node.parent.getSiblingIndex());
  }

  swap(dir = 1) {
    if (!this.swapAnimations) return;

    Tween.stopAllByTarget(this.shakeAnchor);
    this.shakeAnchor.eulerAngles = v3(0, 0, 0);
    punchRotation(
      this.shakeAnchor,
      v3(0, 0, this.swapRotationAngle * dir),
      this.swapTransition,
      this.swapVibrato,
      1
    );
  }

  onBeginDrag() {
    this.node.setParent(find("Canvas/hover-card-visual-container"));

    Tween.stopAllByTarget(this.node);
    tween(this.node)
      .to(
        this.scaleTransition,
        { scale: v3(this.scaleOnSelect, this.scaleOnSelect, 1) },
        { easing: easing.backOut }
      )
      .start();
  }

  onEndDrag() {
    Tween.stopAllByTarget(this.node);
    tween(this.node)
      .to(
        this.scaleTransition,
        { scale: v3(1, 1, 1) },
        { easing: easing.backOut }
      )
      .start();
  }

  onPointerUp() {
    if (this.scaleAnimations) {
      Tween.stopAllByTarget(this.node);
      tween(this.node)
        .to(
          this.scaleTransition,
          { scale: v3(this.scaleOnHover, this.scaleOnHover, 1) },
          { easing: easing.backOut }
        )
        .start();
    }

    this.visualShadow.setPosition(this.shadowDistance);
  }

  onPointerDown() {
    if (this.scaleAnimations) {
      Tween.stopAllByTarget(this.node);
      tween(this.node)
        .to(
          this.scaleTransition,
          { scale: v3(this.scaleOnSelect, this.scaleOnSelect, 1) },
          { easing: easing.backOut }
        )
        .start();
    }

    this.visualShadow.setPosition(
      Vec3.add(v3(), this.visualShadow.position, this.shadowOffset)
    );
  }

  onPointerEnter() {
    if (this.scaleAnimations) {
      Tween.stopAllByTarget(this.node);
      tween(this.node)
        .to(
          this.scaleTransition,
          { scale: v3(this.scaleOnHover, this.scaleOnHover, 1) },
          { easing: easing.backOut }
        )
        .start();
    }
    Tween.stopAllByTarget(this.shakeAnchor);
    this.shakeAnchor.eulerAngles = v3(0, 0, 0);
    punchRotation(
      this.shakeAnchor,
      v3(0, 0, this.hoverPunchAngle),
      this.hoverTransition,
      20,
      1
    );
  }

  onPointerExit() {
    if (!this.card.dragging) {
      Tween.stopAllByTarget(this.node);
      tween(this.node)
        .to(
          this.scaleTransition,
          { scale: Vec3.ONE },
          { easing: easing.backOut }
        )
        .start();
    }
  }

  setMouseMoveLocation(location: Vec2) {
    this.mouseLocation.set(location.x, location.y);
  }
}
//14.796913577560792 -3.2893521503058585 -83.17835910709736 save
//6.656821045123438 -11.896242042339743 -84.92920251737833 get
