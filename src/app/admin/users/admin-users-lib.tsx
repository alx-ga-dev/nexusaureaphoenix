
// src/app/admin/users/admin-users-lib.tsx
import * as z from 'zod';
import { User } from '@/lib/types';

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  type: z.enum(["Blue", "Pink", "Black"], { message: "User type is required." }),
  roleLevel: z.number().min(0, { message: "Role level must be at least 0." }),
});

export type UserFormValues = z.infer<typeof userSchema>;

export interface UserClientProps {
  
  initialEditUser: User | null;
  serverError?: string | null;
}


