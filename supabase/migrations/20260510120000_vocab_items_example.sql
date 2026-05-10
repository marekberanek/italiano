-- Optional example sentences from lookup (DeepL context when available).
alter table public.vocab_items
  add column if not exists ex_it text not null default '';

alter table public.vocab_items
  add column if not exists ex_cz text not null default '';
