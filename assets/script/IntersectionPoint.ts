import { _decorator, Component, Graphics, v2, Vec2 } from "cc";
import { Circle } from "./Circle";
import { Line } from "./Line";
import { Wall } from "./Wall";
const { ccclass, property } = _decorator;

@ccclass("IntersectionPoint")
export class IntersectionPoint extends Component {
  @property(Line) line1: Line = null;
  @property(Line) line2: Line = null;
  @property(Circle) circle: Circle = null;
  @property(Wall) wall: Wall = null;

  moveDir = v2(1, 1).normalize();
  collided = false;

  onLoad() {
    // const [x, y] = this.calIntersectionPoint(this.line1, this.line2);
    const g = this.getComponent(Graphics);
    // g.circle(x, y, 5);
    // g.fill();

    const t = this.calIntersectionTime(
      this.line1.p,
      this.line1.v,
      this.line2.p,
      this.line2.v
    );

    const intersectionPoint = Vec2.add(
      v2(),
      this.line1.p,
      Vec2.multiplyScalar(v2(), this.line1.v, t)
    );

    g.circle(intersectionPoint.x, intersectionPoint.y, 5);
    g.fill();
  }

  // calIntersectionPoint(line1: Line, line2: Line) {
  //   const tc1 = line1.vx - line1.px;
  //   const tc2 = line1.vy - line1.py;
  //   const sc1 = line2.px - line2.vx;
  //   const sc2 = line2.py - line2.vy;
  //   const con1 = line2.px - line1.px;
  //   const con2 = line2.py - line1.py;
  //   const det = tc2 * sc1 - tc1 * sc2;
  //   if (det === 0) return null;

  //   const con = tc2 * con1 - tc1 * con2;
  //   const s = con / det;
  //   return [
  //     line2.px + s * (line2.vx - line2.px),
  //     line2.py + s * (line2.vy - line2.py),
  //   ];
  // }

  calIntersectionTime(p1: Vec2, v1: Vec2, p2: Vec2, v2: Vec2) {
    const tc1 = v1.x;
    const tc2 = v1.y;
    const sc1 = v2.x;
    const sc2 = v2.y;
    const con1 = p2.x - p1.x;
    const con2 = p2.y - p1.y;
    const det = tc2 * sc1 - tc1 * sc2;
    if (det === 0) return null;

    const con = sc1 * con2 - sc2 * con1;
    const t = con / det;
    return t;
  }

  circleWallCollision(cir: Circle, wall: Wall, deltaTime: number) {
    const n = wall.normal;
    const a = Vec2.subtract(
      v2(),
      wall.node.position.toVec2(),
      cir.node.position.toVec2()
    );
    const c = Vec2.dot(a, n);

    if (Math.abs(c) < cir.radius) {
      throw new Error("circle embedded");
    }

    const r = Vec2.multiplyScalar(v2(), n, -cir.radius);
    const displacement = Vec2.multiplyScalar(
      v2(),
      this.moveDir,
      50 * deltaTime
    );

    if (Vec2.dot(displacement, n) > 0) {
      return "none";
    }

    const p = Vec2.add(v2(), cir.node.position.toVec2(), r);
    const t = this.calIntersectionTime(
      p,
      displacement,
      wall.node.position.toVec2(),
      wall.vector
    );

    if (t > 1) {
      return "none";
    }
    return t;
  }

  update(dt: number) {
    const val = this.circleWallCollision(this.circle, this.wall, dt);
    if (val === "none") {
      const displacement = Vec2.multiplyScalar(v2(), this.moveDir, 50 * dt);
      this.circle.node.setPosition(
        Vec2.add(
          v2(),
          this.circle.node.position.toVec2(),
          displacement
        ).toVec3()
      );
    } else if (!this.collided) {
      this.collided = true;
      console.log('val number', val);
    }
  }
}
