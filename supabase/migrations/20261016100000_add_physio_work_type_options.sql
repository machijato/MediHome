-- Obrazac za oglas fizioterapeuta nudi „Tip rada" (teren / ustanova), ali opcije nisu postojale u bazi pa se nisu spremale.
-- Dodaje se grupa „Tip rada" i dvije opcije; nazivi moraju biti jednaki onima u aplikaciji (CreateListingModal).
insert into public.service_option_groups (category_id, key, name, selection_type, is_required, display_order)
select c.id, 'work_type', 'Tip rada', 'multiple', false, 3
from public.service_categories c
where c.slug = 'fizioterapeut'
  and not exists (
    select 1 from public.service_option_groups g where g.category_id = c.id and g.key = 'work_type'
  );

insert into public.service_options (group_id, label, value, display_order, is_active)
select g.id, v.label, v.value, v.display_order, true
from public.service_option_groups g
join public.service_categories c on c.id = g.category_id and c.slug = 'fizioterapeut'
cross join (values
  ('Dolazak u dom / teren', 'dolazak_u_dom_teren', 1),
  ('Rad u ustanovi / ordinaciji', 'rad_u_ustanovi_ordinaciji', 2)
) as v(label, value, display_order)
where g.key = 'work_type'
  and not exists (
    select 1 from public.service_options o where o.group_id = g.id and o.label = v.label
  );
