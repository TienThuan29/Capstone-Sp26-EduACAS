"use client";

import { useState } from "react";
import axios from "axios";
import { Label, TextInput, Spinner } from "flowbite-react";
import {
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { useAuth } from "@/contexts/AuthContext";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { useToast } from "@/hooks/useToast";
import Sidebar from "@/components/sidebar";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const getPasswordStrength = (
  password: string,
): { score: number; text: string; color: string } => {
  let score = 0;
  if (!password) return { score: 0, text: "", color: "" };

  if (password.length >= 5) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2)
    return { score, text: "Weak", color: "bg-red-500" };
  if (score === 3)
    return { score, text: "Medium", color: "bg-yellow-500" };
  if (score === 4)
    return { score, text: "Strong", color: "bg-blue-500" };
  return { score, text: "Very Strong", color: "bg-green-500" };
};

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: PasswordInputProps) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1 block text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      <div className="relative mt-1">
        <TextInput
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={5}
          maxLength={64}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const axiosInstance = useAxios();
  const toast = useToast();

  const [form, setForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = getPasswordStrength(form.newPassword);

  const handleChange = (field: keyof PasswordFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.newPassword || !form.confirmPassword || !form.currentPassword) {
      toast.showError("Please fill in all password fields.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.showError("New password and confirm password do not match.");
      return;
    }

    if (form.newPassword.length < 5 || form.newPassword.length > 64) {
      toast.showError("New password must be between 5 and 64 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.put(Api.Auth.CHANGE_PASSWORD, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      toast.showSuccess("Password changed successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.showError(err.response.data.message);
      } else {
        toast.showError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="ml-20 flex grow items-center justify-center lg:ml-64">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  const passwordsMatch =
    form.confirmPassword &&
    form.newPassword &&
    form.newPassword === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword &&
    form.newPassword &&
    form.newPassword !== form.confirmPassword;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 grow p-4 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>

          {/* Change Password Section */}
          <div className="rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="rounded-full bg-[#1F4E79]/10 p-2 dark:bg-[#C9A24D]/10">
                <KeyIcon className="h-5 w-5 text-[#1F4E79] dark:text-[#C9A24D]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your password to keep your account secure
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <PasswordInput
                id="currentPassword"
                label="Current Password"
                value={form.currentPassword}
                onChange={(val) => handleChange("currentPassword", val)}
                placeholder="Enter your current password"
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              />

              {/* New Password */}
              <div>
                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  value={form.newPassword}
                  onChange={(val) => handleChange("newPassword", val)}
                  placeholder="Enter new password (5-64 characters)"
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword(!showNewPassword)}
                />

                {/* Password strength indicator */}
                {form.newPassword && (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Password strength:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength.score <= 2
                            ? "text-red-500"
                            : passwordStrength.score === 3
                              ? "text-yellow-500"
                              : passwordStrength.score === 4
                                ? "text-blue-500"
                                : "text-green-500"
                        }`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use at least 6 characters with uppercase.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={(val) => handleChange("confirmPassword", val)}
                  placeholder="Re-enter your new password"
                  show={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                />

                {passwordsMismatch && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <XCircleIcon className="h-4 w-4" />
                    Passwords do not match
                  </p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                    <CheckCircleIcon className="h-4 w-4" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <DefaultCustomButton
                  type="submit"
                  label={isSubmitting ? "Updating..." : "Update Password"}
                  disabled={
                    isSubmitting ||
                    !form.currentPassword ||
                    !form.newPassword ||
                    !form.confirmPassword ||
                    passwordsMismatch === true
                  }
                  className="w-full"
                />
              </div>
            </form>
          </div>

          {/* Account Info (read-only) */}
          <div className="mt-6 rounded-lg bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Account Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Role
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Account ID
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
