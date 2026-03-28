'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import SellerButton from '@/components/seller/SellerButton';
import SellerCard from '@/components/seller/SellerCard';
import SellerErrorState from '@/components/seller/SellerErrorState';
import SellerInput from '@/components/seller/SellerInput';
import SellerLoader from '@/components/seller/SellerLoader';
import SellerPageHeader from '@/components/seller/SellerPageHeader';
import SellerTextarea from '@/components/seller/SellerTextarea';
import {
  useChangeSellerPasswordMutation,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
} from '@/store/sellerApi';
import { normalizeApiError } from '@/utils/sellerUtils';

interface ProfileFormState {
  storeName: string;
  ownerName: string;
  storeDescription: string;
  businessAddress: string;
  bankDetails: string;
  contactPhone: string;
  contactEmail: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const SettingsPage = () => {
  const [profileForm, setProfileForm] = useState<Partial<ProfileFormState>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    data: profileResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetSellerProfileQuery();

  const [updateProfile, { isLoading: updatingProfile }] = useUpdateSellerProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangeSellerPasswordMutation();

  const profile = profileResponse?.data;

  const profileValues: ProfileFormState = {
    storeName: profileForm.storeName ?? profile?.storeName ?? '',
    ownerName: profileForm.ownerName ?? profile?.ownerName ?? '',
    storeDescription: profileForm.storeDescription ?? profile?.storeDescription ?? '',
    businessAddress: profileForm.businessAddress ?? profile?.businessAddress ?? '',
    bankDetails: profileForm.bankDetails ?? profile?.bankDetails ?? '',
    contactPhone: profileForm.contactPhone ?? profile?.contactDetails?.phone ?? profile?.phoneNumber ?? '',
    contactEmail: profileForm.contactEmail ?? profile?.contactDetails?.email ?? '',
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);

    try {
      await updateProfile({
        storeName: profileValues.storeName,
        ownerName: profileValues.ownerName,
        storeDescription: profileValues.storeDescription,
        businessAddress: profileValues.businessAddress,
        bankDetails: profileValues.bankDetails,
        contactDetails: {
          phone: profileValues.contactPhone,
          email: profileValues.contactEmail,
        },
        storeLogo: logoFile,
      }).unwrap();

      toast.success('Profile updated successfully');
      setLogoFile(null);
      setProfileForm({});
    } catch (requestError) {
      setProfileError(normalizeApiError(requestError, 'Failed to update profile settings.'));
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      await changePassword(passwordForm).unwrap();
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (requestError) {
      setPasswordError(normalizeApiError(requestError, 'Failed to change password.'));
    }
  };

  return (
    <div className="space-y-8">
      <SellerPageHeader
        title="Seller Profile & Settings"
        description="Update store identity, business contact details, and account security settings."
      />

      {isError ? (
        <SellerErrorState
          message={normalizeApiError(error, 'Unable to load profile settings.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? <SellerLoader label="Loading profile settings..." /> : null}

      {profile ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SellerCard className="xl:col-span-2">
            <h2 className="text-xl font-black tracking-tight text-black">Store Profile</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Keep your storefront details accurate for better buyer trust and communication.
            </p>

            <form className="mt-5 space-y-5" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SellerInput
                  label="Store Name"
                  value={profileValues.storeName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      storeName: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Owner Name"
                  value={profileValues.ownerName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      ownerName: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Contact Phone"
                  value={profileValues.contactPhone}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      contactPhone: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Contact Email"
                  type="email"
                  value={profileValues.contactEmail}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      contactEmail: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Business Address"
                  value={profileValues.businessAddress}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      businessAddress: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Bank Details"
                  value={profileValues.bankDetails}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      bankDetails: event.target.value,
                    }))
                  }
                />
              </div>

              <SellerTextarea
                label="Store Description"
                rows={5}
                value={profileValues.storeDescription}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    storeDescription: event.target.value,
                  }))
                }
              />

              <label className="block space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  Store Logo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setLogoFile(file);
                  }}
                  className="block w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                />
                <p className="text-xs text-zinc-500">
                  {logoFile ? `Selected: ${logoFile.name}` : 'Upload a new logo to replace current branding.'}
                </p>
              </label>

              {profileError ? <SellerErrorState message={profileError} /> : null}

              <div className="flex justify-end">
                <SellerButton
                  label={isFetching ? 'Refreshing...' : 'Save Profile'}
                  type="submit"
                  loading={updatingProfile}
                />
              </div>
            </form>
          </SellerCard>

          <div className="space-y-6">
            <SellerCard>
              <h2 className="text-xl font-black tracking-tight text-black">Current Branding</h2>
              <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                {profile.storeLogo ? (
                  <img
                    src={profile.storeLogo}
                    alt="Store logo"
                    className="h-28 w-28 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-zinc-200 text-xl font-black text-zinc-500">
                    {profile.storeName?.charAt(0) || 'S'}
                  </div>
                )}
                <p className="mt-3 text-sm font-black text-zinc-800">{profile.storeName || 'Seller Store'}</p>
                <p className="mt-1 text-xs text-zinc-500">{profile.email}</p>
              </div>
            </SellerCard>

            <SellerCard>
              <h2 className="text-xl font-black tracking-tight text-black">Change Password</h2>
              <p className="mt-1 text-sm text-zinc-500">Use a strong password and keep it private.</p>

              <form className="mt-4 space-y-4" onSubmit={handlePasswordSubmit}>
                <SellerInput
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                />
                <SellerInput
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmNewPassword: event.target.value,
                    }))
                  }
                />

                {passwordError ? <SellerErrorState message={passwordError} /> : null}

                <div className="flex justify-end">
                  <SellerButton label="Update Password" type="submit" loading={changingPassword} />
                </div>
              </form>
            </SellerCard>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SettingsPage;
