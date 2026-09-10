import type { Request, Response } from "express";
import * as consoleService from "./console.service";

export async function alerts(_req: Request, res: Response) {
  res.json(await consoleService.getAlertCounts());
}
