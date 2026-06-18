export type {
  OfficeModel as Office,
  UserModel as User,
  WhatsappInstanceModel as WhatsappInstance,
  ContactModel as Contact,
  ConversationModel as Conversation,
  MessageModel as Message,
  LeadModel as Lead,
  ProcessModel as Process,
  ProcessMovementModel as ProcessMovement,
  KnowledgeDocumentModel as KnowledgeDocument,
  KnowledgeChunkModel as KnowledgeChunk,
  AiConfigModel as AiConfig,
} from "@/generated/prisma/models";

export {
  UserRole,
  WhatsappStatus,
  ContactType,
  ConversationStatus,
  MessageSender,
  MessageType,
  LeadScore,
  LeadUrgency,
  DocumentStatus,
} from "@/generated/prisma/enums";
