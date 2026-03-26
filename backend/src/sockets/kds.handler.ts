import { Server } from 'socket.io';
import { ItemOrder } from '../models/order.model';
import { logger } from '../config/logger';
import { AuthenticatedSocket } from '../middlewares/socketAuth';

export function registerKdsHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Verify user has kitchen permissions
  const user = socket.user;
  if (!user || !user.permissions.includes('KITCHEN')) {
    logger.warn({ socketId: socket.id }, 'Unauthorized KDS connection attempt');
    socket.disconnect();
    return;
  }

  socket.on('kds:join', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'KDS joined session room');
  });

  socket.on('kds:item_prepare', async ({ itemId }: { itemId: string }) => {
    try {
      // Atomic update to prevent race conditions
      const item = await ItemOrder.findOneAndUpdate(
        { _id: itemId, item_state: 'ORDERED' },
        { item_state: 'ON_PREPARE' },
        { new: true }
      );

      if (!item) {
        logger.warn({ itemId, userId: user.staffId }, 'Item not found or not in ORDERED state');
        return;
      }

      io.to(`session:${item.session_id.toString()}`).emit('item:state_changed', {
        itemId: item._id,
        newState: 'ON_PREPARE',
      });

      logger.info({ itemId, userId: user.staffId }, 'Item marked as ON_PREPARE');
    } catch (err) {
      logger.error({ err, itemId, userId: user.staffId }, 'kds:item_prepare error');
    }
  });

  socket.on('kds:item_serve', async ({ itemId }: { itemId: string }) => {
    try {
      // Atomic update to prevent race conditions
      const item = await ItemOrder.findOneAndUpdate(
        { _id: itemId, item_state: 'ON_PREPARE' },
        { item_state: 'SERVED' },
        { new: true }
      );

      if (!item) {
        logger.warn({ itemId, userId: user.staffId }, 'Item not found or not in ON_PREPARE state');
        return;
      }

      io.to(`session:${item.session_id.toString()}`).emit('item:state_changed', {
        itemId: item._id,
        newState: 'SERVED',
      });

      logger.info({ itemId, userId: user.staffId }, 'Item marked as SERVED');
    } catch (err) {
      logger.error({ err, itemId, userId: user.staffId }, 'kds:item_serve error');
    }
  });
}
