import { z } from "zod";

/**
 * Org-scoped roles, ordered by privilege. `super_admin` is platform-level (StayBoost
 * staff); the rest are tenant roles attached via a Membership.
 */
export const ROLES = ["super_admin", "owner", "manager", "staff"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** Higher number = more privilege. Used for "at least this role" checks. */
export const ROLE_RANK: Readonly<Record<Role, number>> = {
  staff: 1,
  manager: 2,
  owner: 3,
  super_admin: 4,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// Enterprise password policy: length is the dominant factor; require a mix to
// resist trivial guesses. Validated identically on client and server.
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Include upper- and lower-case letters and a number",
  });

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const signupInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  organizationName: z.string().trim().min(2).max(160),
});
export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const requestPasswordResetInputSchema = z.object({ email: emailSchema });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(10).max(256),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const verifyEmailInputSchema = z.object({ token: z.string().min(10).max(256) });
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const magicLinkRequestInputSchema = z.object({ email: emailSchema });
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestInputSchema>;

export const magicLinkConsumeInputSchema = z.object({ token: z.string().min(10).max(256) });
export type MagicLinkConsumeInput = z.infer<typeof magicLinkConsumeInputSchema>;

/** Public shape of the authenticated user (never includes secrets). */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
  organizations: z.array(
    z.object({
      orgId: z.string(),
      orgName: z.string(),
      role: roleSchema,
    }),
  ),
});
export type AuthUser = z.infer<typeof authUserSchema>;
