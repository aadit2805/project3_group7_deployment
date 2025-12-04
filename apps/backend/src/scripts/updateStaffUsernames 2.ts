/**
 * Script to update staff usernames from email to name for Google OAuth users
 * Run with: npx ts-node apps/backend/src/scripts/updateStaffUsernames.ts
 */

import prisma from '../config/prisma';

async function updateStaffUsernames() {
  try {
    // Find all staff entries that look like emails (contain @)
    const staffWithEmails = await prisma.staff.findMany({
      where: {
        username: {
          contains: '@',
        },
        password_hash: 'GOOGLE_AUTH_USER',
      },
    });

    console.log(`Found ${staffWithEmails.length} staff entries with email usernames`);

    for (const staff of staffWithEmails) {
      // Try to find the corresponding User entry to get the name
      const user = await prisma.user.findUnique({
        where: { id: staff.staff_id },
        select: { name: true, email: true },
      });

      if (user && user.name && user.name !== staff.username) {
        await prisma.staff.update({
          where: { staff_id: staff.staff_id },
          data: { username: user.name },
        });
        console.log(`Updated staff ${staff.staff_id}: ${staff.username} -> ${user.name}`);
      } else {
        console.log(`Skipping staff ${staff.staff_id}: No name found in User table`);
      }
    }

    console.log('Update complete!');
  } catch (error) {
    console.error('Error updating staff usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStaffUsernames();

