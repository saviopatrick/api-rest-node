// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    trasactions: {
      id: string
      title: string
      amount: number
      created_at: string
      session_id?: string
    }
  }
}
