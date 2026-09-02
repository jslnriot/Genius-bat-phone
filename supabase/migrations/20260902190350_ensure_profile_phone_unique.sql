alter table public.profiles
  add constraint profiles_phone_number_key unique (phone_number);

comment on constraint profiles_phone_number_key on public.profiles is
  'A phone number identifies exactly one Bat Phone caller; null remains allowed before onboarding.';
