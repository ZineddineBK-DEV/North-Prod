export type NotificationType =
  | 'booking_pending' | 'booking_confirmed' | 'booking_rejected' | 'booking_reminder'
  | 'project_updated' | 'project_delivered'
  | 'file_uploaded' | 'message_received' | 'system';

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  resourceId?: string;
  resourceType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
