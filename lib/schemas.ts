import * as z from "zod"

export const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signUpSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const reportItemSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  location: z.string().min(2, {
    message: "Location is required.",
  }),
  item_type: z.enum(["lost", "found"], {
    required_error: "Please select if the item is lost or found.",
  }),
  date: z.string().optional(), // Optional depending on how it's used
})

export type ReportItemFormValues = z.infer<typeof reportItemSchema>

export const profileSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export const emailUpdateSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export type EmailUpdateFormValues = z.infer<typeof emailUpdateSchema>

export const passwordUpdateSchema = z.object({
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters.",
  }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
})

export type PasswordUpdateFormValues = z.infer<typeof passwordUpdateSchema>
