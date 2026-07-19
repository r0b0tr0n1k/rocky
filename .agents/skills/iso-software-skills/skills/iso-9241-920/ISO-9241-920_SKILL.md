---
name: iso-9241-920
description: ISO 9241-920:2009 Guidance on tactile and haptic interactions. Use when designing tactile/haptic interfaces, encoding information via touch, or implementing haptic feedback. Triggers: tactile interaction, haptic interaction, ISO 9241-920, vibrotactile feedback, force feedback, tactile encoding, haptic encoding, sensory substitution, tactile graphics, haptic controls, Braille display, vibrotactile display, spatial resolution, temporal pattern.
---

# ISO 9241-920:2009 - Guidance on Tactile and Haptic Interactions#

## Scope
Provides ergonomics recommendations for tactile/haptic hardware/software interactions. Covers design/use of tactile/haptic inputs, outputs, combinations (with other modalities or as exclusive mode). Applies to virtual workspaces, assistive technologies, simulation environments.

## Key Terms
- **Tactile/haptic interaction**: Interaction using touch sense (tactile) and force feedback (haptic) via body contact with device.
- **Tactile encoding**: Representing information via tactile properties (texture, shape, vibration).
- **Haptic encoding**: Representing information via force, torque, position feedback.
- **Sensory adaptation**: Decreased sensitivity from prolonged stimulation (recovery time ~half adaptation time).
- **Temporal masking**: Distortion when two stimuli presented asynchronously at same location.
- **Spatial masking**: Inability to discriminate neighboring stimuli due to overlap.
- **Apparent motion**: Simulated motion via sequential stimulus activation.
- **Apparent location**: Simulated location via spatial/temporal stimulus patterns.

## General Guidance on Tactile/Haptic Inputs/Outputs (Clause 3.1)
### 3.1.1 Optimizing Performance
- Account for device accuracy, user accuracy, task accuracy requirements.
- Support active exploration over passive (enhances kinaesthetic perception).
- Enable multi-point-of-contact operation where possible (reduces errors, improves perception).
- Minimize cognitive/sensory task demands.

### 3.1.2 Providing Accessible Information
- Provide accessible descriptions of all tactile/haptic UI elements (text, sound, speech, sign language, Braille).

### 3.1.3 Providing Contextual Information
- Provide context to help users understand tactile/haptic perceptions (captions, speech, sign language, Braille).

### 3.1.4 Using Consistent Labels
- Labels must be consistent in size, distance, orientation, rule application.
- Same-information labels must be equal in form, symbol usage, text.

### 3.1.5 Identifying System State
- Provide clear indication of active task/function via tactile/haptic feedback.

### 3.1.6 Minimizing Fatigue
- Ensure comfort over extended use; avoid fatigue via:
  - Careful body location choice for stimulation.
  - Careful contact method choice.
  - Lowest effective stimulus magnitude.
  - Reduce minute/precise joint rotations (especially proximal segments).
  - Avoid static positions near range-of-motion ends.
  - Avoid requiring overreach to discover display extent.

### 3.1.7 Providing Alternative Input Methods
- Enable task completion via multiple methods; at least one method not requiring fine manipulation skills.

### 3.1.8 Maintaining Coherence Between Modalities
- Align tactile/haptic modality with other modalities (size, orientation, shape, mapping, separation, temporal presentation).
- Prevent incoherence that causes confusion/control instability in multimodal systems.

### 3.1.9 Combining Modalities
- Combine modalities for:
  - Reinforcing information from tactile/haptic interactions.
  - Providing additional information not in tactile/haptic channel.
  - Compensating for diminished/overloaded sensory channels (e.g., tactile cues when audio/visual weak).
- Avoid contradictory combined information.

### 3.1.10 Presenting Realistic Experiences
- Use real-world physics to enhance understanding; deviate to simplify/focus/explore new experiences.
- Adjust object properties (size, vibration frequency) as user approaches, even if unchanged in real world.

### 3.1.11 Isolation of Individual Interface Elements
- Prevent unintended effects on non-activated elements when activating nearby elements (reduce vibration crosstalk, rigid surrounds).

## Intentional Individualization (Clause 3.2)
### 3.2.1 Enabling Users to Change Modalities
- Allow disabling tactile output or switching to another modality.
- Support user preference for visual/audio over tactile/haptic cues.

### 3.2.2 Enabling Force Feedback Override
- Allow users to override force feedback (max force limited by user exertion capability).

### 3.2.3 Enabling Users to Individualise Tactile Parameters
- Provide adjustment of tactile/haptic parameters to prevent discomfort/pain/injury.
- Account for user threshold differences, age-related changes (spatial/temporal acuity degradation).

## Unintentional User Perceptions (Clause 3.3)
### 3.3.1 Limiting Acoustic Output
- Limit acoustic emissions from tactile/haptic displays interfering with auditory info, nearby equipment, security.

### 3.3.2 Limiting Heat Gain of Contact Surface
- Prevent contact surface heat gain that deforms surface, disturbs haptic perception, injures skin, damages interface.

### 3.3.3 Avoiding Sensory Adaptation
- Minimize vibration sensory adaptation: switch frequencies between <80 Hz and >100 Hz.
- Adjust amplitude with frequency changes to maintain sensation levels.

### 3.3.4 Recovering from Sensory Adaptation
- Enable recovery from adaptation (recovery time ~half adaptation time, up to 25 min for full adaptation).

### 3.3.5 Avoiding Unintended Perceptual Illusions
- Minimize unintended perceptual illusions from stimuli too close in time/space.

### 3.3.6 Preventing Temporal Masking
- Prevent temporal masking by presenting stimuli at different locations or different frequencies (<80 Hz vs >100 Hz).

## Attributes of Tactile/Haptic Encoding (Clause 4)
### 4.1 High-Level Guidance
- Use familiar tactile/haptic patterns from daily life.
- Make encoding obvious, simple, intuitive, easy to learn/discriminate.
- Conform to user expectations (predictable behavior mimicking nature/gravity).
- Use appropriate sensory substitutions between visual/audio/tactile/haptic.
- Use appropriate spatial addressability/resolution for task/user perceptual capabilities.
- Use distal body parts (fingers, toes) for high spatial resolution.
- Use higher addressability for trained users.
- Use apparent motion for simulating actual motion (control burst duration, time interval between onsets).
- Prevent spatial masking (use different frequencies, separate locations).

### 4.2 Specific Tactile/Haptic Attributes
**Material properties**: Hardness, viscosity, elasticity, mass/weight, inertia, thermal conductivity.
**Surface properties**: Texture, roughness, friction, temperature.
**Geometrical properties**: Size, shape, location, orientation, spatial pattern, spatial grating amplitude/frequency.
**Temporal properties**: Temporal pattern, vibration amplitude/frequency.

#### 4.2.1 Selecting Dimensions for Encoding
- Use discriminable attribute values; limit to 3 significantly different values per attribute (unless proven otherwise).
- Combine properties to encode different dimensions, redundant info, complex info.
- Limit complexity: all purposeful combinations must be discriminable.

#### 4.2.2 Discriminating Between Attribute Values
- Material properties (texture, hardness) more salient than geometrical (size).
- Use familiar shapes (cubes, spheres, cones) for encoding.

#### 4.2.3 Encoding by Object Shape
- Use recognizable shapes for encoding.

#### 4.2.4 Encoding by Temporal Pattern
- Make temporal pattern time between signals perceivable and adjustable.
- Use rhythm, tempo, duration for patterns (temporal sensitivity: 10 ms pulses/gaps detectable).

#### 4.2.5 Encoding by Vibration Amplitude
- Set discrete amplitude levels between detection threshold and comfort/pain threshold.
- Limit to 7 different frequency levels; ≥20% difference between levels within 10-600 Hz.

#### 4.2.6 Encoding by Vibration Frequency
- Use ≤7 frequency levels; ≥20% difference between levels.
- Within 10-600 Hz unless lower frequency discriminable.
- For same amplitude, different frequencies yield different subjective magnitudes.

#### 4.2.7 Encoding by Location
- Account for body part spatial resolution (distal parts higher resolution).
- Use body joints to increase location identification accuracy.

#### 4.2.8 Encoding by Temperature
- Keep temperature values within user comfort limits.
- Values must remain discriminable over exposure duration.
- Humans perceive heat flow rate (thermal conductivity) not temperature itself.
- Limit to 4 thermal conductivity values.

#### 4.2.9 Identifying Information Values
- Aid users in identifying attribute values (reference values, symbolic legends).

## Content-Specific Encoding (Clause 5)
### 5.1 Encoding Text Data
- Make dynamic text presentation speed controllable.

### 5.2 Encoding Graphical Data
#### 5.2.1 Displaying Tactile/Haptic Graphics
- Keep tactile/haptic graphics simple, recognizable without long exploration.
- Use low addressability displays to portray entirety; use "zoom" for detail.
- Include redundant info in encoding (e.g., bar graph text labels).

#### 5.2.2 Using Grids on Tactile Graphs
- Use grids when exact readings required; avoid interference with graph data.

#### 5.2.3 Using Landmarks in Tactile Maps
- Emphasize landmarks in tactile maps to aid orientation.

#### 5.2.4 Providing Scales for Tactile Maps
- Present scales in orientation most relevant to map contents.
- Use units most accessible to intended user group.

### 5.3 Encoding Controls
#### 5.3.1 Using Tactile/Haptic Controls
- Controls selectable without activating functionality.
- Provide feedback indicating selection/activation.

#### 5.3.2 Using Size/Spacing to Avoid Accidental Activation
- Size/spacing of controls to prevent accidental activation.

#### 5.3.3 Avoiding Difficult Control Actions
- Avoid very small controls or those requiring wrist rotation/pinching/twisting.

#### 5.3.4 Using Force to Avoid Accidental Activation
- Use ≥5 N operating force where accidental activation avoidance needed.

#### 5.3.5 Interacting with Controls
- Limit linear actuating force/torque to max values (see Table 1 for max recommended forces).

**Table 1 — Max Recommended Operating Forces/Torques for Manual Control Actuators**
| Type of grip | Contact grip | Pinch grip | Clench grip | Part of hand | Any direction |
|--------------|--------------|------------|-------------|-----------------|---------------|
| Applying force | Finger | Thumb | Hand | Finger/one hand | Both hands | Any direction |
| Max linear force (N) | 10 | 20 | 10 | 35 | 55 | Any direction |
| Max torque (N·m) | 0.5 | 0.5 | 0.5 | 2 | 20 | Any direction |

## Design of Tactile/Haptic Objects and Space (Clause 6)
### 6.1 Tactile/Haptic Display Spaces
- Ensure easily perceivable presentation of multiple objects.
- Enable identification of adjacent objects individually/collectively.
- Maintain separation between object surfaces to perceive boundaries.
- Separate tactile/haptic elements not required contiguous (perceivable spaces).
- Avoid excess "empty space" (confusion source).
- Avoid volume limits mistaken for objects.
- Prevent falling out of tactile/haptic space (no feedback when outside).

### 6.2 Objects
- Use appropriate object size for task/user perceptual capabilities.
- Create discriminable tactile/haptic symbols.
- Create symbols from visual symbols where appropriate.
- Use discriminable object angles.
- Use easily identifiable/corner-identifiable tactile/haptic objects.

## Interaction (Clause 7)
### 7.1 Navigating Tactile/Haptic Space
- Provide navigation information, path planning support, well-designed paths.
- Make landmarks easy to identify/recognize.
- Provide appropriate navigation techniques.
- Provide navigational aids.
- Support exploratory strategies (procedures to understand space).

### 7.2 Understanding the Tactile/Haptic Space
- Support reconfiguration of tactile/haptic space.

### 7.3 Interaction Techniques
- Implement appropriate interaction techniques.
- Avoid unintended oscillation.

## When to Use
- Designing tactile/haptic interfaces for consumer electronics, medical devices, automotive controls.
- Implementing haptic feedback in touchscreens, wearables, VR/AR.
- Creating accessible interfaces for blind/low-vision users (Braille displays, tactile graphics).
- Encoding information via vibration, force, texture, temperature.
- Evaluating tactile/haptic interaction usability.

## Relationship to Other Standards
- Part of **ISO 9241-900** subseries (Tactile and haptic interactions).
- Builds on **ISO 9241-910** (Framework for tactile and haptic interaction).
- References **ISO 9241-400** (Physical input devices), **ISO 9241-410** (Design criteria for physical input devices).
- Related: **ISO 9355-3:2006** (Manipulating controls - Actuators), **ISO 11064** (Control centres).
- Companion: **ISO 9241-930** (Haptic interactions in multimodal environments), **ISO 9241-940** (Evaluation of tactile/haptic interactions), **ISO 9241-971** (Haptic interfaces to public devices).
