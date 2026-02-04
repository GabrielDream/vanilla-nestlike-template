// Simple in-memory idempotency store
// eventId -> timestamp
//const processedEvents = new Map();

import { prisma } from '../../users/db/prisma.js';

/**
 * Tries to acquire an idempotency lock for a webhook event.
 * If the eventId already exists, it was already received.
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.eventType
 * @param {string} params.provider
 * @returns {Promise<{acquired: boolean, status?: string}>} true if lock acquired, false if duplicate
 */
export async function acquireEventLock({ eventId, eventType, provider }) {
	try {
		await prisma.webhookEvent.create({
			data: {
				eventId,
				eventType,
				provider
			}
		});
		return { acquired: true };
	} catch (err) {
		if (err && err.code === 'P2002') {
			const existing = await prisma.webhookEvent.findUnique({
				where: { eventId },
				select: { status: true }
			});
			return {
				acquired: false,
				status: existing?.status ?? null
			}; //P2002 = Prisma dizendo: violou unique constraint
		}
		throw err;
	}
}

export async function markProcessed(eventId) {
	await prisma.webhookEvent.update({
		where: { eventId },
		data: {
			status: 'PROCESSED',
			processedAt: new Date()
		}
	});
}

export async function markFailed(eventId, reason) {
	await prisma.webhookEvent.update({
		where: { eventId },
		data: {
			status: 'FAILED',
			failedAt: new Date(),
			failReason: reason ? String(reason).slice(0, 300) : null
		}
	});
}
