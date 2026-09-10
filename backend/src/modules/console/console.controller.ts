import type { Request, Response } from "express";
import { sessionRoles } from "../auth/auth.middleware";
import { visibleSections } from "../auth/permissions";
import * as consoleService from "./console.service";

export async function alerts(req: Request, res: Response) {
  const counts = await consoleService.getAlertCounts();
  res.json({ ...counts, sections: visibleSections(sessionRoles(req)) });
}
