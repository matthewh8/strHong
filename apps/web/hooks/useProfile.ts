'use client';
import { useState, useEffect } from 'react';
import { getProfile, saveProfile, type UserProfile } from '@/lib/storage';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const next = { ...profile!, ...updates };
    saveProfile(next);
    setProfile(next);
  };

  return { profile, updateProfile };
}
