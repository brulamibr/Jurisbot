import {
  initAuthCreds,
  BufferJSON,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
  type SignalDataSet,
} from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";

export async function usePrismaAuthState(
  instanceId: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const instance = await prisma.whatsappInstance.findUniqueOrThrow({
    where: { id: instanceId },
    select: { sessionData: true },
  });

  let creds: AuthenticationCreds;
  if (instance.sessionData) {
    creds = JSON.parse(
      JSON.stringify(instance.sessionData),
      BufferJSON.reviver
    );
  } else {
    creds = initAuthCreds();
  }

  const saveCreds = async () => {
    const serialized = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
    await prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { sessionData: serialized },
    });
  };

  const keys = {
    async get<T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[]
    ): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
      const rows = await prisma.whatsappAuthKey.findMany({
        where: {
          instanceId,
          keyType: type,
          keyId: { in: ids },
        },
        select: { keyId: true, value: true },
      });

      const result: { [id: string]: SignalDataTypeMap[T] } = {};
      for (const row of rows) {
        const parsed = JSON.parse(
          JSON.stringify(row.value),
          BufferJSON.reviver
        );
        result[row.keyId] = parsed;
      }
      return result;
    },

    async set(data: SignalDataSet): Promise<void> {
      const ops: Promise<unknown>[] = [];

      for (const type in data) {
        const entries = data[type as keyof SignalDataSet]!;
        for (const [id, value] of Object.entries(entries)) {
          if (value === null || value === undefined) {
            ops.push(
              prisma.whatsappAuthKey.deleteMany({
                where: { instanceId, keyType: type, keyId: id },
              })
            );
          } else {
            const serialized = JSON.parse(
              JSON.stringify(value, BufferJSON.replacer)
            );
            ops.push(
              prisma.whatsappAuthKey.upsert({
                where: {
                  instanceId_keyType_keyId: {
                    instanceId,
                    keyType: type,
                    keyId: id,
                  },
                },
                create: {
                  instanceId,
                  keyType: type,
                  keyId: id,
                  value: serialized,
                },
                update: { value: serialized },
              })
            );
          }
        }
      }

      await Promise.all(ops);
    },
  };

  return { state: { creds, keys }, saveCreds };
}
