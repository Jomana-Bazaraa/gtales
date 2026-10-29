-- Admin → Dashboard numbers (fixnow A6), all computed in the database: counts and sums, never rows sent to the app,
-- so "All time" has no date limit and no row limit. Run AFTER 0007 (uses orders.quantity). Safe to re-run.
-- p_since = start of the range (null = all time). Only the service role may call it (stats are not public).
create or replace function public.gtales_dashboard(p_since timestamptz default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
ev as (select * from public.events where p_since is null or created_at >= p_since),
bk as (select id, slug, gender, (form->>'age') as age, coalesce(nullif(ref, ''), 'direct') as src
         from public.books where p_since is null or created_at >= p_since),
oa as (select * from public.orders where p_since is null or created_at >= p_since),
od as (select o.id, o.quantity, o.total, o.discount, o.promo_code, o.child,
              coalesce(nullif(o.ref, ''), 'direct') as src, b.slug as story_slug
         from oa o left join public.books b on b.id = o.free_story_id
        where o.status <> 'cancelled'),
fin as (select distinct story_id from ev where event = 'story_finished' and story_id is not null),
contrib as (
  select 'story' as dim, bk.slug as k, 1 as created, (bk.id in (select story_id from fin))::int as finished, 0 as orders, 0 as books, 0 as revenue from bk
  union all select 'gender', bk.gender, 1, (bk.id in (select story_id from fin))::int, 0, 0, 0 from bk
  union all select 'age', bk.age, 1, (bk.id in (select story_id from fin))::int, 0, 0, 0 from bk
  union all select 'source', bk.src, 1, 0, 0, 0, 0 from bk
  union all select 'story', od.story_slug, 0, 0, 1, od.quantity, od.total from od where od.story_slug is not null
  union all select 'gender', od.child->>'gender', 0, 0, 1, od.quantity, od.total from od
  union all select 'age', od.child->>'age', 0, 0, 1, od.quantity, od.total from od
  union all select 'source', od.src, 0, 0, 1, od.quantity, od.total from od
)
select jsonb_build_object(
  'first_record', (select min(t) from (select min(created_at) as t from public.books
                                       union all select min(created_at) from public.orders
                                       union all select min(created_at) from public.events) x),
  'first_events', coalesce((select jsonb_object_agg(event, first_at)
                              from (select event, min(created_at) as first_at from public.events group by event) x), '{}'::jsonb),
  -- a "session" = one device on one Cairo day (the device id lives in the browser), so repeat visits count again
  'sessions', (select count(distinct session_id || '|' || (created_at at time zone 'Africa/Cairo')::date) from ev where session_id is not null),
  'unique_devices', (select count(distinct session_id) from ev where session_id is not null),
  'builder_starts', (select count(*) from ev where event = 'story_started'),
  'free_stories', (select count(*) from bk),
  'finished', (select count(*) from fin),
  'shared', (select count(*) from ev where event in ('story_shared', 'share_clicked')),
  'orders', (select count(*) from od),
  'books_ordered', (select coalesce(sum(quantity), 0) from od),
  'revenue', (select coalesce(sum(total), 0) from od),
  'delivered_revenue', (select coalesce(sum(total), 0) from oa where status = 'delivered_paid'),
  'reviews_started', (select count(*) from ev where event = 'review_started'),
  'reviews_submitted', (select count(*) from ev where event = 'review_submitted'),
  'reviews_approved', (select count(*) from ev where event = 'review_approved'),
  'landing', (select count(distinct session_id) from ev where event = 'landing_view'),
  'start_click', (select count(distinct session_id) from ev where event = 'start_click'),
  'step1', (select count(distinct session_id) from ev where event in ('story_started', 'form_step_1')),
  'step2', (select count(distinct session_id) from ev where (event = 'free_form_step' and meta->>'name' = 'review') or event = 'form_step_2'),
  'converted', (select count(*) from bk where bk.id in (select free_story_id from public.orders where status <> 'cancelled' and free_story_id is not null)),
  'parents', (select count(*) from public.parents),
  'parents_new', (select count(*) from public.parents where p_since is null or created_at >= p_since),
  'breakdowns', coalesce((select jsonb_agg(jsonb_build_object('dim', dim, 'k', k, 'created', created, 'finished', finished, 'orders', orders, 'books', books, 'revenue', revenue))
                            from (select dim, k, sum(created) as created, sum(finished) as finished, sum(orders) as orders, sum(books) as books, sum(revenue) as revenue
                                    from contrib where k is not null group by dim, k) g), '[]'::jsonb),
  'source_visitors', coalesce((select jsonb_object_agg(k, n) from (select coalesce(nullif(source, ''), ref) as k, count(distinct session_id) as n from ev
                                 where session_id is not null and coalesce(nullif(source, ''), ref) is not null group by 1) x), '{}'::jsonb),
  'promos', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'orders', n, 'books', books, 'discount', discount, 'revenue', revenue))
                        from (select coalesce(promo_code, '(no code)') as code, count(*) as n, sum(quantity) as books, sum(discount) as discount, sum(total) as revenue
                                from od group by 1) p), '[]'::jsonb)
);
$$;

revoke all on function public.gtales_dashboard(timestamptz) from public, anon, authenticated;
grant execute on function public.gtales_dashboard(timestamptz) to service_role;
