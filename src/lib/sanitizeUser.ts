import type { User } from '@prisma/client'

export const sanitizeUser = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isSubscribed: user.isSubscribed,
    customerId: user.customerId,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }
}
