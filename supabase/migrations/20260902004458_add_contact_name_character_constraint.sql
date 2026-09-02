alter table public.contacts
  add constraint contacts_name_characters_check
  check (
    name ~ '[[:alpha:]]'
    and name ~ '^[[:alpha:] .''’-]+$'
  )
  not valid;

comment on constraint contacts_name_characters_check on public.contacts is
  'Allows letters, spaces, periods, apostrophes, and hyphens. Added NOT VALID because one historical row needs correction; new and updated rows are still enforced.';
