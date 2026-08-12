import type { Request, Response } from "express";
import type { OrganizationType } from "@prisma/client";
import { organizationCreateSchema } from "./organizations.schema";
import * as organizationsService from "./organizations.service";

export async function list(req: Request, res: Response) {
  const type = req.query.type as OrganizationType | undefined;
  const organizations = await organizationsService.listOrganizations(type);
  res.json({ organizations });
}

export async function create(req: Request, res: Response) {
  const parsed = organizationCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const organization = await organizationsService.createOrganization(parsed.data);
  res.status(201).json({ organization });
}
