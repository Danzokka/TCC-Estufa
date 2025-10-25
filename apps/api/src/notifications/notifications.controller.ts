import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.getUserNotifications(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete('cleanup')
  async cleanupOldNotifications(
    @Request() req,
    @Body() body: { daysOld?: number },
  ) {
    const userId = req.user.sub;
    return this.notificationsService.deleteOldNotifications(
      userId,
      body.daysOld || 30,
    );
  }

  @Delete('clear-read')
  async clearReadNotifications(@Request() req) {
    const userId = req.user.sub;
    const count =
      await this.notificationsService.clearReadNotifications(userId);
    return {
      message: `${count} notificações lidas foram removidas`,
      count,
    };
  }
}
