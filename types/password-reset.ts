export type PasswordResetValidationData = {
  email: string;
  expiresAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ConfirmPasswordResetInput = {
  token: string;
  password: string;
};
