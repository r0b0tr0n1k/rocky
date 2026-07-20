---
name: iso-9241-410
description: "ISO 9241-410:2008 Design criteria for physical input devices. Use when designing keyboards, mice, trackballs, touchpads, touchscreens, or other physical input devices. Triggers: physical input devices, keyboard design, mouse design, input device ergonomics, ISO 9241-410, device usability, Fitts law, index of difficulty, biomechanical load, input device criteria, ISO 9241-400."
---

# ISO 9241-410:2008 - Design Criteria for Physical Input Devices

## Scope
Specifies design criteria for physical input devices (keyboards, mice, pucks, joysticks, trackballs, touchpads, tablets, styli, touchscreens) based on usability-related properties. Applies to manufacturers, designers, test organizations selecting devices for specific contexts of use.

## Key Terms
- **Physical input device**: Sensor detecting user behavior (gestures, movements) and transforming into system signals; combination of hardware + driver software.
- **Index of difficulty**: Measure of user precision required for a task (pointing, selection, dragging, tracing), calculated as `ID = log2(d/w + 1)` (d=distance, w=target width).
- **Task precision**: Accuracy required for pointing/selecting/dragging tasks, quantified by index of difficulty.
- **Bounce-free switch**: Switch generating single definite signal after actuation (prevents unintended multiple signals from single press).
- **Force feedback**: Application of physical force in response to user input (e.g., games, simulators).
- **Haptic interface**: User interface based on touch, using movements as input and touch as output for tactile/haptic feedback.

## Procedure for Applying This Standard (Clause 4)
1. **Identify relevant usability properties** of the device (effectiveness, efficiency, dimensioning, software dependency, etc.)
2. **Apply generic design requirements** derived from ergonomic principles (appropriateness, operability, controllability, biomechanical load)
3. **Apply device-specific design requirements** (Annexes B-J for keyboards, mice, pucks, joysticks, trackballs, touchpads, tablets, styli, touchscreens)
4. **Evaluate performance criterion**: Ensure device fulfills requirements for designated purpose; user achieves satisfactory performance with acceptable effort/satisfaction.

## Generic Design Requirements (Clause 7)
### 7.2.2 Appropriateness
- Device shall be appropriate for intended tasks, users, environment.
- Dimensioning compatible with anthropometric dimensions of intended user population.
- If additional tools (stylus, etc.) required, specify this.

### 7.2.3 Operability
- **Obviousness**: C1 (known without instructions), C2 (detectable by trial/error), C3 (learnable by simple instructions), C4 (learnable by special training).
- **Predictability**: Movement/activation consistently produces corresponding system response.
- **Consistency**: Operates same way in specified context of use.
- **User compatibility**: C1 (fully compatible, max throughput 100%), C2 (90% effectiveness/efficiency), C3 (80%), C4 (requires additional aids).
- **Feedback**: Immediate perceptible indication of device response (tactile, visual, auditory).

### 7.2.4 Controllability
- **Responsiveness**: Consistent, sufficient feedback after actuation.
- **Non-interference**: Functional elements accessible without degrading usability; cables/connections don't affect throughput/accuracy.
- **Reliability of access**: Prevents unintended loss of control during use.
- **Adequacy of access**: Quick/easy to grasp, position, manipulate during use.
- **Control access**: Controls locatable/actuable quickly without interfering with overall device use.

### 7.2.5 Biomechanical Load
- **Postures**: Operable without undue deviation from neutral posture.
- **Effort**: Operable without excessive muscular effort during intended use.

## Device-Specific Requirements (Annexes B-J)
### Annex B: Keyboards
#### Functional Properties
- **Key design**: Size (≥110 mm² alphanumeric keys), strike surface (12-15 mm width), displacement (1.5-6 mm, preferred 2-4 mm), force (0.25-1.5 N, preferred 0.5-0.8 N), feedback (tactile/auditory), bounce-free switches, rollover (n-key for C1, 2-key for C2), legends (height ≥2.6 mm, contrast ≥3:1), durability.
- **Sections/zones**: Full-size = alphanumeric, numeric, editing, function sections. Compact = alphanumeric + editing/function sections (no numeric section).
- **Mechanical properties**: Centreline spacing (19 mm C1, 14 mm C2, 12 mm C3, <10 mm C4), height (≤35 mm, preferred ≤30 mm), slope (0°-15°, preferred 0°-12°), profile (slope, dish, step, sculptured, flat), surface (matt finish, reflectance 0.15-0.75), weight, material, thermal conductivity, adjustability, palmrest (50-100 mm depth).
- **Electrical properties**: Cabling (C1 no cable, C2 detachable, C3 middle connection, C4 end connection), battery indicators, electromagnetic compatibility.
- **Maintainability**: Cleanability, battery durability, low-power indicators.
- **Health/safety**: No sharp edges, electrical safety, chemical safety.

### Annex C: Computer Mice
#### Functional Properties
- **Anchoring**: Stable grip, no unintended movement when loosening grip.
- **Resolution**: C1 (index of difficulty >6), C2 (>4 to ≤6), C3 (>3 to ≤4), C4 (≤3).
- **Sensor location**: Under fingers/thumb, not palm.
- **Button design**: Motion (min displacement 0.5 mm, max 6 mm), actuation force (0.5-1.5 N), shape for finger positioning, resistance to inadvertent activation.
- **Wheel**: Resistance, bumps, position, height, diameter, width.
- **Feedback**: Vibration, sound, force; visual feedback via system within 20 ms.
#### Mechanical Properties
- Shape/profile (supports neutral forearm/wrist posture, minimizes pronation/deviation), size (length, width, height), surface friction (in hand), button position/shape/force, wheel characteristics.
#### Other Properties
- **Electrical**: Cabling (thin/flexible preferred), battery life.
- **Maintainability**: Cleanability, battery durability.
- **Health/safety**: Weight (hand-held use), no sharp edges.
- **Software interdependency**: Adjustable gain, support for drawing aids (electronic ruler).
- **Environment**: Works on smooth surfaces (C2), requires mouse pad (C3), requires special pad (C4).

### Annex D: Pucks, Annex E: Joysticks, Annex F: Trackballs, Annex G: Touchpads, Annex H: Tablets/Overlays, Annex I: Styli/Light-pens, Annex J: Touch-sensitive Screens
Each annex follows same structure as B/C: functional, mechanical, electrical, maintainability, health/safety, software interdependency, environment properties with class/group categories for usability.

## Documentation Requirements (Clause 9)
- Product description shall specify all usability-related information for device selection.
- Operating instructions shall include: dynamic representations (video/animation) for operation, timescale for achieving proficiency, training requirements.
- Indicate if special training, additional tools, or specific software support needed.

## Performance Criterion (Clause 5)
Input device shall be usable for designated purpose: user achieves satisfactory performance (effectiveness, efficiency) with acceptable effort and satisfaction.

## When to Use
- Designing new physical input devices (keyboards, mice, etc.)
- Selecting input devices for specific tasks/user populations
- Evaluating input device usability in laboratory/field settings
- Auditing input device design for compliance
- Integrating input devices into interactive systems
- Aligning with ISO 9241-400 (Principles and requirements for physical input devices)

## Relationship to Other Standards
- Part of **ISO 9241-400** subseries (Physical input devices)
- Builds on **ISO 9241-400:2007** (Principles and requirements for physical input devices)
- References **ISO/IEC 9995** (Keyboard layouts), **ISO 7000** (Graphical symbols), **IEC 60417** (Graphical symbols for equipment)
- Companion standards: **ISO 9241-411** (Laboratory test methods), **ISO 9241-420** (Selection procedures), **ISO 9241-421** (Workplace test methods)
- Replaces parts of **ISO 9241-4:1998** (Keyboard requirements) and **ISO 9241-9:2000** (Non-keyboard input devices)
