
import 'dotenv/config';
import { db } from './server/db';
import { users, schedules, notifications } from './shared/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting database seed...');

  // Clear existing data
  await db.delete(notifications);
  await db.delete(schedules);
  await db.delete(users);

  console.log('Cleared existing data');

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const [adminUser] = await db.insert(users).values({
    email: 'admin@uith.com',
    password: hashedAdminPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phoneNumber: '555-0100',
    licenseNumber: 'ADM001'
  }).returning();

  console.log('Created admin user');

  // Create physiotherapist user
  const hashedPhysioPassword = await bcrypt.hash('physio123', 10);
  const [physioUser] = await db.insert(users).values({
    email: 'physio@uith.com',
    password: hashedPhysioPassword,
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'physiotherapist',
    phoneNumber: '555-0101',
    licenseNumber: 'PT001'
  }).returning();

  console.log('Created physiotherapist user');

  // Create sample schedules
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  await db.insert(schedules).values([
    {
      userId: physioUser.id,
      date: today.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      location: 'Main Clinic - Room A',
      notes: 'Regular shift - General physiotherapy'
    },
    {
      userId: physioUser.id,
      date: tomorrow.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '16:00',
      location: 'Main Clinic - Room B',
      notes: 'Specialized session - Sports therapy'
    }
  ]);

  console.log('Created sample schedules');

  // Create sample notifications
  await db.insert(notifications).values([
    {
      userId: adminUser.id,
      title: 'Welcome to the System',
      message: 'Welcome to the UITH Physiotherapy Scheduler. You have admin access.',
      type: 'info',
      isRead: false
    },
    {
      userId: physioUser.id,
      title: 'Schedule Created',
      message: 'Your schedule for today has been created.',
      type: 'info',
      isRead: false
    }
  ]);

  console.log('Created sample notifications');
  console.log('Database seeded successfully!');
  
  console.log('\nTest Users:');
  console.log('Admin - Email: admin@uith.com, Password: admin123');
  console.log('Physio - Email: physio@uith.com, Password: physio123');
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
