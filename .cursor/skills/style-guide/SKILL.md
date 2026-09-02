---
name: style-guide
description: Bat Phone's visual design system — colors, typography, spacing, component styling. Use whenever building or styling any UI component or page.
---

[Calm enterprise utility style: clean, trustworthy, slightly modern, not startup-flashy.]

CORE COLORS
Primary / Navy #16324F — primary text, headers, navigation, important icons, dark buttons
Action / Blue #2563EB — primary buttons, links, selected states, active nav, focus rings
Background #F7F9FC — app background, subtle section separation
White #FFFFFF
Border #E2E8F0
Secondary text #64748B
Muted background #F1F5F9
Semantic only (not general design colors): Success #15803D, Warning #B45309, Error #DC2626

FONT
Geist Sans. Fallback: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif. No second font.

TYPOGRAPHY
Page title: 28px/34px, weight 650–700
Section heading: 20px/28px, weight 600
Card/list title: 16px/24px, weight 600
Body: 16px/24px, weight 400
Secondary text: 14px/20px, weight 400
Label: 14px/20px, weight 500
Small metadata: 12px/16px, weight 400
Never make mobile body text or form inputs smaller than 16px.

SPACING (4px base system)
4 tiny, 8 compact, 12 related elements, 16 standard, 24 section, 32 major section, 48 large separation
Defaults: screen horizontal padding 16px, screen top/bottom padding 24px, title-to-content 24px, between sections 32px, between form fields 16px, inside cards 16px, icon-to-text 12px, between list rows 8px

MOBILE LAYOUT
Design for 375–430px wide. width: 100%; max-width: 480px; margin: auto. Desktop is the same phone-width app centered on the page — do not redesign for desktop, this is fundamentally a phone app in a browser.

TOUCH TARGETS
Minimum touch target 44px. Primary button height 48px. Input height 48px. List row minimum 56px. Icon-only buttons at least 44×44px.

BUTTONS
Primary: bg #2563EB, white text, height 48px, radius 10px, font 15–16px/600 (e.g. "Add Contact", "Sign in with Google")
Secondary: bg white, text #16324F, border #E2E8F0, height 48px, radius 10px
Destructive: text/button color #DC2626, not visually dominant (e.g. "Delete Contact")

INPUTS
Height 48px, bg white, border 1px #E2E8F0, radius 10px, padding 12px 14px, font-size 16px. Focus: border #2563EB with low-opacity blue focus ring. Labels above inputs, never placeholder-as-label.

CARDS
Bg white, border 1px solid #E2E8F0, radius 12px, padding 16px. Avoid large drop shadows — if used, only 0 1px 2px rgba(15,23,42,0.05). Should feel like an internal tool, not a marketing site.

NAVIGATION
Simple mobile bottom nav, three items only: Contacts, Calls, Account. Active color #2563EB, inactive #64748B. Height ~64px + safe-area inset.

PAGE STRUCTURE
Page title, optional short explanation, then content. Minimal chrome. Example: "Contacts" / "People you can reach through Bat Phone." / list of contact rows with chevron.

CALL STATUS
Small, subdued badges only where meaningful: Completed, Transcribing, Transcript Ready, Failed. Don't badge every metadata field.

ICONS
lucide-react. Use: Phone, Users, Plus, Clock, FileText, ChevronRight, Settings, LogOut, CheckCircle, AlertCircle, LoaderCircle, Mail, Mic. Sizes: mostly 18/20/24px.

BRANDING
No logo design needed. Use "☎ Bat Phone" or a Lucide phone icon beside the wordmark "Bat Phone," in navy.

DO NOT USE
gradients, glassmorphism, oversized hero sections, excessive rounded cards, giant headings, decorative illustrations, multiple accent colors, heavy shadows, excessive animations, tiny mobile text, desktop-first dashboards, dense sidebar navigation.
