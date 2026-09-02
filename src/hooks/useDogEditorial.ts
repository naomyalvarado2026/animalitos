import { useEffect, useState } from 'react';
import { DOG_EDITORIAL_EVENT, getAllDogEditorial, getDogEditorial } from '@/lib/dogEditorialStore';

export function useDogEditorial(slug: string) {
  const [profile, setProfile] = useState(() => getDogEditorial(slug));
  useEffect(() => {
    setProfile(getDogEditorial(slug));
    const update = () => setProfile(getDogEditorial(slug));
    window.addEventListener(DOG_EDITORIAL_EVENT, update);
    return () => window.removeEventListener(DOG_EDITORIAL_EVENT, update);
  }, [slug]);
  return profile;
}

export function useAllDogEditorial() {
  const [profiles, setProfiles] = useState(getAllDogEditorial);
  useEffect(() => {
    const update = () => setProfiles(getAllDogEditorial());
    window.addEventListener(DOG_EDITORIAL_EVENT, update);
    return () => window.removeEventListener(DOG_EDITORIAL_EVENT, update);
  }, []);
  return profiles;
}
