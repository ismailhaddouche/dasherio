import { ClientSession, startSession } from 'mongoose';
import { logger } from '../config/logger';

/**
 * Transaction wrapper for MongoDB operations
 * Automatically handles session creation, commit, and rollback
 * 
 * Usage:
 * const result = await withTransaction(async (session) => {
 *   const order = await orderRepo.create(data, session);
 *   const item = await itemRepo.create(itemData, session);
 *   return { order, item };
 * });
 */
export async function withTransaction<T>(
  operations: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await startSession();
  
  try {
    session.startTransaction();
    
    const result = await operations(session);
    
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error({ error }, 'Transaction aborted due to error');
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Run operations within an existing session
 * Use this when you already have a session from a parent transaction
 */
export async function withSession<T>(
  _session: ClientSession,
  operations: () => Promise<T>
): Promise<T> {
  return operations();
}

/**
 * Type for repository methods that support transactions
 * All create/update/delete methods should accept an optional session parameter
 */
export type WithSession<T> = T & { session?: ClientSession };
