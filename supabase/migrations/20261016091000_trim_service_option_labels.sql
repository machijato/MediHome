-- Osam naziva opcija imalo je razmak/novi red na kraju, pa ih aplikacija (usporedba po točnom nazivu) nije pronalazila.
update public.service_options
set label = btrim(label, E' \n\r\t')
where label <> btrim(label, E' \n\r\t');
