-- Ujednačavanje podataka: grad „Zagreb" -> „Grad Zagreb" (naziv iz popisa županija u aplikaciji),
-- jedinica cijene „hour" -> „EUR" (aplikacija sprema i prikazuje EUR).
update public.provider_listings set city = 'Grad Zagreb' where city = 'Zagreb';
update public.provider_listings set price_unit = 'EUR' where price_unit = 'hour';
