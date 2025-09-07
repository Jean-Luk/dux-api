import { Manager } from "@prisma/client";
import { PermissionEnum, RoleEnum } from "../app/enums";

export type RequestUser = {
    name: string;
    id: string;
    email: string;
    cpf: string;
    lastName: string;
    phone: string | null;
    permissions: PermissionEnum[];
    roles: RoleEnum[];
    manager: Manager|null;
}
