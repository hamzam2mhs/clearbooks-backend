import prisma from '../config/prisma';

export async function provisionUser({
  cognitoSub,
  email,
}: {
  cognitoSub: string;
  email?: string;
}) {
  if (!cognitoSub) {
    throw new Error('Missing cognitoSub for provisioning');
  }

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { cognitoSub: cognitoSub },
    include: { business: true },
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. Create user + business
  const user = await prisma.user.create({
    data: {
      cognitoSub: cognitoSub,
      email: email ?? `pending+${cognitoSub}@clearbooks.local`,
      business: {
        create: {
          name: 'My Business',
          province: 'ON',
          gstRegistered: false,
        },
      },
    },
    include: { business: true },
  });

  return user;
}

