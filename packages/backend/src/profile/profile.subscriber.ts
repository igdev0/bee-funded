import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import ProfileEntity from './entities/profile.entity';
import NotificationSettings from '../notification/entities/notification-settings.entity'; // Your new entity

@EventSubscriber()
export class ProfileSubscriber
  implements EntitySubscriberInterface<ProfileEntity>
{
  constructor(private readonly dataSource: DataSource) {
    // Register the subscriber with the data source
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return ProfileEntity;
  }

  async afterInsert(event: InsertEvent<ProfileEntity>) {
    const profile = event.entity;

    // Create a new NotificationSettings entity with default values
    const newSettings = new NotificationSettings();
    newSettings.profile = { id: profile.id } as ProfileEntity; // Assign the profile ID

    // Use the entity manager to save the new settings entity
    await event.manager.save(newSettings);
  }
}
