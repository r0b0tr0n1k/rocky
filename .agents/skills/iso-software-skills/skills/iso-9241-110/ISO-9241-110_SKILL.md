---
name: iso-9241-110
description: "Ergonomics of human-system interaction - Dialogue principles. Use when designing user interfaces, evaluating interactive systems, or applying dialogue principles. Triggers: dialogue principles, interactive systems, user interface design, ergonomics, usability, ISO 9241-110, dialogue requirements, self-descriptiveness, controllability, error tolerance, suitability for learning, suitability for individualization."
---

# ISO 9241-110:2006 - Dialogue Principles for Interactive Systems

Follow ISO 9241-110:2006 for ergonomic design of interactive systems using dialogue principles.

## Scope

Applies to ALL types of interactive systems. Does NOT cover:
- Specifics of every context of use (safety critical systems, collaborative work)
- Marketing, aesthetics, corporate design

**Intended for**:
- User interface designers (style guides)
- User interface designers (during development)
- Developers (design & implementation)
- Buyers (product procurement)
- Evaluators (ensuring compliance)

## Seven Dialogue Principles

### 1. Suitability for the Task
**Definition**: Interactive system supports user in completing the task (functionality & dialogue based on task characteristics, not technology).

**Key recommendations**:
- Present information related to successful task completion
- Avoid presenting unnecessary information
- Format input/output appropriate to task
- Include necessary steps, avoid unnecessary steps
- Compatible with source document characteristics
- Channels for inputs/outputs appropriate to task
- Design so interaction is apparent to user

**Examples**:
- Time-critical correspondence: display relevant deadlines
- Online shop: context-sensitive help for order steps
- Currency conversion: display precision suitable for target currency (2 decimal digits for European currencies)
- Domestic market: state clearly "for domestic use only"

### 2. Self-descriptiveness
**Definition**: At any time, obvious which dialogue user is in, where they are, what actions can be taken, how they can be performed.

**Key recommendations**:
- Guide user through dialogue at each step
- Minimize need to consult manuals/external info
- Keep informed about system status changes
- Provide info on expected input format
- Design so interaction is apparent
- Provide info on required formats/units

**Examples**:
- Hotel reservation: [Next] & [Back] buttons guide through steps
- Office phone: clearly labelled "Record message" or "Set forwarding"
- CAD application: voice commands for pointer manipulation
- E-commerce: explicitly display all required steps with current step highlighted

### 3. Conformity with User Expectations
**Definition**: Corresponds to predictable contextual needs of user and commonly accepted conventions.

**Key recommendations**:
- Use vocabulary familiar to user / based on existing knowledge
- Provide immediate & suitable feedback
- Reflect data structures/organization perceived as natural
- Follow cultural & linguistic conventions
- Format, length of feedback/explanation based on user needs
- Behaviour & appearance consistent within/across similar tasks

**Examples**:
- Banking app: use "wire transfer" & "savings" (not "transfer" & "deposit")
- International users: "Last name" & "First name" (not "Name" & "Given name")
- Installation: feedback on success, even if user not looking at screen
- Search results: indicate if will take >60s due to high traffic
- Department store: organize goods similar to physical store layout
- English: left-to-right; Arabic: right-to-left

### 4. Suitability for Learning
**Definition**: Supports & guides user in learning to use the system.

**Key recommendations**:
- Make rules & underlying concepts available (tutorials)
- Provide appropriate support for infrequent use/relearning
- Feedback/explonations assist in building conceptual understanding
- Provide sufficient feedback on intermediary/final results
- Allow exploration ("try out") without negative consequences
- Enable minimal learning (system supplies additional info on request)
- Enable familiarization with dialogue

**Examples**:
- Bookkeeping software: help system guides through annual balance sheet steps
- Scanning software: shows all steps (order & interrelationships) for creating electronic text files
- Menu items: explain use when user presses Help key
- Feedback helps build patterns for memorization activities
- Scheduling system: evaluate potential variations before applying changes
- Photo processing: sequence of changes reversible via "Undo"

### 5. Controllability
**Definition**: User able to initiate & control direction/pace of interaction until goal met. Pace NOT dictated by system.

**Key recommendations**:
- User controls how to continue dialogue
- If dialogue interrupted, user determines restart point (if permitted)
- If task operations reversible & context allows, undo at least last step
- User controls data presentation when volume is large
- Enable use of any available input/output devices
- Enable modification of default values (where appropriate)
- Original data remains available if modified (where required)

**Examples**:
- Mobile phone: messages visible & editable until user sends/stores/deletes
- ERP system: store partially entered orders to continue later
- Data base app: modify postal codes in range 1-35 only
- Text editor: dedicated "Undo" option for last editorial step
- Calendar app: view by day/week/month/user-specified criteria
- Search form: activate via mouse or "Enter" key

### 6. Error Tolerance
**Definition**: Despite evident errors in input, intended result may be achieved with no/minimal corrective action. Achieved via error control, correction, or management.

**Key recommendations**:
- Assist user in detecting & avoiding input errors
- Prevent actions causing undefined system states/failures
- When error occurs, provide explanation for correction
- Active support for error recovery where errors typically occur
- Auto-correct where possible, advise user & offer override
- Enable deferring correction or leaving errors uncorrected (unless required)
- Provide error & correction info upon request

**Examples**:
- E-commerce: point out unfilled required fields
- DVD player: "No DVD inserted. Insert DVD to play"
- Printing: allow only page numbers 1-35
- Cursor positioned at erroneous input location
- E-mail client: verify syntax before storing address
- E-mail: check for "attach/attached" words before sending, offer "Attach file?" message

**Error recovery**: Minimize steps required for correction. Cursor auto-positioned at error location.

### 7. Suitability for Individualization
**Definition**: Users can modify interaction & presentation to suit individual capabilities/needs.

**Key recommendations**:
- Provide mechanisms to modify characteristics for diverse users (language, culture, knowledge, experience, perceptual/sensory-motor/cognitive abilities)
- Allow choice from alternative representations (screen reader software, etc.)
- Modify amount of explanation (details in error messages, help info)
- Incorporate own vocabulary for objects/actions
- Set speed of dynamic inputs/outputs to match needs
- Select between different dialogue techniques
- Select levels/methods of interaction
- Select how input/output data represented (format & type)
- Add/rearrange dialogue elements/functionality for individual needs
- Reversible individualization, return to original settings

**Examples**:
- Text-based app: use icons/graphics for limited reading skills
- Individualization: next user finds system behaving unexpectedly → reset to defaults
- Business app: turn off system-initiated help for advanced users
- Word processor: save via menu, icon, or keyboard shortcut
- Adjust character sizes, pointing device sensitivity
- Railway ticket machine: choose between direct entry or list selection
- Add "Strikethrough" to toolbar if frequently used

## Framework for Using Dialogue Principles (Clause 5)

### 5.1 Analysis Phase
**Identify Context of Use** (from ISO 9241-11):
- **Users**: Characteristics, knowledge, experience, abilities
- **Tasks**: Activities required to achieve goal
- **Equipment**: Hardware, software, materials
- **Environment**: Physical & social environments

**Specify Dialogue Requirements** based on:
1. Dialogue principles (suitability for task, self-descriptiveness, etc.)
2. Context of use analysis
3. Applicable recommendations from Clause 4.3-4.9

**Example**: Railway ticket machine
- Context: Travellers typically buy from departure station
- Dialogue requirement: "Departure station should be preselected at start of dialogue" (from Principle 1, Rec. 4.3.4)

### 5.2 Design Phase
**Select Dialogue Techniques** (from ISO 9241-14 to 9241-17):
- **Menus** (ISO 9241-14)
- **Command languages** (ISO 9241-15)
- **Direct manipulation** (ISO 9241-16)
- **Form-filling** (ISO 9241-17)

**Apply Recommendations** from Clause 4.3-4.9 to selected technique.

**Example**: Railway ticket machine
- Selected technique: Form-filling dialogues (ISO 9241-17)
- Applicable recommendation: "Fields should contain default values wherever possible" (ISO 9241-17:1998, 6.1.3 a))
- Design solution: Form with departure station preselected as default

### 5.3 Evaluation Phase
**Evaluate Against Dialogue Requirements** using:
- Usability testing
- Expert evaluation
- User performance tests

**Example**: Railway ticket machine
- Test users report: "Takes too much effort to select departure station"
- Attribute: Departure station NOT preselected
- Conclusion: Does not meet dialogue requirement
- Action: Redesign to preselect departure station

## Relationship with Other ISO 9241 Parts

| Part | Title | Relationship to ISO 9241-110 |
|---|---|---|
| Part 1 | General introduction | Foundation |
| Part 2 | Guidance on task requirements | Context of use (ISO 9241-11) |
| Part 3 | Visual display requirements | - |
| Part 4 | Keyboard requirements | - |
| Part 5 | Workstation layout & postural | - |
| Part 6 | Guidance on work environment | - |
| Part 7 | Requirements for display with reflections | - |
| Part 8 | Requirements for displayed colours | - |
| Part 9 | Requirements for non-keyboard input | - |
| Part 11 | Guidance on usability | Context of use analysis |
| Part 12 | Presentation of information | Detailed recommendations for info presentation |
| Part 13 | User guidance | Dialogue techniques (menus, commands, etc.) |
| Part 14 | Menu dialogues | Specific dialogue technique |
| Part 15 | Command dialogues | Specific dialogue technique |
| Part 16 | Direct manipulation dialogues | Specific dialogue technique |
| Part 17 | Form filling dialogues | Specific dialogue technique |
| Part 20 | Accessibility guidelines | - |
| Part 110 | Dialogue principles | THIS PART |
| Part 300-307 | Electronic visual displays | - |
| Part 400-421 | Physical input devices | - |

## ISO 9241 Series Overview (Annex A)

**Ergonomics of office work with VDTs** (Parts 1-17):
- Parts 1-10: General principles, task requirements, visual displays, keyboards, workstation, environment, colours, input devices
- Parts 11-17: Usability, presentation, user guidance, menus, commands, direct manipulation, form-filling

**Ergonomics of human-system interaction** (Parts 20+):
- Part 20: Accessibility guidelines
- Part 110: Dialogue principles (THIS PART)
- Parts 300-307: Electronic visual displays (introduction, terminology, requirements, test methods)
- Parts 400-421: Physical input devices (principles, design criteria, selection, assessment)
- Part 151: Web software user interfaces
- Part 171: Software accessibility

## When to Apply Each Principle

| Context | Priority Principles |
|---|---|
| Time-critical tasks | 1 (Suitability for task), 5 (Controllability) |
| Learning new system | 4 (Suitability for learning), 2 (Self-descriptiveness) |
| Error-prone context | 6 (Error tolerance), 3 (Conformity with expectations) |
| Diverse user group | 7 (Suitability for individualization), 3 (Conformity) |
| Frequent use | 4 (Learning), 7 (Individualization) |
| Infrequent use | 2 (Self-descriptiveness), 4 (Learning) |

**Trade-offs**: Principles may conflict (e.g., controllability vs. error tolerance). Priority depends on:
- Organization's goals
- Needs of intended user group
- Tasks to be supported
- Available technologies & resources

## Checklist for ISO 9241-110:2006 Compliance

### Suitability for Task (Clause 4.3)
□ Information related to successful task completion presented
□ Unnecessary information avoided
□ Input/output format appropriate to task
□ Necessary steps included, unnecessary avoided
□ Compatible with source documents
□ Channels for inputs/outputs appropriate
□ Interaction apparent to user

### Self-descriptiveness (Clause 4.4)
□ User guided through dialogue at each step
□ Need for manuals/external info minimized
□ User kept informed of system status changes
□ Info on expected input provided
□ Interaction apparent to user
□ Required formats/units information provided

### Conformity with User Expectations (Clause 4.5)
□ Vocabulary familiar to user used
□ Immediate & suitable feedback provided
□ Data structures perceived as natural
□ Cultural & linguistic conventions followed
□ Feedback/explanation length based on user needs
□ Behaviour & appearance consistent

### Suitability for Learning (Clause 4.6)
□ Rules & concepts available to user
□ Support for infrequent use/relearning provided
□ Feedback assists building conceptual understanding
□ Sufficient feedback on results provided
□ Exploration without negative consequences allowed
□ Minimal learning required (system supplies info)
□ User enabled to become familiar with dialogue

### Controllability (Clause 4.7)
□ User controls how to continue dialogue
□ Restart point determinable after interruption
□ Last step undoable (where appropriate)
□ User controls data presentation (large volume)
□ Any input/output devices usable
□ Default values modifiable (where appropriate)
□ Original data remains available if modified

### Error Tolerance (Clause 4.8)
□ User assisted in detecting/avoiding input errors
□ Prevention of actions causing undefined states
□ Error explanation provided for correction
□ Active support for error recovery
□ Auto-correction with advice & override
□ Correction deferrable (unless required)
□ Error & correction info available upon request
□ Steps for error correction minimized

### Suitability for Individualization (Clause 4.9)
□ Mechanisms to modify characteristics for diverse users
□ Choice from alternative representations
□ Explanation amount modifiable
□ Own vocabulary incorporation enabled
□ Speed of inputs/outputs adjustable
□ Different dialogue techniques selectable
□ Interaction levels/methods selectable
□ Input/output data representation selectable
□ Dialogue elements addable/rearrangeable
□ Individualization reversible to original settings

### Framework Application (Clause 5)
□ Context of use analyzed (users, tasks, equipment, environment)
□ Dialogue requirements specified based on principles
□ Dialogue technique selected (menu, command, direct manipulation, form)
□ Recommendations applied to selected technique
□ Evaluation conducted against dialogue requirements

## Key Terms Defined

| Term | Definition |
|---|---|
| Dialogue | Interaction between user & interactive system as sequence of user actions (inputs) & system responses (outputs) |
| Dialogue principle | Set of general goals for design of dialogues |
| Dialogue requirement | Characteristic of dialogue satisfying user needs within identified contexts of use |
| Interactive system | Combination of hardware & software receiving input from & communicating output to human user |
| Task | Activities required to achieve a goal |
| User | Person who interacts with interactive system |
| User interface | All components (software/hardware) providing info & controls for user to accomplish tasks |
| Context of use | Users, tasks, equipment, & physical/social environments |
| Goal | Intended outcome |
