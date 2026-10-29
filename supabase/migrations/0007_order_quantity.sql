-- Number of printed books per Series order (fixnow A3). Run in the Supabase SQL editor. Safe to re-run.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'orders' and column_name = 'quantity') then
    alter table public.orders add column quantity int not null default 1;
    -- orders placed before this column existed were the three-book Series: count them as 3
    update public.orders set quantity = 3;
  end if;
end $$;

-- orders placed after the code went live but before this migration kept their count inside parent (jsonb): move it
update public.orders
   set quantity = (parent->>'quantity')::int, parent = parent - 'quantity'
 where parent ? 'quantity';

alter table public.orders drop constraint if exists orders_quantity_range;
alter table public.orders add constraint orders_quantity_range check (quantity between 1 and 100);
