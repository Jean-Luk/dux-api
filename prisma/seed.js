import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Cria as permissões na tabela permissions
    console.log("Criando as permissões...");
    const permissions = [
        {id:0, description:"Editar permissões", defaultValue:false },
        {id:1, description:"Operar linhas", defaultValue:true },
        {id:2, description:"Operar carteirinhas", defaultValue:true },
        {id:3, description:"Operar documentos", defaultValue:false },
        {id:4, description:"Editar passageiros", defaultValue:false },
        {id:5, description:"Editar motoristas", defaultValue:false },
        {id:6, description:"Convidar gestores", defaultValue:false }
    ];

    for (const permission of permissions) {
        console.log("Criando a permissão: " + permission.description)
        await prisma.permission.upsert({
            where: { id: permission.id },
            update: permission,
            create: permission,
        });
    }
    console.log("Permissões criadas.");

    // Cria o usuário root com todas as permissões
    console.log("Criando usuário admin...")

    const adminUserData = {
            id:"1",
            email:"admin",
            cpf:"123",
            name:"Admin",
            lastName:"Root",
            phone:"11111111111",
            login: {
                create:
                    {
                        password:"$2b$10$o857eEqIvy0fply6w5hFxOX7sw3rpQryjyCDahglTa6qYGu8WJ2p6",
                        salt:"$2b$10$o857eEqIvy0fply6w5hFxO"
                    }                        
            }
    }

    const adminUser = await prisma.user.upsert({
        where: {id:"1"},
        update: adminUserData,
        create: adminUserData
    });
    console.log("Usuário admin criado.")

    console.log("Criando gestor admin...")
    const adminManager = await prisma.manager.create({
        data:{userId:adminUser.id}
    });

    console.log("Adicionando permissões ao gestor admin...")
    for (const permission of permissions) {
        await prisma.managerPermission.create({
            data: {
                active:true,
                managerId:adminManager.id,
                permissionId:permission.id,
            }
        });
        console.log("Permissão " + permission.description + " adicionada.");
    }
    console.log("Gestor admin criado.")

    console.log("Seed criada");
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
