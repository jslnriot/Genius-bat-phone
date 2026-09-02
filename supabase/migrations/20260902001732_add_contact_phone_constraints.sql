update public.contacts
set phone_number = '+1' || regexp_replace(phone_number, '[^0-9]', '', 'g')
where phone_number !~ '^\+1[0-9]{10}$'
  and regexp_replace(phone_number, '[^0-9]', '', 'g') ~ '^[0-9]{10}$';

update public.profiles
set phone_number = '+1' || regexp_replace(phone_number, '[^0-9]', '', 'g')
where phone_number is not null
  and phone_number !~ '^\+1[0-9]{10}$'
  and regexp_replace(phone_number, '[^0-9]', '', 'g') ~ '^[0-9]{10}$';

alter table public.contacts
  add constraint contacts_name_length_check
  check (char_length(trim(name)) between 1 and 50),
  add constraint contacts_phone_number_e164_check
  check (phone_number ~ '^\+1[0-9]{10}$');

alter table public.profiles
  add constraint profiles_phone_number_e164_check
  check (
    phone_number is null
    or phone_number ~ '^\+1[0-9]{10}$'
  );
