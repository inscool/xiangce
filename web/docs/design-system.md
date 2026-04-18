# Xiangce Frontend Design Guidelines

This document defines the UI and interaction rules for the Xiangce project.

It is intended for:
- developers
- designers
- AI coding agents

The goal is to keep the product visually consistent while the project keeps evolving.

## Product Positioning

Xiangce is a photo album and image-hosting platform with two very different audiences:

- Chinese operators use the management backend.
- International visitors access public profile pages and shared album pages.

Because of that, the UI language must be split clearly:

- Dashboard and admin pages: Chinese
- Public-facing pages: English

## Language Rules

### Backend / Dashboard

All management UI under `/dashboard/**` should use Chinese:

- navigation labels
- form labels
- buttons
- toasts
- validation messages
- upload dialogs
- admin controls
- settings panels

Examples:

- `上传图片`
- `新建相册`
- `用户 / 分组`
- `系统设置`
- `保存设置`

### Public Pages

Public pages follow audience-based language rules:

- Landing page (`/`) can use Chinese for domestic operators.
- Shared album pages should default to English for external clients.
- Shared album pages should support Chinese/English switching when possible.
- Profile pages can stay English-first for international visitors.
- Public dialogs / protection gate / album actions should align with the active page language.

Examples:

- `Protected Album`
- `Copy Direct Link`
- `Open Album`
- `No images yet`

Do not mix Chinese and English randomly on the same visitor-facing page.
If bilingual support is needed, provide an explicit language switch instead of mixed inline text.

## Layout Principles

### Dashboard Layout

The backend must use a stable workspace layout:

- fixed left sidebar
- wide right main content area
- sidebar stays visually stable during navigation
- only the right content area changes when switching sections

The preferred mental model is:

- sidebar = navigation and identity
- main area = active workspace

Avoid old-style stacked full-page card blocks when the page is primarily an operations page.

### Main Workspace

The right content area should feel wide and media-oriented:

- use large card grids for albums
- use direct image grids for image operations
- reduce unnecessary nested containers
- prioritize horizontal space for image browsing

Avoid making the interface feel cramped with too many boxed wrappers.

## Dashboard Navigation

The sidebar should contain the core business flows:

- `仪表盘`
- `所有相册`
- `用户 / 分组`
- `系统设置`

Sidebar should also include:

- project identity / logo
- current user summary
- storage mini progress

## Workflow Rules

### Album-Centered Workflow

The product should be album-first, not upload-first.

Correct workflow:

1. enter `所有相册`
2. browse albums in a large responsive grid
3. click one album to enter album detail workspace
4. upload and manage images inside that album context

Do not push the user into a detached upload page as the primary flow.

### Upload Interaction

Upload should use a focused dialog workflow.

Expected interaction:

1. click `上传图片`
2. dialog opens
3. select album
4. select files
5. show progress
6. finish and refresh the active workspace

Upload requirements:

- album must be selected before upload starts
- upload button must be visually obvious
- progress bar must be shown during upload
- local and S3 storage modes must both work
- error messages must be human-friendly

### Settings Isolation

Settings and media operations must not be mixed in one visual area.

That means:

- image management stays in album/image pages
- SMTP / S3 / account security stays in `系统设置`
- admin group control stays in `用户 / 分组`

Do not place settings forms under album grids unless the user explicitly navigates into settings.

## Visual Style

### General Tone

The design should feel:

- clean
- operational
- intentional
- modern
- image-first

Avoid:

- bland boilerplate layouts
- excessive empty wrappers
- random mixed spacing scales
- default-looking enterprise UI without hierarchy

### Card System

Use cards where cards help scanning, especially for:

- albums
- stats
- settings sections
- admin panels

Avoid card overload in image-heavy workspaces.

For image areas, prefer:

- direct grid layout
- subtle shadows
- hover overlays
- floating action bars

### Album Cards

Album cards should:

- use cover images whenever possible
- have clear title and metadata
- support hover elevation/shadow
- feel clickable
- open the album workspace directly

Album cards are not decorative only; they are navigation objects.

### Image Grid

Image grids should:

- use large thumbnails
- be responsive
- fill horizontal space well
- show hover actions when relevant
- support multi-select with top-right checkbox

Recommended desktop density:

- 4 to 6 columns depending on viewport width

## Multi-Select Rules

Multi-select behavior should feel like a hosting dashboard.

Requirements:

- checkbox in the top-right corner of each image
- clear visual selected state
- floating bottom action bar appears when at least one image is selected

Batch action bar should support:

- move to album
- copy direct links
- copy HTML
- copy Markdown
- batch delete
- clear selection

Keyboard shortcuts are encouraged:

- `A` = select all
- `Esc` = clear selection

## Public Pages Design Rules

Public pages should be simpler and more gallery-oriented than the dashboard.

### Public Profile

Should include:

- avatar / identity block
- username
- bio
- WhatsApp and website buttons
- responsive image grid

### Public Album

Should include:

- album title
- image count
- owner reference
- clean gallery view
- lightbox support

Protected album pages should stay minimal and professional.

## Component Guidance

Preferred UI building blocks:

- Shadcn UI style components
- Radix primitives
- `Card`
- `Dialog`
- `DropdownMenu`
- `ScrollArea`
- `Progress`
- toast notifications

Use these components consistently instead of inventing new interaction patterns for similar tasks.

## Storage and Upload UX Rules

The system supports both:

- local storage
- S3-compatible storage

UX expectations:

- if storage config is incomplete, show a clear message
- never expose raw credential errors to end users
- if CDN is not configured, use a safe fallback URL strategy
- local storage paths must map to publicly accessible asset URLs

## Admin Experience Rules

Admin pages should prioritize clarity over decoration.

Admin users must be able to:

- create users manually
- create groups
- assign users to groups
- edit storage limits
- configure SMTP and storage settings

Admin forms should be vertically aligned and easy to scan.

Do not mix half-grid and full-width form styles randomly on the same page.

## Interaction Consistency

When there are multiple possible interactions, choose the more direct one.

Preferred examples:

- album card click opens album workspace directly
- upload is dialog-based, not hidden behind deep navigation
- batch actions appear contextually, not in separate pages

## What To Avoid

Do not introduce the following without strong reason:

- purple-heavy default themes
- dark mode by default unless requested
- tiny low-contrast text in operation-heavy pages
- upload flows that require multiple detached pages
- settings forms mixed into media grids
- public pages with admin-style clutter

## Implementation Note For Future Contributors

When adding new frontend features:

1. decide whether the page is backend-facing or public-facing
2. choose Chinese or English accordingly
3. keep album management image-first
4. reuse existing dashboard shell and interaction patterns
5. avoid introducing a second visual language unless intentionally redesigning the product

If a new UI proposal conflicts with this document, prefer the album-centered, operator-friendly workflow unless the business requirement explicitly says otherwise.
