---
name: iso-software-skills
description: "International standards for software ergonomics, quality management, and terminology. Covers ISO 690 (bibliographic references), 704 (terminology), 9000/9001/9004 (quality management), and the 9241 series (human-system interaction — dialogue principles, form design, web UI, accessibility, tactile interaction, and more). Use when the task references ISO standards for software, quality, UX, accessibility, or documentation."
---

# ISO Software Skills

This directory indexes 15 ISO-standard skill files organized under `skills/`. Load a specific skill via `/skill:<name>` or by reading its `SKILL.md` directly.

## Index

| Standard | Description | Path |
|----------|-------------|------|
| ISO 690 | Bibliographic references and citations | `skills/iso-690/ISO-690_SKILL.md` |
| ISO 704 | Terminology work and concept systems | `skills/iso-704/ISO-704_SKILL.md` |
| ISO 9000 | Quality management — fundamentals and vocabulary | `skills/iso-9000/ISO-9000_SKILL.md` |
| ISO 9001 | Quality management — requirements | `skills/iso-9001/ISO-9001_SKILL.md` |
| ISO 9004 | Sustained success through quality management | `skills/iso-9004/SKILL.md` |
| ISO 9241-110 | Dialogue principles (interactive systems) | `skills/iso-9241-110/ISO-9241-110_SKILL.md` |
| ISO 9241-12 | Presentation of information | `skills/iso-9241-12/ISO-9241-12_SKILL.md` |
| ISO 9241-143 | Forms | `skills/iso-9241-143/ISO-9241-143_SKILL.md` |
| ISO 9241-151 | Web user interfaces | `skills/iso-9241-151/ISO-9241-151_SKILL.md` |
| ISO 9241-161 | Visual user-interface elements | `skills/iso-9241-161/ISO-9241-161_SKILL.md` |
| ISO 9241-171 | Software accessibility | `skills/iso-9241-171/ISO-9241-171_SKILL.md` |
| ISO 9241-210 | Human-centred design | `skills/iso-9241-210/ISO-9241-210_SKILL.md` |
| ISO 9241-410 | Physical input device design criteria | `skills/iso-9241-410/ISO-9241-410_SKILL.md` |
| ISO 9241-420 | Physical input device selection | `skills/iso-9241-420/ISO-9241-420_SKILL.md` |
| ISO 9241-920 | Tactile and haptic interaction | `skills/iso-9241-920/ISO-9241-920_SKILL.md` |
| ISO/TR 9241-100 | Overview of software ergonomics standards | `skills/iso-tr-9241-100/ISO-TR-9241-100_SKILL.md` |

## Usage

```markdown
# From any skill file, reference another via relative path:
See [ISO 9241-110](iso-9241-110/ISO-9241-110_SKILL.md) for dialogue principles.
```

## Convention

Each child skill's `SKILL.md` (or `ISO-*_SKILL.md`) file contains YAML frontmatter with `name` and `description`, followed by the standard-specific guidance.
