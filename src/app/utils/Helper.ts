import { RoleEnum } from "../enums";

export class Helper {
    static isValidCPF(cpf:string) : boolean {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]+/g, '');

        // Verifica se não tem 11 dígitos ou se todos os dígitos são iguais (inválido)
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit1 = 11 - (sum % 11);
        if (digit1 >= 10) digit1 = 0;
        if (digit1 !== parseInt(cpf.charAt(9))) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let digit2 = 11 - (sum % 11);
        if (digit2 >= 10) digit2 = 0;
        if (digit2 !== parseInt(cpf.charAt(10))) return false;

        return true;    
    }

    static sanitizeCPF(cpf:string) : string {
        return cpf.replace(/[^\d]/g, '');
    }

    static sanitizePhone(phone:string) : string {
        return phone.replace(/[^\d]/g, '');
    }

    static isValidEmail(email:string) : boolean {
        // Expressão regular para validar formato básico de e-mail
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static isValidPhone(phone: string): boolean {
        // Remove todos os caracteres não numéricos
        const digits = phone.replace(/[^\d]/g, '');
        // Verifica se tem 10 (fixo) ou 11 (celular) digitos
        return digits.length === 10 || digits.length === 11;
    }

    static isValidRole(role:string) : boolean {
        // Validar se a string equivale a "M", "D" ou "P"
        return Object.values(RoleEnum).includes(role as RoleEnum);
    }
}
