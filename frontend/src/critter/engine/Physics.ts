/**
 * Intégrateur de particule 2D minimal : forces -> accélération -> vitesse ->
 * position, avec inertie et amortissement. Pas de collisions rigides ici — le
 * critter est un point souple, pas un solide.
 *
 * Les forces sont accumulées pendant la frame (`applyForce`) puis consommées par
 * `integrate(dt)` (semi-implicite d'Euler : stable et suffisant à cette échelle).
 */
import type { Vec2 } from "../core/types";
import { addScaledMut, limitMut, scaleMut, set } from "../core/vec2";

export interface BodyOptions {
  position?: Vec2;
  mass?: number;
  /** Fraction de vitesse conservée par seconde (0 = stoppe net, 1 = sans frottement). */
  damping?: number;
  /** Vitesse maximale (px/s). */
  maxSpeed?: number;
  /** Force maximale appliquable par pas (garde-fou anti explosion). */
  maxForce?: number;
}

export class Body {
  readonly position: Vec2;
  readonly velocity: Vec2 = { x: 0, y: 0 };
  readonly acceleration: Vec2 = { x: 0, y: 0 };

  mass: number;
  damping: number;
  maxSpeed: number;
  maxForce: number;

  constructor(opts: BodyOptions = {}) {
    this.position = opts.position ? { ...opts.position } : { x: 0, y: 0 };
    this.mass = opts.mass ?? 1;
    this.damping = opts.damping ?? 0.86;
    this.maxSpeed = opts.maxSpeed ?? 220;
    this.maxForce = opts.maxForce ?? 900;
  }

  /** Ajoute une force au cumul de la frame (F = m·a). */
  applyForce(fx: number, fy: number): void {
    this.acceleration.x += fx / this.mass;
    this.acceleration.y += fy / this.mass;
  }

  applyForceV(f: Vec2): void {
    this.applyForce(f.x, f.y);
  }

  /** Impulsion instantanée sur la vitesse (ex. réaction à un clic). */
  applyImpulse(ix: number, iy: number): void {
    this.velocity.x += ix / this.mass;
    this.velocity.y += iy / this.mass;
  }

  integrate(dt: number): void {
    // borne l'accélération accumulée
    limitMut(this.acceleration, this.maxForce);

    // v += a·dt
    addScaledMut(this.velocity, this.acceleration, dt);

    // amortissement exponentiel indépendant du framerate
    const d = Math.pow(this.damping, dt * 60);
    scaleMut(this.velocity, d);

    limitMut(this.velocity, this.maxSpeed);

    // x += v·dt
    addScaledMut(this.position, this.velocity, dt);

    // reset du cumul de forces
    set(this.acceleration, 0, 0);
  }

  get speed(): number {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }
}

/**
 * Force de « seek » : dirige le corps vers `target` à `maxSpeed`, en corrigeant
 * la vitesse actuelle (steering behaviour de Reynolds).
 */
export function seek(body: Body, tx: number, ty: number, weight = 1): void {
  const dx = tx - body.position.x;
  const dy = ty - body.position.y;
  const d = Math.hypot(dx, dy) || 1;
  const desiredX = (dx / d) * body.maxSpeed;
  const desiredY = (dy / d) * body.maxSpeed;
  body.applyForce((desiredX - body.velocity.x) * weight, (desiredY - body.velocity.y) * weight);
}

/**
 * Idem `seek` mais ralentit en approchant (`slowRadius`), pour se poser en
 * douceur sur une cible plutôt que de la dépasser.
 */
export function arrive(body: Body, tx: number, ty: number, slowRadius = 60, weight = 1): void {
  const dx = tx - body.position.x;
  const dy = ty - body.position.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return;
  const targetSpeed = d < slowRadius ? body.maxSpeed * (d / slowRadius) : body.maxSpeed;
  const desiredX = (dx / d) * targetSpeed;
  const desiredY = (dy / d) * targetSpeed;
  body.applyForce((desiredX - body.velocity.x) * weight, (desiredY - body.velocity.y) * weight);
}

/**
 * Repousse le corps vers l'intérieur d'un rectangle [0..w, 0..h] quand il
 * approche du bord (marge `pad`). Garde le critter dans le cadre sans rebond dur.
 */
export function containWithin(body: Body, w: number, h: number, pad = 24, weight = 1): void {
  const k = body.maxForce * 0.02 * weight;
  if (body.position.x < pad) body.applyForce(k * (1 - body.position.x / pad), 0);
  else if (body.position.x > w - pad)
    body.applyForce(-k * (1 - (w - body.position.x) / pad), 0);
  if (body.position.y < pad) body.applyForce(0, k * (1 - body.position.y / pad));
  else if (body.position.y > h - pad)
    body.applyForce(0, -k * (1 - (h - body.position.y) / pad));
}
