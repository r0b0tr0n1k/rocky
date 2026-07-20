---
name: iso-9241-143
description: "Ergonomics of human-system interaction - Forms. Use when designing forms, form elements, user-interface controls, or data entry interfaces. Triggers: forms, form design, user-interface elements, data entry, form validation, push buttons, radio buttons, check boxes, list boxes, text fields, ISO 9241-143."
---

# ISO 9241-143:2012 - Forms for Human-System Interaction!

Follow ISO 9241-143:2012 for ergonomic design of forms and form elements in interactive systems.

## Scope!

Applies to forms regardless of modality (visual, spatial, vocal). Covers:`
- Text entry (abbreviations, full names) or selections from option lists`
- Visual/spatial relationship model (also applies to voice interfaces over telephone)`
- User-interface elements relevant to forms (NOT hardware aspects)`

**NOT covered**: Menus (covered in ISO 9241-14).`

**Intended for**:`
- User-interface designers (during development)`
- Designers of printed forms (source documents)`
- Buyers (during procurement)`
- Evaluators (ensuring requirements met)`
- Development tool designers`
- End users (beneficiaries)`

## Key Terms Defined!

| Term | Definition |
|---|---|
| Analogue form element | Allows selecting value within continuous range (rotary dials, sliders) |
| Check box | Option that can be on/off, independent choices (multiple can be checked) |
| Combination box | Text field + list box, type or select from list |
| Default action | Predefined operation for object that executes when user activates default mechanism |
| Dialogue box | Subordinate form in separate window supplementing interaction |
| Entry field | Field where users can input data or edit displayed data |
| Field | User-interface element for data entry/presentation |
| Form element | User-interface element applicable to forms |
| Hierarchical list | Lists in tree-like manner, selection leads to another list |
| Implicit designator | Portion of option name for keyboard selection |
| Label | Short descriptive title for field/control/object |
| List button | Button to access list, displays current selection + graphic bar |
| Navigation | Move from element to element within/between forms |
| Push button | Executes immediate command/action |
| Radio button | "One of many" choice, exactly one in group selected |
| Read-only field | Field with data that cannot be modified |
| Scroll bar | Move objects beyond display area (indicates position/amount) |
| Scroll box | Rectangle within scroll bar for moving to specific region |
| Selection cursor | Indicator of item whose state can be changed |
| Selection indication | Visual cue that indicates selected element |
| Selection list | List of items for single/multiple selection |
| Stepper | Move through alternatives/options/values one at a time |
| Tab set | Metaphor of index cards with tabs to identify sets |
| Text field | Allows entering character-based data |
| Toggle button | Choice between two states (set/unset, popped in/out) |
| User-interface element | Entity presented by software (text, graphic, control, container) |

## Clause 4: Forms!

### 4.1 Selection`
Forms (including dialogue boxes) shall be used for structured data entry tasks requiring input/modification of multiple data items.`

**Major uses**:`
- Entering information into forms (income tax, registration, service orders)`
- Entering information received over telephone`
- Interactively populating data (e-commerce transactions, database updates, consumer profiles)`
- Specifying application options/parameters`
- Responding to mediate requests (dialogue boxes)`

**Considerations**:`
- Forms vary from simple fields to complex multi-record data`
- Often based on visual spatial metaphor (can be implemented in other modalities)`
- Users fill-in, select entries, modify fields, retrieve information`
- Quality depends on specific usability criteria set by user/buyer/consumer`

### 4.2 General Requirements & Recommendations!

**ISO 9241-110 dialogue principles**: Provides additional info on ergonomic rationale for trade-offs.`

**Applicability**: Some requirements/recommendations are conditional based on:`
- Particular kinds of users, tasks, environments, technology`
- Not ALL are expected to be applied - only those relevant`
- Annex B provides procedure for determining applicability/conformance`

## Clause 5: Information Presentation!

**General**: Consult ISO 9241-12 for general guidance on information presentation.`

**Layout** (5.2):`
- **Paper document source**: If used, form screen should be consistent with source document structure (item ordering, grouping, units) - see ISO 9241-12:1998, 5.6`
- **No source document** (5.2.2):`
  - Arrange elements based on sequence appropriate for written language`
  - Example (English): elements arranged left-to-right, top-to-bottom`
  - Group fields by function/importance or optimize based on input sequences`
  - Dynamically modified based on user choices (telephone sales)`
- **Order of required/optional fields** (5.2.3):`
  - Required fields positioned first (unless inappropriate, e.g., conflicting with paper source)`
  - Important for elderly users who often don't recognize typical coding for required fields`
- **Alphanumeric field alignment** (5.2.4):`
  - Visually presented forms: align fields vertically in columns, left-justified within each column`
  - Improves visual scanning, minimizes keystrokes between fields`
- **Numerical field alignment** (5.2.5):`
  - Groups of numeric fields with different lengths: content right-justified`
  - Fields with decimal markers: aligned to decimal marker`
- **Allowable field values** (5.2.6): Provide information indicating allowable values (display on form or on demand)`

## Clause 5.3: Names and Labels!

**Consistency** (5.3.1): Naming of labels consistent through different platforms/systems (PCs, PDAs, Kiosks).`

**Naming elements/groups** (5.3.2): All elements/groups shall have a name (whether label visually displayed or not). Names can be used by screen readers.`

**Label visual design** (5.3.3): Consult ISO 9241-12:1998, 5.9 for general guidance.`

**Differing label lengths** (5.3.4):`
- Fields LEFT-justified, labels placed ABOVE fields, left-justified with fields (when lengths differ significantly)`
- See Figure 1 (labels differ) vs. Figure 3 (labels similar)`

**Similar label lengths** (5.3.5): Text/alphanumeric fields aligned vertically, labels left-justified (when lengths don't differ significantly).`

**Label placement for search tasks** (5.3.6): Fields labels should be LEFT-justified (for search tasks).`

**Consistent label positions** (5.3.7): Labels consistently positioned for type of element/group.`

**Label position for check boxes/radio buttons** (5.3.8): Labels should be to the RIGHT (unless button large enough for text inside).`

**Labels for screen reader use** (5.3.9): Individual check box/radio button label name should include group label name (for accessibility).`

**Multiple instances in matrix** (5.3.11):`
- Labels for multiple instances in matrix: place ABOVE columns (Figure 4) or to LEFT of rows (Figure 5)`
- See figures for examples`

**Descriptive field labels** (5.3.12): All fields should be clearly/unambiguously labelled to describe purpose/function.`

**Distinctive field labels** (5.3.13): Distinctive words/codes (position, border, font, colour) for entry field labels. Apply consistently throughout form.`

**Consistent labels** (5.3.14): Mapping between labels and functions for form elements should be consistent across software/application/product/service.`

**Symbols/units** (5.3.15): Display symbols/units ($, %, mph, cm) as additional labels when required for data interpretation.`

**Initial upper-case** (5.3.16): English text field labels begin with upper-case letter, rest lower-case (except logos, acronyms, numeric values, or language conventions).`

**Implicit designator** (5.3.17): Assign implicit designator to each element label to facilitate navigation (e.g., for keyboard selection).`

**Multiple pages** (5.3.18):`
- In sequence of multiple forms: location within sequence shall be provided, same location on each form (e.g., "Page 1 of 3" at top)`
- If columnar: labels of columns should be re-displayed`

## Clause 5.4: Visual Cues in Fields and Forms!

**Design considerations** (5.4.1): Cueing should be provided appropriate to modality (visual cues for visually presented forms).`

**Fields with fixed length** (5.4.2): Lengths should be explicit (character spaces shown, separated by boxes - see Figure 6).`

**Fields with maximum length** (5.4.3): Should be explicit (show amount of space available).`

**Representation of optional/required entries** (5.4.4):`
- Required and optional fields shall be represented so differences are perceptible`
- Methods: asterisks (*) for required, periods (.) for optional (Figure 7)`
- Different colours/shades (discriminable on monochrome display)`
- See ISO 9241-12 and ISO 9241-171 for limiting exclusive use of colour`

**Modifiable vs. non-modifiable fields** (5.4.6): User should easily distinguish modifiable from read-only fields via coding.`
- Example: Non-modifiable = same background as dialogue box; Modifiable = different colouring`
- Read-only fields take focus for reading, announced as read-only by screen readers`

**Cues for entry format** (5.4.7): Cues for data entry format (e.g., "hh:mm:ss") displayed within field or in labels. If abbreviations used, clarify meaning (Y/N for Yes/No).`

**Cues for push buttons** (5.4.8): Push buttons should have visual cues indicating:`
- Command carried out immediately (no ellipsis "...") vs.`
- Need additional input/confirmation before command (ellipsis "...") - see Figure`

**Cues for expanding dialogues** (5.4.9): If form element expands dialogue to reveal additional functionality:`
- Element should contain visual cue/label indicating expansion (e.g., "Advanced >>")`
- User should be able to easily contract dialogue again`

**Cues for contracting dialogues** (5.4.10): If form element contracts dialogue to hide functionality:`
- Element should contain visual cue/label indicating contraction (e.g., "< Basic")`

## Clause 6: Interaction!

### 6.1 Navigation!

**Method** (6.1.1): User needs navigation methods to access areas of form required by tasks. Choice should account for:`
- Particular user population`
- Compatibility with user's flow of work`
- Examples: Tab key, cursor keys, pointing device`

**Movements among fields** (6.1.2): User shall be provided capability to:`
- Move from field to field within group`
- Move to non-adjacent fields in other groups`
- Mechanisms: Tab key, cursor keys, pointing device`
- See ISO 9241-171:2008 for keyboard-only navigation`

**Quick access** (6.1.3): If rapid access to specific field required: quick access mechanism should be provided.`
- Example 1: Fields have implicit designators, users type designator to go to field`
- Example 2: Press designated function key + type label/number in dialogue box`

**Return to initial field** (6.1.4): Key/command should be provided so user can return to initial field on form.`

**Record cycling** (6.1.5): If data organized in sequential records: mechanism for cycling forwards/backwards through records.`

**Pointing device and multiple forms** (6.1.6): If pointing device used + multiple forms: mechanism for navigating between forms using pointing device.`

**Conditional navigation** (6.1.7): If value of entry makes some entries unnecessary:`
- System should move to next appropriate entry field after completion`
- Remaining choices should be deleted or protected`
- User should recognize which fields no longer require entries`

### 6.2 Navigation by Tab Keys and Scrolling!

**Tab keys** (6.2.1): Tab key (or equivalent) should be provided for moving from field to field.`
- Note: Not all devices have tab key, but equivalent exists (e.g., other key/command)`

**Completely filled fixed-length fields** (6.2.2): If ALL fields completely filled + easily learned forms:`
- Auto-skip tabbing provided (cursor auto-skips to next field when last character position filled)`
- Used only when consistent with user expectations`
- Should NOT repeatedly create errors/delays`
- Reverse tabbing should be provided for correcting errors`

**Mutually exclusive fields** (6.2.3): If mutually exclusive fields present: skipping remaining choices allowed when entry made for one choice.`

**Form sections** (6.2.4): If form organized into meaningful groups (sections):`
- User should be provided capability to move from group to group (not tab through all fields in group to reach next group)`

**Backwards tabbing** (6.2.5): If form supports tab key navigation: mechanism for tabbing backwards through fields should be provided.`

**Forward wrapping** (6.2.6): When pressed in LAST field: forward tab should move to FIRST field in form/dialogue box.`

**Backward wrapping** (6.2.7): When pressed in FIRST field: backward tab should move to LAST field in form/dialogue box.`

**Field scrolling** (6.2.8): If max length of data > field display: scrolling mechanism should be provided.`
- Consider auto wrap capability for text entry only`

**Scrolling by pages** (6.2.9): When scrolling by page: minimum ONE unit of overlap between information displayed.`
- Example: Pages scrolled using up/down arrows in vertical scroll bar - overlap yields visual continuity`

### 6.3 Input Focus and Cursors!

**Keyboard focus** (6.3.1): Only ONE field at a time within form/dialogue box shall have keyboard focus for given user.`
- Field has keyboard focus only when window/form/dialogue box containing it has keyboard focus`

**Cues for keyboard focus** (6.3.2): Field with keyboard focus should be indicated by presence of focus indicator.`
- When text field loses keyboard focus: should NOT display text cursor`

**Initial focus position** (6.3.3): When dialogue box/form first displayed:`
- Should have keyboard focus`
- Focus indicator should be positioned automatically at first entry field that MUST/MAY be completed`

**Initial placement of text cursor** (6.3.4): Location of text cursor when text field first gets keyboard focus should support user's task:`
- Task indicates portion likely to be modified: cursor at END of that portion`
- Task indicates NO specific portion: cursor at END of text in field`
- Entire text selected for replacement: cursor may NOT be shown (see 6.3.5)`

**Replacement of text in field** (6.3.5): If user task typically requires replacement of all (not portion) of text:`
- Entire text should be selected for replacement when user first enters field`
- a) User enters info: previously selected text replaced with new text`
- b) User leaves field without entering: text that was initially in field remains`
- c) Mechanism should be provided for positioning text cursor within field so info can be entered WITHOUT deleting previous text`

**Indirect regaining of keyboard focus** (6.3.6): If field lost keyboard focus + subsequently regains focus indirectly:`
- Text field: text cursor should reappear at SAME position when field lost keyboard focus`
- NOT text field (radio button group): selection indicators should reappear at SAME position`

**Regaining focus by clicking** (6.3.7): If field lost keyboard focus + regains via click within element:`
- Text field: focus indicator moves to field, text cursor moves to position where click occurred`
- Check box/radio button: focus indicator moves to specific button, state changes`
- Push button: button activated, keyboard focus changes as per button's defined action`
- List box: focus indicator moves to list box, selection indicator on item at click position`

**Indicators and cursor for multiple selection** (6.3.8): When multiple-selection list box entered:`
- Selection cursor should be on FIRST item in list box`
- Selection indicator for each currently selected item in list box`

**Indicator for single selection** (6.3.9): When single selection list box initially receives focus:`
- Presence/location of selection indicator should support user's task`
- Current selection/default selection in list box (see recommendation for selections in single-selection list box)`
- NO current selection + NO default appropriate: NO selection indicator present, selection cursor on first item`

### 6.4 Input!

**Considerations** (6.4.1): User input considerations should include:`
- User control of dialogue at all times`
- Capability to recover easily from errors`
- Avoiding requiring user to input more information than necessary for successful task performance`
- Input info currently available in system`

**Minimize cursor movement** (6.4.2): User actions required to move cursor from one entry field to next should be minimized.`
- Example: Tab key used to jump from field to field`

**Input device independency** (6.4.3): If multiple input device access available: all form elements should be operable by ALL available input devices (keyboard, mouse, voice).`

**Pointing devices** (6.4.4): If pointing device can be used for input in form: should be usable for navigation as well.`

**Switching between input devices** (6.4.5): If appropriate to task: need to switch between different input devices when filling form should be minimized.`
- Example 1: Multiple data entry methods available in same field where appropriate`
- Example 2: Navigation to all form fields with all input devices provided`

**Incomplete text entry field** (6.4.6): If (required) number of characters entered does NOT fill whole field:`
- User should be allowed to move directly to next field (without requiring user to enter blank spaces to complete field)`

## Clause 6.5: User Control!

**Changes/corrections** (6.5.1): If user changes in form can impact database accessed by multiple users:`
- User should be allowed to go back to initial state at any time`
- Start over, cancel entries, or change any entry before form processed by computer`

**Immediate processing of user input** (6.5.2):`

**Condition 1** (6.5.2.1): Change in form results in ONLY visual changes on screen + local storage of data:`
- If can be reversed without negative consequences: user inputs should be processed immediately, then transferred to database on user confirmation`
- Example: Choice in first field changes values visible in second field - user can go back/change first field without affecting database`

**Condition 2** (6.5.2.2): Changes can be reversed without negative consequences + user performance benefits:`
- User inputs should be processed immediately without confirming action`
- Example: Making desktop settings (background colour, font) - changes immediately reflected as user makes selections, NO push button confirmation required`

**Condition 3** (6.5.2.3): User input processed immediately without user confirmation (as in 6.5.2.2):`
- User should be allowed to go back to initial state at any time, start over, cancel entries, or change any entry BEFORE form/dialogue box is closed`

**Identifying and locating errors** (6.5.3):`

**Multiple fields** (6.5.3.1): If validation detects fields in error:`
- These fields should be indicated`
- Cursor should be placed on FIRST field in error`
- User should be allowed to easily move through fields in error to correct entries`

**Dependencies** (6.5.3.2): If dependencies between fields: potential errors resulting from such dependencies should be indicated (if appropriate to task).`

**Re-entering data** (6.5.4): If field contains error: user should be required ONLY to correct ERRONEOUS PART of input.`
- Note: For security/authorization info, may need entire field or fields to be re-entered`

**Disaled areas** (6.5.5): User should NOT be able to enter info in areas NOT available for input (read-only fields).`
- These areas should give visual cues + info to screen readers indicating they are disabled`
- Cursor might be placed in disabled field for copy/paste to other fields`
- If users want context-sensitive help on read-only fields: may need to allow focus indicator to move to read-only fields so keyboard mechanisms for activating Help can be used (F1)`

**Easy transmission** (6.5.6): If transmission of form required: transmission of field entries should be accomplished by SIMPLE, EXPLICIT action.`
- Transmission action should take place NO MATTER where cursor currently located on form (user NOT required to navigate to particular field)`
- Note: For blind user, useful to provide submit button that user can select at any time, after having opportunity to review all form fields`

**User control information** (6.5.7): Unless obvious to user, form should state how to carry out following actions (if provided):`
- a) Signal completion of form/dialogue box + redisplay EMPTY form (with default values if appropriate) for entry of new data`
- b) Signal completion of form + redisplay PREVIOUSLY COMPLETED version of form/template`
- c) Dismiss form/dialogue box WITHOUT changing any data in system (Escape/Cancel)`
- d) Use "Undo"`

**Dismissing dialogue boxes** (6.5.8):`

**Single actions** (6.5.8.1): If expected use involves single application of set of inputs: dialogue box should contain button that APPLIES input + DISMISSES it.`

**Multiple actions** (6.5.8.2): If expected use involves multiple applications of inputs:`
- Dialogue should have form element that APPLIES input WITHOUT closing dialogue`
- AND button for closing dialogue after inputs applied`

**Single and multiple actions** (6.5.8.3): If expected use may involve BOTH:`
- Dialogue should provide mechanism for applying input WITHOUT closing`
- AND button for applying input + closing dialogue`

**Temporary save** (6.5.9): If appropriate to task + system constraints allow: temporary save function should be provided so user can:`
- Leave form temporarily (required data item not available, e.g.)`
- Return to it later WITHOUT having to re-enter all data on form`
- Note: When form re-selected + already saved form of that type exists: user can be given option of continuing with saved form OR starting new form`

## Clause 6.6: Feedback!

**Information needed** (6.6.1): User should be provided with information allowing him/her to:`
- Control dialogue`
- Recognize errors`
- Determine next course of action`

**Typed-in character echoing** (6.6.2): Typed-in characters shall be echoed back to user, character by character, as entered.`
- Note: For password entry, non-identifiable characters typically used (unless security not issue)`

**Cursor position and visibility** (6.6.3):`

**Form** (6.6.3.1): Cursor position shall always be clearly visible if within currently displayed portion of form.`

**Pointer position** (6.6.4): If pointing device available: position of pointer shall always be clearly visible to user.`

**Focus indicator** (6.6.5): Easily discriminable focus indicator shall be provided that allows user to determine which field/form element in dialogue box/form currently has keyboard focus.`

**Field errors** (6.6.6): If field contains error + appropriate to task + within system's capabilities:`
- Error feedback should be provided as SOON as user completes field`
- (e.g., by highlighting error OR providing info on nature of error and correct entries)`
- Manner that is minimally disruptive of continuation of task`
- Note: Security/safety requirements can necessitate immediate correction`

**Transmission acknowledgment** (6.6.7): If appropriate to task: system should provide acknowledgment to user that TRANSMISSION OF FORM ENTRIES HAS BEEN ACCEPTED by system.`

**Database changes** (6.6.8): If form/dialogue box changes database: feedback that database has been updated should be provided to user.`

## Clause 6.7: Access to Forms and Dialogue Boxes!

**Access mechanism** (6.7.1): If application contains various forms/dialogue boxes: user shall be provided with mechanism to access particular form/dialogue box.`

**Direct form access** (6.7.2): If appropriate to task + forms can be accessed independently: user should be able to select forms directly:`
- By naming form OR selecting from menu OR`
- By selecting form "container object" through direct manipulation`

**Movement between forms** (6.7.3): If forms can be accessed independently + appropriate to task: user should be able to move from form to form, forwards + backwards, in predefined sequence WITHOUT losing input.`

**Hierarchical level movement** (6.7.4): If set of forms is hierarchical: user should be provided with capability to move to both NEXT, HIGHER, and LOWER levels in structure.`

**Returning to initial form** (6.7.5): If set of forms is hierarchical: user should be provided with obvious means of returning to INITIAL FORM (top of hierarchy) from any form in hierarchy.`
- Note: Assumes form has NOT yet been submitted`

**Forms in windows environment** (6.7.6): If more than one form can be displayed in windows environment:`
- a) Only LAST selected form should be active + ready for input`
- b) If appropriate to task: user should be provided with capability to switch to another form to make it active`

**Default form** (6.7.7): If one form more likely to be used than another (generally or for particular task/user/environment/technology):`
- That form should be INITIAL FORM (system should display form on screen automatically when system/form application initially activated)`

## Clause 6.8: Default Values!

**Field default values** (6.8.1): Fields should contain default values whenever possible + appropriate to task.`

**Choice of system default values** (6.8.2): Whenever default values used, value should be chosen to support user's task:`
- a) System defaults should NOT be destructive (lead to data loss) NOR lead to undesirably time-consuming activities`
- b) Single-selection list box: initial default selection = item most likely to be selected OR first item in list`
- c) Multiple-selection list box: default values = set of items most likely to be selected by user`
- d) Group of radio buttons: there shall be default value initially selected`
- e) Group of radio buttons: default value = choice most likely to be selected`
- f) Group of check boxes: each check box should be set to value most likely to be selected (unless inappropriate to task, e.g., user required to make explicit choice)`
- g) Text box: default value = value most likely to be entered by user`
- h) Stepper buttons: initially displayed choice = most logical default choice (i.e., most likely to be selected)`
- Note: "Not answered" or "Not applicable" might be provided as default values`

**User configured defaults** (6.8.3): If default values likely to vary across users but remain relatively consistent across tasks of specific user: methods should be provided to allow user to customize default values.`

**Return to system defaults** (6.8.4): If application allows user to customize default values: means shall be provided to allow user to return settings to system default values.`

**Defaults in previously opened dialogue boxes/forms** (6.8.5): User's forms/dialogue boxes that may be accessed multiple times should provide default values that support user's task:`
- a) If likely that retaining values set by user will minimize user steps or need for changes: user-customized defaults should be presented as default values next time dialogue box/form accessed`
- b) If unlikely that user will want to retain previously set values + user-configured defaults NOT set: system defaults should be presented as default values next time dialogue box/form accessed`

**Default values for group of radio buttons** (6.8.7): If default for group of radio buttons: default choice in set shall be visibly selected when field first presented.`

**Default values for group of check boxes** (6.8.8): If default values for group of check boxes: default choice for each check box in group shall be indicated as active/inactive when field first presented.`

**Editable default values for text fields** (6.8.6): Text default field values should be editable by user using conventional editing commands.`

## Clause 6.9: Default Actions for Forms Elements!

**Default actions** (6.9.1): When default actions will benefit task performance: default actions should be defined for elements in dialogue box/form.`

**Number of default actions** (6.9.2): At any point in time ONLY ONE default action shall be applicable.`
- Note: Default action can change over time within same dialogue box/form based on position of focus indicator`

**Activation of default action** (6.9.3): A consistent user action should initiate default action.`
- Example: Pressing Enter key, Return key, or clicking with mouse button when pointer is on element initiates default action`

**Safe default actions** (6.9.4): Actions chosen as default actions should be SAFE (NOT destructive or resulting in time-consuming activity that user cannot easily cancel).`

**Cues for default action** (6.9.5): If default actions used + associated with push buttons: current default push button should have visual cue to indicate it is default.`
- Example: Default push button shown by thicker outer border (Figure 13)`

**Default actions in multi-field dialogues** (6.9.6): If dialogue box/form has more than one input field: default action should be based on most likely user action given location of focus indicator + structure of dialogue:`

**Scenario A** (focus on text field):`
- a) Task flow indicates portion of text likely to be modified: text cursor should be placed at END of that portion`
- b) Task flow indicates NO specific portion: text cursor should be placed at END of text in field`
- c) Entire text selected for replacement: text cursor may NOT be shown (see 6.3.5)`
- d) Mechanism provided for positioning text cursor within field so info can be entered WITHOUT deleting previous text`

**Scenario B** (focus on radio button):`
- Default action = select radio button + move to next field after group of radio buttons`

**Scenario C** (focus on check box):`
- Default action = select check box + move to next check box in group OR to next field if no more check boxes in group`

**Scenario D** (focus on single line text field with associated push button, e.g., Add, Find):`
- Default action = activate push button + text cursor remains in text field`

**Scenario E** (focus on last field in dialogue before exiting push buttons):`
- User will NOT need to review values entered in dialogue: default action = follow recommendations b) to g) above + activate push button to close dialogue`

**Scenario F** (focus on push button that results in new dialogue box):`
- Moves keyboard focus to new dialogue box`

**Scenario G** (focus on single-selection list item):`
- Default action = selection of item + appropriate action associated with list item (e.g., selection or open)`

**Scenario H** (focus on multiple-selection list item):`
- Default action = perform most typical action associated with list item (e.g., selection or open)`

**Default actions in simple dialogues** (6.9.7): In dialogue boxes/forms where primary user interaction provided by specific push buttons (OK, Cancel): ONE of push buttons should be defined as default action when user first enters dialogue.`
- Example: OK is default push button (Figure 14)`

## Clause 7: Validation!

### 7.1 Single-Field Validation!

If system capabilities available: data entry system should check entry in EACH field before accepting it, based on criteria defined for that field individually.`

**Validation criteria**:`
- Values in field defined from predefined range or list: editing criteria simply verify entry matches some item in predefined range/list`
- Note: Validation can involve BOTH syntax (date format) AND more importantly semantics (correct date)`

### 7.2 Multiple-Field Validation!

If dependencies between fields on form/dialogue box OR between field on OTHER instances of same form: following additional validation checks may be made:`

**Condition A** (7.2.1): Data already entered in other fields of same form.`
- Example: User NOT allowed to enter data in "Age of Child" if entry in "Children" is "0".`

**Condition B** (7.2.2): Data already entered in same field in other forms.`
- Example: Field is "key field" requiring unique value. System checks to make sure this value has NOT been used before on another instance of form.`

## Clause 8: Choice of Form Elements!

All form elements shall be accessible to screen readers (8.1).`

### 8.2 Push Buttons!

**Use when appropriate for**:`
- Desired result = making selection/setting state OR executing action`
- Need for quick access`
- Need for persistent high recognizability`
- Note: In some cases, selectable area of form (e.g., windows border) can result in action similar to push button`

**Cues**: Push button (current state) should be clearly indicated by perceptible cue.`
- Example 1: Inactive elements are dimmed`
- Example 2: Voice-based interaction - unavailable elements might NOT be presented but system tells user option is inactive`
- Example 3: Check box has check/tick to show it has been selected`

### 8.3 Toggle Buttons!

**Use when appropriate for**:`
- Desired result = setting a state`
- Set of choices is binary`
- Choices can be meaningfully portrayed`
- User needs to quickly see current state of options`
- User will clearly understand meaning of choice when selected/not selected`
- User may need to change settings frequently`

**Note**: Toggle buttons can be arranged in groups.`

### 8.4 Text Entry Fields!

**Use when appropriate for**:`
- Desired result = making selection, setting state, or assigning value`
- Set of possible valid entries is LARGE`
- NOT all entries can be predefined in advance`
- User can easily enter valid entries`
- Element used as part of keyboard intensive task`
- ANY input is acceptable (e.g., comment field)`

### 8.5 Radio Buttons!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Two or more MUTUALLY EXCLUSIVE choices`
- Display space sufficient for ALL buttons + labels`
- Number of choices is NOT LARGE (e.g., 5 or fewer)`
- User needs to quickly see which option currently selected`
- User will benefit from seeing ALL potential choices simultaneously`
- User may need to change settings frequently`

**Note**: Radio buttons can be arranged in groups. Logic = choosing one of A, B, C, etc.`

### 8.6 Check Boxes!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Each setting is single two-state choice (on/off, yes/no, true/false)`
- Choices can be meaningfully portrayed`
- User needs to quickly see current state of options`
- User will clearly understand meaning of choice when selected/not selected`
- User may need to change settings frequently`

**Note**: Check boxes can be arranged in labelled groups. Logic = choosing between A and NOT A. Check boxes in group are INDEPENDENT - selecting one does NOT affect others.`

### 8.7 Stepper Buttons!

**Use when appropriate for**:`
- Choices are MUTUALLY EXCLUSIVE`
- Limited space`
- Familiar sequential order to items`
- User does NOT need to preview options before making selection`
- User will want to make small changes relative to current value, quickly`
- User may want to go in EITHER direction within sequence`

**Examples**: Stepper with up/down arrows, cycle buttons, little arrows, sliders.`

### 8.8 Single-Selections List Boxes!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Choices are MUTUALLY EXCLUSIVE`
- Adequate space to display THREE or more items simultaneously WITHOUT scrolling`
- More than five items OR number of items may change over time`
- User may need to change settings frequently`
- Value in having LARGE number of choices simultaneously visible`
- Number of items changes dynamically`

**Note**: Selection cursor on current selection or default selection. If NO current selection + NO default appropriate: NO selection indicator present.`

### 8.9 Multiple-Selections List Boxes!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Choices are NOT MUTUALLY EXCLUSIVE`
- Adequate space to display THREE or more items simultaneously WITHOUT scrolling`
- More than five items OR number of items may change over time`
- User may need to change settings frequently`
- Value in having LARGE number of choices simultaneously visible`
- Number of items changes dynamically`

**Note**: Large enough to show at least 3 items when scroll bar used. Harder to use by elderly than radio/check boxes.`

### 8.10 Pop-up/Drop-Down Lists!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Choices are MUTUALLY EXCLUSIVE`
- VERY limited space`
- Settings NOT changed frequently`
- Except when changing selection, user needs to see ONLY item currently selected`
- Four or more items OR number of items may change over time`
- All values can be supplied by application`

**Pop-up list**: Activates by button, picker appears.`
**Drop-down list**: Field + list, user types or selects from list which fills field.`

### 8.11 Combination Boxes!

**Use when appropriate for**:`
- Desired result = making selection, setting state, or assigning value`
- Choices are MUTUALLY EXCLUSIVE`
- Limited space`
- User needs to see which option currently selected`
- Five or more items OR number of items may change over time`
- User may be able to type entry more quickly than select it`
- Element used as part of keyboard intensive task`
- User may have to type values NOT in application`

**Note**: Combination box typically has label (textual/graphical) indicating purpose.`

### 8.12 Single-Selections Hierarchical Lists!

**Use when appropriate for**:`
- Desired result = making selection`
- Choices are MUTUALLY EXCLUSIVE`
- Adequate space to display THREE or more options simultaneously WITHOUT scrolling`
- LARGE number of items`
- Options can be meaningfully grouped in hierarchy`
- User needs to implicitly select all subordinates of a level in hierarchy`

**Note**: When item selected at higher level, ALL subordinate levels automatically selected.`

### 8.13 Multiple-Selections Hierarchical Lists!

**Use when appropriate for**:`
- Desired result = making selection`
- Choices are NOT MUTUALLY EXCLUSIVE`
- Adequate space to display THREE or more options simultaneously WITHOUT scrolling`
- LARGE number of items`
- Options can be meaningfully grouped in hierarchy`
- User needs to simultaneously select ALL subordinates of a level in hierarchy`

### 8.14 Analogue Form Elements (Slider, Rotary Dial, etc.)!

**Use when appropriate for**:`
- Desired result = making selection, setting state`
- Choices are MUTUALLY EXCLUSIVE`
- Display space is sufficient`
- Need to present + manipulate variable along continuum`
- Need for large precise changes with minimal effort`
- Need to show current value relative to possible range of values`

### 8.15 Tabbed Form Elements!

**Use when appropriate for**:`
- Presenting multiple pages of information in limited display space`
- More information than can be presented in single dialogue`
- Multiple forms which need to be visible, ONE at a time, simultaneously with another user-interface element`
- Multiple settings that can be grouped into meaningful non-overlapping categories`
- NO sequential dependency between groups of elements (placed on separate tabs)`
- User does NOT need to see all settings simultaneously`

**Note**: Respective tab gets step through list of items, with item details displayed on tabs.`

### 8.16 Property Dialogues!

**Access** (8.16.1): User should have simple + consistent mechanism for accessing property boxes.`
- Example: Edit menu contains "Properties" item. User selects object, then accesses Edit → Properties.`

**Association with object** (8.16.2): Property box should provide means for user to identify object/item with which properties are associated.`
- Example: Title of properties box provides name of object whose properties are shown.`

**Multiple properties** (8.16.3): If object has LARGE number of properties: properties should be categorized + grouped for presentation.`
- Example: Document properties grouped under tabs: Title, Page Layout, Permissions.`

**Templates** (8.16.4): If possible: user should be able to take property settings for given object + apply them to new/existing object.`

**Modifications** (8.16.5): If user can modify properties of objects: properties box should provide mechanism for making these modifications.`

## Annex A: Overview of ISO 9241 Series!

**Structure reflects original ISO 9241 standard numbering**:`
- Part 100: Introduction to software ergonomics`
- Part 110: Dialogue principles`
- Part 143: **Forms** (THIS PART)`
- Part 151: Guidance on Web user interfaces`
- Part 171: Guidance on software accessibility`
- Part 210: Human-centred design for interactive systems`
- Part 300-307: Electronic visual display requirements`
- Part 400-420: Physical input devices`
- Part 910-920: Tactile and haptic interaction`

## Annex B: Checklist for Applying This Part!

**Procedure for determining conformance** (based on applicability + compliance):`

**Applicability**: Each requirement/recommendation has "shall" (requirement) or "should" (recommendation).`
- Determine if conditional statement is TRUE → Y/N`
- Methods: System documentation analysis, Documented evidence, Observation, Analytical evaluation, Empirical evaluation`

**Compliance**: If applicable (Y):`
- Determine whether met using: Measurements, Observation, Documented evidence, Analytical evaluation, Empirical evaluation`
- Checklist columns: Requirement/Recommendation, Y/N (applicable), Method used, P/F (pass/fail), Comments`

**Adherence Rating (AR)**: (Number of P checks) / (Number of Y checks) × 100%`
- Note: AR is arithmetic count, NOT reliable measurement of degree of adherence without considering respective weights`

## Checklist for ISO 9241-143:2012 Compliance!

### Forms!
□ Forms used for structured data entry tasks`
□ Title clearly indicates purpose, differentiates from other forms`
□ Title provides sense of location within application structure`
□ Visual coding for user entries, defaults, previously entered data`
□ Element states clearly indicated by perceptible cue`
□ Form display density limited (unless required by task)`
□ Complexity appropriate for task (expandable forms, additional pages, tabbed dialogues)`
□ Instructions provided (particularly helpful for infrequent/elderly/non-native speakers)`
□ Help available for completing entries`
□ Overview of form structure provided (for complex forms)`
□ Modaless (NOT modal) dialogue boxes preferred (unless necessary for command completion)`
□ Conformance with ISO 9241-171 (accessibility)`

### Information Presentation!
□ Layout consistent with paper source (if used)`
□ Elements arranged based on language sequence OR optimized for user`
□ Required fields positioned first`
□ Alphanumeric fields left-justified in columns`
□ Numeric fields right-justified (or aligned to decimal)`
□ Allowable field values indicated`
□ Labels: consistent naming, all elements have names, visually designed per ISO 9241-12`
□ Labels: appropriate length formatting, positioned consistently`
□ Labels for check boxes/radio buttons to the right`
□ Labels for screen readers include group label name`
□ Multiple instances: labels above columns OR left of rows`
□ Descriptive + distinctive labels (words/codes for differentiation)`
□ Consistent mapping between labels + functions across application`
□ Symbols/units displayed as additional labels`
□ English labels: initial upper-case, rest lower-case`
□ Implicit designators assigned for keyboard navigation`

### Visual Cues!
□ Cues appropriate to modality (visual cues for visual forms)`
□ Fixed-length fields: lengths explicit (character spaces shown)`
□ Maximum-length fields: explicit (space available shown)`
□ Required/optional entries: perceptibly different (asterisks, periods, colours)`
□ Modifiable vs. non-modifiable: easily distinguishable (different colouring)`
□ Entry format cues: displayed in field or labels (abbreviations clarified)`
□ Push buttons: cues for immediate vs. needs confirmation (ellipsis "...")`
□ Expanding dialogues: visual cue indicating expansion (e.g., "Advanced >>")`
□ Contracting dialogues: visual cue indicating contraction (e.g., "< Basic")`

### Navigation!
□ Tab key/equivalent provided for moving field to field`
□ Auto-skip for completely filled fixed-length fields (if appropriate)`
□ Mechanisms: backwards tabbing, forward/backward wrapping`
□ Field scrolling provided (if max length > field display)`
□ Scrolling by pages: minimum ONE unit overlap`
□ Methods account for user population + work flow compatibility`
□ Movement among fields: within group, to non-adjacent fields, quick access`
□ Return to initial field, record cycling, conditional navigation`
□ Pointing device: usable for both input + navigation`
□ Minimize need to switch between input devices`

### Input Focus & Cursors!
□ Only ONE field at a time has keyboard focus`
□ Focus indicator clearly visible on field with keyboard focus`
□ Initial focus on first entry field that must/MAY be completed`
□ Text cursor placement supports user's task (end of portion, end of text, or selected for replacement)`
□ Regaining focus: cursor/text cursor reappears at SAME position`
□ Clicking in field: focus indicator + text cursor move to click position`
□ Multiple-selection list: selection cursor on FIRST item, indicators for selected items`
□ Single-selection list: indicator on current/default selection (or NO indicator if none)`

### Input!
□ User control at all times, capability to recover from errors`
□ Cursor movement minimized between fields (Tab key)`
□ All form elements operable by ALL input devices available`
□ Incomplete text field: user can move directly to next field`
□ Avoid requiring more info than necessary`

### User Control!
□ Changes impact database: can return to initial state, start over, cancel, or change entries`
□ Immediate processing: conditions met for visual changes, reversibility, user confirmation`
□ Error fields indicated, cursor on FIRST error, easy movement to correct`
□ Dependencies between fields: potential errors indicated`
□ Re-entering data: ONLY correct ERRONEOUS PART (unless security requires full re-entry)`
□ Disaled areas: NOT editable, visual cues + screen reader info provided`
□ Easy transmission: SIMPLE, EXPLICIT action, NO MATTER where cursor located`
□ Form states how to: complete form, dismiss, use "Undo"`
□ Dismissing dialogues: single action applies + dismisses, OR multiple actions (apply without closing + close button)`
□ Temporary save function available (if appropriate)`

### Feedback!
□ Info allowing user to control dialogue, recognize errors, determine next action`
□ Typed-in characters echoed back, character by character`
□ Cursor + pointer position always clearly visible`
□ Focus indicator: easily discriminable, shows which field has focus`
□ Field errors: feedback as SOON as field completed, minimally disruptive`
□ Transmission acknowledgment provided (if appropriate)`
□ Database changes feedback provided (if form changes database)`

### Access to Forms!
□ Mechanism to access particular form/dialogue box`
□ Direct form access (by naming, menu, or direct manipulation)`
□ Movement between forms: forwards + backwards in sequence, NO losing input`
□ Hierarchical level movement: to next, higher, and lower levels`
□ Return to initial form from any form in hierarchy`
□ Windows environment: only LAST selected form active, capability to switch`
□ Default form: most likely to be used displayed automatically`

### Default Values!
□ Fields contain default values whenever possible`
□ System defaults support user's task (NOT destructive, predictable selections)`
□ User-configured defaults: methods to customize + return to system defaults`
□ Previously opened forms: retain user values OR system defaults as appropriate`
□ Radio buttons: default choice visibly selected`
□ Check boxes: default choices indicated as active/inactive`
□ Text fields: default values editable`

### Default Actions!
□ Default actions defined for elements (benefit task performance)`
□ ONLY ONE default action applicable at any time`
□ Consistent user action initiates default (Enter, Return, click)`
□ Safe default actions (NOT destructive or time-consuming)`
□ Visual cue for default push button (thicker border, etc.)`
□ Multi-field dialogues: default based on focus location + dialogue structure`
□ Simple dialogues: ONE push button defined as default (OK vs. Cancel)`

### Validation!
□ Single-field: system checks entry before accepting, based on criteria`
□ Multiple-field: validation checks for dependencies between fields/forms`
□ Validation involves syntax AND semantics`

### Choice of Form Elements!
□ ALL elements accessible to screen readers`
□ Push buttons: mutually exclusive choices, quick access, persistent recognizability`
□ Toggle buttons: binary choices, meaningful portrayal, quick state visibility`
□ Text fields: LARGE set of valid entries, keyboard intensive, ANY input acceptable`
□ Radio buttons: mutually exclusive, 5 or fewer, all choices visible simultaneously`
□ Check boxes: independent two-state choices, meaningful portrayal, frequent changes`
□ Steppers: mutually exclusive, limited space, sequential order, bidirectional`
□ Single-selection lists: mutually exclusive, 3+ items visible, items may change dynamically`
□ Multiple-selection lists: NOT mutually exclusive, 3+ items visible, simultaneous selections`
□ Pop-up/drop-down: mutually exclusive, VERY limited space, 4+ items, all values supplied`
□ Combination boxes: mutually exclusive, limited space, keyboard intensive, type OR select`
□ Hierarchical lists: LARGE number of items, meaningful groups, implicit selection of subordinates`
□ Analogue elements: mutually exclusive, present/manipulate variable, precise changes, show current value`
□ Tabbed elements: multiple pages, meaningful categories, NO sequential dependency`
□ Property dialogues: simple access, object association, categorized properties, templates, modifications`

### When to Use Each Form Element!

| Element | Mutual Exclusive | Space | Items | Change Frequency | Key Features |
|---|---|---|---|---|---|
| Push button | Yes | Any | Few | Frequent | Immediate action, quick access |
| Toggle button | Yes (binary) | Any | Few | Frequent | Two states, meaningful |
| Text field | N/A | Any | Large | Any | Free input, keyboard intensive |
| Radio button | Yes | Enough | ≤5 | Frequent | All visible, mutually exclusive |
| Check box | No | Enough | Few | Frequent | Independent, two-state |
| Stepper | Yes | Limited | Sequential | Frequent | Bidirectional, small changes |
| Single-selection list | Yes | ≥3 visible | Changes | Frequent | Dynamic, large number visible |
| Multiple-selection list | No | ≥3 visible | Changes | Frequent | Multiple selections, dynamic |
| Pop-up/drop-down | Yes | Very limited | ≥4 | Infrequent | Current only visible |
| Combination box | Yes | Limited | ≥5 | Frequent | Type OR select, keyboard |
| Hierarchical list | Yes | ≥3 visible | Large | Any | Tree structure, subordinates |
| Analogue (slider) | Yes | Enough | Continuum | Frequent | Precise, variable range |
| Tabbed | N/A | Limited | Categories | Infrequent | Multiple pages, categories |
| Property dialogue | N/A | Any | Large | Any | Object properties, tabs |

## Relationship with Other ISO 9241 Parts!

| Part | Title | Relationship to ISO 9241-143 |
|---|---|---|
| Part 12 | Presentation of information | General guidance on visual design, labels, fields |
| Part 16 | Direct manipulation dialogues | Cursor/pointer design for form elements |
| Part 110 | Dialogue principles | Ergonomic rationale for trade-offs |
| Part 171 | Software accessibility | ALL elements shall be accessible to screen readers |
| Part 143 | **Forms** | THIS PART |
| Part 210 | Human-centred design | Process for interactive systems |

## Key Design Considerations!

1. **Forms are for structured data entry** - not menus (covered in ISO 9241-14)`
2. **Applicability is conditional** - not ALL requirements apply, only those relevant to context of use`
3. **Conformance procedure** - Determine applicability first (Y/N), then compliance (P/F)`
4. **Accessibility** - ALL form elements shall be accessible to screen readers (ISO 9241-171)`
5. **Defaults matter** - support user's task, NOT destructive, predictable, customizable`
6. **Navigation** - Tab key, cursor keys, pointing device, quick access mechanisms`
7. **Visual cues** - distinguish states, required/optional, format, errors, focus`
8. **User control** - at all times, recover from errors, easy transmission`
9. **Feedback** - echoed characters, cursor/pointer visible, error acknowledgment`
10. **Validation** - single-field + multiple-field dependencies, syntax + semantics`
