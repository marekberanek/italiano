-- Personal vocab: single word vs multi-word phrase (filters, display).
alter table public.vocab_items
  add column if not exists kind text not null default 'word';

alter table public.vocab_items
  drop constraint if exists vocab_items_kind_check;

alter table public.vocab_items
  add constraint vocab_items_kind_check
  check (kind in ('word', 'phrase'));
