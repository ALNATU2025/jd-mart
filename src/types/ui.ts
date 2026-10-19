// UI-only types used by static menus, feature tiles and onboarding slides.
import type { UserRole } from './index';

export type PlatformRole = UserRole;

export interface MenuItemModel {
  id: string;
  title: string;
  icon: string;
}

export interface FeatureItem {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export interface OnboardingItem {
  image: string;
  title: string;
  subtitle: string;
}
