DB READY TABLE:
	'enum WebhookEventStatus {
		PROCESSING
		PROCESSED
		FAILED
	}

	model WebhookEvent {
		id         String             @id @default(uuid())
		eventId    String             @unique
		eventType  String
		provider   String

		// Estado do processamento (base para logs e idempotência real)
		status     WebhookEventStatus @default(PROCESSING)

		// Timestamps de auditoria
		createdAt    DateTime           @default(now())   //quando o evento chegou
		updatedAt    DateTime           @updatedAt        //última mudança de estado
		processedAt  DateTime?                        //quando finalizou com sucesso
		failedAt     DateTime?                            //quando falhou
		failReason   String?                              //motivo resumido da falha
	}'
