import { RoleEnum } from "../app/enums";

export type RequestUser = {
    name: string;
    id: string;
    email: string;
    cpf: string;
    lastName: string;
    phone: string | null;
    permissions: number[];
    roles: RoleEnum[]
}
