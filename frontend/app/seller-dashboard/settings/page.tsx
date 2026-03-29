'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  IoStorefrontOutline, 
  IoPersonOutline, 
  IoCallOutline, 
  IoMailOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoImageOutline,
  IoLockClosedOutline,
  IoCheckmarkCircleOutline,
  IoCard
} from 'react-icons/io5';
import { BsBank } from "react-icons/bs";
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
  bankAccountHolderName: string;
  bankName: string;
  bankIBAN: string;
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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
    bankAccountHolderName: profileForm.bankAccountHolderName ?? profile?.bankAccountHolderName ?? '',
    bankName: profileForm.bankName ?? profile?.bankName ?? '',
    bankIBAN: profileForm.bankIBAN ?? profile?.bankIBAN ?? '',
    contactPhone: profileForm.contactPhone ?? profile?.contactDetails?.phone ?? profile?.phoneNumber ?? '',
    contactEmail: profileForm.contactEmail ?? profile?.contactDetails?.email ?? '',
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
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
        bankAccountHolderName: profileValues.bankAccountHolderName,
        bankName: profileValues.bankName,
        bankIBAN: profileValues.bankIBAN,
        contactDetails: {
          phone: profileValues.contactPhone,
          email: profileValues.contactEmail,
        },
        storeLogo: logoFile,
      }).unwrap();

      toast.success('Profile updated successfully');
      setLogoFile(null);
      setLogoPreview(null);
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
          {/* Profile Completion Banner */}
          {!profile.profileCompleted && (
            <div className="xl:col-span-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-100 to-orange-50 rounded-[2.5rem] blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[2.5rem] p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
                      <IoLockClosedOutline className="text-amber-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-light tracking-tight text-amber-900 mb-1">Complete Your Profile to Unlock Dashboard</h3>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        Please fill in all required fields including bank account details below. Once your profile is complete, all dashboard sections will be unlocked and you can start managing your store.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Profile Form */}
          <div className="xl:col-span-2 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-100 to-purple-50 rounded-[2.5rem] blur opacity-10"></div>
              <SellerCard className="relative bg-white/80 border border-white/60">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-light tracking-tight text-gray-900">Store Profile</h2>
                    <p className="mt-1 text-sm font-light text-zinc-500">
                      Keep your storefront details accurate for better buyer trust and communication.
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                    <IoStorefrontOutline className="text-indigo-400 text-xl" />
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="relative">
                      <IoStorefrontOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                      <SellerInput
                        label="Store Name"
                        className="!pl-12"
                        value={profileValues.storeName}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            storeName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="relative">
                      <IoPersonOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                      <SellerInput
                        label="Owner Name"
                        className="!pl-12"
                        value={profileValues.ownerName}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            ownerName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="relative">
                      <IoCallOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                      <SellerInput
                        label="Contact Phone"
                        className="!pl-12"
                        value={profileValues.contactPhone}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            contactPhone: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="relative">
                      <IoMailOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                      <SellerInput
                        label="Contact Email"
                        type="email"
                        className="!pl-12"
                        value={profileValues.contactEmail}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            contactEmail: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="relative">
                      <IoLocationOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                      <SellerInput
                        label="Business Address"
                        className="!pl-12"
                        value={profileValues.businessAddress}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            businessAddress: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                      <BsBank className="text-emerald-500 text-base" />
                      </div>
                      <div>
                        <h3 className="text-sm font-light tracking-tight text-gray-900">Bank Account Details</h3>
                        <p className="text-xs text-zinc-400">Required to receive payments from sales</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
                      <div className="relative md:col-span-2">
                        <IoPersonOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                        <SellerInput
                          label="Account Holder Name"
                          className="!pl-12 bg-white"
                          placeholder="Full name as per bank account"
                          value={profileValues.bankAccountHolderName}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              bankAccountHolderName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="relative">
                        <BsBank className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                        <SellerInput
                          label="Bank Name"
                          className="!pl-12 bg-white"
                          placeholder="e.g., Chase Bank"
                          value={profileValues.bankName}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              bankName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="relative">
                        <IoCard className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                        <SellerInput
                          label="IBAN Number"
                          className="!pl-12 bg-white"
                          placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                          value={profileValues.bankIBAN}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              bankIBAN: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <SellerTextarea
                    label="Store Description"
                    rows={5}
                    className="bg-zinc-50/50 focus:bg-white transition-all"
                    value={profileValues.storeDescription}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        storeDescription: event.target.value,
                      }))
                    }
                  />

                  <div className="space-y-3">
                    <label className="block">
                      <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-3">
                        Store Logo
                      </span>
                      <div className="relative group/upload">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor="logo-upload"
                          className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 cursor-pointer hover:bg-white hover:border-indigo-200 transition-all"
                        >
                          <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                            <IoImageOutline className="text-indigo-400 text-2xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-light text-zinc-800">
                              {logoFile ? logoFile.name : 'Click to upload store logo'}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                          {(logoPreview || profile.storeLogo) && (
                            <div className="h-14 w-14 rounded-2xl overflow-hidden border border-zinc-200 shrink-0">
                              <img 
                                src={logoPreview || profile.storeLogo} 
                                alt="Preview" 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </label>
                      </div>
                    </label>
                  </div>

                  {profileError ? <SellerErrorState message={profileError} /> : null}

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <SellerButton
                      label={isFetching ? 'Refreshing...' : 'Save Profile'}
                      type="submit"
                      className="px-8 h-12 !rounded-2xl"
                      loading={updatingProfile}
                    />
                  </div>
                </form>
              </SellerCard>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Branding Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-100 to-pink-50 rounded-[2.5rem] blur opacity-10"></div>
              <SellerCard className="relative bg-white/80 border border-white/60">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light tracking-tight text-black">Current Branding</h2>
                  <IoCheckmarkCircleOutline className="text-emerald-400 text-xl" />
                </div>
                <div className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-6 backdrop-blur-sm">
                  <div className="flex flex-col items-center text-center">
                    {profile.storeLogo ? (
                      <img
                        src={profile.storeLogo}
                        alt="Store logo"
                        className="h-28 w-28 rounded-3xl object-cover border-2 border-white shadow-lg"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 text-3xl font-black text-indigo-600 shadow-lg border-2 border-white">
                        {profile.storeName?.charAt(0) || 'S'}
                      </div>
                    )}
                    <p className="mt-5 text-lg font-light text-zinc-900">{profile.storeName || 'Seller Store'}</p>
                    <p className="mt-1 text-xs font-light text-zinc-400 flex items-center gap-1">
                      <IoMailOutline className="text-sm" />
                      {profile.email}
                    </p>
                  </div>
                </div>
              </SellerCard>
            </div>

            {/* Change Password Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-100 to-orange-50 rounded-[2.5rem] blur opacity-10"></div>
              <SellerCard className="relative bg-white/80 border border-white/60">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-light tracking-tight text-black">Change Password</h2>
                    <p className="mt-1 text-sm font-light text-zinc-500">Use a strong password and keep it private.</p>
                  </div>
                  <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                    <IoShieldCheckmarkOutline className="text-rose-400 text-xl" />
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                  <div className="relative">
                    <IoLockClosedOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                    <SellerInput
                      label="Current Password"
                      type="password"
                      className="!pl-12"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="relative">
                    <IoLockClosedOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                    <SellerInput
                      label="New Password"
                      type="password"
                      className="!pl-12"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="relative">
                    <IoLockClosedOutline className="absolute left-4 top-[42px] text-zinc-400 text-lg pointer-events-none z-10" />
                    <SellerInput
                      label="Confirm New Password"
                      type="password"
                      className="!pl-12"
                      value={passwordForm.confirmNewPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmNewPassword: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {passwordError ? <SellerErrorState message={passwordError} /> : null}

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <SellerButton 
                      label="Update Password" 
                      type="submit" 
                      tone="secondary"
                      className="px-8 h-12 !rounded-2xl"
                      loading={changingPassword} 
                    />
                  </div>
                </form>
              </SellerCard>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SettingsPage;
