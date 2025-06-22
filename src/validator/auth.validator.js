import { z } from "zod";

const registerSchema = z.object({
  fullName: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username must be at most 20 characters long" }),

  email: z.string().trim().email({ message: "Invalid email address" }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" })
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/, {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
});

const loginSchema = registerSchema.omit({
  fullName: true,
  username: true,
});

const emailVerification = registerSchema.pick({ email: true });
const resetPasswordSchema = registerSchema.pick({ newPassword: true });

const changeCurrentPassword = z.object({
  oldPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" })
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/, {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  newPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" })
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/, {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
});

const validateRegisterData = (data) => {
  return registerSchema.safeParse(data);
};

const validateLoginData = (data) => {
  return loginSchema.safeParse(data);
};

const validateEmailData = (data) => {
  return emailVerification.safeParse(data);
};

const validateChangePassword = (data) => {
  return changeCurrentPassword.safeParse(data);
};

const validateResetPassword = (data) => {
  return resetPasswordSchema.safeParse(data);
};

export {
  validateRegisterData,
  validateLoginData,
  validateEmailData,
  validateChangePassword,
  validateResetPassword,
};
