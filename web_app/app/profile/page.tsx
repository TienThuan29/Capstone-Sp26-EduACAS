"use client";

import { useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Avatar,
  Label,
  TextInput,
  Spinner,
} from "flowbite-react";
import { DefaultCustomButton, DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import {
  UserCircleIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { useToast } from "@/hooks/useToast";
import type { UserProfile } from "@/types/user";
import dayjs from "dayjs";
import { Kbd } from "flowbite-react";

type ProfileFormState = Pick<UserProfile, "fullname" | "birthday" | "avatarUrl">;

const defaultFormState = (user: UserProfile | null): ProfileFormState => ({
  fullname: user?.fullname ?? "",
  birthday: user?.birthday ?? "",
  avatarUrl: user?.avatarUrl ?? "",
});

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const axiosInstance = useAxios();
  const toast = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(() => defaultFormState(user));
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setForm(defaultFormState(user));
  }, [user]);

  const handleEdit = () => {
    resetForm();
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    resetForm();
  };

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.showError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.showError("File size must be 5 MB or less.");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post(
        Api.S3.UPLOAD_AVATAR,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const url = (response.data?.dataResponse as { url?: string })?.url;
      if (url) {
        handleChange("avatarUrl", url);
        toast.showSuccess("Avatar uploaded. Save profile to apply.");
      } else {
        toast.showError("Upload failed.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.showError(err.response.data.message);
      } else {
        toast.showError("Failed to upload avatar.");
      }
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        fullname: form.fullname.trim(),
        birthday: form.birthday?.trim() || null,
        avatarUrl: form.avatarUrl?.trim() || null,
      };
      const response = await axiosInstance.put(
        Api.Auth.UPDATE_PROFILE,
        payload
      );
      const updated = response.data?.dataResponse as UserProfile | undefined;
      if (updated) {
        setUser(updated);
        toast.showSuccess("Profile updated successfully.");
        setIsEditMode(false);
      } else {
        toast.showError("Failed to update profile.");
      }
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const displayBirthday = user.birthday
    ? dayjs(user.birthday).format("MMM D, YYYY")
    : "—";
  const displayLastLogin = user.lastLoginDate
    ? dayjs(user.lastLoginDate).format("MMM D, YYYY h:mm A")
    : "—";
  const displayCreated = user.createdDate
    ? dayjs(user.createdDate).format("MMM D, YYYY")
    : "—";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Profile settings
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile – view */}
          <div className="lg:col-span-1 rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              <Avatar
                img={user.avatarUrl || undefined}
                alt={user.fullname}
                rounded
                size="xl"
                className="mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.fullname}
              </h2>
              {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.role}
              </p> */}
              <Kbd>{user.role}</Kbd>
              {!isEditMode && (
                <DefaultCustomButton
                  label="Edit profile"
                  icon={<PencilSquareIcon className="h-5 w-5" />}
                  onClick={handleEdit}
                  className="mt-4"
                />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 rounded-lg bg-white p-6 dark:bg-gray-800">
            {isEditMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit profile
                  </h3>
                  <div className="flex gap-2">
                    <DefaultOutlineCustomButton
                      label="Cancel"
                      icon={<XMarkIcon className="h-4 w-4" />}
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    />
                    <DefaultCustomButton
                      label={isSubmitting ? "Saving..." : "Save"}
                      icon={
                        isSubmitting ? (
                          <Spinner size="sm" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )
                      }
                      type="submit"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fullname" className="mb-1 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <UserCircleIcon className="h-5 w-5" />
                    Full name
                  </Label>
                  <TextInput
                    id="fullname"
                    value={form.fullname}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birthday" className="mb-1 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CalendarDaysIcon className="h-5 w-5" />
                    Birthday
                  </Label>
                  <TextInput
                    id="birthday"
                    type="date"
                    value={form.birthday || ""}
                    onChange={(e) => handleChange("birthday", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-gray-700 dark:text-gray-300">
                    Avatar
                  </Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      img={form.avatarUrl || undefined}
                      alt={form.fullname}
                      rounded
                      size="lg"
                    />
                    <div className="flex flex-col gap-2">
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                        disabled={isUploadingAvatar}
                      />
                      <DefaultCustomButton
                        type="button"
                        label={isUploadingAvatar ? "Uploading..." : "Upload image"}
                        icon={
                          isUploadingAvatar ? (
                            <Spinner size="sm" />
                          ) : (
                            <CloudArrowUpIcon className="h-5 w-5" />
                          )
                        }
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPEG, PNG, WebP or GIF. Max 5 MB.
                      </p>
                    </div>
                  </div>
                  {/* {form.avatarUrl && (
                    <TextInput
                      id="avatarUrl"
                      value={form.avatarUrl}
                      onChange={(e) => handleChange("avatarUrl", e.target.value)}
                      placeholder="Or paste image URL"
                      className="mt-2"
                    />
                  )} */}
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <EnvelopeIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <IdentificationIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Role number
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {user.roleNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <CalendarDaysIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Birthday
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {displayBirthday}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <ShieldCheckIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Role
                    </p>
                    <p className="text-gray-900 dark:text-white">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <ClockIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Last login
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {displayLastLogin}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Member since
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {displayCreated}
                    </p>
                  </div>
                </div>
                <DefaultCustomButton
                  label="Edit profile"
                  icon={<PencilSquareIcon className="h-5 w-5" />}
                  onClick={handleEdit}
                  className="mt-4"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
