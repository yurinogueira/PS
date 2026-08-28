import { User } from "../../auth/types/auth.types";

export interface ProfileData {
  user: User;
}

export interface UpdateProfilePayload {
  name: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
