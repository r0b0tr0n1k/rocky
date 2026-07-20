---
name: iso-9241-171
description: "ISO 9241-171:2008 Software accessibility guidance. Use when designing accessible software, implementing assistive technology compatibility, ensuring accessibility compliance, or addressing requirements for users with sensory, motor, or cognitive disabilities. Triggers: software accessibility, accessible software, WCAG, assistive technology, screen reader, keyboard navigation, visual impairment, hearing impairment, motor impairment, cognitive accessibility, ISO 9241-171, accessibility features, StickyKeys, SlowKeys, BounceKeys, MouseKeys, ShowSounds, SoundSentry."
---

# ISO 9241-171:2008 - Software Accessibility

## Scope
Provides ergonomics guidance for designing accessible software systems, ensuring usability for users with the widest possible range of physical, sensory, and cognitive capabilities. Applies to all interactive software, including closed systems (kiosks, ATMs) and general-purpose applications.

## Key Terms
- **Accessibility**: Extent to which a system can be used by users with the widest range of capabilities to achieve specified goals in a specified context of use.
- **Assistive Technology (AT)**: Hardware/software used by people with disabilities to interact with systems (e.g., screen readers, on-screen keyboards, eye-tracking devices).
- **User-Interface Element**: Any interactive component (buttons, menus, text fields, windows).
- **ShowSounds**: System flag indicating auditory information should be presented visually.
- **StickyKeys/SlowKeys/BounceKeys/MouseKeys**: Standard access features for keyboard/mouse adaptation.

## Structure Overview
1. **General Guidelines**: Naming, user preferences, accessibility controls
2. **Compatibility with Assistive Technology**: Communication, standard services, AT integration
3. **Inputs**: Keyboard, pointing device requirements
4. **Outputs**: Visual, audio, tactile, media accessibility
5. **Documentation & Support**: Accessible help, training, support services

## Core Requirements (Mandatory)
### General
- Provide unique, meaningful names for all user-interface elements (8.1.1)
- Make names available to assistive technology (8.1.4)
- Enable individualization of cursor/pointer (8.2.4)
- Enable user control of timed responses (8.2.7)
- Make accessibility features discoverable and operable (8.3.1)
- Avoid interference with accessibility features (8.3.3)
- Provide alternatives when AT is unavailable (8.4.4)
- Allow warning/error information to persist (8.4.9)

### Assistive Technology Compatibility
- Enable communication between software and AT (8.5.2)
- Use standard accessibility services (8.5.3)
- Make UI element information available to AT (8.5.4)
- Allow AT to change keyboard focus/selection (8.5.5)
- Use system-standard input/output (8.5.9)
- Enable appropriate table presentation (8.5.10)
- Accept keyboard/pointing device emulators (8.5.11)

### Input Requirements
- Provide parallel keyboard control of pointer functions (9.1.2)
- Provide keyboard focus and text cursors (9.2.1)
- Provide high-visibility keyboard focus/cursors (9.2.2)
- Enable full use via keyboard (9.3.2)
- Enable sequential entry of chorded keystrokes (9.3.3)
- Provide adjustment of key acceptance delay (9.3.4)
- Provide adjustment of double-strike acceptance (9.3.5)
- Allow users to turn key repeat off (9.3.8)
- Reserve accessibility accelerator key assignments (9.3.12)
- Provide direct pointer position control from external devices (9.4.2)
- Enable pointing-device button reassignment (9.4.4)
- Enable pointing-device button-hold functionality (9.4.6)
- Provide adjustment of multiple-click parameters (9.4.9)
- Provide adjustment of pointer speed (9.4.10)
- Provide adjustment of pointer acceleration (9.4.11)
- Provide means to find pointer (9.4.13)
- Provide alternatives to simultaneous pointer operations (9.4.14)

### Output Requirements
- Avoid seizure-inducing flash rates (<3 flashes/second) (10.1.1)
- Enable user control of time-sensitive presentation (10.1.2)
- Provide accessible alternatives to audio/video (10.1.3)
- Provide keyboard access to off-screen information (10.2.4)
- Do not convey information by colour alone (10.4.1)
- Enable non-pointer window navigation (10.5.3)
- Enable "always-on-top" windows (10.5.4)
- Provide user control of multiple "always-on-top" windows (10.5.5)
- Enable window positioning (10.5.7)
- Enable windows to avoid taking focus (10.5.10)
- Enable audio volume control (10.6.2)
- Allow visual alternatives for audio output (10.6.7)
- Synchronize audio equivalents with visual events (10.6.8)
- Provide speech output services (10.6.9)
- Display provided captions (10.7.1)
- Support system captioning settings (10.7.3)
- Enable stop/start/pause of media (10.8.1)

### Documentation & Support
- Provide user documentation in accessible electronic form (11.1.2)
- Provide text alternatives in electronic documentation (11.1.3)
- Provide documentation on accessibility features (11.1.5)
- Provide accessible support services (11.2.1)

## Key Recommendations (Optional but Advised)
- Use tactile patterns familiar from daily life
- Enable adjustment of pointer movement direction
- Provide high-contrast colour schemes for visual impairments
- Enable window resizing/minimizing/maximizing
- Provide understandable documentation in simple language
- Support system-wide accessibility preferences

## Accessibility Features Reference (Annex E)
### Standard Access Features
1. **StickyKeys**: Sequential modifier key entry (e.g., Ctrl+Alt+Del as separate presses)
2. **SlowKeys**: Ignore brief keystrokes, accept only keys held for set duration
3. **BounceKeys**: Ignore repeated same-key presses within set interval
4. **MouseKeys**: Control pointer via numeric keypad
5. **RepeatKeys**: Adjust key repeat delay/interval
6. **ToggleKeys**: Audible signals for CapsLock/NumLock/ScrollLock state
7. **SoundSentry**: Visual indicators for system sounds
8. **ShowSounds**: Flag for applications to present auditory info visually

## Activity Limitation Considerations (Annex D)
- **Sensory**: Vision (blindness, low vision), hearing (deafness, reduced hearing), tactile
- **Motor**: Limited mobility, tremor, speech disabilities, physical size/reach
- **Cognitive**: Attention, memory, language limitations, dyslexia
- **Multiple**: Combined sensory/motor/cognitive effects (common in aging)

## Conformance Checklist (Annex B/C)
Use the provided checklist (Table C.1) to assess:
1. Applicability of each requirement/recommendation
2. Conformance status (Yes/Partial/No)
3. Notes for non-conformant items

## When to Use
- Designing new software to be accessible to users with disabilities
- Auditing existing software for accessibility compliance
- Implementing support for assistive technologies
- Developing accessibility features (StickyKeys, ShowSounds, etc.)
- Ensuring compliance with accessibility regulations (e.g., ADA, EN 301 549)
- Integrating with platform accessibility services (Windows UI Automation, macOS Accessibility API, Linux AT-SPI)

## Relationship to Other Standards
- Builds on ISO 9241-110 (Dialogue principles), ISO 9241-12 (Presentation of information)
- Aligns with WCAG 2.0 guidelines
- References ISO 9241-210 (Human-centred design), ISO 9241-151 (Web UI)
- Part of the ISO 9241 Ergonomics of human-system interaction series
