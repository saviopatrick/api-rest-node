import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto from 'crypto'
import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select()

    return { transactions }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTrasactionsShema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getTrasactionsShema.parse(request.params)

    const { sessionId } = request.cookies

    const transaction = await knex('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first()
    return { transaction }
  })

  app.get('/summary', async (request) => {
    const { sessionId } = request.cookies

    const summary = await knex('transactions')
      .sum('amount', { as: 'amount' })
      .where('session_id', sessionId)
      .first()
    return { summary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionSchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })
}
