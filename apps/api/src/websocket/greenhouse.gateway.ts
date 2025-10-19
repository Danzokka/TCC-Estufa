import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  greenhouseId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/greenhouse',
})
export class GreenhouseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GreenhouseGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided from ${client.id}`,
        );
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      this.connectedClients.set(client.id, client);
      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId})`,
      );

      // Join user-specific room
      client.join(`user-${client.userId}`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-greenhouse')
  handleJoinGreenhouse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() greenhouseId: string,
  ) {
    if (!client.userId) {
      return { success: false, message: 'Not authenticated' };
    }

    client.greenhouseId = greenhouseId;
    client.join(`greenhouse-${greenhouseId}`);

    this.logger.log(`User ${client.userId} joined greenhouse ${greenhouseId}`);
    return { success: true, message: `Joined greenhouse ${greenhouseId}` };
  }

  @SubscribeMessage('leave-greenhouse')
  handleLeaveGreenhouse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() greenhouseId: string,
  ) {
    client.leave(`greenhouse-${greenhouseId}`);
    this.logger.log(`User ${client.userId} left greenhouse ${greenhouseId}`);
    return { success: true, message: `Left greenhouse ${greenhouseId}` };
  }

  // Notification methods
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user-${userId}`).emit(event, data);
  }

  emitToGreenhouse(greenhouseId: string, event: string, data: any) {
    this.server.to(`greenhouse-${greenhouseId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Specific notification methods for irrigation
  notifyPumpActivated(userId: string, greenhouseId: string, pumpData: any) {
    const notification = {
      type: 'pump_activated',
      title: 'Bomba Ativada',
      message: `Bomba ativada por ${pumpData.duration}s, liberando ${pumpData.waterAmount}L de água`,
      data: pumpData,
      timestamp: new Date().toISOString(),
    };

    this.emitToUser(userId, 'notification', notification);
    this.emitToGreenhouse(greenhouseId, 'pump-activated', pumpData);
  }

  notifyIrrigationDetected(
    userId: string,
    greenhouseId: string,
    irrigationData: any,
  ) {
    const notification = {
      type: 'irrigation_detected',
      title: 'Irrigação Detectada',
      message: `Detectado aumento de ${irrigationData.moistureIncrease.toFixed(1)}% na umidade do solo`,
      data: irrigationData,
      timestamp: new Date().toISOString(),
      requiresAction: true,
      actionUrl: `/irrigation/confirm/${irrigationData.id}`,
    };

    this.emitToUser(userId, 'notification', notification);
    this.emitToGreenhouse(greenhouseId, 'irrigation-detected', irrigationData);
  }

  notifyIrrigationConfirmed(
    userId: string,
    greenhouseId: string,
    irrigationData: any,
  ) {
    const notification = {
      type: 'irrigation_confirmed',
      title: 'Irrigação Confirmada',
      message: `Irrigação manual confirmada: ${irrigationData.waterAmount}L de água`,
      data: irrigationData,
      timestamp: new Date().toISOString(),
    };

    this.emitToUser(userId, 'notification', notification);
    this.emitToGreenhouse(greenhouseId, 'irrigation-confirmed', irrigationData);
  }
}
