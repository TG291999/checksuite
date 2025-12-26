-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Workspaces Table
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Workspace Members Table
create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (workspace_id, user_id)
);

-- 3. Boards Table
create table boards (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Columns Table
create table columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  name text not null,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Cards Table
create table cards (
  id uuid primary key default uuid_generate_v4(),
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  position integer default 0,
  assigned_to uuid references auth.users(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Checklist Items Table
create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid references cards(id) on delete cascade not null,
  content text not null,
  is_completed boolean default false,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helper function to check if user is a member of the workspace
create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Trigger to automatically add workspace creator as admin member
create or replace function public.add_creator_as_workspace_member()
returns trigger as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.add_creator_as_workspace_member();


-- RLS POLICIES --

-- Enable RLS on all tables
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table boards enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;
alter table checklist_items enable row level security;

-- Policies for Workspaces
create policy "Users can view workspaces they are members of"
  on workspaces for select
  using ( is_workspace_member(id) );

create policy "Users can create workspaces"
  on workspaces for insert
  with check ( auth.uid() = owner_id );

create policy "Admins can update workspaces"
  on workspaces for update
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id
      and user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Policies for Workspace Members
create policy "Members can view other members of their workspace"
  on workspace_members for select
  using ( is_workspace_member(workspace_id) );

-- Policies for Boards
create policy "Members can view boards in their workspace"
  on boards for select
  using ( is_workspace_member(workspace_id) );

create policy "Members can create boards in their workspace"
  on boards for insert
  with check ( is_workspace_member(workspace_id) );

create policy "Members can update boards in their workspace"
  on boards for update
  using ( is_workspace_member(workspace_id) );

create policy "Members can delete boards in their workspace"
  on boards for delete
  using ( is_workspace_member(workspace_id) );

-- Policies for Columns
create policy "View columns if access to board"
  on columns for select
  using (
    exists (
      select 1 from boards
      where id = columns.board_id
      and is_workspace_member(workspace_id)
    )
  );

create policy "Create columns if access to board"
  on columns for insert
  with check (
    exists (
      select 1 from boards
      where id = columns.board_id
      and is_workspace_member(workspace_id)
    )
  );

create policy "Update columns if access to board"
  on columns for update
  using (
    exists (
      select 1 from boards
      where id = columns.board_id
      and is_workspace_member(workspace_id)
    )
  );

create policy "Delete columns if access to board"
  on columns for delete
  using (
    exists (
      select 1 from boards
      where id = columns.board_id
      and is_workspace_member(workspace_id)
    )
  );

-- Policies for Cards (inherit logic from Column -> Board)
create policy "Manage cards if access to board"
  on cards for all
  using (
    exists (
      select 1 from columns
      join boards on boards.id = columns.board_id
      where columns.id = cards.column_id
      and is_workspace_member(boards.workspace_id)
    )
  );

-- Policies for Checklist Items (inherit logic from Card -> Column -> Board)
create policy "Manage checklist items if access to board"
  on checklist_items for all
  using (
    exists (
      select 1 from cards
      join columns on columns.id = cards.column_id
      join boards on boards.id = columns.board_id
      where cards.id = checklist_items.card_id
      and is_workspace_member(boards.workspace_id)
    )
  );
